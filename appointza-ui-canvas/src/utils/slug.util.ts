/**
 * Utility functions for generating and normalizing URL slugs
 * Handles spaces, special characters, and Unicode characters
 */

/**
 * Converts a string to a URL-safe slug
 * Example: "Organization Name" => "organization-name"
 * Example: "São Paulo" => "sao-paulo"
 */
export const toSlug = (text: string): string => {
  if (!text) return '';

  let slug = text.toLowerCase();

  // Remove accents/diacritics
  slug = slug.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // Replace spaces and underscores with hyphens
  slug = slug.replace(/[\s_]+/g, '-');

  // Remove all non-alphanumeric characters except hyphens
  slug = slug.replace(/[^a-z0-9\-]/g, '');

  // Replace multiple consecutive hyphens with a single hyphen
  slug = slug.replace(/-+/g, '-');

  // Trim hyphens from start and end
  slug = slug.replace(/^-+|-+$/g, '');

  return slug;
};

/**
 * Normalizes a string for comparison purposes
 * Removes all spaces, hyphens, and special characters, converts to lowercase
 */
export const normalize = (text: string): string => {
  if (!text) return '';

  let normalized = text.toLowerCase();

  // Remove accents/diacritics
  normalized = normalized.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // Remove all non-alphanumeric characters
  normalized = normalized.replace(/[^a-z0-9]/g, '');

  return normalized;
};

/**
 * Checks if two strings match after normalization
 * Useful for comparing database values with URL slugs
 */
export const normalizedEquals = (text1: string, text2: string): boolean => {
  if (!text1 && !text2) return true;
  if (!text1 || !text2) return false;

  return normalize(text1) === normalize(text2);
};

/**
 * Checks if text1 contains text2 after normalization
 */
export const normalizedContains = (text1: string, text2: string): boolean => {
  if (!text1 || !text2) return false;

  return normalize(text1).includes(normalize(text2));
};

/**
 * Generates a subdomain URL from organization and location details
 * Example: "Organization Name", "Area Name", "City Name", "State Name"
 * => "organization-name-area-name-city-name-state-name"
 */
export const generateSubdomainSlug = (
  organizationName: string,
  areaName: string,
  cityName: string,
  stateName: string
): string => {
  const orgSlug = toSlug(organizationName);
  const areaSlug = toSlug(areaName);
  const citySlug = toSlug(cityName);
  const stateSlug = toSlug(stateName);

  // Build subdomain parts, skipping empty values
  const parts: string[] = [];

  if (orgSlug) parts.push(orgSlug);
  if (areaSlug) parts.push(areaSlug);
  if (citySlug) parts.push(citySlug);
  if (stateSlug) parts.push(stateSlug);

  return parts.join('-');
};

/**
 * Origin (scheme + host + port) from a stored custom URL — path/query in DB are ignored.
 */
export function parseCustomSiteOrigin(
  customUrl: string,
  fallbackProtocol: string = typeof window !== "undefined" ? window.location.protocol : "https:"
): string | null {
  const trimmed = (customUrl || "").trim();
  if (!trimmed) return null;

  try {
    const withScheme = trimmed.includes("://")
      ? trimmed
      : `${fallbackProtocol}//${trimmed.replace(/^\/\//, "")}`;
    return new URL(withScheme).origin;
  } catch {
    const host = trimmed.replace(/^https?:\/\//i, "").split("/")[0]?.toLowerCase();
    if (!host) return null;
    const protocol = fallbackProtocol === "http:" ? "http:" : "https:";
    return `${protocol}//${host}`;
  }
}

/** True when the app is on the main marketing host (not an org subdomain). */
export function isMainAppHostname(hostname: string): boolean {
  const h = (hostname || "").toLowerCase();
  return h === "appointza.com" || h === "www.appointza.com" || h === "localhost" || h === "127.0.0.1";
}

export function customSiteOriginsMatch(currentHref: string, customOrigin: string): boolean {
  try {
    const current = new URL(currentHref);
    const custom = new URL(customOrigin);
    return (
      current.hostname.toLowerCase() === custom.hostname.toLowerCase() &&
      (current.port || "") === (custom.port || "")
    );
  } catch {
    return false;
  }
}

/**
 * Generates a full subdomain URL
 * Example: returns "organization-name-area-name-city-name-state-name.appointza.com"
 */
export const generateSubdomainUrl = (
  organizationName: string,
  areaName: string,
  cityName: string,
  stateName: string,
  domain: string = 'appointza.com'
): string => {
  const slug = generateSubdomainSlug(organizationName, areaName, cityName, stateName);
  return `${slug}.${domain}`;
};
