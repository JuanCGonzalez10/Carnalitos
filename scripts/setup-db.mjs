import { pathToFileURL } from "node:url";
import { ensureDatabase, applySchema, resetDatabase } from "./db-config.mjs";

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const reset = process.argv.includes("--reset");
  if (reset) await resetDatabase();
  await ensureDatabase();
  await applySchema();
  const { seed } = await import("./seed.mjs");
  await seed();
  console.log("\n✅ Listo. Inicia el sitio con: npm run dev");
  console.log("   Panel: http://localhost:3000/admin/login");
  console.log(`   Correo: ${process.env.ADMIN_EMAIL || "admin@adrenalinaextrema.co"}`);
  console.log("   Contraseña: la definida en ADMIN_PASSWORD (.env.local)\n");
}
