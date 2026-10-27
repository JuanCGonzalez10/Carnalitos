import { resolve } from "node:path";

export function uploadDirectory(): string {
  return resolve(process.cwd(), process.env.UPLOAD_DIR || "storage/uploads");
}
