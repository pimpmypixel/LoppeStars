/**
 * Removes common words and dashes from a market name for concise display.
 * E.g. "Loppemarked ved Søerne - København" => "ved Søerne København"
 */
export function cleanMarketName(name: string): string {
  if (!name) return '';
  // Remove common Danish/English words and dashes
  return name
    .replace(/\b(loppemarked|marked|flea market|loppis|bazaar|loppemarkeder|market|og)\b/gi, '')
    .replace(/[–—\-]/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}
// String and text utility functions for the app

/**
 * Decodes common HTML entities in a string to their Unicode equivalents.
 * @param text The string to decode
 * @returns The decoded string
 */
export function decodeHtmlEntities(text: string): string {
  if (!text) return '';
  const entities: { [key: string]: string } = {
    '&#038;': '&',
    '&amp;': '&',
    '&#8211;': '–',
    '&ndash;': '–',
    '&#8212;': '—',
    '&mdash;': '—',
    '&nbsp;': ' ',
    '&quot;': '"',
    '&#39;': "'",
    '&apos;': "'",
    '&lt;': '<',
    '&gt;': '>',
  };
  return text.replace(/&#?\w+;/g, (match) => entities[match] || match);
}
