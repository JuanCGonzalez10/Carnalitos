import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import mysql from "mysql2/promise";
import dotenv from "dotenv";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

for (const file of [".env.local", ".env"]) {
  const path = join(root, file);
  if (existsSync(path)) dotenv.config({ path });
}

function fromUrl() {
  const url = process.env.DATABASE_URL;
  if (!url) return {};
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "mysql:") return {};
    return {
      host: parsed.hostname || undefined,
      port: parsed.port ? Number(parsed.port) : undefined,
      user: decodeURIComponent(parsed.username) || undefined,
      password: decodeURIComponent(parsed.password) || undefined,
      database: decodeURIComponent(parsed.pathname.replace(/^\//, "")) || undefined,
    };
  } catch {
    return {};
  }
}

export function databaseName() {
  const url = fromUrl();
  const name = process.env.DB_NAME || url.database;
  if (!name) {
    console.error("❌ Falta DB_NAME (o DATABASE_URL) en .env.local");
    process.exit(1);
  }
  if (!/^[a-zA-Z0-9_]+$/.test(name)) throw new Error("Nombre de base de datos inválido");
  return name;
}

export function sslConfig() {
  return process.env.DB_SSL === "true" || process.env.DATABASE_SSL === "true"
    ? { rejectUnauthorized: false }
    : undefined;
}

export function connectionConfig(overrides = {}) {
  const url = fromUrl();
  return {
    host: process.env.DB_HOST || url.host || "127.0.0.1",
    port: Number(process.env.DB_PORT || url.port || 3306),
    user: process.env.DB_USER || url.user,
    password: process.env.DB_PASSWORD ?? url.password ?? "",
    database: databaseName(),
    ssl: sslConfig(),
    charset: "utf8mb4_unicode_ci",
    timezone: "local",
    multipleStatements: true,
    ...overrides,
  };
}

export async function ensureDatabase() {
  const name = databaseName();
  const config = connectionConfig();
  const connection = await mysql.createConnection({ ...config, database: undefined });
  try {
    await connection.query(
      `create database if not exists \`${name}\` character set utf8mb4 collate utf8mb4_unicode_ci`,
    );
    console.log(`✓ Base de datos "${name}" disponible`);
  } catch (error) {
    if (error?.code === "ER_DBACCESS_DENIED_ERROR" || error?.code === "ER_ACCESS_DENIED_ERROR") {
      // En Hostinger la base y el usuario se crean desde el panel. Si ya existen,
      // basta con poder conectarse a ellas.
      const direct = await mysql.createConnection(config);
      await direct.end();
      console.log(`✓ Base de datos "${name}" ya existe (sin permiso para crearla)`);
      return;
    }
    throw error;
  } finally {
    await connection.end().catch(() => {});
  }
}

export async function resetDatabase() {
  const connection = await mysql.createConnection(connectionConfig());
  try {
    await connection.query("set foreign_key_checks = 0");
    for (const table of [
      "order_items",
      "orders",
      "products",
      "categories",
      "admin_sessions",
      "admin_users",
      "contact_messages",
      "settings",
    ]) {
      await connection.query(`drop table if exists \`${table}\``);
    }
    await connection.query("set foreign_key_checks = 1");
  } finally {
    await connection.end();
  }
  console.log("✓ Tablas eliminadas (modo --reset)");
}

export async function applySchema() {
  const connection = await mysql.createConnection(connectionConfig());
  try {
    const sql = readFileSync(join(root, "database", "schema.sql"), "utf8");
    await connection.query(sql);
  } finally {
    await connection.end();
  }
  console.log("✓ Esquema aplicado");
}
