import { randomUUID } from "node:crypto";
import { query, queryOne } from "@/lib/db";
import { buildUpdateSet } from "@/lib/data/helpers";
import type { Category, Product } from "@/types";

const CATEGORY_FIELDS = `
  id, slug, name, description, icon, image,
  sort_order as \`sortOrder\`, active
`;

const PRODUCT_FIELDS = `
  p.id, p.slug, p.name, p.category_id as \`categoryId\`,
  c.name as \`categoryName\`, c.slug as \`categorySlug\`,
  p.short_description as \`shortDescription\`, p.description,
  p.price, p.compare_at_price as \`compareAtPrice\`, p.stock, p.sku, p.unit, p.weight,
  p.pet_type as \`petType\`, p.benefits, p.ingredients, p.image,
  p.active, p.featured, p.sort_order as \`sortOrder\`, p.created_at as \`createdAt\`
`;

type ProductQuery = {
  includeInactive?: boolean;
  categorySlug?: string;
  search?: string;
  sort?: string;
  featured?: boolean;
  limit?: number;
};

function jsonBenefits(value: unknown): string {
  return JSON.stringify(Array.isArray(value) ? value : []);
}

export async function listCategories(includeInactive = false): Promise<Category[]> {
  return query<Category>(
    `select ${CATEGORY_FIELDS},
       (select count(*) from products p where p.category_id = categories.id and p.active = 1) as productCount
     from categories
     ${includeInactive ? "" : "where active = 1"}
     order by sort_order asc, name asc`,
  );
}

export async function getCategoryById(id: string): Promise<Category | null> {
  return queryOne<Category>(`select ${CATEGORY_FIELDS} from categories where id = ?`, [id]);
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  return queryOne<Category>(`select ${CATEGORY_FIELDS} from categories where slug = ? and active = 1`, [
    slug,
  ]);
}

export async function createCategory(input: Record<string, unknown>): Promise<Category> {
  const id = randomUUID();
  await query(
    `insert into categories (id, slug, name, description, icon, image, sort_order, active)
     values (?,?,?,?,?,?,?,?)`,
    [
      id,
      input.slug,
      input.name,
      input.description ?? "",
      input.icon ?? "paw",
      input.image ?? "",
      input.sortOrder ?? 0,
      input.active ?? true,
    ],
  );
  return (await getCategoryById(id))!;
}

const CATEGORY_UPDATE_FIELDS: Record<string, string> = {
  slug: "slug",
  name: "name",
  description: "description",
  icon: "icon",
  image: "image",
  sortOrder: "sort_order",
  active: "active",
};

export async function updateCategory(
  id: string,
  input: Record<string, unknown>,
): Promise<Category | null> {
  const { clause, values } = buildUpdateSet(input, CATEGORY_UPDATE_FIELDS);
  if (!clause) return getCategoryById(id);
  values.push(id);
  await query(`update categories set ${clause}, updated_at = now() where id = ?`, values);
  return getCategoryById(id);
}

export async function deleteCategory(id: string): Promise<"deleted" | "deactivated" | "not_found"> {
  const existing = await getCategoryById(id);
  if (!existing) return "not_found";
  const products = await queryOne<{ n: number }>(
    "select count(*) as n from products where category_id = ?",
    [id],
  );
  if ((products?.n ?? 0) > 0) {
    await query("update categories set active = 0, updated_at = now() where id = ?", [id]);
    return "deactivated";
  }
  await query("delete from categories where id = ?", [id]);
  return "deleted";
}

export async function listProducts(options: ProductQuery = {}): Promise<Product[]> {
  const where: string[] = [];
  const values: unknown[] = [];

  if (!options.includeInactive) where.push("p.active = 1");
  if (options.featured) where.push("p.featured = 1");
  if (options.categorySlug) {
    values.push(options.categorySlug);
    where.push("c.slug = ? and c.active = 1");
  }
  if (options.search?.trim()) {
    values.push(`%${options.search.trim()}%`);
    where.push("(p.name like ? or p.short_description like ? or p.ingredients like ?)");
    const term = values[values.length - 1];
    values.push(term, term);
  }

  let orderBy = "p.sort_order asc, p.created_at desc";
  switch (options.sort) {
    case "price-asc":
      orderBy = "p.price asc";
      break;
    case "price-desc":
      orderBy = "p.price desc";
      break;
    case "newest":
      orderBy = "p.created_at desc";
      break;
    case "name":
      orderBy = "p.name asc";
      break;
    case "featured":
      orderBy = "p.featured desc, p.sort_order asc";
      break;
  }

  const limit = options.limit ? `limit ${Math.max(1, Math.min(100, options.limit))}` : "";

  return query<Product>(
    `select ${PRODUCT_FIELDS}
     from products p
     left join categories c on c.id = p.category_id
     ${where.length ? `where ${where.join(" and ")}` : ""}
     order by ${orderBy}
     ${limit}`,
    values,
  );
}

export async function listFeaturedProducts(limit = 4): Promise<Product[]> {
  return listProducts({ featured: true, limit, sort: "featured" });
}

export async function listBestSellers(limit = 4): Promise<Product[]> {
  const rows = await query<Product>(
    `select ${PRODUCT_FIELDS}, sum(oi.quantity) as soldCount
     from order_items oi
     join orders o on o.id = oi.order_id and o.status <> 'cancelled'
     join products p on p.id = oi.product_id
     left join categories c on c.id = p.category_id
     where p.active = 1
     group by p.id, c.name, c.slug
     order by soldCount desc
     limit ?`,
    [limit],
  );
  if (rows.length > 0) return rows;
  const fallback = await listFeaturedProducts(limit);
  if (fallback.length > 0) return fallback;
  return listProducts({ limit, sort: "newest" });
}

export async function getProductById(id: string, includeInactive = true): Promise<Product | null> {
  return queryOne<Product>(
    `select ${PRODUCT_FIELDS}
     from products p left join categories c on c.id = p.category_id
     where p.id = ? ${includeInactive ? "" : "and p.active = 1"}`,
    [id],
  );
}

export async function getProductBySlug(slug: string, includeInactive = false): Promise<Product | null> {
  return queryOne<Product>(
    `select ${PRODUCT_FIELDS}
     from products p left join categories c on c.id = p.category_id
     where p.slug = ? ${includeInactive ? "" : "and p.active = 1"}`,
    [slug],
  );
}

export async function getRelatedProducts(product: Product, limit = 4): Promise<Product[]> {
  if (product.categoryId) {
    const related = await query<Product>(
      `select ${PRODUCT_FIELDS}
       from products p left join categories c on c.id = p.category_id
       where p.active = 1 and p.id <> ? and p.category_id = ?
       order by p.featured desc, p.sort_order asc
       limit ?`,
      [product.id, product.categoryId, limit],
    );
    if (related.length > 0) return related;
  }
  return query<Product>(
    `select ${PRODUCT_FIELDS}
     from products p left join categories c on c.id = p.category_id
     where p.active = 1 and p.id <> ?
     order by p.featured desc, p.sort_order asc
     limit ?`,
    [product.id, limit],
  );
}

export async function createProduct(input: Record<string, unknown>): Promise<Product> {
  const id = randomUUID();
  await query(
    `insert into products
      (id, slug, name, category_id, short_description, description, price, compare_at_price,
       stock, sku, unit, weight, pet_type, benefits, ingredients, image, active, featured, sort_order)
     values (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      id,
      input.slug,
      input.name,
      input.categoryId ?? null,
      input.shortDescription ?? "",
      input.description ?? "",
      input.price ?? 0,
      input.compareAtPrice ?? null,
      input.stock ?? 0,
      input.sku ?? "",
      input.unit ?? "unidad",
      input.weight ?? "",
      input.petType ?? "ambos",
      jsonBenefits(input.benefits),
      input.ingredients ?? "",
      input.image ?? "",
      input.active ?? true,
      input.featured ?? false,
      input.sortOrder ?? 0,
    ],
  );
  return (await getProductById(id))!;
}

const PRODUCT_UPDATE_FIELDS: Record<string, string> = {
  slug: "slug",
  name: "name",
  categoryId: "category_id",
  shortDescription: "short_description",
  description: "description",
  price: "price",
  compareAtPrice: "compare_at_price",
  stock: "stock",
  sku: "sku",
  unit: "unit",
  weight: "weight",
  petType: "pet_type",
  benefits: "benefits",
  ingredients: "ingredients",
  image: "image",
  active: "active",
  featured: "featured",
  sortOrder: "sort_order",
};

export async function updateProduct(
  id: string,
  input: Record<string, unknown>,
): Promise<Product | null> {
  const data = { ...input };
  if (Array.isArray(data.benefits)) data.benefits = jsonBenefits(data.benefits);
  const { clause, values } = buildUpdateSet(data, PRODUCT_UPDATE_FIELDS);
  if (!clause) return getProductById(id);
  values.push(id);
  await query(`update products set ${clause}, updated_at = now() where id = ?`, values);
  return getProductById(id);
}

export async function deleteProduct(id: string): Promise<"deleted" | "deactivated" | "not_found"> {
  const existing = await getProductById(id);
  if (!existing) return "not_found";
  const sold = await queryOne<{ n: number }>(
    "select count(*) as n from order_items where product_id = ?",
    [id],
  );
  if ((sold?.n ?? 0) > 0) {
    await query("update products set active = 0, updated_at = now() where id = ?", [id]);
    return "deactivated";
  }
  await query("delete from products where id = ?", [id]);
  return "deleted";
}
