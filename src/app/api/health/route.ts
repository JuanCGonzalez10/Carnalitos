import { NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db";

export const dynamic = "force-dynamic";

type HealthStatus = "ok" | "error";

function databaseHint(code?: string): string {
  switch (code) {
    case "ER_ACCESS_DENIED_ERROR":
      return "Usuario o contraseña incorrectos. Revisa DB_USER y DB_PASSWORD en hPanel.";
    case "ER_BAD_DB_ERROR":
      return "La base de datos no existe. Crea la base en hPanel y revisa DB_NAME.";
    case "ECONNREFUSED":
    case "ETIMEDOUT":
      return "No se pudo conectar al servidor MySQL. Usa DB_HOST=127.0.0.1 y revisa DB_PORT.";
    case "ENOTFOUND":
      return "El host de la base de datos no existe. Revisa DB_HOST.";
    case "ER_NO_SUCH_TABLE":
      return "Faltan las tablas. Importa database/install-hostinger.sql en phpMyAdmin.";
    default:
      return "Revisa las variables de entorno de la base de datos en Hostinger.";
  }
}

export async function GET() {
  const checks: Record<string, unknown> = {
    app: "ok",
    node: process.version,
    timestamp: new Date().toISOString(),
  };

  const env = {
    DB_HOST: process.env.DB_HOST || "por defecto (127.0.0.1)",
    DB_PORT: process.env.DB_PORT || "por defecto (3306)",
    DB_USER: process.env.DB_USER ? "definido" : "faltante",
    DB_PASSWORD: process.env.DB_PASSWORD ? "definido" : "vacío",
    DB_NAME: process.env.DB_NAME ? "definido" : "faltante",
    DATABASE_URL: process.env.DATABASE_URL ? "definida" : "no definida",
  };
  checks.env = env;

  const missing: string[] = [];
  const hasUrl = Boolean(process.env.DATABASE_URL);
  if (!hasUrl && !process.env.DB_USER) missing.push("DB_USER");
  if (!hasUrl && !process.env.DB_NAME) missing.push("DB_NAME");

  if (missing.length > 0) {
    return NextResponse.json(
      {
        status: "error" satisfies HealthStatus,
        message: "La configuración de la base de datos está incompleta.",
        missing,
        checks,
      },
      { status: 503 },
    );
  }

  try {
    await queryOne("select 1 as ok");

    const tables = await query<{ name: string }>(
      `select table_name as name
       from information_schema.tables
       where table_schema = database()
       order by table_name`,
    );
    const tableNames = tables.map((row) => row.name);
    const required = [
      "admin_users",
      "admin_sessions",
      "settings",
      "categories",
      "products",
      "orders",
      "order_items",
      "contact_messages",
    ];
    const missingTables = required.filter((table) => !tableNames.includes(table));

    if (missingTables.length > 0) {
      return NextResponse.json(
        {
          status: "error" satisfies HealthStatus,
          message: "La base de datos está conectada, pero faltan tablas.",
          missingTables,
          hint: "Importa database/install-hostinger.sql desde phpMyAdmin.",
          checks,
        },
        { status: 503 },
      );
    }

    const [counts] = await Promise.all([
      queryOne<{ products: number }>("select count(*) as products from products"),
    ]);

    return NextResponse.json({
      status: "ok" satisfies HealthStatus,
      message: "Aplicación y base de datos funcionando.",
      database: {
        tables: tableNames.length,
        products: counts?.products ?? 0,
      },
      checks,
    });
  } catch (error) {
    const err = error as { code?: string; errno?: number; message?: string };
    console.error("Health check de base de datos falló", error);
    return NextResponse.json(
      {
        status: "error" satisfies HealthStatus,
        message: "No se pudo conectar con la base de datos.",
        code: err.code ?? null,
        errno: err.errno ?? null,
        hint: databaseHint(err.code),
        checks,
      },
      { status: 503 },
    );
  }
}
