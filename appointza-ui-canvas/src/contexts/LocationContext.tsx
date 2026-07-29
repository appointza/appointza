import React, { createContext, useContext, ReactNode } from 'react';
import { useLocation } from '../hooks/useLocation';
import { LocationDetail } from '../services/location.service';

interface LocationContextType {
  currentLocation: LocationDetail | null;
  isLoading: boolean;
  error: string | null;
  isStaff: boolean;
  getLocationDisplayName: () => string;
  getFullAddress: () => string;
  getLocationList: () => Promise<LocationDetail[]>;
  getLocationById: (locationId: number) => Promise<LocationDetail | null>;
  updateLocation: (location: LocationDetail) => void;
  clearLocation: () => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

interface LocationProviderProps {
  children: ReactNode;
}

export const LocationProvider: React.FC<LocationProviderProps> = ({ children }) => {
  const locationData = useLocation();

  return (
    <LocationContext.Provider value={locationData}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocationContext = (): LocationContextType => {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocationContext must be used within a LocationProvider');
  }
  return context;
};

// Helper functions for easy access
export const getCurrentLocation = (): LocationDetail | null => {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('current_location_details');
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Error reading location from localStorage:', error);
      return null;
    }
  }
  return null;
};

export const isStaffUser = (user: any): boolean => {
  return user && 
         (user.organisationlocationid > 0) && 
         (user.organisationid === 0 || !user.organisationid);
};

export const getLocationDisplayName = (location: LocationDetail | null): string => {
  if (!location) return 'No Location';
  return `${location.name}${location.city ? `, ${location.city}` : ''}`;
};

export const getFullAddress = (location: LocationDetail | null): string => {
  if (!location) return 'No Address';
  
  const parts = [
    location.address,
    location.city,
    location.state,
    location.country,
    location.pincode
  ].filter(part => part && part.trim() !== '');
  
  return parts.join(', ');
};
