/**
 * Normalize a display name into a URL-safe slug base (lowercase, hyphenated).
 */
export function normalizeNameToSlugBase(name: string): string {
  const trimmed = name.trim().toLowerCase();
  const withoutInvalid = trimmed
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");
  return withoutInvalid.length > 0 ? withoutInvalid : "workspace";
}

/**
 * Pick a slug that is not in `taken`, using deterministic `-2`, `-3`, … suffixes.
 */
export function pickUniqueSlug(base: string, taken: Set<string>): string {
  const safeBase = base.length > 0 ? base : "workspace";
  if (!taken.has(safeBase)) {
    return safeBase;
  }
  let n = 2;
  while (taken.has(`${safeBase}-${n}`)) {
    n += 1;
  }
  return `${safeBase}-${n}`;
}
