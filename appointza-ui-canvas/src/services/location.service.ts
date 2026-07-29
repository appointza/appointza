import { OrganisationLocationService } from './organisationlocation.service';
import { OrganisationLocation, OrganisationLocationSelectReq } from '../models/organisationlocation.model';

export interface LocationDetail {
  id: number;
  name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  phone: string;
  email: string;
  organisationid: number;
  templateid: number;
  isactive: boolean;
  createdby: number;
  createdon: string;
  modifiedby: number;
  modifiedon: string;
  version: number;
}

export class LocationService {
  private static readonly LOCATION_STORAGE_KEY = 'current_location_details';
  private organisationLocationService: OrganisationLocationService;

  constructor() {
    this.organisationLocationService = new OrganisationLocationService();
  }

  // Check if user is staff (has organisationlocationid but no organisationid)
  // Note: user object from AuthContext has 'locationid' field (mapped from organisationlocationid)
  // Also check user.isStaff if available (calculated in AuthContext)
  static isStaff(user: any): boolean {
    if (!user) return false;
    
    // First check if isStaff is already set (from AuthContext)
    if (user.isStaff !== undefined) {
      return user.isStaff === true;
    }
    
    // Fallback: check locationid or organisationlocationid
    const hasLocation = (user.organisationlocationid && user.organisationlocationid > 0) || 
                       (user.locationid && user.locationid > 0);
    const noOrganisation = !user.organisationid || user.organisationid === 0;
    
    return hasLocation && noOrganisation;
  }

  // Get location details from localStorage
  static getLocationFromStorage(): LocationDetail | null {
    try {
      const stored = localStorage.getItem(LocationService.LOCATION_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('❌ Error reading location from localStorage:', error);
    }
    return null;
  }

  // Save location details to localStorage
  static saveLocationToStorage(location: LocationDetail): void {
    try {
      localStorage.setItem(LocationService.LOCATION_STORAGE_KEY, JSON.stringify(location));
      console.log('✅ Location saved to localStorage:', location);
    } catch (error) {
      console.error('❌ Error saving location to localStorage:', error);
    }
  }

  // Clear location from localStorage
  static clearLocationFromStorage(): void {
    try {
      localStorage.removeItem(LocationService.LOCATION_STORAGE_KEY);
      console.log('✅ Location cleared from localStorage');
    } catch (error) {
      console.error('❌ Error clearing location from localStorage:', error);
    }
  }

  // Fetch location details by ID
  async fetchLocationDetails(locationId: number): Promise<LocationDetail | null> {
    try {
      console.log('🔍 Fetching location details for ID:', locationId);
      
      const req = new OrganisationLocationSelectReq();
      req.id = locationId;
      
      const response = await this.organisationLocationService.select(req);
      
      if (response && response.length > 0) {
        const location = response[0];
        const locationDetail: LocationDetail = {
          id: location.id,
          name: location.name,
          address: location.address,
          city: location.city,
          state: location.state,
          country: location.country,
          pincode: location.pincode,
          phone: location.phone,
          email: location.email,
          organisationid: location.organisationid,
          templateid: location.templateid,
          isactive: location.isactive,
          createdby: location.createdby,
          createdon: location.createdon,
          modifiedby: location.modifiedby,
          modifiedon: location.modifiedon,
          version: location.version
        };
        
        console.log('✅ Location details fetched:', locationDetail);
        return locationDetail;
      }
      
      console.log('⚠️ No location found for ID:', locationId);
      return null;
    } catch (error) {
      console.error('❌ Error fetching location details:', error);
      return null;
    }
  }

  // Initialize location for staff user
  async initializeLocationForStaff(user: any): Promise<LocationDetail | null> {
    if (!LocationService.isStaff(user)) {
      console.log('ℹ️ User is not staff, skipping location initialization');
      return null;
    }

    const locationId = user.organisationlocationid;
    if (!locationId || locationId === 0) {
      console.log('⚠️ Staff user has no organisationlocationid');
      return null;
    }

    // Check if location is already in localStorage
    const existingLocation = LocationService.getLocationFromStorage();
    if (existingLocation && existingLocation.id === locationId) {
      console.log('✅ Location already in localStorage:', existingLocation);
      return existingLocation;
    }

    // Fetch location details
    const locationDetail = await this.fetchLocationDetails(locationId);
    if (locationDetail) {
      // Save to localStorage
      LocationService.saveLocationToStorage(locationDetail);
      return locationDetail;
    }

    return null;
  }

  // Get current location (from localStorage or fetch if needed)
  async getCurrentLocation(user: any): Promise<LocationDetail | null> {
    if (!LocationService.isStaff(user)) {
      return null;
    }

    // Try to get from localStorage first
    let location = LocationService.getLocationFromStorage();
    
    if (!location || location.id !== user.organisationlocationid) {
      // Location not in localStorage or different location, fetch it
      location = await this.initializeLocationForStaff(user);
    }

    return location;
  }

  // Get location list - for staff users, returns only their assigned location
  async getLocationList(user: any): Promise<LocationDetail[]> {
    if (LocationService.isStaff(user)) {
      // Staff user - return only their assigned location
      const location = await this.getCurrentLocation(user);
      return location ? [location] : [];
    } else {
      // Organization user - return all locations (existing behavior)
      try {
        const req = new OrganisationLocationSelectReq();
        req.organisationid = user?.organisationid || 0;
        
        const response = await this.organisationLocationService.select(req);
        
        if (response && response.length > 0) {
          return response.map(location => ({
            id: location.id,
            name: location.name,
            address: location.address,
            city: location.city,
            state: location.state,
            country: location.country,
            pincode: location.pincode,
            phone: location.phone,
            email: location.email,
            organisationid: location.organisationid,
            templateid: location.templateid,
            isactive: location.isactive,
            createdby: location.createdby,
            createdon: location.createdon,
            modifiedby: location.modifiedby,
            modifiedon: location.modifiedon,
            version: location.version
          }));
        }
        
        return [];
      } catch (error) {
        console.error('❌ Error fetching location list:', error);
        return [];
      }
    }
  }

  // Get single location by ID - for staff users, validates they can access it
  async getLocationById(locationId: number, user: any): Promise<LocationDetail | null> {
    if (LocationService.isStaff(user)) {
      // Staff user - can only access their assigned location
      if (locationId !== user.organisationlocationid) {
        console.log('⚠️ Staff user cannot access location:', locationId, 'assigned to:', user.organisationlocationid);
        return null;
      }
      
      // Return their assigned location
      return await this.getCurrentLocation(user);
    } else {
      // Organization user - can access any location
      return await this.fetchLocationDetails(locationId);
    }
  }

  // Update location in localStorage (when location data changes)
  updateLocationInStorage(location: LocationDetail): void {
    LocationService.saveLocationToStorage(location);
  }

  // Get location display name
  static getLocationDisplayName(location: LocationDetail | null): string {
    if (!location) return 'No Location';
    return `${location.name}${location.city ? `, ${location.city}` : ''}`;
  }

  // Get full location address
  static getFullAddress(location: LocationDetail | null): string {
    if (!location) return 'No Address';
    
    const parts = [
      location.address,
      location.city,
      location.state,
      location.country,
      location.pincode
    ].filter(part => part && part.trim() !== '');
    
    return parts.join(', ');
  }
}
