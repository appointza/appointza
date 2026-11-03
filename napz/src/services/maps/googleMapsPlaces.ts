import type { NominatimSearchResult, ReverseGeocodeResult } from './osm';
import {
  appointzaReverseGeocode,
  appointzaSearchPlaces,
} from '../../billing/appointzaCloud';

type LatLng = { lat: number; lng: number };

/** Premium place search via Appointza (server Google Places key). */
export async function searchPlacesGoogle(
  query: string,
  near?: LatLng | null,
): Promise<NominatimSearchResult[]> {
  const hits = await appointzaSearchPlaces(query, near);
  return hits
    .filter((item) => item.lat && item.lon)
    .map((item, index) => ({
      place_id: index + 1,
      lat: item.lat,
      lon: item.lon,
      display_name: item.display_name || query,
      type: item.type || 'google_place',
      importance: item.importance,
    }));
}

export async function reverseGeocodeGoogle(lat: number, lng: number): Promise<ReverseGeocodeResult> {
  const result = await appointzaReverseGeocode(lat, lng);
  return { display_name: result.display_name };
}
