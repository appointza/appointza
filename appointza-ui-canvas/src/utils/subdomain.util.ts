import { getAppDomain } from "@/utils/environment";

export type SubdomainLocation = {
  organization: string;
  area: string;
  city: string;
  state: string;
};

const POSSIBLE_STATES = [
  "tamil-nadu",
  "tamilnadu", // Allow without hyphen for flexibility
  "andhra-pradesh",
  "andhrapradesh",
  "west-bengal",
  "westbengal",
  "uttar-pradesh",
  "uttarpradesh",
  "madhya-pradesh",
  "madhyapradesh",
  "karnataka",
  "gujarat",
  "rajasthan",
  "maharashtra",
];

// Normalize state names (e.g., "tamilnadu" -> "tamil-nadu")
const normalizeStateName = (state: string): string => {
  const normalized = state.toLowerCase().replace(/-/g, "");
  
  // Map common variations to standard format
  const stateMap: Record<string, string> = {
    "tamilnadu": "tamil-nadu",
    "andhrapradesh": "andhra-pradesh",
    "westbengal": "west-bengal",
    "uttarpradesh": "uttar-pradesh",
    "madhyapradesh": "madhya-pradesh",
  };
  
  return stateMap[normalized] || state;
};

const normalizeHostname = (input: string): string => {
  if (!input) {
    return "";
  }

  let host = input.trim().toLowerCase();

  // If a full URL is passed, extract hostname.
  if (host.startsWith("http://") || host.startsWith("https://")) {
    try {
      host = new URL(host).hostname.toLowerCase();
    } catch {
      // Fall back to the raw input if URL parsing fails.
    }
  }

  // Strip port if present (e.g., "example.localhost:8083").
  if (host.includes(":")) {
    host = host.split(":")[0];
  }

  // Trim trailing dot if present.
  return host.endsWith(".") ? host.slice(0, -1) : host;
};

export const parseSubdomainLocation = (
  hostname: string,
  domain: string = getAppDomain()
): SubdomainLocation | null => {
  const normalizedHostname = normalizeHostname(hostname);
  console.log('🔍 Parsing subdomain:', { hostname, normalizedHostname, domain });

  // Handle .localhost subdomains (works in both dev and production)
  if (normalizedHostname.endsWith(".localhost")) {
    const subdomainPart = normalizedHostname.slice(0, -".localhost".length);
    if (!subdomainPart) {
      console.log('❌ Empty subdomain part');
      return null;
    }
    console.log('📍 Extracted subdomain part:', subdomainPart);
    const result = parseSubdomainParts(subdomainPart.split("-"));
    console.log('📋 Parse result:', result);
    return result;
  }

  // Handle plain localhost (no subdomain)
  if (normalizedHostname === "localhost" || normalizedHostname === "127.0.0.1") {
    return null;
  }

  // Auto-detect domain from hostname if it contains a dot
  // This handles cases where DOMAIN might not match the actual hostname
  const hostnameParts = normalizedHostname.split(".");
  let detectedDomain = domain;
  
  // If hostname has multiple parts, try to detect the base domain
  if (hostnameParts.length >= 2) {
    // Check if it matches known patterns
    const lastTwoParts = hostnameParts.slice(-2).join(".");
    if (lastTwoParts === "localhost" || lastTwoParts.includes("appointza.com")) {
      detectedDomain = lastTwoParts;
    } else if (hostnameParts.length >= 2) {
      // Use last two parts as domain (e.g., "appointza.com")
      detectedDomain = lastTwoParts;
    }
  }

  const wwwDomain = `www.${detectedDomain}`;
  
  // Check if it's the base domain (no subdomain)
  if (
    normalizedHostname === detectedDomain ||
    normalizedHostname === wwwDomain
  ) {
    return null;
  }

  // Check for subdomain pattern: subdomain.domain
  const suffix = normalizedHostname.endsWith(`.${wwwDomain}`)
    ? `.${wwwDomain}`
    : `.${detectedDomain}`;
    
  if (!normalizedHostname.endsWith(suffix)) {
    // If it doesn't match the expected suffix, try parsing anyway
    // This handles cases like "subdomain.localhost:5000" where port is stripped
    const parts = normalizedHostname.split(".");
    if (parts.length >= 2) {
      // Assume everything before the last dot is the subdomain
      const subdomainPart = parts.slice(0, -1).join(".");
      if (subdomainPart && subdomainPart.split("-").length >= 4) {
        console.log('📍 Trying alternative parsing with parts:', parts);
        return parseSubdomainParts(subdomainPart.split("-"));
      }
    }
    console.log('❌ Hostname does not match expected suffix:', suffix);
    return null;
  }

  const subdomainPart = normalizedHostname.slice(0, -suffix.length);
  if (!subdomainPart) {
    return null;
  }

  const domainParts = subdomainPart.split("-");
  return parseSubdomainParts(domainParts);
};

const parseSubdomainParts = (domainParts: string[]): SubdomainLocation | null => {
  const parts = domainParts.filter((part) => part);
  if (parts.length < 4) {
    console.log('❌ Subdomain parsing failed: Less than 4 parts', parts);
    return null;
  }

  let state = "";
  let city = "";
  let area = "";
  let organization = "";

  // Try to detect multi-part state names (e.g., tamil-nadu) by matching from the tail.
  const maxStateParts = Math.min(3, parts.length - 3);
  for (let count = maxStateParts; count >= 1; count -= 1) {
    const stateCandidate = parts.slice(-count).join("-");
    const normalizedCandidate = normalizeStateName(stateCandidate);
    
    // Check both original and normalized versions
    if (POSSIBLE_STATES.includes(stateCandidate) || POSSIBLE_STATES.includes(normalizedCandidate)) {
      state = normalizedCandidate; // Use normalized version
      city = parts[parts.length - count - 1] || "";
      organization = parts[0] || "";
      area = parts.slice(1, parts.length - count - 1).join("-");
      console.log('✅ Matched state with', count, 'parts:', { state, city, area, organization });
      break;
    }
  }

  // Fallback: treat last part as state (even if not in POSSIBLE_STATES)
  if (!state) {
    const lastPart = parts[parts.length - 1] || "";
    state = normalizeStateName(lastPart);
    city = parts[parts.length - 2] || "";
    area = parts.slice(1, -2).join("-");
    organization = parts[0] || "";
    console.log('⚠️ Using fallback parsing:', { state, city, area, organization });
  }

  if (!organization || !city || !state) {
    console.log('❌ Subdomain parsing failed: Missing required fields', { organization, city, state });
    return null;
  }

  return { organization, area, city, state };
};
