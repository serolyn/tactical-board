/** Normalise le préfixe Vite pour conserver les liens directs sur GitHub Pages. */
export function normalizeSiteBasename(baseUrl: string): string {
  const withLeadingSlash = baseUrl.startsWith('/') ? baseUrl : `/${baseUrl}`
  return withLeadingSlash.replace(/\/+$/, '') || '/'
}
