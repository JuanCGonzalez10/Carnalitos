import { query, queryOne } from "@/lib/db";
import { buildUpdateSet } from "@/lib/data/helpers";
import type { Category, Product } from "@/types";

const CATEGORY_FIELDS = `
  id, slug, name, description, icon, image,
  sort_order as "sortOrder", active
`;

const PRODUCT_FIELDS = `
  p.id, p.slug, p.name, p.category_id as "categoryId",
  c.name as "categoryName", c.slug as "categorySlug",
  p.short_description as "shortDescription", p.description,
  p.price, p.compare_at_price as "compareAtPrice", p.stock, p.sku, p.unit, p.weight,
  p.pet_type as "petType", p.benefits, p.ingredients, p.image,
  p.active, p.featured, p.sort_order as "sortOrder", p.created_at as "createdAt"
`;

type ProductQuery = {
  includeInactive?: boolean;
  categorySlug?: string;
  search?: string;
  sort?: string;
  featured?: boolean;
  limit?: number;
};

export async function listCategories(includeInactive = false): Promise<Category[]> {
  return query<Category>(
    `select ${CATEGORY_FIELDS},
       (select count(*)::int from products p where p.category_id = categories.id and p.active = true) as "productCount"
     from categories
     ${includeInactive ? "" : "where active = true"}
     order by sort_order asc, name asc`,
  );
}

export async function getCategoryById(id: string): Promise<Category | null> {
  return queryOne<Category>(`select ${CATEGORY_FIELDS} from categories where id = $1`, [id]);
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  return queryOne<Category>(`select ${CATEGORY_FIELDS} from categories where slug = $1 and active = true`, [
    slug,
  ]);
}

export async function createCategory(input: Record<string, unknown>): Promise<Category> {
  const row = await queryOne<Category>(
    `insert into categories (slug, name, description, icon, image, sort_order, active)
     values ($1,$2,$3,$4,$5,$6,$7) returning ${CATEGORY_FIELDS}`,
    [
      input.slug,
      input.name,
      input.description ?? "",
      input.icon ?? "paw",
      input.image ?? "",
      input.sortOrder ?? 0,
      input.active ?? true,
    ],
  );
  return row!;
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
  const { clause, values } = buildUpdateSet(input, CATEGORY_UPDATE_FIELDS, 1);
  if (!clause) return getCategoryById(id);
  values.push(id);
  return queryOne<Category>(
    `update categories set ${clause}, updated_at = now() where id = $${values.length} returning ${CATEGORY_FIELDS}`,
    values,
  );
}

export async function deleteCategory(id: string): Promise<"deleted" | "deactivated" | "not_found"> {
  const existing = await getCategoryById(id);
  if (!existing) return "not_found";
  const products = await queryOne<{ n: number }>(
    "select count(*)::int as n from products where category_id = $1",
    [id],
  );
  if ((products?.n ?? 0) > 0) {
    await query("update categories set active = false, updated_at = now() where id = $1", [id]);
    return "deactivated";
  }
  await query("delete from categories where id = $1", [id]);
  return "deleted";
}

export async function listProducts(options: ProductQuery = {}): Promise<Product[]> {
  const where: string[] = [];
  const values: unknown[] = [];

  if (!options.includeInactive) where.push("p.active = true");
  if (options.featured) where.push("p.featured = true");
  if (options.categorySlug) {
    values.push(options.categorySlug);
    where.push(`c.slug = $${values.length} and c.active = true`);
  }
  if (options.search?.trim()) {
    values.push(`%${options.search.trim()}%`);
    where.push(
      `(p.name ilike $${values.length} or p.short_description ilike $${values.length} or p.ingredients ilike $${values.length})`,
    );
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
    `select ${PRODUCT_FIELDS}, sum(oi.quantity) as "soldCount"
     from order_items oi
     join orders o on o.id = oi.order_id and o.status <> 'cancelled'
     join products p on p.id = oi.product_id
     left join categories c on c.id = p.category_id
     where p.active = true
     group by p.id, c.name, c.slug
     order by "soldCount" desc
     limit $1`,
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
     where p.id = $1 ${includeInactive ? "" : "and p.active = true"}`,
    [id],
  );
}

export async function getProductBySlug(slug: string, includeInactive = false): Promise<Product | null> {
  return queryOne<Product>(
    `select ${PRODUCT_FIELDS}
     from products p left join categories c on c.id = p.category_id
     where p.slug = $1 ${includeInactive ? "" : "and p.active = true"}`,
    [slug],
  );
}

export async function getRelatedProducts(product: Product, limit = 4): Promise<Product[]> {
  if (product.categoryId) {
    const related = await query<Product>(
      `select ${PRODUCT_FIELDS}
       from products p left join categories c on c.id = p.category_id
       where p.active = true and p.id <> $1 and p.category_id = $2
       order by p.featured desc, p.sort_order asc
       limit $3`,
      [product.id, product.categoryId, limit],
    );
    if (related.length > 0) return related;
  }
  return query<Product>(
    `select ${PRODUCT_FIELDS}
     from products p left join categories c on c.id = p.category_id
     where p.active = true and p.id <> $1
     order by p.featured desc, p.sort_order asc
     limit $2`,
    [product.id, limit],
  );
}

export async function createProduct(input: Record<string, unknown>): Promise<Product> {
  const row = await queryOne<{ id: string }>(
    `insert into products
      (slug, name, category_id, short_description, description, price, compare_at_price,
       stock, sku, unit, weight, pet_type, benefits, ingredients, image, active, featured, sort_order)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
     returning id`,
    [
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
      input.benefits ?? [],
      input.ingredients ?? "",
      input.image ?? "",
      input.active ?? true,
      input.featured ?? false,
      input.sortOrder ?? 0,
    ],
  );
  return (await getProductById(row!.id))!;
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
  const { clause, values } = buildUpdateSet(input, PRODUCT_UPDATE_FIELDS, 1);
  if (!clause) return getProductById(id);
  values.push(id);
  await query(
    `update products set ${clause}, updated_at = now() where id = $${values.length}`,
    values,
  );
  return getProductById(id);
}

export async function deleteProduct(id: string): Promise<"deleted" | "deactivated" | "not_found"> {
  const existing = await getProductById(id);
  if (!existing) return "not_found";
  const sold = await queryOne<{ n: number }>(
    "select count(*)::int as n from order_items where product_id = $1",
    [id],
  );
  if ((sold?.n ?? 0) > 0) {
    await query("update products set active = false, updated_at = now() where id = $1", [id]);
    return "deactivated";
  }
  await query("delete from products where id = $1", [id]);
  return "deleted";
}
