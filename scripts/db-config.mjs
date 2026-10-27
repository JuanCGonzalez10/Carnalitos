import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "pg";
import dotenv from "dotenv";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

for (const file of [".env.local", ".env"]) {
  const path = join(root, file);
  if (existsSync(path)) dotenv.config({ path });
}

export function databaseUrl() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("❌ Falta DATABASE_URL en .env.local");
    process.exit(1);
  }
  return url;
}

export function sslConfig() {
  return process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : undefined;
}

export async function ensureDatabase() {
  const url = new URL(databaseUrl());
  const dbName = decodeURIComponent(url.pathname.replace(/^\//, ""));
  if (!/^[a-zA-Z0-9_]+$/.test(dbName)) throw new Error("Nombre de base de datos inválido");

  const adminUrl = new URL(url.toString());
  adminUrl.pathname = "/postgres";
  const client = new Client({ connectionString: adminUrl.toString(), ssl: sslConfig() });
  await client.connect();
  const exists = await client.query("select 1 from pg_database where datname = $1", [dbName]);
  if (exists.rowCount === 0) {
    await client.query(`create database "${dbName}"`);
    console.log(`✓ Base de datos "${dbName}" creada`);
  } else {
    console.log(`✓ Base de datos "${dbName}" ya existe`);
  }
  await client.end();
}

export async function resetDatabase() {
  const client = new Client({ connectionString: databaseUrl(), ssl: sslConfig() });
  await client.connect();
  await client.query(`
    drop table if exists booking_status_history cascade;
    drop table if exists payments cascade;
    drop table if exists booking_services cascade;
    drop table if exists booking_activities cascade;
    drop table if exists bookings cascade;
    drop table if exists customers cascade;
    drop table if exists gallery_images cascade;
    drop table if exists blocked_dates cascade;
    drop table if exists glamping_rates cascade;
    drop table if exists glamping_images cascade;
    drop table if exists glampings cascade;
    drop table if exists services cascade;
    drop table if exists activities cascade;
    drop table if exists admin_sessions cascade;
    drop table if exists admin_users cascade;
    drop table if exists settings cascade;
    drop table if exists contact_messages cascade;
  `);
  await client.end();
  console.log("✓ Tablas eliminadas (modo --reset)");
}

export async function applySchema() {
  const client = new Client({ connectionString: databaseUrl(), ssl: sslConfig() });
  await client.connect();
  const sql = readFileSync(join(root, "database", "schema.sql"), "utf8");
  await client.query(sql);
  await client.end();
  console.log("✓ Esquema aplicado");
}
