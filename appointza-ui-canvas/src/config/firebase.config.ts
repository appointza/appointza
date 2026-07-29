import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging';
import { getAnalytics, Analytics } from 'firebase/analytics';
import { Capacitor } from '@capacitor/core';

// Firebase configuration for web app
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyD2MwVwLi7u100omxM6WkCc3as9awOUuPg",
  authDomain: "appointza-a0d00.firebaseapp.com",
  projectId: "appointza-a0d00",
  storageBucket: "appointza-a0d00.firebasestorage.app",
  messagingSenderId: "1029193730608",
  appId: "1:1029193730608:web:a536c6ea39532d72a7bbf5",
  measurementId: "G-DRDMBJ8N7F"
};

// VAPID key for web push notifications
// This key is used to authenticate web push notification requests
// Get from: Firebase Console > Project Settings > Cloud Messaging > Web Push certificates
// The key should be ~87 characters long (base64url encoded)
// You can also set it via environment variable: VITE_VAPID_PUBLIC_KEY
const VAPID_KEY =
  (typeof window !== "undefined" && (window as any).APP_CONFIG?.vapidKey) ||
  import.meta.env.VITE_VAPID_PUBLIC_KEY ||
  "BG6qfOt_h6ujiW_J14D57NDN_B-O2MS5WN-lq6C-d6ZpjJLYUnkBslIonPEnd55Ds-29ph9kU1IZisxaW-IMDBo";

let app: FirebaseApp | null = null;
let messaging: Messaging | null = null;
let analytics: Analytics | null = null;

// Initialize Firebase
export const initializeFirebase = (): FirebaseApp | null => {
  try {
    if (getApps().length === 0) {
      app = initializeApp(firebaseConfig);
      console.log('✅ Firebase initialized successfully');
      
      // Initialize analytics only for web platform
      if (!Capacitor.isNativePlatform()) {
        try {
          analytics = getAnalytics(app);
          console.log('✅ Firebase Analytics initialized for web');
        } catch (error) {
          console.warn('⚠️ Firebase Analytics not available:', error);
        }
      }
      
      // Initialize messaging only for web platform
      if (!Capacitor.isNativePlatform() && 'serviceWorker' in navigator) {
        try {
          messaging = getMessaging(app);
          console.log('✅ Firebase Messaging initialized for web');
        } catch (error) {
          console.warn('⚠️ Firebase Messaging not available:', error);
        }
      }
    } else {
      app = getApps()[0];
    }
    return app;
  } catch (error) {
    console.error('❌ Firebase initialization failed:', error);
    return null;
  }
};

// Get Firebase app instance
export const getFirebaseApp = (): FirebaseApp | null => {
  if (!app) {
    return initializeFirebase();
  }
  return app;
};

// Get messaging instance (web only)
export const getFirebaseMessaging = (): Messaging | null => {
  if (Capacitor.isNativePlatform()) {
    return null; // Native platforms use Capacitor Push Notifications
  }
  return messaging;
};

// Get analytics instance (web only)
export const getFirebaseAnalytics = (): Analytics | null => {
  if (Capacitor.isNativePlatform()) {
    return null; // Native platforms use native analytics
  }
  return analytics;
};

// Get VAPID key
export const getVapidKey = (): string => {
  return VAPID_KEY;
};

export default app;

