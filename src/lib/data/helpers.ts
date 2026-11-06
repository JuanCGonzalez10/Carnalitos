export function buildUpdateSet(
  input: Record<string, unknown>,
  fields: Record<string, string>,
): { clause: string; values: unknown[]; nextIndex: number } {
  const parts: string[] = [];
  const values: unknown[] = [];
  for (const [key, column] of Object.entries(fields)) {
    if (!(key in input) || input[key] === undefined) continue;
    parts.push(`${column} = ?`);
    values.push(input[key]);
  }
  return { clause: parts.join(", "), values, nextIndex: values.length + 1 };
}

export function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function toNumber(value: unknown, fallback = 0): number {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

export function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (typeof value === "string") {
    return value
      .split(/\r?\n|,/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}
