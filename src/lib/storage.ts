import { isAbsolute, resolve } from "node:path";

/**
 * Devuelve la carpeta donde se guardan las imágenes subidas.
 *
 * En Hostinger cada despliegue crea una carpeta nueva, por lo que UPLOAD_DIR
 * debe apuntar a una ruta absoluta fuera de hbuilds/public_html:
 *   /home/u123456789/domains/tudominio.com/storage/uploads
 */
export function uploadDirectory(): string {
  const configured = (process.env.UPLOAD_DIR || "storage/uploads").trim();
  if (isAbsolute(configured)) return configured;
  return resolve(/* turbopackIgnore: true */ process.cwd(), configured);
}
