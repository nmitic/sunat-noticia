/**
 * Decode HTML content with proper character entity handling
 * Works with both named entities and numeric entities
 */
export function decodeContent(text: string): string {
  // Handle numeric character references (&#NUMBER; and &#xHEX;)
  let result = text.replace(/&#(\d{2,3});/g, (match, charCode) => {
    try {
      return String.fromCharCode(parseInt(charCode, 10));
    } catch {
      return match;
    }
  });

  // Handle hex character references
  result = result.replace(/&#x([0-9a-fA-F]{2,4});/g, (match, hexCode) => {
    try {
      return String.fromCharCode(parseInt(hexCode, 16));
    } catch {
      return match;
    }
  });

  // Handle common named entities - Spanish focused
  const entities: Record<string, string> = {
    '&aacute;': 'á',
    '&Aacute;': 'Á',
    '&acirc;': 'â',
    '&Acirc;': 'Â',
    '&agrave;': 'à',
    '&Agrave;': 'À',
    '&aring;': 'å',
    '&Aring;': 'Å',
    '&atilde;': 'ã',
    '&Atilde;': 'Ã',
    '&auml;': 'ä',
    '&Auml;': 'Ä',
    '&eacute;': 'é',
    '&Eacute;': 'É',
    '&ecirc;': 'ê',
    '&Ecirc;': 'Ê',
    '&egrave;': 'è',
    '&Egrave;': 'È',
    '&euml;': 'ë',
    '&Euml;': 'Ë',
    '&iacute;': 'í',
    '&Iacute;': 'Í',
    '&icirc;': 'î',
    '&Icirc;': 'Î',
    '&igrave;': 'ì',
    '&Igrave;': 'Ì',
    '&iuml;': 'ï',
    '&Iuml;': 'Ï',
    '&ntilde;': 'ñ',
    '&Ntilde;': 'Ñ',
    '&oacute;': 'ó',
    '&Oacute;': 'Ó',
    '&ocirc;': 'ô',
    '&Ocirc;': 'Ô',
    '&ograve;': 'ò',
    '&Ograve;': 'Ò',
    '&otilde;': 'õ',
    '&Otilde;': 'Õ',
    '&ouml;': 'ö',
    '&Ouml;': 'Ö',
    '&uacute;': 'ú',
    '&Uacute;': 'Ú',
    '&ucirc;': 'û',
    '&Ucirc;': 'Û',
    '&ugrave;': 'ù',
    '&Ugrave;': 'Ù',
    '&uuml;': 'ü',
    '&Uuml;': 'Ü',
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&apos;': "'",
    '&nbsp;': ' ',
    '&copy;': '©',
    '&reg;': '®',
    '&deg;': '°',
  };

  Object.entries(entities).forEach(([entity, char]) => {
    result = result.split(entity).join(char);
  });

  return result;
}
