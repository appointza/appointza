import { useState, useEffect, useCallback, useContext } from 'react';
import { LocationService, LocationDetail } from '../services/location.service';
import { AuthContext } from '@/contexts/auth-context';

export const useLocation = () => {
  const auth = useContext(AuthContext);
  const user = auth?.user ?? null;
  const isAuthenticated = auth?.isAuthenticated ?? false;
  const [currentLocation, setCurrentLocation] = useState<LocationDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isStaff = LocationService.isStaff(user);

  const syncFromStorage = useCallback(() => {
    if (!isAuthenticated || !isStaff) {
      setCurrentLocation(null);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const location = LocationService.getStoredCurrentLocation(user);
      setCurrentLocation(location);
      if (!location) {
        setError('No location selected. Choose a location on the Dashboard.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, isStaff, user]);

  const getCurrentLocation = useCallback(() => {
    if (!isAuthenticated || !isStaff) return null;
    const location = LocationService.getStoredCurrentLocation(user);
    setCurrentLocation(location);
    return location;
  }, [isAuthenticated, isStaff, user]);

  const getLocationList = useCallback(() => {
    if (!isAuthenticated) return [];
    return LocationService.getStoredLocations(user);
  }, [isAuthenticated, user]);

  const getLocationById = useCallback(
    (locationId: number) => {
      if (!isAuthenticated) return null;
      if (LocationService.isStaff(user)) {
        const staffId = user?.organisationlocationid || user?.locationid || 0;
        if (staffId !== locationId) return null;
      }
      return LocationService.getStoredLocations(user).find((loc) => loc.id === locationId) ?? null;
    },
    [isAuthenticated, user],
  );

  const updateLocation = useCallback((location: LocationDetail) => {
    LocationService.saveLocationToStorage(location);
    setCurrentLocation(location);
  }, []);

  const clearLocation = useCallback(() => {
    LocationService.clearLocationFromStorage();
    setCurrentLocation(null);
  }, []);

  useEffect(() => {
    syncFromStorage();
  }, [syncFromStorage]);

  useEffect(() => {
    const handleLocationChanged = () => syncFromStorage();
    window.addEventListener('organizationlocationidChanged', handleLocationChanged);
    window.addEventListener('userContextUpdated', handleLocationChanged);
    return () => {
      window.removeEventListener('organizationlocationidChanged', handleLocationChanged);
      window.removeEventListener('userContextUpdated', handleLocationChanged);
    };
  }, [syncFromStorage]);

  const getLocationDisplayName = useCallback(() => {
    return LocationService.getLocationDisplayName(currentLocation);
  }, [currentLocation]);

  const getFullAddress = useCallback(() => {
    return LocationService.getFullAddress(currentLocation);
  }, [currentLocation]);

  return {
    currentLocation,
    isLoading,
    error,
    isStaff,
    initializeLocation: syncFromStorage,
    getCurrentLocation,
    getLocationList,
    getLocationById,
    updateLocation,
    clearLocation,
    getLocationDisplayName,
    getFullAddress,
  };
};
