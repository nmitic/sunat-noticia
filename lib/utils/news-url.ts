/**
 * Canonical URLs for a single news item.
 *
 * The path carries a readable slug plus the row id: `/noticias/<slug>-<id>`.
 * Lookup keys on the id alone, so a title that changes — the mensajes scraper
 * derives titles from page content, which shifts whenever extraction improves —
 * never breaks a link that someone has already shared.
 */

/** Ids are cuid2: lowercase alphanumeric, 24 chars in practice. */
const ID_SUFFIX = /-([a-z0-9]{16,32})$/;

/**
 * Accent-folded, punctuation-free, hyphen-joined form of a title.
 */
export function slugifyTitle(title: string): string {
  const slug = title
    .normalize('NFD')
    // Strip combining marks so "Caída" becomes "caida" rather than "cada".
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  // Titles here are full sentences; keep the URL to a readable prefix and
  // never cut mid-word.
  const MAX = 70;
  if (slug.length <= MAX) return slug;

  return slug.slice(0, MAX).replace(/-[^-]*$/, '');
}

/**
 * Path for a news item, e.g. `/noticias/sunat-amplia-el-plazo-abc123…`.
 */
export function newsPath(news: { id: string; title: string }): string {
  const slug = slugifyTitle(news.title);
  return slug ? `/noticias/${slug}-${news.id}` : `/noticias/${news.id}`;
}

/**
 * Recover the row id from a `<slug>-<id>` path segment.
 *
 * Returns the whole segment when there is no slug prefix, which covers both
 * bare-id URLs and untitled items.
 */
export function parseNewsSlug(segment: string): string {
  const match = ID_SUFFIX.exec(segment);
  return match ? match[1] : segment;
}
