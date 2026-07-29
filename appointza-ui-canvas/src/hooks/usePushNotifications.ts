import { useState, useEffect, useCallback } from 'react';
import { pushNotificationService } from '@/services/pushnotification.service';
import { useAuth } from '@/contexts/AuthContext';

export const usePushNotifications = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user, isAuthenticated } = useAuth();

  // Initialize push notifications
  const initialize = useCallback(async () => {
    if (isInitialized) {
      return pushToken;
    }

    setIsLoading(true);
    try {
      console.log('🚀 Initializing push notifications...');
      const token = await pushNotificationService.initialize();
      
      if (token) {
        setPushToken(token);
        setIsInitialized(true);
        console.log('✅ Push notifications initialized with token:', token);
      } else {
        console.warn('⚠️ Push notifications initialization failed or permission denied');
      }
    } catch (error) {
      console.error('❌ Error initializing push notifications:', error);
    } finally {
      setIsLoading(false);
    }

    return pushToken;
  }, [isInitialized, pushToken]);

  // Save token to server when user is authenticated
  useEffect(() => {
    const saveToken = async () => {
      if (isAuthenticated && user?.id && pushToken && isInitialized) {
        try {
          console.log('💾 Saving push token to server for user:', user.id, 'Token:', pushToken.substring(0, 20) + '...');
          const saved = await pushNotificationService.saveTokenToServer(user.id);
          if (saved) {
            console.log('✅ Push token saved to server successfully');
          } else {
            console.warn('⚠️ Failed to save push token, will retry on next auth check');
          }
        } catch (error) {
          console.error('❌ Error saving push token to server:', error);
        }
      } else if (isAuthenticated && user?.id && !pushToken) {
        // If user is authenticated but no token, try to initialize
        console.log('🔄 User authenticated but no push token, initializing...');
        try {
          const token = await pushNotificationService.initialize();
          if (token) {
            setPushToken(token);
            setIsInitialized(true);
            // Save the newly obtained token
            await pushNotificationService.saveTokenToServer(user.id);
          }
        } catch (error) {
          console.error('❌ Error initializing push notifications for authenticated user:', error);
        }
      }
    };

    saveToken();
  }, [isAuthenticated, user?.id, pushToken, isInitialized]);

  // Refresh token when user changes (e.g., login from different device)
  useEffect(() => {
    const refreshTokenIfNeeded = async () => {
      if (isAuthenticated && user?.id && isInitialized) {
        // Update token to ensure it's current
        try {
          await pushNotificationService.updateTokenForUser(user.id);
        } catch (error) {
          console.error('❌ Error updating token for user:', error);
        }
      }
    };

    // Small delay to ensure auth state is fully updated
    const timeoutId = setTimeout(refreshTokenIfNeeded, 500);
    return () => clearTimeout(timeoutId);
  }, [isAuthenticated, user?.id, isInitialized]);

  // Initialize on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Manual refresh function
  const refreshToken = useCallback(async (userId?: number) => {
    setIsLoading(true);
    try {
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

