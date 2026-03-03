/**
 * CSF String Utilities
 */

export function normalizeSpace(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

export function normalizeKey(s: string): string {
  return normalizeSpace(s.replace(/:$/, ""));
}

export function looksLikeLabelToken(s: string): boolean {
  return s.endsWith(":") || /^[A-ZÁÉÍÓÚÜÑ\s]+$/.test(s);
}

export function mergeBrokenTokens(tokens: string[]): string[] {
  const result: string[] = [];
  let buffer = "";

  for (const t of tokens) {
    if (looksLikeLabelToken(t)) {
      if (buffer) result.push(buffer);
      buffer = t;
    } else if (buffer) {
      buffer += " " + t;
    } else {
      result.push(t);
    }
  }

  if (buffer) result.push(buffer);
  return result;
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
  if (isJavaScriptCode(value)) {
    return "";
  }

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
