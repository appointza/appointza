import { environment } from '../utils/environment';

export interface GeocodingResult {
  address: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  latitude?: number;
  longitude?: number;
}

export class GeocodingService {
  private get apiKey(): string {
    return environment.googleMapsApiKey || '';
  }

  /**
   * Reverse geocode: Convert latitude/longitude to address
   */
  async reverseGeocode(lat: number, lng: number): Promise<GeocodingResult> {
    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${this.apiKey}`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK' && data.results.length > 0) {
        const result = data.results[0];
        const address = result.formatted_address;
        const components = result.address_components;

        let city = '';
        let state = '';
        let country = '';
        let pincode = '';

        components.forEach((component: { types: string[]; long_name: string }) => {
          if (component.types.includes('locality')) {
            city = component.long_name;
          }
          if (component.types.includes('administrative_area_level_1')) {
            state = component.long_name;
          }
          if (component.types.includes('country')) {
            country = component.long_name;
          }
          if (component.types.includes('postal_code')) {
            pincode = component.long_name;
          }
        });

        return {
          address,
          city,
          state,
          country,
          pincode,
          latitude: lat,
          longitude: lng
        };
      }

      return { address: 'Selected location' };
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return { address: 'Selected location' };
    }
  }

  /**
   * Forward geocode: Convert address to latitude/longitude
   */
  async forwardGeocode(address: string): Promise<GeocodingResult | null> {
    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${this.apiKey}`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK' && data.results.length > 0) {
        const result = data.results[0];
        const location = result.geometry.location;
        const formattedAddress = result.formatted_address;
        const components = result.address_components;

        let city = '';
        let state = '';
        let country = '';
        let pincode = '';

        components.forEach((component: { types: string[]; long_name: string }) => {
          if (component.types.includes('locality')) {
            city = component.long_name;
          }
          if (component.types.includes('administrative_area_level_1')) {
            state = component.long_name;
          }
          if (component.types.includes('country')) {
            country = component.long_name;
          }
          if (component.types.includes('postal_code')) {
            pincode = component.long_name;
          }
        });

        return {
          address: formattedAddress,
          city,
          state,
          country,
          pincode,
          latitude: location.lat,
          longitude: location.lng
        };
      }

      return null;
    } catch (error) {
      console.error('Forward geocoding error:', error);
      return null;
    }
  }
}

