import { parse } from 'tldts';

/**
 * Validate if a string is a valid URL
 * @param url - The URL string to validate
 * @returns true if valid URL, false otherwise
 */
export function isValidUrl(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }

  try {
    const urlObj = new URL(url);
    // Ensure it has a valid protocol (http or https)
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Normalize a URL to ensure it has https:// protocol
 * Handles URLs with http://, https://, or no protocol
 * @param url - The URL to normalize
 * @returns Normalized URL with https:// protocol, or null if invalid
 */
export function normalizeUrl(url: string): string | null {
  if (!url || typeof url !== 'string') {
    return null;
  }

  const trimmed = url.trim();
  if (!trimmed) {
    return null;
  }

  // If URL already has http:// or https://, validate it
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    if (!isValidUrl(trimmed)) {
      return null;
    }
    // Convert http:// to https://
    return trimmed.replace(/^http:\/\//, 'https://');
  }

  // If no protocol, add https://
  const withProtocol = `https://${trimmed}`;
  if (!isValidUrl(withProtocol)) {
    return null;
  }

  return withProtocol;
}

/**
 * Extract the root domain from a URL using tldts library
 * @param url - The URL or domain string to extract from
 * @returns The root domain (e.g., "example.com"), or null if invalid
 */
export function extractDomain(url: string): string | null {
  if (!url || typeof url !== 'string') {
    return null;
  }

  const trimmed = url.trim();
  if (!trimmed) {
    return null;
  }

  // Try to parse with tldts
  // If URL doesn't have a protocol, tldts may not parse correctly, so normalize first
  let urlToParse = trimmed;
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    urlToParse = `https://${trimmed}`;
  }

  const parsed = parse(urlToParse);

  if (parsed.domain) {
    return parsed.domain;
  }

  return null;
}
