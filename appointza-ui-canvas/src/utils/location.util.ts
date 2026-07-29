import { LocationDetail } from '../services/location.service';

/**
 * Utility functions for working with location data throughout the application
 */

// Get current location from localStorage
export const getCurrentLocationFromStorage = (): LocationDetail | null => {
  if (typeof window === 'undefined') return null;
  
  try {
    const stored = localStorage.getItem('current_location_details');
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Error reading location from localStorage:', error);
    return null;
  }
};

// Check if user is staff based on user context
export const isStaffUser = (user: any): boolean => {
  return user && 
         (user.organisationlocationid > 0) && 
         (user.organisationid === 0 || !user.organisationid);
};

// Get location display name
export const getLocationDisplayName = (location: LocationDetail | null): string => {
  if (!location) return 'No Location';
  return `${location.name}${location.city ? `, ${location.city}` : ''}`;
};

// Get full address
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

// Get location contact info
export const getLocationContactInfo = (location: LocationDetail | null): { phone: string; email: string } => {
  if (!location) return { phone: 'Not provided', email: 'Not provided' };
  
  return {
    phone: location.phone || 'Not provided',
    email: location.email || 'Not provided'
  };
};

// Check if location is active
export const isLocationActive = (location: LocationDetail | null): boolean => {
  return location ? location.isactive : false;
};

// Get location template ID
export const getLocationTemplateId = (location: LocationDetail | null): number => {
  return location ? location.templateid : 0;
};

// Format location for display in lists
export const formatLocationForList = (location: LocationDetail | null): string => {
  if (!location) return 'No Location';
  
  const parts = [location.name];
  if (location.city) parts.push(location.city);
  if (location.state) parts.push(location.state);
  
  return parts.join(', ');
};

// Get location status badge
export const getLocationStatusBadge = (location: LocationDetail | null): { text: string; color: string } => {
  if (!location) return { text: 'Unknown', color: 'gray' };
  
  if (location.isactive) {
    return { text: 'Active', color: 'green' };
  } else {
    return { text: 'Inactive', color: 'red' };
  }
};

// Validate location data
export const validateLocationData = (location: LocationDetail | null): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!location) {
    errors.push('No location data available');
    return { isValid: false, errors };
  }
  
  if (!location.id || location.id === 0) {
    errors.push('Invalid location ID');
  }
  
  if (!location.name || location.name.trim() === '') {
    errors.push('Location name is required');
  }
  
  if (!location.organisationid || location.organisationid === 0) {
    errors.push('Organization ID is required');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Create location summary for display
export const createLocationSummary = (location: LocationDetail | null): string => {
  if (!location) return 'No location information available';
  
  const summary = [
    `Location: ${location.name}`,
    location.city ? `City: ${location.city}` : null,
    location.state ? `State: ${location.state}` : null,
    location.phone ? `Phone: ${location.phone}` : null,
    location.email ? `Email: ${location.email}` : null,
    `Status: ${location.isactive ? 'Active' : 'Inactive'}`
  ].filter(Boolean).join(' | ');
  
  return summary;
};
