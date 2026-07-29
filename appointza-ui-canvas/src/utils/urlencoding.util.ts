/**
 * URL Encoding/Decoding Utilities (Percent Encoding)
 * Converts: "Organization Name" <-> "Organization%20Name"
 * Process: Character -> UTF-8 bytes -> Hex -> %XX format
 */

/**
 * Encodes a string for safe URL usage (percent encoding)
 * Example: "Organization Name" -> "Organization%20Name"
 * Process: Character -> number -> hex -> attach %
 */
export const encodeForUrl = (text: string): string => {
  if (!text) return '';
  
  // Built-in function that does: char -> UTF-8 bytes -> hex -> %XX
  return encodeURIComponent(text);
};

/**
 * Decodes a URL-encoded string back to original
 * Example: "Organization%20Name" -> "Organization Name"
 */
export const decodeFromUrl = (encodedText: string): string => {
  if (!encodedText) return '';
  
  try {
    return decodeURIComponent(encodedText);
  } catch (error) {
    console.error('Failed to decode URL:', encodedText, error);
    return encodedText;
  }
};

/**
 * Manual percent encoding for educational purposes
 * Shows the complete process step by step
 */
export const manualEncode = (text: string): string => {
  if (!text) return '';
  
  let result = '';
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    
    // Check if character is unreserved (no encoding needed)
    if (isUnreserved(char)) {
      result += char;
    } else {
      // Convert character to UTF-8 bytes
      const utf8Bytes = new TextEncoder().encode(char);
      
      // Convert each byte to hex with % prefix
      for (const byte of utf8Bytes) {
        result += '%' + byte.toString(16).toUpperCase().padStart(2, '0');
      }
    }
  }
  
  return result;
};

/**
 * Manual percent decoding
 */
export const manualDecode = (encodedText: string): string => {
  if (!encodedText) return '';
  
  const bytes: number[] = [];
  let i = 0;
  
  while (i < encodedText.length) {
    if (encodedText[i] === '%' && i + 2 < encodedText.length) {
      // Get the two hex digits after %
      const hexString = encodedText.substring(i + 1, i + 3);
      const byte = parseInt(hexString, 16);
      bytes.push(byte);
      i += 3;
    } else {
      bytes.push(encodedText.charCodeAt(i));
      i++;
    }
  }
  
  // Convert bytes back to string
  return new TextDecoder().decode(new Uint8Array(bytes));
};

/**
 * Check if character is unreserved and doesn't need encoding
 * Unreserved: A-Z a-z 0-9 - _ . ~
 */
const isUnreserved = (char: string): boolean => {
  const code = char.charCodeAt(0);
  return (
    (code >= 65 && code <= 90) ||   // A-Z
    (code >= 97 && code <= 122) ||  // a-z
    (code >= 48 && code <= 57) ||   // 0-9
    char === '-' || char === '_' || char === '.' || char === '~'
  );
};

/**
 * Get encoding steps for educational/debugging purposes
 */
export const getEncodingSteps = (text: string): string => {
  if (!text) return 'Empty string';
  
  let steps = `Original: "${text}"\n\nEncoding Process:\n`;
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const code = char.charCodeAt(0);
    
    if (isUnreserved(char)) {
      steps += `  '${char}' -> No encoding needed -> '${char}'\n`;
    } else {
      const utf8Bytes = new TextEncoder().encode(char);
      const hexValues = Array.from(utf8Bytes)
        .map(b => b.toString(16).toUpperCase().padStart(2, '0'))
        .join(' ');
      const encoded = Array.from(utf8Bytes)
        .map(b => '%' + b.toString(16).toUpperCase().padStart(2, '0'))
        .join('');
      steps += `  '${char}' -> Code: ${code} -> Bytes: [${hexValues}] -> ${encoded}\n`;
    }
  }
  
  steps += `\nFinal Encoded: "${encodeForUrl(text)}"`;
  return steps;
};

/**
 * Batch encode multiple strings
 */
export const encodeBatch = (texts: string[]): Record<string, string> => {
  const result: Record<string, string> = {};
  texts.forEach(text => {
    if (text) {
      result[text] = encodeForUrl(text);
    }
  });
  return result;
};

/**
 * Batch decode multiple strings
 */
export const decodeBatch = (encodedTexts: string[]): Record<string, string> => {
  const result: Record<string, string> = {};
  encodedTexts.forEach(encodedText => {
    if (encodedText) {
      result[encodedText] = decodeFromUrl(encodedText);
    }
  });
  return result;
};

/**
 * Example encoding table for common characters
 */
export const ENCODING_TABLE = {
  ' ': '%20',
  '!': '%21',
  '"': '%22',
  '#': '%23',
  '$': '%24',
  '%': '%25',
  '&': '%26',
  "'": '%27',
  '(': '%28',
  ')': '%29',
  '*': '%2A',
  '+': '%2B',
  ',': '%2C',
  '/': '%2F',
  ':': '%3A',
  ';': '%3B',
  '=': '%3D',
  '?': '%3F',
  '@': '%40',
  '[': '%5B',
  ']': '%5D',
};

/**
 * Display encoding table
 */
export const getEncodingTable = (): string => {
  let table = 'Common Character Encoding Table:\n';
  table += 'Character -> Percent Encoded\n';
  table += '─────────────────────────────\n';
  
  Object.entries(ENCODING_TABLE).forEach(([char, encoded]) => {
    const displayChar = char === ' ' ? 'Space' : char;
    table += `  '${displayChar}' -> ${encoded}\n`;
  });
  
  return table;
};
