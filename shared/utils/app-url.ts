/** Absolute URL of a page of the app, for emails and links shared outside it. */
export function appUrl(path: string): string {
  const base = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '')
  return `${base}${path}`
}
