/**
 * Nettoie le base path pour que React Router et GitHub Pages parlent la même URL.
 *
 * La fonction ajoute un slash initial si besoin et enlève les slashes finaux pour
 * garder un préfixe stable, par exemple `/tactical-board`.
 */
export function normalizeSiteBasename(baseUrl: string): string {
  const withLeadingSlash = baseUrl.startsWith('/') ? baseUrl : `/${baseUrl}`
  return withLeadingSlash.replace(/\/+$/, '') || '/'
}
