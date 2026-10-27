import { query, queryOne } from "@/lib/db";
import { buildUpdateSet } from "@/lib/data/helpers";
import type { Activity, GalleryImage, Service } from "@/types";

const ACTIVITY_FIELDS = `
  id, slug, name, category, short_description as "shortDescription", description,
  price, weekend_price as "weekendPrice", holiday_price as "holidayPrice",
  price_unit as "priceUnit", duration, difficulty, min_age as "minAge",
  max_people as "maxPeople", includes, requirements, image, active, featured,
  sort_order as "sortOrder"
`;

const SERVICE_FIELDS = `
  id, name, description, price, price_unit as "priceUnit", image, active,
  sort_order as "sortOrder"
`;

const GALLERY_FIELDS = `
  id, url, alt, category, sort_order as "sortOrder", active
`;

export async function listActivities(includeInactive = false): Promise<Activity[]> {
  return query<Activity>(
    `select ${ACTIVITY_FIELDS} from activities
     ${includeInactive ? "" : "where active = true"}
     order by sort_order asc, created_at asc`,
  );
}

export async function getActivityBySlug(slug: string, includeInactive = false): Promise<Activity | null> {
  return queryOne<Activity>(
    `select ${ACTIVITY_FIELDS} from activities where slug = $1 ${includeInactive ? "" : "and active = true"}`,
    [slug],
  );
}

export async function getActivityById(id: string): Promise<Activity | null> {
  return queryOne<Activity>(`select ${ACTIVITY_FIELDS} from activities where id = $1`, [id]);
}

const ACTIVITY_UPDATE_FIELDS: Record<string, string> = {
  slug: "slug",
  name: "name",
  category: "category",
  shortDescription: "short_description",
  description: "description",
  price: "price",
  weekendPrice: "weekend_price",
  holidayPrice: "holiday_price",
  priceUnit: "price_unit",
  duration: "duration",
  difficulty: "difficulty",
  minAge: "min_age",
  maxPeople: "max_people",
  includes: "includes",
  requirements: "requirements",
  image: "image",
  active: "active",
  featured: "featured",
  sortOrder: "sort_order",
};

export async function createActivity(input: Record<string, unknown>): Promise<Activity> {
  const row = await queryOne<Activity>(
    `insert into activities
      (slug, name, category, short_description, description, price,
       weekend_price, holiday_price, price_unit, duration,
       difficulty, min_age, max_people, includes, requirements, image, active, featured, sort_order)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
     returning ${ACTIVITY_FIELDS}`,
    [
      input.slug, input.name, input.category ?? "Aventura", input.shortDescription ?? "",
      input.description ?? "", input.price ?? 0, input.weekendPrice ?? null, input.holidayPrice ?? null,
      input.priceUnit ?? "persona", input.duration ?? "",
      input.difficulty ?? "Media", input.minAge ?? 8, input.maxPeople ?? null, input.includes ?? [],
      input.requirements ?? "", input.image ?? "", input.active ?? true, input.featured ?? false,
      input.sortOrder ?? 0,
    ],
  );
  return row!;
}

export async function updateActivity(id: string, input: Record<string, unknown>): Promise<Activity | null> {
  const { clause, values } = buildUpdateSet(input, ACTIVITY_UPDATE_FIELDS, 1);
  if (!clause) return getActivityById(id);
  values.push(id);
  return queryOne<Activity>(
    `update activities set ${clause}, updated_at = now() where id = $${values.length} returning ${ACTIVITY_FIELDS}`,
    values,
  );
}

export async function deleteActivity(id: string): Promise<"deleted" | "deactivated" | "not_found"> {
  const existing = await getActivityById(id);
  if (!existing) return "not_found";
  const used = await queryOne<{ n: number }>("select count(*)::int as n from booking_activities where activity_id = $1", [id]);
  if ((used?.n ?? 0) > 0) {
    await query("update activities set active = false, updated_at = now() where id = $1", [id]);
    return "deactivated";
  }
  await query("delete from activities where id = $1", [id]);
  return "deleted";
}

export async function listServices(includeInactive = false): Promise<Service[]> {
  return query<Service>(
    `select ${SERVICE_FIELDS} from services
     ${includeInactive ? "" : "where active = true"}
     order by sort_order asc, created_at asc`,
  );
}

export async function getServiceById(id: string): Promise<Service | null> {
  return queryOne<Service>(`select ${SERVICE_FIELDS} from services where id = $1`, [id]);
}

const SERVICE_UPDATE_FIELDS: Record<string, string> = {
  name: "name",
  description: "description",
  price: "price",
  priceUnit: "price_unit",
  image: "image",
  active: "active",
  sortOrder: "sort_order",
};

export async function createService(input: Record<string, unknown>): Promise<Service> {
  const row = await queryOne<Service>(
    `insert into services (name, description, price, price_unit, image, active, sort_order)
     values ($1,$2,$3,$4,$5,$6,$7) returning ${SERVICE_FIELDS}`,
    [
      input.name, input.description ?? "", input.price ?? 0, input.priceUnit ?? "servicio",
      input.image ?? "", input.active ?? true, input.sortOrder ?? 0,
    ],
  );
  return row!;
}

export async function updateService(id: string, input: Record<string, unknown>): Promise<Service | null> {
  const { clause, values } = buildUpdateSet(input, SERVICE_UPDATE_FIELDS, 1);
  if (!clause) return getServiceById(id);
  values.push(id);
  return queryOne<Service>(
    `update services set ${clause}, updated_at = now() where id = $${values.length} returning ${SERVICE_FIELDS}`,
    values,
  );
}

export async function deleteService(id: string): Promise<"deleted" | "deactivated" | "not_found"> {
  const existing = await getServiceById(id);
  if (!existing) return "not_found";
  const used = await queryOne<{ n: number }>("select count(*)::int as n from booking_services where service_id = $1", [id]);
  if ((used?.n ?? 0) > 0) {
    await query("update services set active = false, updated_at = now() where id = $1", [id]);
    return "deactivated";
  }
  await query("delete from services where id = $1", [id]);
  return "deleted";
}

export async function listGallery(includeInactive = false): Promise<GalleryImage[]> {
  return query<GalleryImage>(
    `select ${GALLERY_FIELDS} from gallery_images
     ${includeInactive ? "" : "where active = true"}
     order by sort_order asc, created_at asc`,
  );
}

export async function createGalleryImage(input: Record<string, unknown>): Promise<GalleryImage> {
  const order = await queryOne<{ next: number }>("select coalesce(max(sort_order), -1) + 1 as next from gallery_images");
  const row = await queryOne<GalleryImage>(
    `insert into gallery_images (url, alt, category, sort_order, active)
     values ($1,$2,$3,$4,$5) returning ${GALLERY_FIELDS}`,
    [input.url, input.alt ?? "", input.category ?? "General", order?.next ?? 0, input.active ?? true],
  );
  return row!;
}

export async function updateGalleryImage(id: string, input: Record<string, unknown>): Promise<GalleryImage | null> {
  const { clause, values } = buildUpdateSet(
    input,
    { alt: "alt", category: "category", sortOrder: "sort_order", active: "active" },
    1,
  );
  if (!clause) return queryOne<GalleryImage>(`select ${GALLERY_FIELDS} from gallery_images where id = $1`, [id]);
  values.push(id);
  return queryOne<GalleryImage>(
    `update gallery_images set ${clause} where id = $${values.length} returning ${GALLERY_FIELDS}`,
    values,
  );
}

export async function deleteGalleryImage(id: string): Promise<void> {
  await query("delete from gallery_images where id = $1", [id]);
}
