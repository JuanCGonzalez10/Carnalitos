import { randomBytes } from "node:crypto";
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
  customer_name as "customerName",
  customer_email as "customerEmail",
  customer_phone as "customerPhone",
  delivery_method as "deliveryMethod",
  address, city, notes, subtotal, shipping, total, status,
  payment_method as "paymentMethod",
  payment_status as "paymentStatus",
  admin_notes as "adminNotes",
  created_at as "createdAt",
  updated_at as "updatedAt"
`;

const ORDER_FIELDS_O = `
  o.id, o.code,
  o.customer_name as "customerName",
  o.customer_email as "customerEmail",
  o.customer_phone as "customerPhone",
  o.delivery_method as "deliveryMethod",
  o.address, o.city, o.notes, o.subtotal, o.shipping, o.total, o.status,
  o.payment_method as "paymentMethod",
  o.payment_status as "paymentStatus",
  o.admin_notes as "adminNotes",
  o.created_at as "createdAt",
  o.updated_at as "updatedAt"
`;

const ITEM_FIELDS = `
  id, order_id as "orderId", product_id as "productId",
  product_name as "productName", unit_price as "unitPrice",
  quantity, total, image
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

  return withTransaction(async (client) => {
    const ids = [...new Set(input.items.map((item) => item.productId))];
    const productsResult = await client.query<{
      id: string;
      name: string;
      price: number;
      stock: number;
      image: string;
      active: boolean;
    }>(
      `select id, name, price, stock, image, active
       from products where id = any($1::uuid[]) for update`,
      [ids],
    );
    const products = new Map(productsResult.rows.map((row) => [row.id, row]));

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
        total: product.price * item.quantity,
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

    const orderRow = await client.query<Order>(
      `insert into orders
        (code, customer_name, customer_email, customer_phone, delivery_method,
         address, city, notes, subtotal, shipping, total, status,
         payment_method, payment_status)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'pending',$12,'unpaid')
       returning ${ORDER_FIELDS}`,
      [
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
    const order = orderRow.rows[0];

    const items: OrderItem[] = [];
    for (const line of lines) {
      const itemRow = await client.query<OrderItem>(
        `insert into order_items (order_id, product_id, product_name, unit_price, quantity, total, image)
         values ($1,$2,$3,$4,$5,$6,$7) returning ${ITEM_FIELDS}`,
        [
          order.id,
          line.product.id,
          line.product.name,
          line.product.price,
          line.quantity,
          line.total,
          line.product.image,
        ],
      );
      items.push(itemRow.rows[0]);
      await client.query(
        "update products set stock = stock - $1, updated_at = now() where id = $2",
        [line.quantity, line.product.id],
      );
    }

    return { ...order, items };
  });
}

export async function getOrderByCode(code: string): Promise<Order | null> {
  const order = await queryOne<Order>(
    `select ${ORDER_FIELDS} from orders where upper(code) = upper($1)`,
    [code.trim()],
  );
  if (!order) return null;
  const items = await query<OrderItem>(
    `select ${ITEM_FIELDS} from order_items where order_id = $1 order by created_at asc`,
    [order.id],
  );
  return { ...order, items };
}

export async function getOrderById(id: string): Promise<Order | null> {
  const order = await queryOne<Order>(`select ${ORDER_FIELDS} from orders where id = $1`, [id]);
  if (!order) return null;
  const items = await query<OrderItem>(
    `select ${ITEM_FIELDS} from order_items where order_id = $1 order by created_at asc`,
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
    where.push(`o.status = $${values.length}`);
  }
  if (options.search?.trim()) {
    values.push(`%${options.search.trim()}%`);
    where.push(
      `(o.code ilike $${values.length} or o.customer_name ilike $${values.length} or o.customer_email ilike $${values.length} or o.customer_phone ilike $${values.length})`,
    );
  }

  const limit = options.limit ? `limit ${Math.max(1, Math.min(500, options.limit))}` : "";

  return query<Order>(
    `select ${ORDER_FIELDS_O}, coalesce(sum(oi.quantity), 0)::int as "itemsCount"
     from orders o
     left join order_items oi on oi.order_id = o.id
     ${where.length ? `where ${where.join(" and ")}` : ""}
     group by o.id
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

  return withTransaction(async (client) => {
    if (restock && current.items?.length) {
      for (const item of current.items) {
        if (!item.productId) continue;
        await client.query(
          "update products set stock = stock + $1, updated_at = now() where id = $2",
          [item.quantity, item.productId],
        );
      }
    }

    const { clause, values } = buildUpdateSet(input, ORDER_UPDATE_FIELDS, 1);
    if (!clause) return current;
    values.push(id);
    await client.query(
      `update orders set ${clause}, updated_at = now() where id = $${values.length}`,
      values,
    );
    return null;
  }).then(async () => getOrderById(id));
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
    `select id, name, email, phone, subject, message, status, created_at as "createdAt"
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
           coalesce(sum(total) filter (where payment_status = 'paid' and status <> 'cancelled'), 0) as revenue,
           coalesce(sum(total) filter (where payment_status = 'unpaid' and status <> 'cancelled'), 0) as "pendingBalance",
           count(*) filter (where date_trunc('month', created_at) = date_trunc('month', now()))::int as "ordersThisMonth",
           count(*) filter (where status in ('pending', 'confirmed', 'preparing'))::int as "pendingOrders",
           coalesce(avg(total) filter (where status <> 'cancelled'), 0) as "averageTicket"
         from orders`,
      ),
      query<{ month: string; total: number }>(
        `select to_char(date_trunc('month', created_at), 'YYYY-MM') as month, sum(total) as total
         from orders
         where status <> 'cancelled' and created_at >= date_trunc('month', now()) - interval '5 months'
         group by 1 order by 1`,
      ),
      query<{ status: string; n: number }>(
        "select status, count(*)::int as n from orders group by status",
      ),
      query<{ name: string; quantity: number; total: number }>(
        `select oi.product_name as name, sum(oi.quantity)::int as quantity, sum(oi.total) as total
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
         group by c.name
         order by total desc
         limit 6`,
      ),
      listOrders({ limit: 8 }),
      queryOne<{ n: number }>("select count(*)::int as n from products where active = true"),
      queryOne<{ n: number }>(
        "select count(*)::int as n from products where active = true and stock <= $1",
        [settings.store.lowStockThreshold],
      ),
      queryOne<{ n: number }>("select count(distinct lower(customer_email))::int as n from orders"),
    ]);

  const lowStockProducts = await query<Product>(
    `select p.id, p.slug, p.name, p.category_id as "categoryId", p.short_description as "shortDescription",
       p.description, p.price, p.compare_at_price as "compareAtPrice", p.stock, p.sku, p.unit, p.weight,
       p.pet_type as "petType", p.benefits, p.ingredients, p.image, p.active, p.featured,
       p.sort_order as "sortOrder", p.created_at as "createdAt",
       c.name as "categoryName", c.slug as "categorySlug"
     from products p left join categories c on c.id = p.category_id
     where p.active = true and p.stock <= $1
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

export async function getReport(from: string, to: string): Promise<ReportData> {
  const range = [from, to];
  const [orders, totals, topProducts, categorySales] = await Promise.all([
    query<Order>(
      `select ${ORDER_FIELDS_O}, coalesce(sum(oi.quantity), 0)::int as "itemsCount"
       from orders o
       left join order_items oi on oi.order_id = o.id
       where o.created_at >= $1::date and o.created_at < ($2::date + interval '1 day')
       group by o.id
       order by o.created_at desc`,
      range,
    ),
    queryOne<{ totalOrders: number; units: number; revenue: number; pending: number }>(
      `select
         (select count(*)::int from orders o
          where o.created_at >= $1::date and o.created_at < ($2::date + interval '1 day')) as "totalOrders",
         coalesce((select sum(oi.quantity)::int from order_items oi
          join orders o on o.id = oi.order_id
          where o.created_at >= $1::date and o.created_at < ($2::date + interval '1 day')), 0) as units,
         coalesce((select sum(o.total) from orders o
          where o.payment_status = 'paid' and o.status <> 'cancelled'
            and o.created_at >= $1::date and o.created_at < ($2::date + interval '1 day')), 0) as revenue,
         coalesce((select sum(o.total) from orders o
          where o.payment_status = 'unpaid' and o.status <> 'cancelled'
            and o.created_at >= $1::date and o.created_at < ($2::date + interval '1 day')), 0) as pending`,
      range,
    ),
    query<{ name: string; quantity: number; total: number }>(
      `select oi.product_name as name, sum(oi.quantity)::int as quantity, sum(oi.total) as total
       from order_items oi
       join orders o on o.id = oi.order_id
       where o.status <> 'cancelled'
         and o.created_at >= $1::date and o.created_at < ($2::date + interval '1 day')
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
       where o.status <> 'cancelled'
         and o.created_at >= $1::date and o.created_at < ($2::date + interval '1 day')
       group by c.name
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
    `select ${ORDER_FIELDS_O}, coalesce(sum(oi.quantity), 0)::int as "itemsCount"
     from orders o
     left join order_items oi on oi.order_id = o.id
     where o.created_at >= $1::date and o.created_at < ($2::date + interval '1 day')
     group by o.id
     order by o.created_at desc`,
    [from, to],
  );
}
