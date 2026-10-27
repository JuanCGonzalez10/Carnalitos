import { query, queryOne } from "@/lib/db";
import { buildUpdateSet } from "@/lib/data/helpers";
import type { BlockedDate, Glamping, GlampingImage, GlampingRate } from "@/types";

const FIELDS = `
  id, slug, name, tagline,
  short_description as "shortDescription",
  description, price_per_night as "pricePerNight",
  weekend_price_per_night as "weekendPricePerNight",
  holiday_price_per_night as "holidayPricePerNight",
  capacity, bedrooms, bathrooms,
  size_m2 as "sizeM2", amenities, includes, conditions, location,
  main_image as "mainImage", active, featured, sort_order as "sortOrder",
  created_at as "createdAt"
`;

const IMAGE_FIELDS = `
  id, glamping_id as "glampingId", url, alt, sort_order as "sortOrder", is_main as "isMain"
`;

const RATE_FIELDS = `
  id, glamping_id as "glampingId", name, start_date as "startDate", end_date as "endDate",
  price_per_night as "pricePerNight", min_nights as "minNights", active
`;

const BLOCK_FIELDS = `
  id, glamping_id as "glampingId", start_date as "startDate", end_date as "endDate", reason
`;

export async function listGlampings(includeInactive = false): Promise<Glamping[]> {
  return query<Glamping>(
    `select ${FIELDS} from glampings
     ${includeInactive ? "" : "where active = true"}
     order by sort_order asc, created_at asc`,
  );
}

export async function listFeaturedGlampings(): Promise<Glamping[]> {
  return query<Glamping>(
    `select ${FIELDS} from glampings where active = true and featured = true order by sort_order asc limit 4`,
  );
}

export async function getGlampingById(id: string, includeInactive = true): Promise<Glamping | null> {
  return queryOne<Glamping>(
    `select ${FIELDS} from glampings where id = $1 ${includeInactive ? "" : "and active = true"}`,
    [id],
  );
}

export async function getGlampingBySlug(slug: string, includeInactive = false): Promise<Glamping | null> {
  return queryOne<Glamping>(
    `select ${FIELDS} from glampings where slug = $1 ${includeInactive ? "" : "and active = true"}`,
    [slug],
  );
}

export async function getGlampingImages(glampingId: string): Promise<GlampingImage[]> {
  return query<GlampingImage>(
    `select ${IMAGE_FIELDS} from glamping_images where glamping_id = $1 order by sort_order asc, created_at asc`,
    [glampingId],
  );
}

export async function getImagesForGlampings(ids: string[]): Promise<GlampingImage[]> {
  if (ids.length === 0) return [];
  return query<GlampingImage>(
    `select ${IMAGE_FIELDS} from glamping_images
     where glamping_id = any($1::uuid[])
     order by sort_order asc, created_at asc`,
    [ids],
  );
}

export async function getGlampingRates(glampingId: string): Promise<GlampingRate[]> {
  return query<GlampingRate>(
    `select ${RATE_FIELDS} from glamping_rates where glamping_id = $1 order by start_date asc`,
    [glampingId],
  );
}

export async function getGlampingBlocks(glampingId: string): Promise<BlockedDate[]> {
  return query<BlockedDate>(
    `select ${BLOCK_FIELDS} from blocked_dates where glamping_id = $1 order by start_date asc`,
    [glampingId],
  );
}

export async function getGlampingDetails(idOrSlug: string): Promise<Glamping | null> {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
  const glamping = isUuid ? await getGlampingById(idOrSlug) : await getGlampingBySlug(idOrSlug, true);
  if (!glamping) return null;
  const [images, rates, blocks] = await Promise.all([
    getGlampingImages(glamping.id),
    getGlampingRates(glamping.id),
    getGlampingBlocks(glamping.id),
  ]);
  return { ...glamping, images, rates, blocks };
}

export async function getRatesForGlampings(ids: string[]): Promise<GlampingRate[]> {
  if (ids.length === 0) return [];
  return query<GlampingRate>(
    `select ${RATE_FIELDS} from glamping_rates
     where glamping_id = any($1::uuid[]) and active = true
     order by start_date asc`,
    [ids],
  );
}

const GLAMPING_UPDATE_FIELDS: Record<string, string> = {
  slug: "slug",
  name: "name",
  tagline: "tagline",
  shortDescription: "short_description",
  description: "description",
  pricePerNight: "price_per_night",
  weekendPricePerNight: "weekend_price_per_night",
  holidayPricePerNight: "holiday_price_per_night",
  capacity: "capacity",
  bedrooms: "bedrooms",
  bathrooms: "bathrooms",
  sizeM2: "size_m2",
  amenities: "amenities",
  includes: "includes",
  conditions: "conditions",
  location: "location",
  mainImage: "main_image",
  active: "active",
  featured: "featured",
  sortOrder: "sort_order",
};

export async function createGlamping(input: Record<string, unknown>): Promise<Glamping> {
  const row = await queryOne<Glamping>(
    `insert into glampings
      (slug, name, tagline, short_description, description, price_per_night,
       weekend_price_per_night, holiday_price_per_night, capacity, bedrooms,
       bathrooms, size_m2, amenities, includes, conditions, location, main_image, active, featured, sort_order)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)
     returning ${FIELDS}`,
    [
      input.slug, input.name, input.tagline ?? "", input.shortDescription ?? "", input.description ?? "",
      input.pricePerNight ?? 0, input.weekendPricePerNight ?? null, input.holidayPricePerNight ?? null,
      input.capacity ?? 2, input.bedrooms ?? 1, input.bathrooms ?? 1,
      input.sizeM2 ?? null, input.amenities ?? [], input.includes ?? [], input.conditions ?? "",
      input.location ?? "Cañón del Magdalena, Huila", input.mainImage ?? "", input.active ?? true,
      input.featured ?? false, input.sortOrder ?? 0,
    ],
  );
  return row!;
}

export async function updateGlamping(id: string, input: Record<string, unknown>): Promise<Glamping | null> {
  const { clause, values } = buildUpdateSet(input, GLAMPING_UPDATE_FIELDS, 1);
  if (!clause) return getGlampingById(id);
  values.push(id);
  const updated = await queryOne<Glamping>(
    `update glampings set ${clause}, updated_at = now() where id = $${values.length} returning ${FIELDS}`,
    values,
  );
  // Mantiene sincronizada la marca de foto principal entre el glamping y su galería.
  // Así, cambiar la imagen principal desde "Información" no deja una foto antigua
  // marcada como principal en la pestaña "Fotos".
  if (updated && typeof input.mainImage === "string") {
    await query(
      `update glamping_images set is_main = (url = $1) where glamping_id = $2`,
      [input.mainImage, id],
    );
  }
  return updated;
}

export async function deleteGlamping(id: string): Promise<"deleted" | "deactivated" | "not_found"> {
  const existing = await getGlampingById(id);
  if (!existing) return "not_found";
  const bookings = await queryOne<{ n: number }>("select count(*)::int as n from bookings where glamping_id = $1", [id]);
  if ((bookings?.n ?? 0) > 0) {
    await query("update glampings set active = false, updated_at = now() where id = $1", [id]);
    return "deactivated";
  }
  await query("delete from glampings where id = $1", [id]);
  return "deleted";
}

export async function addGlampingImage(glampingId: string, url: string, alt: string): Promise<GlampingImage> {
  const order = await queryOne<{ next: number }>(
    "select coalesce(max(sort_order), -1) + 1 as next from glamping_images where glamping_id = $1",
    [glampingId],
  );
  const isFirst = (order?.next ?? 0) === 0;
  const image = await queryOne<GlampingImage>(
    `insert into glamping_images (glamping_id, url, alt, sort_order, is_main)
     values ($1,$2,$3,$4,$5) returning ${IMAGE_FIELDS}`,
    [glampingId, url, alt, order?.next ?? 0, isFirst],
  );
  if (isFirst) {
    await query("update glampings set main_image = $1, updated_at = now() where id = $2", [url, glampingId]);
  }
  return image!;
}

export async function reorderGlampingImages(
  glampingId: string,
  images: Array<{ id: string; sortOrder: number; isMain: boolean }>,
): Promise<void> {
  for (const image of images) {
    await query(
      `update glamping_images set sort_order = $1, is_main = $2
       where id = $3 and glamping_id = $4`,
      [image.sortOrder, image.isMain, image.id, glampingId],
    );
  }
  const main = images.find((image) => image.isMain) ?? images[0];
  if (main) {
    if (!images.some((image) => image.isMain)) {
      await query("update glamping_images set is_main = (id = $1) where glamping_id = $2", [main.id, glampingId]);
    }
    const row = await queryOne<{ url: string }>("select url from glamping_images where id = $1", [main.id]);
    if (row) {
      await query("update glampings set main_image = $1, updated_at = now() where id = $2", [row.url, glampingId]);
    }
  }
}

export async function deleteGlampingImage(glampingId: string, imageId: string): Promise<void> {
  const removed = await queryOne<{ url: string; is_main: boolean }>(
    "delete from glamping_images where id = $1 and glamping_id = $2 returning url, is_main",
    [imageId, glampingId],
  );
  if (!removed) return;

  // Si la foto eliminada era la principal (o el glamping apuntaba a ella),
  // promovemos la primera foto restante. Si no queda ninguna, limpiamos la portada.
  const current = await queryOne<{ main_image: string }>(
    "select main_image from glampings where id = $1",
    [glampingId],
  );
  if (removed.is_main || current?.main_image === removed.url) {
    const next = await queryOne<{ id: string; url: string }>(
      "select id, url from glamping_images where glamping_id = $1 order by sort_order asc limit 1",
      [glampingId],
    );
    if (next) {
      await query("update glamping_images set is_main = (id = $1) where glamping_id = $2", [next.id, glampingId]);
      await query("update glampings set main_image = $1, updated_at = now() where id = $2", [next.url, glampingId]);
    } else {
      await query("update glampings set main_image = '', updated_at = now() where id = $1", [glampingId]);
    }
  }
}

export async function addGlampingRate(glampingId: string, input: Record<string, unknown>): Promise<GlampingRate> {
  const row = await queryOne<GlampingRate>(
    `insert into glamping_rates (glamping_id, name, start_date, end_date, price_per_night, min_nights, active)
     values ($1,$2,$3,$4,$5,$6,$7) returning ${RATE_FIELDS}`,
    [
      glampingId, input.name, input.startDate, input.endDate,
      input.pricePerNight, input.minNights ?? 1, input.active ?? true,
    ],
  );
  return row!;
}

export async function deleteGlampingRate(glampingId: string, rateId: string): Promise<void> {
  await query("delete from glamping_rates where id = $1 and glamping_id = $2", [rateId, glampingId]);
}

export async function addBlockedDate(glampingId: string, input: Record<string, unknown>): Promise<BlockedDate> {
  const row = await queryOne<BlockedDate>(
    `insert into blocked_dates (glamping_id, start_date, end_date, reason)
     values ($1,$2,$3,$4) returning ${BLOCK_FIELDS}`,
    [glampingId, input.startDate, input.endDate, input.reason ?? ""],
  );
  return row!;
}

export async function deleteBlockedDate(glampingId: string, blockId: string): Promise<void> {
  await query("delete from blocked_dates where id = $1 and glamping_id = $2", [blockId, glampingId]);
}
