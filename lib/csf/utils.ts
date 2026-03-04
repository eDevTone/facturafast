/**
 * CSF String Utilities
 * Aligned with eip-api implementation
 */

export function normalizeSpace(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

export function normalizeKey(k: string): string {
  let key = normalizeSpace(k);
  if (key.endsWith(":")) {
    key = key.slice(0, -1).trim();
  }
  return key;
}

export function looksLikeLabelToken(tok: string): boolean {
  const trimmed = tok.trim();
  return Boolean(trimmed) && trimmed.endsWith(":") && /^[a-zA-Z]/.test(trimmed);
}

export function mergeBrokenTokens(tokens: string[]): string[] {
  const merged: string[] = [];
  let i = 0;
  while (i < tokens.length) {
    const a = tokens[i];
    if (i + 1 < tokens.length) {
      const b = tokens[i + 1];
      if (
        a.length <= 12 &&
        b &&
        /^[a-z]/.test(b) &&
        !a.endsWith(":") &&
        a.length + b.length <= 120
      ) {
        merged.push(a + b);
        i += 2;
        continue;
      }
    }
    merged.push(a);
    i += 1;
  }
  return merged;
}

export function isJavaScriptCode(text: string): boolean {
  const jsPatterns = [
    /^\s*\$\s*\(/,
    /^\s*function\s*\(/,
    /PrimeFaces\./,
    /\.cw\s*\(/,
    /window\.(onload|onready)/i,
    /navigator\./,
    /document\./,
    /console\.(log|warn|error)/,
    /var\s+\w+\s*=/,
    /\{id:'/,
    /widget_/,
  ];

  return jsPatterns.some((pattern) => pattern.test(text));
}

export function cleanValue(value: string): string {
  if (isJavaScriptCode(value)) return "";

  const cleaned = value
    .replace(/\$\s*\(\s*function\s*\(\s*\)\s*\{[^}]*\}\s*\)\s*;?\s*/g, "")
    .replace(/window\.\w+\s*=\s*function[^}]*\}[^}]*\}/g, "")
    .replace(/PrimeFaces\.[^;]+;?\s*/g, "")
    .replace(/function\s+\w+\s*\([^)]*\)\s*\{[^}]*\}/g, "")
    .replace(/\s*;\s*/g, " ")
    .trim();

  return normalizeSpace(cleaned);
}

export function stripSectionTitleSuffix(value: string, titles: string[]): string {
  let v = normalizeSpace(value);
  for (const title of titles) {
    if (v.endsWith(title)) {
      v = normalizeSpace(v.slice(0, -title.length));
    }
  }
  return v;
}

export function upsertKeyValue(
  container: Record<string, string | string[]>,
  key: string,
  val: string
): void {
  if (!key || !val) return;

  if (!(key in container)) {
    container[key] = val;
    return;
  }

  const existing = container[key];
  if (Array.isArray(existing)) {
    existing.push(val);
  } else {
    container[key] = [existing, val];
  }
}

export function moveKeys(
  rawKv: Record<string, string | string[]>,
  keyset: Set<string>,
  section: Record<string, any>
): void {
  for (const k of Object.keys(rawKv)) {
    if (keyset.has(k)) {
      section[k] = rawKv[k];
      delete rawKv[k];
    }
  }
}
