import { useState, useEffect, useCallback, useMemo } from 'react';
import { LocationWrapperService } from '../services/locationWrapper.service';
import { LocationDetail } from '../services/location.service';
import { useAuth } from '../contexts/AuthContext';

/**
 * Hook for getting location lists with automatic staff user filtering
 */
export const useLocationList = () => {
  const { user, isAuthenticated } = useAuth();
  const [locations, setLocations] = useState<LocationDetail[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const locationWrapperService = useMemo(() => new LocationWrapperService(), []);

  // Load locations
  const loadLocations = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setLocations([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('🔍 Loading locations for user:', user);
      const locationList = await locationWrapperService.getLocations(user);
      setLocations(locationList);
      console.log('✅ Locations loaded:', locationList);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load locations';
      setError(errorMessage);
      console.error('❌ Error loading locations:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user, locationWrapperService]);

  // Get single location by ID
  const getLocationById = useCallback(async (locationId: number): Promise<LocationDetail | null> => {
    if (!isAuthenticated || !user) {
      return null;
    }

    try {
      return await locationWrapperService.getLocationById(locationId, user);
    } catch (err) {
      console.error('❌ Error getting location by ID:', err);
      return null;
    }
  }, [isAuthenticated, user, locationWrapperService]);

  // Check if user can access a location
  const canAccessLocation = useCallback((locationId: number): boolean => {
    if (!user) return false;
    return locationWrapperService.canAccessLocation(locationId, user);
  }, [user, locationWrapperService]);

  // Get accessible location IDs
  const getAccessibleLocationIds = useCallback((): number[] => {
    if (!user) return [];
    return locationWrapperService.getAccessibleLocationIds(user);
  }, [user, locationWrapperService]);

  // Get location display name
  const getLocationDisplayName = useCallback(async (locationId: number): Promise<string> => {
    if (!user) return 'No Location';
    return await locationWrapperService.getLocationDisplayName(locationId, user);
  }, [user, locationWrapperService]);

  // Get full address
  const getFullAddress = useCallback(async (locationId: number): Promise<string> => {
    if (!user) return 'No Address';
    return await locationWrapperService.getFullAddress(locationId, user);
  }, [user, locationWrapperService]);

  // Load locations on mount and when user changes
  useEffect(() => {
    loadLocations();
  }, [loadLocations]);

  return {
    locations,
    isLoading,
    error,
    loadLocations,
    getLocationById,
    canAccessLocation,
    getAccessibleLocationIds,
    getLocationDisplayName,
    getFullAddress
  };
};
