import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { getFirebaseMessaging, getVapidKey, initializeFirebase } from '@/config/firebase.config';
import { getToken, onMessage, Messaging } from 'firebase/messaging';
import { UsersService } from './users.service';

export interface PushNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, any>;
  type?: string;
}

class PushNotificationService {
  private usersService: UsersService;
  private fcmToken: string | null = null;
  private isInitialized: boolean = false;
  private lastSyncedUserId: number | null = null;
  private lastSyncedToken: string | null = null;

  constructor() {
    this.usersService = new UsersService();
  }

  private syncStorageKey(userId: number): string {
    return `appointza:push_token_sync:${userId}`;
  }

  private isAlreadySynced(userId: number, token: string): boolean {
    if (this.lastSyncedUserId === userId && this.lastSyncedToken === token) {
      return true;
    }
    try {
      return sessionStorage.getItem(this.syncStorageKey(userId)) === token;
    } catch {
      return false;
    }
  }

  private markSynced(userId: number, token: string): void {
    this.lastSyncedUserId = userId;
    this.lastSyncedToken = token;
    try {
      sessionStorage.setItem(this.syncStorageKey(userId), token);
    } catch {
      // ignore storage errors
    }
  }

  /** Call on logout so the next login re-syncs the token once. */
  clearSyncedToken(userId?: number): void {
    this.lastSyncedUserId = null;
    this.lastSyncedToken = null;
    if (!userId) return;
    try {
      sessionStorage.removeItem(this.syncStorageKey(userId));
    } catch {
      // ignore
    }
  }

  /**
   * Initialize push notifications
   */
  async initialize(): Promise<string | null> {
    if (this.isInitialized && this.fcmToken) {
      console.log('✅ Push notifications already initialized');
      return this.fcmToken;
    }

    try {
      const platform = Capacitor.getPlatform();
      console.log('🔍 Detected platform:', platform);
      
      if (Capacitor.isNativePlatform()) {
        // Native platform (iOS/Android) - use Capacitor Push Notifications
        console.log('📱 Initializing for native platform:', platform);
        return await this.initializeNative();
      } else {
        // Web platform - use Firebase Cloud Messaging
        console.log('🌐 Initializing for web platform');
        return await this.initializeWeb();
      }
    } catch (error) {
      console.error('❌ Error initializing push notifications:', error);
      return null;
    }
  }

  /**
   * Initialize for native platforms (iOS/Android)
   */
  private async initializeNative(): Promise<string | null> {
    try {
      console.log('🚀 Initializing native push notifications...');

      // Request permissions
      const permissionStatus = await PushNotifications.requestPermissions();
      
      if (permissionStatus.receive === 'granted') {
        console.log('✅ Push notification permission granted');

        // If already initialized and have token, return it
        if (this.isInitialized && this.fcmToken) {
          return this.fcmToken;
        }

        // Register for push notifications
        await PushNotifications.register();

        // Create a promise to wait for the token
        return new Promise<string | null>((resolve) => {
          // Set a timeout to avoid waiting forever
          const timeout = setTimeout(() => {
            console.warn('⚠️ Push token registration timeout, returning existing token if available');
            resolve(this.fcmToken);
          }, 10000); // 10 second timeout

          // Listen for registration
          const registrationListener = PushNotifications.addListener('registration', (token) => {
            console.log('✅ FCM Token obtained (native):', token.value);
            this.fcmToken = token.value;
            this.isInitialized = true;
            clearTimeout(timeout);
            resolve(token.value);
          });

          // Listen for registration errors
          const registrationErrorListener = PushNotifications.addListener('registrationError', (error) => {
            console.error('❌ Push notification registration error:', error);
            clearTimeout(timeout);
            resolve(null);
          });

          // Listen for push notifications (keep these listeners active)
          PushNotifications.addListener('pushNotificationReceived', (notification) => {
            console.log('🔔 Push notification received:', notification);
            this.handleNotification(notification);
          });

          // Listen for push notification actions (keep these listeners active)
          PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
            console.log('🔔 Push notification action performed:', action);
            this.handleNotificationAction(action);
          });
        });
      } else {
        console.warn('⚠️ Push notification permission denied');
        return null;
      }
    } catch (error) {
      console.error('❌ Error initializing native push notifications:', error);
      return null;
    }
  }

  /**
   * Initialize for web platform
   */
  private async initializeWeb(): Promise<string | null> {
    try {
      console.log('🚀 Initializing web push notifications...');

      // Check if service worker is supported
      if (!('serviceWorker' in navigator)) {
        console.warn('⚠️ Service Worker not supported');
        return null;
      }

      // Check if notifications are supported
      if (!('Notification' in window)) {
        console.warn('⚠️ Notifications not supported');
        return null;
      }

      // Request notification permission
      const permission = await Notification.requestPermission();
      
      if (permission !== 'granted') {
        console.warn('⚠️ Notification permission denied');
        return null;
      }

      console.log('✅ Notification permission granted');

      // Register service worker
      let registration;
      try {
        registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
          scope: '/'
        });
        console.log('✅ Service Worker registered:', registration);
      } catch (error) {
        console.warn('⚠️ Service Worker registration failed, trying alternative paths:', error);
        // Try alternative paths
        const paths = ['/sw.js', './firebase-messaging-sw.js', './sw.js'];
        let registered = false;
        
        for (const path of paths) {
          try {
            registration = await navigator.serviceWorker.register(path, { scope: '/' });
            console.log(`✅ Service Worker registered at ${path}:`, registration);
            registered = true;
            break;
          } catch (e) {
            console.warn(`⚠️ Failed to register at ${path}:`, e);
          }
        }
        
        if (!registered) {
          console.error('❌ Service Worker registration failed on all paths');
          return null;
        }
      }

      // Ensure Firebase app + messaging exist (may not have been booted on marketing pages)
      initializeFirebase();
      const messaging = getFirebaseMessaging();
      if (!messaging) {
        console.warn('⚠️ Firebase Messaging not available');
        return null;
      }

      // Get FCM token
      const vapidKey = getVapidKey();
      if (!vapidKey || vapidKey === 'YOUR_VAPID_KEY_HERE') {
        console.error('❌ ============================================');
        console.error('❌ VAPID KEY NOT CONFIGURED');
        console.error('❌ ============================================');
        console.error('❌ Web push notifications require a VAPID key.');
        console.error('❌');
        console.error('❌ To get your VAPID key:');
        console.error('❌ 1. Go to: https://console.firebase.google.com/project/appointza-a0d00/settings/cloudmessaging');
        console.error('❌ 2. Scroll to "Web Push certificates" section');
        console.error('❌ 3. Click "Generate key pair" (if not exists) or copy existing key');
        console.error('❌ 4. Open: appointza-ui-canvas/src/config/firebase.config.ts');
        console.error('❌ 5. Replace line 20: const VAPID_KEY = "YOUR_ACTUAL_KEY_HERE";');
        console.error('❌');
        console.error('❌ See: appointza-ui-canvas/GET_VAPID_KEY.md for detailed instructions');
        console.error('❌ ============================================');
        console.warn('⚠️ Login will continue, but push notifications will NOT work until VAPID key is set');
        console.warn('⚠️ For native apps (iOS/Android), VAPID key is NOT required');
        return null;
      }

      // Validate VAPID key format
      // VAPID keys from Firebase are typically 87 characters long (base64url encoded)
      // They should not contain spaces and should be a valid base64url string
      const trimmedKey = vapidKey.trim();
      
      // Check if key is too short (likely incomplete)
      if (trimmedKey.length < 80) {
        console.error('❌ ============================================');
        console.error('❌ INVALID VAPID KEY FORMAT - KEY TOO SHORT');
        console.error('❌ ============================================');
        console.error('❌ The VAPID key appears to be incomplete.');
        console.error('❌ VAPID keys from Firebase are typically 87 characters long.');
        console.error('❌');
        console.error('❌ Current key length:', trimmedKey.length, '(expected: ~87)');
        console.error('❌ Key preview:', trimmedKey.substring(0, Math.min(30, trimmedKey.length)) + (trimmedKey.length > 30 ? '...' : ''));
        console.error('❌');
        console.error('❌ SOLUTION: Get the complete key from Firebase Console');
        console.error('❌');
        console.error('❌ Steps to fix:');
        console.error('❌ 1. Go to: https://console.firebase.google.com/project/appointza-a0d00/settings/cloudmessaging');
        console.error('❌ 2. Scroll to "Web Push certificates" section');
        console.error('❌ 3. If no key exists: Click "Generate key pair"');
        console.error('❌ 4. Click on the key pair to expand it');
        console.error('❌ 5. Copy the COMPLETE key (should be ~87 characters, one long string)');
        console.error('❌ 6. Update: appointza-ui-canvas/src/config/firebase.config.ts line 20');
        console.error('❌    OR add to .env file: VITE_VAPID_PUBLIC_KEY=your-complete-key');
        console.error('❌');
        console.error('❌ The key should look like:');
        console.error('❌   BElGCiB3eGJxQkxBRW1vR2FmZmFpSGxYQWV0dHh2M0YxR2FmZmFpSGxYQWV0dHh2M0Yx...');
        console.error('❌   (one continuous string, no spaces, no line breaks)');
        console.error('❌ ============================================');
        return null;
      }

      // Validate base64url format (basic check)
      const base64urlRegex = /^[A-Za-z0-9_-]+$/;
      if (!base64urlRegex.test(trimmedKey)) {
        console.error('❌ ============================================');
        console.error('❌ INVALID VAPID KEY FORMAT - INVALID CHARACTERS');
        console.error('❌ ============================================');
        console.error('❌ VAPID keys should only contain: A-Z, a-z, 0-9, -, _');
        console.error('❌ Make sure there are no spaces, line breaks, or special characters');
        console.error('❌ ============================================');
        return null;
      }

      console.log('🔑 Using VAPID key (length:', trimmedKey.length, 'chars)');

      try {
        const token = await getToken(messaging, {
          vapidKey: trimmedKey,
          serviceWorkerRegistration: await navigator.serviceWorker.ready
        });

        if (token) {
          console.log('✅ FCM Token obtained (web):', token);
          this.fcmToken = token;
          this.isInitialized = true;

          // Listen for foreground messages
          onMessage(messaging, (payload) => {
            console.log('🔔 Foreground message received:', payload);
            this.handleWebNotification(payload);
          });

          return token;
        } else {
          console.warn('⚠️ No FCM token available');
          return null;
        }
      } catch (error: any) {
        // Check if it's a VAPID key error
        if (error?.message?.includes('applicationServerKey') || error?.message?.includes('not valid')) {
          console.error('❌ ============================================');
          console.error('❌ INVALID VAPID KEY');
          console.error('❌ ============================================');
          console.error('❌ The VAPID key format is invalid.');
          console.error('❌ Error:', error.message);
          console.error('❌');
          console.error('❌ Please verify:');
          console.error('❌ 1. You copied the COMPLETE key from Firebase Console');
          console.error('❌ 2. The key is from "Web Push certificates" section');
          console.error('❌ 3. The key is not the private key (should be the public key)');
          console.error('❌ 4. There are no extra spaces or line breaks');
          console.error('❌');
          console.error('❌ To get the correct VAPID key:');
          console.error('❌ 1. Go to: https://console.firebase.google.com/project/appointza-a0d00/settings/cloudmessaging');
          console.error('❌ 2. Scroll to "Web Push certificates"');
          console.error('❌ 3. If no key exists, click "Generate key pair"');
          console.error('❌ 4. Copy the KEY PAIR (public key) - should be ~87 characters');
          console.error('❌ 5. Update: appointza-ui-canvas/src/config/firebase.config.ts line 20');
          console.error('❌ ============================================');
        } else {
          console.error('❌ Error initializing web push notifications:', error);
        }
        return null;
      }
    } catch (error) {
      console.error('❌ Error initializing web push notifications:', error);
      return null;
    }
  }

  /**
   * Save FCM token to server
   */
  async saveTokenToServer(userId: number, retryCount: number = 0): Promise<boolean> {
    if (!this.fcmToken || !userId) {
      console.warn('⚠️ Cannot save token: missing token or userId', {
        hasToken: !!this.fcmToken,
        userId,
        tokenLength: this.fcmToken?.length || 0
      });
      return false;
    }

    if (this.isAlreadySynced(userId, this.fcmToken)) {
      console.log('⏭️ Push token already synced for user — skipping UpdatePushToken');
      return true;
    }

    try {
      // Detect platform
      const platform = Capacitor.getPlatform();
      const platformName = platform === 'ios' ? 'ios' : 
                          platform === 'android' ? 'android' : 
                          'web';
      
      console.log('💾 Saving FCM token to server...', {
        userId,
        platform: platform,
        platformName: platformName,
        tokenLength: this.fcmToken.length,
        tokenPreview: this.fcmToken.substring(0, 30) + '...',
        retryCount
      });
      
      const saved = await this.usersService.UpdatePushToken(userId, this.fcmToken, platformName);
      
      if (saved) {
        this.markSynced(userId, this.fcmToken);
        console.log('✅ FCM token saved successfully to server for user:', userId);
        return true;
      } else {
        console.error('❌ Failed to save FCM token to server. API returned false');
        // Retry once if failed
        if (retryCount < 1) {
          console.log('🔄 Retrying token save (attempt', retryCount + 2, ')...');
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
          return this.saveTokenToServer(userId, retryCount + 1);
        }
        console.error('❌ Token save failed after retries');
        return false;
      }
    } catch (error) {
      console.error('❌ Error saving FCM token:', error);
      console.error('❌ Error details:', {
        message: error instanceof Error ? error.message : String(error),
        response: (error as any)?.response?.data || 'N/A',
        status: (error as any)?.response?.status || 'N/A'
      });
      
      // Retry once on error
      if (retryCount < 1) {
        console.log('🔄 Retrying token save after error (attempt', retryCount + 2, ')...');
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
        return this.saveTokenToServer(userId, retryCount + 1);
      }
      console.error('❌ Token save failed after error retries');
      return false;
    }
  }

  /**
   * Refresh and update push token
   * Useful when user logs in from a new device or after token expiration
   */
  async refreshToken(userId?: number): Promise<string | null> {
    try {
      console.log('🔄 Refreshing push notification token...');
      
      // Reset initialization state to force re-initialization
      this.isInitialized = false;
      this.fcmToken = null;
      
      // Re-initialize to get a new token
      const newToken = await this.initialize();
      
      if (newToken && userId) {
        // Save the new token to server
        await this.saveTokenToServer(userId);
      }
      
      return newToken;
    } catch (error) {
      console.error('❌ Error refreshing push token:', error);
      return null;
    }
  }

  /**
   * Update push token for a user (force update)
   * This ensures the token is always up-to-date on the server
   */
  async updateTokenForUser(userId: number): Promise<boolean> {
    try {
      console.log('🔄 updateTokenForUser called for userId:', userId);
      
      // Get current token or initialize if not available
      let token = this.getToken();
      console.log('📱 Current token status:', token ? 'Token exists' : 'No token');
      
      if (!token) {
        console.log('🔄 No token available, initializing...');
        token = await this.initialize();
        console.log('📱 After initialization, token:', token ? 'Token obtained' : 'No token');
      }
      
      if (!token) {
        console.error('❌ Cannot update token: No token available after initialization');
        console.log('🔍 Debug info:', {
          platform: Capacitor.getPlatform(),
          isNative: Capacitor.isNativePlatform(),
          hasServiceWorker: 'serviceWorker' in navigator,
          notificationPermission: typeof Notification !== 'undefined' ? Notification.permission : 'N/A'
        });
        return false;
      }
      
      if (!userId) {
        console.error('❌ Cannot update token: userId is missing');
        return false;
      }
      
      console.log('💾 Attempting to save token to server...', {
        userId,
        tokenLength: token.length,
        tokenPreview: token.substring(0, 20) + '...'
      });
      
      const result = await this.saveTokenToServer(userId);
      
      if (result) {
        console.log('✅ Token successfully saved to server');
      } else {
        console.error('❌ Failed to save token to server');
      }
      
      return result;
    } catch (error) {
      console.error('❌ Error updating token for user:', error);
      console.error('❌ Error details:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      return false;
    }
  }

  /**
   * Get current FCM token
   */
  getToken(): string | null {
    return this.fcmToken;
  }

  /**
   * Check if notifications are enabled
   */
  async areNotificationsEnabled(): Promise<boolean> {
    if (Capacitor.isNativePlatform()) {
      const status = await PushNotifications.checkPermissions();
      return status.receive === 'granted';
    } else {
      return Notification.permission === 'granted';
    }
  }

  /**
   * Handle native notification (foreground)
   * Note: Native platforms automatically show notifications in background/killed state
   * This handler is for when app is in foreground
   */
  private handleNotification(notification: any) {
    console.log('🔔 Handling notification (native foreground):', notification);
    
    // Native platforms will automatically display notifications
    // This is just for logging and any custom handling
    // You can emit events here that your React components can listen to
  }

  /**
   * Handle native notification action (when user taps notification)
   */
  private handleNotificationAction(action: any) {
    console.log('🔔 Handling notification action (native):', action);
    
    // Navigation is handled by NotificationHandler component
    // This is just for logging
  }

  /**
   * Handle web notification (foreground)
   * Background notifications are handled by service worker
   */
  private handleWebNotification(payload: any) {
    console.log('🔔 Handling web notification (foreground):', payload);
    
    // Show browser notification
    if (Notification.permission === 'granted') {
      const notificationTitle = payload.notification?.title || 'Appointza';
      const notificationOptions: NotificationOptions = {
        body: payload.notification?.body || '',
        icon: '/lovable-uploads/6205c671-a6b9-4927-8268-bd1fa436cd0b.png',
        badge: '/lovable-uploads/6205c671-a6b9-4927-8268-bd1fa436cd0b.png',
        data: payload.data || {},
        tag: payload.data?.type || 'default',
        requireInteraction: false,
        vibrate: [200, 100, 200], // Vibration pattern
      };

      const notification = new Notification(notificationTitle, notificationOptions);

      // Handle notification click
      notification.onclick = (event) => {
        event.preventDefault();
        window.focus();
        
        // Navigation is handled by NotificationHandler component
        // Store notification data for navigation
        if (payload.data) {
          localStorage.setItem('pendingNotification', JSON.stringify(payload.data));
        }
        
        notification.close();
      };
    }
  }
}

// Export singleton instance
export const pushNotificationService = new PushNotificationService();

