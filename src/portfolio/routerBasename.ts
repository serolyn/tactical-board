export function normalizeBasename(baseUrl: string): string {
  const withLeadingSlash = baseUrl.startsWith('/') ? baseUrl : `/${baseUrl}`
  return withLeadingSlash.replace(/\/+$/, '') || '/'
}
