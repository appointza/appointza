/**
 * Android Maps SDK key only (manifest / react-native-maps).
 * Places, Geocoding, Routes, and Directions HTTP go through Appointza server keys.
 */
export const GOOGLE_MAPS_API_KEY = 'AIzaSyBK-jeC4P0LzQgL_cWz3xrTtSpYi0waZ_M';

/** @deprecated Prefer Appointza `/api/Napz/*` proxies. Kept empty so client HTTP cannot leak a server key. */
export const GOOGLE_ROUTES_API_KEY = '';

/** SHA-1 without colons — only needed if a legacy client call still hits Android-restricted Places. */
export const GOOGLE_MAPS_ANDROID_CERT_SHA1 = __DEV__
  ? '5E8F16062EA3CD2C4A0D547876BAA6F38CABF625'
  : '8D7C64BCC9409368D4195723800A19C107D45FDC';
