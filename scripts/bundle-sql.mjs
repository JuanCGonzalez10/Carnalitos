import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Genera database/install-hostinger.sql combinando el esquema y los datos
 * iniciales en un solo archivo fácil de importar desde phpMyAdmin.
 *
 * Uso: npm run db:bundle
 */

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const databaseDir = join(root, "database");

const schema = readFileSync(join(databaseDir, "schema.sql"), "utf8").trim();
const seed = readFileSync(join(databaseDir, "seed-production.sql"), "utf8").trim();

const header = `-- ============================================================
-- Carnalitos - instalación completa para Hostinger
--
-- Importa ESTE único archivo en phpMyAdmin y quedará lista la base:
--   1. Tablas (schema.sql)
--   2. Administrador, configuración, categorías y productos
--
-- Es seguro importarlo varias veces: los datos existentes se conservan.
--
-- Acceso inicial al panel:
--   Correo: carnalitosbarf@gmail.com
--   Contraseña: Cami0510*
-- Cambia la contraseña desde el panel apenas ingreses.
-- ============================================================

SET NAMES utf8mb4;
`;

const output = `${header}\n${schema}\n\n-- ============================================================\n-- Datos iniciales\n-- ============================================================\n\n${seed}\n`;

writeFileSync(join(databaseDir, "install-hostinger.sql"), output, "utf8");
console.log("✓ database/install-hostinger.sql generado");
