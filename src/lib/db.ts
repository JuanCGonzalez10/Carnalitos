import mysql, {
  type Pool,
  type PoolConnection,
  type ResultSetHeader,
  type RowDataPacket,
} from "mysql2/promise";

// ---------------------------------------------------------------------------
// Conexión MySQL / MariaDB (Hostinger)
//
// Variables admitidas:
//   DB_HOST / DB_PORT / DB_USER / DB_PASSWORD / DB_NAME
// o una sola cadena:
//   DATABASE_URL=mysql://usuario:clave@127.0.0.1:3306/base
//
// En Hostinger el host debe ser 127.0.0.1 (no "localhost", porque Node 17+
// resuelve localhost a IPv6 y MySQL de Hostinger solo acepta IPv4).
// ---------------------------------------------------------------------------

type DbGlobal = { __carnalitosPool?: Pool };

const globalForDb = globalThis as unknown as DbGlobal;

function parseDatabaseUrl(): Partial<mysql.PoolOptions> {
  const url = process.env.DATABASE_URL;
  if (!url) return {};
  try {
    const parsed = new URL(url);
    if (!/^mysql:$/.test(parsed.protocol)) return {};
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

function createPool(): Pool {
  const fromUrl = parseDatabaseUrl();
  const host = process.env.DB_HOST || fromUrl.host || "127.0.0.1";
  const user = process.env.DB_USER || fromUrl.user;
  const database = process.env.DB_NAME || fromUrl.database;

  if (!user || !database) {
    throw new Error(
      "Configuración de base de datos incompleta. Define DB_HOST, DB_USER, DB_PASSWORD y DB_NAME (o DATABASE_URL) en .env.local.",
    );
  }

  const pool = mysql.createPool({
    host,
    port: Number(process.env.DB_PORT || fromUrl.port || 3306),
    user,
    password: process.env.DB_PASSWORD ?? fromUrl.password ?? "",
    database,
    charset: "utf8mb4_unicode_ci",
    waitForConnections: true,
    connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 5),
    maxIdle: Number(process.env.DB_CONNECTION_LIMIT || 5),
    idleTimeout: 30_000,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    decimalNumbers: true,
    dateStrings: true,
    supportBigNumbers: true,
    bigNumberStrings: false,
    ssl:
      process.env.DB_SSL === "true" || process.env.DATABASE_SSL === "true"
        ? { rejectUnauthorized: false }
        : undefined,
    typeCast(field, next) {
      // TINYINT(1) -> boolean (active, featured, etc.).
      if (field.type === "TINY" && field.length === 1) {
        const value = field.string();
        return value === null ? null : value === "1";
      }
      // Algunos proveedores (MariaDB) exponen JSON como LONGTEXT.
      if (field.type === "JSON") {
        const value = field.string("utf8");
        if (value === null) return null;
        try {
          return JSON.parse(value);
        } catch {
          return value;
        }
      }
      return next();
    },
  });

  return pool;
}

function safeJsonParse(value: string): unknown {
  const text = value.trim();
  if (!text.startsWith("{") && !text.startsWith("[")) return value;
  try {
    return JSON.parse(text);
  } catch {
    return value;
  }
}

/**
 * MariaDB devuelve las columnas JSON como texto. Normalizamos los campos que
 * sabemos que son JSON para que la aplicación siempre reciba objetos/arrays.
 */
function normalizeRow<T>(row: T): T {
  if (!row || typeof row !== "object") return row;
  const record = row as Record<string, unknown>;
  if (typeof record.benefits === "string") {
    record.benefits = safeJsonParse(record.benefits);
  }
  if (typeof record.value === "string") {
    record.value = safeJsonParse(record.value);
  }
  // MySQL devuelve DATETIME como "YYYY-MM-DD HH:mm:ss". Lo pasamos a ISO
  // (con "T") para que `new Date(...)` funcione igual en todos los navegadores.
  for (const [key, value] of Object.entries(record)) {
    if (typeof value === "string" && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value)) {
      record[key] = value.replace(" ", "T");
    }
  }
  return row;
}

export const pool = globalForDb.__carnalitosPool ?? createPool();
if (process.env.NODE_ENV !== "production") globalForDb.__carnalitosPool = pool;

/** Devuelve las filas de un SELECT. */
export async function query<T = RowDataPacket>(
  sql: string,
  params: unknown[] = [],
): Promise<T[]> {
  const [rows] = await pool.query(sql, params as unknown[]);
  if (!Array.isArray(rows)) return [];
  return (rows as T[]).map((row) => normalizeRow(row));
}

/** Devuelve la primera fila de un SELECT o null. */
export async function queryOne<T = RowDataPacket>(
  sql: string,
  params: unknown[] = [],
): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows[0] ?? null;
}

/** Ejecuta INSERT/UPDATE/DELETE y devuelve metadatos del resultado. */
export async function execute(sql: string, params: unknown[] = []): Promise<ResultSetHeader> {
  const [result] = await pool.query(sql, params as unknown[]);
  return result as ResultSetHeader;
}

export async function withTransaction<T>(
  fn: (connection: PoolConnection) => Promise<T>,
): Promise<T> {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await fn(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export function isUniqueViolation(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  const err = error as { code?: string; errno?: number };
  return err.code === "ER_DUP_ENTRY" || err.errno === 1062;
}
