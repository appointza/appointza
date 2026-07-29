import { LocationService, LocationDetail } from './location.service';
import { OrganisationLocationService } from './organisationlocation.service';
import { OrganisationLocationSelectReq } from '../models/organisationlocation.model';

/**
 * Wrapper service that automatically handles staff user location filtering
 * Use this instead of directly calling OrganisationLocationService
 */
export class LocationWrapperService {
  private organisationLocationService: OrganisationLocationService;
  private locationService: LocationService;

  constructor() {
    this.organisationLocationService = new OrganisationLocationService();
    this.locationService = new LocationService();
  }

  /**
   * Get locations - automatically filters for staff users
   * @param user - Current user context
   * @param req - Location select request (optional for staff users)
   * @returns Promise<LocationDetail[]> - Filtered location list
   */
  async getLocations(user: any, req?: OrganisationLocationSelectReq): Promise<LocationDetail[]> {
    if (LocationService.isStaff(user)) {
      // Staff user - call API with organisationlocationid
      console.log('🔍 Staff user detected, calling API with organisationlocationid');
      
      const staffReq = new OrganisationLocationSelectReq();
      staffReq.organisationlocationid = user?.organisationlocationid || user?.locationid || 0;
      
      if (staffReq.organisationlocationid <= 0) {
        console.warn('⚠️ Staff user has no organisationlocationid');
        return [];
      }

      try {
        console.log('📤 Calling OrganisationLocation/select with organisationlocationid:', staffReq.organisationlocationid);
        const response = await this.organisationLocationService.select(staffReq);
        console.log('✅ Staff location API response:', response);
        
        if (response && response.length > 0) {
          return response.map(location => {
            // Construct full address from addressline1 and addressline2
            const fullAddress = [
              location.addressline1 || '',
              location.addressline2 || '',
              location.address || ''
            ].filter(Boolean).join(', ');

            // Extract phone and email from attributes if available
            const phone = location.attributes?.phone || location.attributes?.contact || '';
            const email = location.attributes?.email || '';

            return {
              id: location.id,
              name: location.name,
              address: fullAddress || location.address || '',
              city: location.city || '',
              state: location.state || '',
              country: location.country || '',
              pincode: location.pincode || '',
              phone: phone,
              email: email,
              organisationid: location.organisationid,
              templateid: location.templateid || 0,
              isactive: location.isactive,
              createdby: location.createdby,
              createdon: location.createdon ? (typeof location.createdon === 'string' ? location.createdon : location.createdon.toString()) : '',
              modifiedby: location.modifiedby,
              modifiedon: location.modifiedon ? (typeof location.modifiedon === 'string' ? location.modifiedon : location.modifiedon.toString()) : '',
              version: location.version
            };
          });
        }
        
        return [];
      } catch (error) {
        console.error('❌ Error fetching staff location:', error);
        return [];
      }
    } else {
      // Organization user - return all locations based on request
      console.log('🔍 Organization user detected, returning all locations');
      
      if (!req) {
        req = new OrganisationLocationSelectReq();
        req.organisationid = user?.organisationid || 0;
      }

      try {
        const response = await this.organisationLocationService.select(req);
        
        if (response && response.length > 0) {
          return response.map(location => {
            // Construct full address from addressline1 and addressline2
            const fullAddress = [
              location.addressline1 || '',
              location.addressline2 || '',
              location.address || ''
            ].filter(Boolean).join(', ');

            // Extract phone and email from attributes if available
            const phone = location.attributes?.phone || location.attributes?.contact || '';
            const email = location.attributes?.email || '';

            return {
              id: location.id,
              name: location.name,
              address: fullAddress || location.address || '',
              city: location.city || '',
              state: location.state || '',
              country: location.country || '',
              pincode: location.pincode || '',
              phone: phone,
              email: email,
              organisationid: location.organisationid,
              templateid: location.templateid || 0,
              isactive: location.isactive,
              createdby: location.createdby,
              createdon: location.createdon ? (typeof location.createdon === 'string' ? location.createdon : location.createdon.toString()) : '',
              modifiedby: location.modifiedby,
              modifiedon: location.modifiedon ? (typeof location.modifiedon === 'string' ? location.modifiedon : location.modifiedon.toString()) : '',
              version: location.version
            };
          });
        }
        
        return [];
      } catch (error) {
        console.error('❌ Error fetching locations:', error);
        return [];
      }
    }
  }

  /**
   * Get single location by ID - validates staff user access
   * @param locationId - Location ID to fetch
   * @param user - Current user context
   * @returns Promise<LocationDetail | null> - Location or null if not accessible
   */
  async getLocationById(locationId: number, user: any): Promise<LocationDetail | null> {
    return await this.locationService.getLocationById(locationId, user);
  }

  /**
   * Check if user can access a specific location
   * @param locationId - Location ID to check
   * @param user - Current user context
   * @returns boolean - True if user can access the location
   */
  canAccessLocation(locationId: number, user: any): boolean {
    if (LocationService.isStaff(user)) {
      return locationId === user.organisationlocationid;
    } else {
      return true; // Organization users can access any location
    }
  }

  /**
   * Get user's accessible location IDs
   * @param user - Current user context
   * @returns number[] - Array of accessible location IDs
   */
  getAccessibleLocationIds(user: any): number[] {
    if (LocationService.isStaff(user)) {
      return user.organisationlocationid ? [user.organisationlocationid] : [];
    } else {
      // For organization users, this would need to be populated based on their organization
      // For now, return empty array - should be populated by calling getLocations()
      return [];
    }
  }

  /**
   * Get location display name for a location ID
   * @param locationId - Location ID
   * @param user - Current user context
   * @returns Promise<string> - Display name or "No Location"
   */
  async getLocationDisplayName(locationId: number, user: any): Promise<string> {
    const location = await this.getLocationById(locationId, user);
    return LocationService.getLocationDisplayName(location);
  }

  /**
   * Get full address for a location ID
   * @param locationId - Location ID
   * @param user - Current user context
   * @returns Promise<string> - Full address or "No Address"
   */
  async getFullAddress(locationId: number, user: any): Promise<string> {
    const location = await this.getLocationById(locationId, user);
    return LocationService.getFullAddress(location);
  }
}
