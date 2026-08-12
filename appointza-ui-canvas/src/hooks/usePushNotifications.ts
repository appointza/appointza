import { useState, useEffect, useCallback, useRef } from 'react';
import { pushNotificationService } from '@/services/pushnotification.service';
import { useAuth } from '@/contexts/AuthContext';

export const usePushNotifications = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user, isAuthenticated } = useAuth();
  const syncAttemptedRef = useRef<string | null>(null);

  const initialize = useCallback(async () => {
    if (isInitialized && pushToken) {
      return pushToken;
    }

    setIsLoading(true);
    try {
      const token = await pushNotificationService.initialize();
      if (token) {
        setPushToken(token);
        setIsInitialized(true);
      }
      return token;
    } catch (error) {
      console.error('❌ Error initializing push notifications:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [isInitialized, pushToken]);

  // Initialize once on mount
  useEffect(() => {
    void initialize();
  }, [initialize]);

  // Sync token to server once per login session (not on every screen)
  useEffect(() => {
    const userId = user?.id;
    if (!isAuthenticated || !userId || !isInitialized || !pushToken) {
      return;
    }

    const syncKey = `${userId}:${pushToken}`;
    if (syncAttemptedRef.current === syncKey) {
      return;
    }
    syncAttemptedRef.current = syncKey;

    void pushNotificationService.saveTokenToServer(userId).catch((error) => {
      console.error('❌ Error saving push token to server:', error);
      syncAttemptedRef.current = null;
    });
  }, [isAuthenticated, user?.id, pushToken, isInitialized]);

  const refreshToken = useCallback(async (userId?: number) => {
    setIsLoading(true);
    try {
      syncAttemptedRef.current = null;
      pushNotificationService.clearSyncedToken(userId || user?.id);
      const newToken = await pushNotificationService.refreshToken(userId || user?.id);
      if (newToken) {
        setPushToken(newToken);
        setIsInitialized(true);
        return newToken;
      }
      return null;
    } catch (error) {
      console.error('❌ Error refreshing push token:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  return {
    isInitialized,
    pushToken,
    isLoading,
    initialize,
    refreshToken,
    updateTokenForUser: pushNotificationService.updateTokenForUser.bind(pushNotificationService),
    areNotificationsEnabled: pushNotificationService.areNotificationsEnabled.bind(pushNotificationService),
  };
};
