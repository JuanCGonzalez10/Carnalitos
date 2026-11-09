import { randomBytes, randomUUID } from "node:crypto";
import { query, queryOne, withTransaction } from "@/lib/db";
import { buildUpdateSet } from "@/lib/data/helpers";
import { getSettings } from "@/lib/settings";
import type { DashboardStats, Order, OrderItem, Product } from "@/types";

export class OrderError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.name = "OrderError";
    this.status = status;
  }
}

const ORDER_FIELDS = `
  id, code,
  customer_name as \`customerName\`,
  customer_email as \`customerEmail\`,
  customer_phone as \`customerPhone\`,
  delivery_method as \`deliveryMethod\`,
  address, city, notes, subtotal, shipping, total, status,
  payment_method as \`paymentMethod\`,
  payment_status as \`paymentStatus\`,
  admin_notes as \`adminNotes\`,
  created_at as \`createdAt\`,
  updated_at as \`updatedAt\`
`;

const ORDER_FIELDS_O = `
  o.id, o.code,
  o.customer_name as \`customerName\`,
  o.customer_email as \`customerEmail\`,
  o.customer_phone as \`customerPhone\`,
  o.delivery_method as \`deliveryMethod\`,
  o.address, o.city, o.notes, o.subtotal, o.shipping, o.total, o.status,
  o.payment_method as \`paymentMethod\`,
  o.payment_status as \`paymentStatus\`,
  o.admin_notes as \`adminNotes\`,
  o.created_at as \`createdAt\`,
  o.updated_at as \`updatedAt\`
`;

const ITEM_FIELDS = `
  id, order_id as \`orderId\`, product_id as \`productId\`,
  product_name as \`productName\`, unit_price as \`unitPrice\`,
  quantity, total, image
`;

const ITEMS_COUNT = `
  (select coalesce(sum(oi.quantity), 0) from order_items oi where oi.order_id = o.id) as \`itemsCount\`
`;

function createCode(): string {
  return `CAR-${randomBytes(4).toString("hex").toUpperCase()}`;
}

export interface CreateOrderInput {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryMethod: "delivery" | "pickup";
  address: string;
  city: string;
  notes: string;
  paymentMethod: "cash" | "nequi" | "bancolombia" | "transfer";
  items: Array<{ productId: string; quantity: number }>;
}

export async function createOrder(input: CreateOrderInput): Promise<Order> {
  const settings = await getSettings();
  const store = settings.store;
  let createdOrderId = "";

  await withTransaction(async (connection) => {
    const ids = [...new Set(input.items.map((item) => item.productId))];
    const placeholders = ids.map(() => "?").join(",");
    const [productRows] = await connection.query(
      `select id, name, price, stock, image, active
       from products where id in (${placeholders}) for update`,
      ids,
    );
    const products = new Map(
      (productRows as Array<{
        id: string;
        name: string;
        price: number;
        stock: number;
        image: string;
        active: boolean;
      }>).map((row) => [row.id, row]),
    );

    const lines = input.items.map((item) => {
      const product = products.get(item.productId);
      if (!product) throw new OrderError("Uno de los productos de tu carrito ya no está disponible.");
      if (!product.active) throw new OrderError(`"${product.name}" no está disponible por el momento.`);
      if (product.stock < item.quantity) {
        throw new OrderError(
          `Solo quedan ${product.stock} unidad${product.stock === 1 ? "" : "es"} de "${product.name}".`,
        );
      }
      return {
        product,
        quantity: item.quantity,
        total: Number(product.price) * item.quantity,
      };
    });

    const subtotal = lines.reduce((sum, line) => sum + line.total, 0);
    const shipping =
      input.deliveryMethod === "pickup" ||
      (store.freeShippingThreshold > 0 && subtotal >= store.freeShippingThreshold)
        ? 0
        : store.shippingCost;
    const total = subtotal + shipping;
    const code = createCode();
    createdOrderId = randomUUID();

    await connection.query(
      `insert into orders
        (id, code, customer_name, customer_email, customer_phone, delivery_method,
         address, city, notes, subtotal, shipping, total, status,
         payment_method, payment_status)
       values (?,?,?,?,?,?,?,?,?,?,?,?,'pending',?,'unpaid')`,
      [
        createdOrderId,
        code,
        input.customerName,
        input.customerEmail,
        input.customerPhone,
        input.deliveryMethod,
        input.address,
        input.city,
        input.notes,
        subtotal,
        shipping,
        total,
        input.paymentMethod,
      ],
    );

    for (const line of lines) {
      await connection.query(
        `insert into order_items
          (id, order_id, product_id, product_name, unit_price, quantity, total, image)
         values (?,?,?,?,?,?,?,?)`,
        [
          randomUUID(),
          createdOrderId,
          line.product.id,
          line.product.name,
          line.product.price,
          line.quantity,
          line.total,
          line.product.image,
        ],
      );
      await connection.query(
        "update products set stock = stock - ?, updated_at = now() where id = ?",
        [line.quantity, line.product.id],
      );
    }
  });

  return (await getOrderById(createdOrderId))!;
}

export interface PosSaleInput {
  items: Array<{ productId: string; quantity: number }>;
  paymentMethod: "cash" | "nequi" | "bancolombia" | "card" | "transfer";
  received: number;
  customerName: string;
  customerPhone: string;
  notes: string;
}

function createPosCode(): string {
  return `POS-${randomBytes(3).toString("hex").toUpperCase()}`;
}

/**
 * Registra una venta presencial de la caja registradora.
 * La venta entra al flujo normal de pedidos como pagada y entregada,
 * descuenta stock y queda identificada con el prefijo POS-.
 */
export async function createPosSale(input: PosSaleInput): Promise<Order> {
  let createdOrderId = "";

  await withTransaction(async (connection) => {
    const ids = [...new Set(input.items.map((item) => item.productId))];
    const placeholders = ids.map(() => "?").join(",");
    const [productRows] = await connection.query(
      `select id, name, price, stock, image, active
       from products where id in (${placeholders}) for update`,
      ids,
    );
    const products = new Map(
      (productRows as Array<{
        id: string;
        name: string;
        price: number;
        stock: number;
        image: string;
        active: boolean;
      }>).map((row) => [row.id, row]),
    );

    const lines = input.items.map((item) => {
      const product = products.get(item.productId);
      if (!product) throw new OrderError("Uno de los productos ya no está disponible.");
      if (!product.active) throw new OrderError(`"${product.name}" no está disponible por el momento.`);
      if (product.stock < item.quantity) {
        throw new OrderError(
          `Solo quedan ${product.stock} unidad${product.stock === 1 ? "" : "es"} de "${product.name}".`,
        );
      }
      return {
        product,
        quantity: item.quantity,
        total: Number(product.price) * item.quantity,
      };
    });

    const subtotal = lines.reduce((sum, line) => sum + line.total, 0);
    const total = subtotal;

    if (input.paymentMethod === "cash" && input.received + 0.001 < total) {
      throw new OrderError("El efectivo recibido es menor al total a pagar.");
    }

    const change =
      input.paymentMethod === "cash" ? Math.max(0, Math.round((input.received - total) * 100) / 100) : 0;
    const code = createPosCode();
    createdOrderId = randomUUID();

    const cashNote =
      input.paymentMethod === "cash"
        ? `Efectivo recibido: ${input.received.toFixed(2)}. Cambio: ${change.toFixed(2)}.`
        : "";
    const saleNotes = [input.notes.trim(), cashNote].filter(Boolean).join(" ");

    await connection.query(
      `insert into orders
        (id, code, customer_name, customer_email, customer_phone, delivery_method,
         address, city, notes, subtotal, shipping, total, status,
         payment_method, payment_status, admin_notes)
       values (?,?,?,?,?,'pickup','','Medellín',?,?,0,?,'delivered',?,'paid',?)`,
      [
        createdOrderId,
        code,
        input.customerName.trim() || "Cliente en tienda",
        "pos@carnalitosbakery.com",
        input.customerPhone.trim(),
        saleNotes,
        subtotal,
        total,
        input.paymentMethod,
        "Venta física registrada en caja registradora.",
      ],
    );

    for (const line of lines) {
      await connection.query(
        `insert into order_items
          (id, order_id, product_id, product_name, unit_price, quantity, total, image)
         values (?,?,?,?,?,?,?,?)`,
        [
          randomUUID(),
          createdOrderId,
          line.product.id,
          line.product.name,
          line.product.price,
          line.quantity,
          line.total,
          line.product.image,
        ],
      );
      await connection.query(
        "update products set stock = stock - ?, updated_at = now() where id = ?",
        [line.quantity, line.product.id],
      );
    }
  });

  return (await getOrderById(createdOrderId))!;
}

export interface PosTodaySummary {
  count: number;
  total: number;
  recent: Order[];
}

export async function getPosTodaySummary(): Promise<PosTodaySummary> {
  const [totals, recent] = await Promise.all([
    queryOne<{ count: number; total: number }>(
      `select count(*) as \`count\`, coalesce(sum(total), 0) as total
       from orders
       where code like 'POS-%' and status <> 'cancelled' and created_at >= curdate()`,
    ),
    query<Order>(
      `select ${ORDER_FIELDS},
         (select coalesce(sum(quantity), 0) from order_items where order_id = orders.id) as \`itemsCount\`
       from orders
       where code like 'POS-%' and created_at >= curdate()
       order by created_at desc
       limit 8`,
    ),
  ]);

  return {
    count: totals?.count ?? 0,
    total: totals?.total ?? 0,
    recent,
  };
}

export async function getOrderByCode(code: string): Promise<Order | null> {
  const order = await queryOne<Order>(
    `select ${ORDER_FIELDS} from orders where upper(code) = upper(?)`,
    [code.trim()],
  );
  if (!order) return null;
  const items = await query<OrderItem>(
    `select ${ITEM_FIELDS} from order_items where order_id = ? order by created_at asc`,
    [order.id],
  );
  return { ...order, items };
}

export async function getOrderById(id: string): Promise<Order | null> {
  const order = await queryOne<Order>(`select ${ORDER_FIELDS} from orders where id = ?`, [id]);
  if (!order) return null;
  const items = await query<OrderItem>(
    `select ${ITEM_FIELDS} from order_items where order_id = ? order by created_at asc`,
    [order.id],
  );
  return { ...order, items };
}

export async function listOrders(options: {
  status?: string;
  search?: string;
  limit?: number;
} = {}): Promise<Order[]> {
  const where: string[] = [];
  const values: unknown[] = [];

  if (options.status && options.status !== "all") {
    values.push(options.status);
    where.push("o.status = ?");
  }
  if (options.search?.trim()) {
    values.push(`%${options.search.trim()}%`);
    where.push(
      "(o.code like ? or o.customer_name like ? or o.customer_email like ? or o.customer_phone like ?)",
    );
    const term = values[values.length - 1];
    values.push(term, term, term);
  }

  const limit = options.limit ? `limit ${Math.max(1, Math.min(500, options.limit))}` : "";

  return query<Order>(
    `select ${ORDER_FIELDS_O}, ${ITEMS_COUNT}
     from orders o
     ${where.length ? `where ${where.join(" and ")}` : ""}
     order by o.created_at desc
     ${limit}`,
    values,
  );
}

const ORDER_UPDATE_FIELDS: Record<string, string> = {
  status: "status",
  paymentStatus: "payment_status",
  paymentMethod: "payment_method",
  adminNotes: "admin_notes",
};

export async function updateOrder(id: string, input: Record<string, unknown>): Promise<Order | null> {
  const current = await getOrderById(id);
  if (!current) return null;

  const nextStatus = typeof input.status === "string" ? input.status : null;
  const restock = nextStatus === "cancelled" && current.status !== "cancelled";

  await withTransaction(async (connection) => {
    if (restock && current.items?.length) {
      for (const item of current.items) {
        if (!item.productId) continue;
        await connection.query(
          "update products set stock = stock + ?, updated_at = now() where id = ?",
          [item.quantity, item.productId],
        );
      }
    }

    const { clause, values } = buildUpdateSet(input, ORDER_UPDATE_FIELDS);
    if (!clause) return;
    values.push(id);
    await connection.query(
      `update orders set ${clause}, updated_at = now() where id = ?`,
      values,
    );
  });

  return getOrderById(id);
}

export async function listContactMessages(): Promise<
  Array<{
    id: string;
    name: string;
    email: string;
    phone: string;
    subject: string;
    message: string;
    status: string;
    createdAt: string;
  }>
> {
  return query(
    `select id, name, email, phone, subject, message, status, created_at as \`createdAt\`
     from contact_messages order by created_at desc`,
  );
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const settings = await getSettings();
  const [totals, monthly, statuses, topProducts, categorySales, recentOrders, activeProducts, lowStockCount, customers] =
    await Promise.all([
      queryOne<{
        revenue: number;
        pendingBalance: number;
        ordersThisMonth: number;
        pendingOrders: number;
        averageTicket: number;
      }>(
        `select
           coalesce(sum(case when payment_status = 'paid' and status <> 'cancelled' then total else 0 end), 0) as revenue,
           coalesce(sum(case when payment_status = 'unpaid' and status <> 'cancelled' then total else 0 end), 0) as pendingBalance,
           count(case when year(created_at) = year(now()) and month(created_at) = month(now()) then 1 end) as ordersThisMonth,
           count(case when status in ('pending', 'confirmed', 'preparing') then 1 end) as pendingOrders,
           coalesce(avg(case when status <> 'cancelled' then total end), 0) as averageTicket
         from orders`,
      ),
      query<{ month: string; total: number }>(
        `select date_format(created_at, '%Y-%m') as month, sum(total) as total
         from orders
         where status <> 'cancelled'
           and created_at >= date_sub(date_format(now(), '%Y-%m-01'), interval 5 month)
         group by month order by month`,
      ),
      query<{ status: string; n: number }>(
        "select status, count(*) as n from orders group by status",
      ),
      query<{ name: string; quantity: number; total: number }>(
        `select oi.product_name as name, sum(oi.quantity) as quantity, sum(oi.total) as total
         from order_items oi
         join orders o on o.id = oi.order_id
         where o.status <> 'cancelled'
         group by oi.product_name
         order by total desc
         limit 5`,
      ),
      query<{ name: string; total: number }>(
        `select coalesce(c.name, 'Sin categoría') as name, sum(oi.total) as total
         from order_items oi
         join orders o on o.id = oi.order_id
         left join products p on p.id = oi.product_id
         left join categories c on c.id = p.category_id
         where o.status <> 'cancelled'
         group by coalesce(c.name, 'Sin categoría')
         order by total desc
         limit 6`,
      ),
      listOrders({ limit: 8 }),
      queryOne<{ n: number }>("select count(*) as n from products where active = 1"),
      queryOne<{ n: number }>(
        "select count(*) as n from products where active = 1 and stock <= ?",
        [settings.store.lowStockThreshold],
      ),
      queryOne<{ n: number }>("select count(distinct lower(customer_email)) as n from orders"),
    ]);

  const lowStockProducts = await query<Product>(
    `select p.id, p.slug, p.name, p.category_id as \`categoryId\`, p.short_description as \`shortDescription\`,
       p.description, p.price, p.compare_at_price as \`compareAtPrice\`, p.stock, p.sku, p.unit, p.weight,
       p.pet_type as \`petType\`, p.benefits, p.ingredients, p.image, p.active, p.featured,
       p.sort_order as \`sortOrder\`, p.created_at as \`createdAt\`,
       c.name as \`categoryName\`, c.slug as \`categorySlug\`
     from products p left join categories c on c.id = p.category_id
     where p.active = 1 and p.stock <= ?
     order by p.stock asc, p.name asc
     limit 5`,
    [settings.store.lowStockThreshold],
  );

  return {
    revenue: totals?.revenue ?? 0,
    pendingBalance: totals?.pendingBalance ?? 0,
    ordersThisMonth: totals?.ordersThisMonth ?? 0,
    pendingOrders: totals?.pendingOrders ?? 0,
    activeProducts: activeProducts?.n ?? 0,
    lowStock: lowStockCount?.n ?? 0,
    customers: customers?.n ?? 0,
    averageTicket: totals?.averageTicket ?? 0,
    monthlyRevenue: monthly,
    statusCounts: Object.fromEntries(statuses.map((row) => [row.status, row.n])),
    topProducts,
    categorySales,
    recentOrders,
    lowStockProducts,
  };
}

export interface ReportData {
  orders: Order[];
  totalOrders: number;
  units: number;
  revenue: number;
  pending: number;
  averageTicket: number;
  topProducts: Array<{ name: string; quantity: number; total: number }>;
  categorySales: Array<{ name: string; total: number }>;
}

const DATE_RANGE = "o.created_at >= ? and o.created_at < date_add(?, interval 1 day)";

export async function getReport(from: string, to: string): Promise<ReportData> {
  const range = [from, to];
  const [orders, totals, topProducts, categorySales] = await Promise.all([
    query<Order>(
      `select ${ORDER_FIELDS_O}, ${ITEMS_COUNT}
       from orders o
       where ${DATE_RANGE}
       order by o.created_at desc`,
      range,
    ),
    queryOne<{ totalOrders: number; units: number; revenue: number; pending: number }>(
      `select
         (select count(*) from orders o
          where ${DATE_RANGE}) as totalOrders,
         coalesce((select sum(oi.quantity) from order_items oi
          join orders o on o.id = oi.order_id
          where ${DATE_RANGE}), 0) as units,
         coalesce((select sum(o.total) from orders o
          where o.payment_status = 'paid' and o.status <> 'cancelled'
            and ${DATE_RANGE}), 0) as revenue,
         coalesce((select sum(o.total) from orders o
          where o.payment_status = 'unpaid' and o.status <> 'cancelled'
            and ${DATE_RANGE}), 0) as pending`,
      [...range, ...range, ...range, ...range],
    ),
    query<{ name: string; quantity: number; total: number }>(
      `select oi.product_name as name, sum(oi.quantity) as quantity, sum(oi.total) as total
       from order_items oi
       join orders o on o.id = oi.order_id
       where o.status <> 'cancelled' and ${DATE_RANGE}
       group by oi.product_name
       order by total desc
       limit 8`,
      range,
    ),
    query<{ name: string; total: number }>(
      `select coalesce(c.name, 'Sin categoría') as name, sum(oi.total) as total
       from order_items oi
       join orders o on o.id = oi.order_id
       left join products p on p.id = oi.product_id
       left join categories c on c.id = p.category_id
       where o.status <> 'cancelled' and ${DATE_RANGE}
       group by coalesce(c.name, 'Sin categoría')
       order by total desc`,
      range,
    ),
  ]);

  const totalOrders = totals?.totalOrders ?? 0;
  const revenue = totals?.revenue ?? 0;

  return {
    orders,
    totalOrders,
    units: totals?.units ?? 0,
    revenue,
    pending: totals?.pending ?? 0,
    averageTicket: totalOrders > 0 ? revenue / totalOrders : 0,
    topProducts,
    categorySales,
  };
}

export async function getOrdersForRange(from: string, to: string): Promise<Order[]> {
  return query<Order>(
    `select ${ORDER_FIELDS_O}, ${ITEMS_COUNT}
     from orders o
     where ${DATE_RANGE}
     order by o.created_at desc`,
    [from, to],
  );
}
