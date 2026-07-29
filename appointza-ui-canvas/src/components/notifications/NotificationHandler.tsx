import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { App } from '@capacitor/app';
import { useToast } from '@/hooks/use-toast';
import { getFirebaseMessaging } from '@/config/firebase.config';
import { onMessage } from 'firebase/messaging';

/**
 * NotificationHandler Component
 * Handles push notifications for all platforms (Web, Android, iOS)
 * - Displays notifications when received
 * - Handles notification clicks/taps
 * - Navigates to appropriate pages based on notification type
 */
export const NotificationHandler = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    let appStateListener: any = null;
    let nativeListeners: any[] = [];

    if (Capacitor.isNativePlatform()) {
      // Native platform (Android/iOS) notification handlers
      const listeners = setupNativeNotificationHandlers();
      nativeListeners = listeners || [];

      // Handle app state changes (when app comes to foreground from notification)
      appStateListener = App.addListener('appStateChange', (state) => {
        if (state.isActive) {
          console.log('📱 App came to foreground');
          // You can check for pending notifications here if needed
        }
      });
    } else {
      // Web platform notification handlers
      setupWebNotificationHandlers();
    }

    return () => {
      // Cleanup listeners
      if (appStateListener) {
        appStateListener.remove();
      }
      // Note: Capacitor listeners are automatically cleaned up when component unmounts
      // but we keep the array reference for clarity
    };
  }, [navigate, toast]);

  /**
   * Setup native notification handlers (Android/iOS)
   * Returns array of listeners for cleanup (though Capacitor handles this automatically)
   */
  const setupNativeNotificationHandlers = () => {
    // Handle notification received while app is in foreground
    const receivedListener = PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('🔔 Push notification received (foreground):', notification);
      
      const title = notification.title || 'Appointza';
      const body = notification.body || '';
      const data = notification.data || {};

      // Show toast notification
      toast({
        title: title,
        description: body,
        duration: 5000,
      });

      // You can also show a native notification if needed
      // The native platform will handle displaying it automatically
    });

    // Handle notification tap/action (when user taps the notification)
    const actionListener = PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      console.log('🔔 Push notification action performed:', action);
      
      const notification = action.notification;
      const data = notification.data || {};
      const type = data.type;

      // Navigate based on notification type
      handleNotificationNavigation(type, data);
    });

    return [receivedListener, actionListener];
  };

  /**
   * Setup web notification handlers
   */
  const setupWebNotificationHandlers = () => {
    const messaging = getFirebaseMessaging();
    if (!messaging) {
      console.warn('⚠️ Firebase Messaging not available for web notifications');
      return;
    }

    // Handle foreground messages (when app is open)
    onMessage(messaging, (payload) => {
      console.log('🔔 Foreground message received (web):', payload);
      
      const title = payload.notification?.title || 'Appointza';
      const body = payload.notification?.body || '';
      const data = payload.data || {};

      // Show toast notification
      toast({
        title: title,
        description: body,
        duration: 5000,
      });

      // Also show browser notification
      if (Notification.permission === 'granted') {
        const notification = new Notification(title, {
          body: body,
          icon: '/lovable-uploads/6205c671-a6b9-4927-8268-bd1fa436cd0b.png',
          badge: '/lovable-uploads/6205c671-a6b9-4927-8268-bd1fa436cd0b.png',
          data: data,
          tag: data.type || 'default',
        });

        // Handle notification click
        notification.onclick = (event) => {
          event.preventDefault();
          window.focus();
          handleNotificationNavigation(data.type, data);
          notification.close();
        };
      }
    });

    // Handle service worker notification clicks (background messages)
    // This is handled in firebase-messaging-sw.js
    // But we can also listen for focus events to handle navigation
    window.addEventListener('focus', () => {
      // Check if we should navigate based on notification data
      // This would require storing notification data in localStorage or similar
    });
  };

  /**
   * Handle navigation based on notification type and data
   */
  const handleNotificationNavigation = (type?: string, data?: any) => {
    if (!type) {
      // Default navigation
      navigate('/user/dashboard');
      return;
    }

    switch (type) {
      case 'appointment_success':
      case 'appointment_reminder':
      case 'appointment_cancelled':
      case 'appointment_rescheduled':
        navigate('/user/appointments');
        break;

      case 'payment_success':
        navigate('/user/dashboard');
        break;

      case 'test_notification':
      case 'test_notification_admin':
        navigate('/user/dashboard');
        break;

      default:
        // If URL is provided in data, use it
        if (data?.url) {
          navigate(data.url);
        } else {
          navigate('/user/dashboard');
        }
    }
  };

  return null; // This component doesn't render anything
};

