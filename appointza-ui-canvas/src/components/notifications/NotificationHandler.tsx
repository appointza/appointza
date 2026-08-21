import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { App } from '@capacitor/app';
import type { PluginListenerHandle } from '@capacitor/core';
import { useToast } from '@/hooks/use-toast';
import { getFirebaseMessaging, initializeFirebase } from '@/config/firebase.config';
import { onMessage, Unsubscribe } from 'firebase/messaging';
import { isPublicBookingPagePath } from '@/utils/publicBookingRoute.util';

/**
 * Handles push notifications (Web, Android, iOS).
 * Listeners are always cleaned up on unmount / path change.
 */
export const NotificationHandler = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const navigateRef = useRef(navigate);
  const toastRef = useRef(toast);
  navigateRef.current = navigate;
  toastRef.current = toast;

  const isPublicBookingPath = isPublicBookingPagePath(location.pathname);

  useEffect(() => {
    if (isPublicBookingPath) {
      return;
    }

    let cancelled = false;
    let appStateListener: PluginListenerHandle | undefined;
    let unsubscribeOnMessage: Unsubscribe | undefined;
    const nativeHandles: PluginListenerHandle[] = [];

    const handleNotificationNavigation = (type?: string, data?: Record<string, unknown>) => {
      if (!type) {
        navigateRef.current('/user/dashboard');
        return;
      }

      switch (type) {
        case 'appointment_success':
        case 'appointment_reminder':
        case 'appointment_cancelled':
        case 'appointment_rescheduled':
          navigateRef.current('/user/appointments');
          break;
        case 'payment_success':
        case 'test_notification':
        case 'test_notification_admin':
          navigateRef.current('/user/dashboard');
          break;
        default:
          if (typeof data?.url === 'string' && data.url) {
            navigateRef.current(data.url);
          } else {
            navigateRef.current('/user/dashboard');
          }
      }
    };

    const setup = async () => {
      if (Capacitor.isNativePlatform()) {
        const received = await PushNotifications.addListener(
          'pushNotificationReceived',
          (notification) => {
            console.log('🔔 Push notification received (foreground):', notification);
            toastRef.current({
              title: notification.title || 'Appointza',
              description: notification.body || '',
              duration: 5000,
            });
          },
        );
        if (cancelled) {
          await received.remove();
          return;
        }
        nativeHandles.push(received);

        const action = await PushNotifications.addListener(
          'pushNotificationActionPerformed',
          (actionEvent) => {
            console.log('🔔 Push notification action performed:', actionEvent);
            const data = (actionEvent.notification.data || {}) as Record<string, unknown>;
            handleNotificationNavigation(
              typeof data.type === 'string' ? data.type : undefined,
              data,
            );
          },
        );
        if (cancelled) {
          await action.remove();
          return;
        }
        nativeHandles.push(action);

        appStateListener = await App.addListener('appStateChange', (state) => {
          if (state.isActive) {
            console.log('📱 App came to foreground');
          }
        });
        if (cancelled) {
          await appStateListener.remove();
          appStateListener = undefined;
        }
        return;
      }

      // Web
      initializeFirebase();
      const messaging = getFirebaseMessaging();
      if (!messaging) {
        console.warn('⚠️ Firebase Messaging not available for web notifications');
        return;
      }

      unsubscribeOnMessage = onMessage(messaging, (payload) => {
        console.log('🔔 Foreground message received (web):', payload);

        const title = payload.notification?.title || 'Appointza';
        const body = payload.notification?.body || '';
        const data = (payload.data || {}) as Record<string, unknown>;

        toastRef.current({
          title,
          description: body,
          duration: 5000,
        });

        if (Notification.permission === 'granted') {
          const notification = new Notification(title, {
            body,
            icon: '/lovable-uploads/6205c671-a6b9-4927-8268-bd1fa436cd0b.png',
            badge: '/lovable-uploads/6205c671-a6b9-4927-8268-bd1fa436cd0b.png',
            data,
            tag: (typeof data.type === 'string' && data.type) || 'default',
          });

          notification.onclick = (event) => {
            event.preventDefault();
            window.focus();
            handleNotificationNavigation(
              typeof data.type === 'string' ? data.type : undefined,
              data,
            );
            notification.close();
          };
        }
      });
    };

    void setup();

    return () => {
      cancelled = true;
      unsubscribeOnMessage?.();
      unsubscribeOnMessage = undefined;
      void appStateListener?.remove();
      for (const handle of nativeHandles) {
        void handle.remove();
      }
      nativeHandles.length = 0;
    };
  }, [isPublicBookingPath]);

  return null;
};
