import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { initializeFirebase } from "@/config/firebase.config";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { pushNotificationService } from "@/services/pushnotification.service";
import { NotificationHandler } from "@/components/notifications/NotificationHandler";
import { isPublicBookingPagePath } from "@/utils/publicBookingRoute.util";

/**
 * Loaded only when Firebase / push are required (authenticated app routes).
 * Keeps firebase/* and push code out of the marketing homepage main chunk.
 */
const PushNotificationInitializer = () => {
  const location = useLocation();
  const enabled = !isPublicBookingPagePath(location.pathname);
  usePushNotifications({ enabled });
  return null;
};

const NOTIF_DISMISSED_KEY = "appointza:notif-prompt-dismissed-until";
const NOTIF_SNOOZE_DAYS = 30;

/** Web-only prompt to enable notifications when permission is not granted. */
const PushNotificationPrompt = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (Capacitor.isNativePlatform()) return;
    if (!("Notification" in window)) {
      setPermission("unsupported");
      return;
    }
    setPermission(Notification.permission);

    const until = localStorage.getItem(NOTIF_DISMISSED_KEY);
    if (until && Date.now() < Number(until)) {
      setDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    const until = Date.now() + NOTIF_SNOOZE_DAYS * 24 * 60 * 60 * 1000;
    localStorage.setItem(NOTIF_DISMISSED_KEY, String(until));
    setDismissed(true);
  };

  const handleEnable = async () => {
    setIsLoading(true);
    try {
      await pushNotificationService.initialize();
    } finally {
      setIsLoading(false);
    }
    if ("Notification" in window) {
      setPermission(Notification.permission);
    }
  };

  if (
    Capacitor.isNativePlatform() ||
    dismissed ||
    permission === "granted" ||
    permission === "unsupported"
  ) {
    return null;
  }

  return (
    <div className="w-full bg-amber-50 border-b border-amber-200 px-4 py-2 text-sm text-amber-900 flex items-center justify-between gap-3">
      <span className="flex-1">
        Enable notifications to get appointment updates.
        {permission === "denied" && (
          <span className="ml-1 text-amber-700">
            (Browser blocked — allow in site settings to enable.)
          </span>
        )}
      </span>
      <div className="flex items-center gap-2 shrink-0">
        {permission !== "denied" && (
          <button
            className="px-3 py-1 rounded bg-amber-600 text-white text-sm disabled:opacity-60"
            onClick={handleEnable}
            disabled={isLoading}
          >
            Enable
          </button>
        )}
        <button
          className="px-2 py-1 rounded text-amber-700 hover:bg-amber-100 text-lg leading-none"
          onClick={handleDismiss}
          aria-label="Dismiss notification prompt"
          title="Don't show for 30 days"
        >
          ×
        </button>
      </div>
    </div>
  );
};

/** Banner only on dashboards (not marketing). */
const RouteScopedPushNotificationPrompt = () => {
  const location = useLocation();
  const path = location.pathname || "";
  const show = path === "/organization/dashboard" || path === "/user/dashboard";
  return show ? <PushNotificationPrompt /> : null;
};

const FirebasePushBootstrap = () => {
  useEffect(() => {
    initializeFirebase();
  }, []);

  return (
    <>
      <PushNotificationInitializer />
      <RouteScopedPushNotificationPrompt />
      <NotificationHandler />
    </>
  );
};

export default FirebasePushBootstrap;
