import { useState, useEffect, useCallback } from 'react';
import { LocationService, LocationDetail } from '../services/location.service';
import { useAuth } from '../contexts/AuthContext';

/**
 * Location list from dashboard selection (localStorage) — no OrganisationLocation/Select call.
 */
export const useLocationList = () => {
  const { user, isAuthenticated } = useAuth();
  const [locations, setLocations] = useState<LocationDetail[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadLocations = useCallback(() => {
    if (!isAuthenticated || !user) {
      setLocations([]);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      setLocations(LocationService.getStoredLocations(user));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to read stored locations';
      setError(errorMessage);
      setLocations([]);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user]);

  const getLocationById = useCallback(
    (locationId: number): LocationDetail | null => {
      if (!isAuthenticated || !user) return null;
      if (LocationService.isStaff(user)) {
        const staffId = user.organisationlocationid || user.locationid || 0;
        if (staffId !== locationId) return null;
      }
      return locations.find((loc) => loc.id === locationId) ?? null;
    },
    [isAuthenticated, user, locations],
  );

  const canAccessLocation = useCallback(
    (locationId: number): boolean => {
      if (!user) return false;
      if (LocationService.isStaff(user)) {
        const staffId = user.organisationlocationid || user.locationid || 0;
        return staffId === locationId;
      }
      return locations.some((loc) => loc.id === locationId);
    },
    [user, locations],
  );

  const getAccessibleLocationIds = useCallback((): number[] => {
    return locations.map((loc) => loc.id);
  }, [locations]);

  const getLocationDisplayName = useCallback((locationId: number): string => {
    const location = locations.find((loc) => loc.id === locationId) ?? null;
    return LocationService.getLocationDisplayName(location);
  }, [locations]);

  const getFullAddress = useCallback((locationId: number): string => {
    const location = locations.find((loc) => loc.id === locationId) ?? null;
    return LocationService.getFullAddress(location);
  }, [locations]);

  useEffect(() => {
    loadLocations();
  }, [loadLocations]);

  useEffect(() => {
    const handleLocationChanged = () => loadLocations();
    window.addEventListener('organizationlocationidChanged', handleLocationChanged);
    window.addEventListener('userContextUpdated', handleLocationChanged);
    return () => {
      window.removeEventListener('organizationlocationidChanged', handleLocationChanged);
      window.removeEventListener('userContextUpdated', handleLocationChanged);
    };
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
    getFullAddress,
  };
};
