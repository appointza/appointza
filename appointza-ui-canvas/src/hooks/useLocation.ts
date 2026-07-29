import { useState, useEffect, useCallback, useMemo } from 'react';
import { LocationService, LocationDetail } from '../services/location.service';
import { useAuth } from '../contexts/AuthContext';

export const useLocation = () => {
  const { user, isAuthenticated } = useAuth();
  const [currentLocation, setCurrentLocation] = useState<LocationDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const locationService = useMemo(() => new LocationService(), []);

  // Check if current user is staff
  const isStaff = LocationService.isStaff(user);

  // Initialize location for staff user
  const initializeLocation = useCallback(async () => {
    if (!isAuthenticated || !isStaff) {
      setCurrentLocation(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('🔍 Initializing location for staff user:', user);
      const location = await locationService.initializeLocationForStaff(user);
      
      if (location) {
        setCurrentLocation(location);
        console.log('✅ Location initialized:', location);
      } else {
        setError('Failed to load location details');
        console.log('❌ Failed to initialize location');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('❌ Error initializing location:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, isStaff, user, locationService]);

  // Get current location (from localStorage or fetch)
  const getCurrentLocation = useCallback(async () => {
    if (!isAuthenticated || !isStaff) {
      return null;
    }

    try {
      const location = await locationService.getCurrentLocation(user);
      setCurrentLocation(location);
      return location;
    } catch (err) {
      console.error('❌ Error getting current location:', err);
      return null;
    }
  }, [isAuthenticated, isStaff, user, locationService]);

  // Get location list - for staff users, returns only their assigned location
  const getLocationList = useCallback(async () => {
    if (!isAuthenticated) {
      return [];
    }

    try {
      const locations = await locationService.getLocationList(user);
      console.log('🔍 Location list for user:', locations);
      return locations;
    } catch (err) {
      console.error('❌ Error getting location list:', err);
      return [];
    }
  }, [isAuthenticated, user, locationService]);

  // Get single location by ID - for staff users, validates access
  const getLocationById = useCallback(async (locationId: number) => {
    if (!isAuthenticated) {
      return null;
    }

    try {
      const location = await locationService.getLocationById(locationId, user);
      return location;
    } catch (err) {
      console.error('❌ Error getting location by ID:', err);
      return null;
    }
  }, [isAuthenticated, user, locationService]);

  // Update location in localStorage
  const updateLocation = useCallback((location: LocationDetail) => {
    locationService.updateLocationInStorage(location);
    setCurrentLocation(location);
  }, [locationService]);

  // Clear location data
  const clearLocation = useCallback(() => {
    LocationService.clearLocationFromStorage();
    setCurrentLocation(null);
  }, []);

  // Initialize location when user changes or component mounts
  useEffect(() => {
    if (isAuthenticated && isStaff) {
      initializeLocation();
    } else {
      setCurrentLocation(null);
    }
  }, [isAuthenticated, isStaff, initializeLocation]);

  // Get location display name
  const getLocationDisplayName = useCallback(() => {
    return LocationService.getLocationDisplayName(currentLocation);
  }, [currentLocation]);

  // Get full address
  const getFullAddress = useCallback(() => {
    return LocationService.getFullAddress(currentLocation);
  }, [currentLocation]);

  return {
    currentLocation,
    isLoading,
    error,
    isStaff,
    initializeLocation,
    getCurrentLocation,
    getLocationList,
    getLocationById,
    updateLocation,
    clearLocation,
    getLocationDisplayName,
    getFullAddress
  };
};
