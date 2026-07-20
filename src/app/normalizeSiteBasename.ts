/**
 * @packageDocumentation
 * Outils de navigation et de métadonnées du site.
 *
 * Il nettoie le préfixe d'URL pour que GitHub Pages et Vite restent compatibles. Ce dossier est le bon point d'entrée si tu veux comprendre comment
 * une URL devient une page visible dans le navigateur.
 */

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
