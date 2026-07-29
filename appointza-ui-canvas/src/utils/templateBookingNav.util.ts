import type { NavigateFunction } from "react-router-dom";
import {
  getMainAppAuthUrl,
  isOrgSubdomainHost,
  isUserLoggedIn,
  redirectToLogin,
} from "@/utils/authNavigation.util";

/** Turn template booking href into a path (pathname + search + hash). */
export function resolveTemplateBookingPath(href: string): string {
  const raw = (href || "").trim();
  if (!raw) return "";

  try {
    const parsed = new URL(raw, window.location.origin);
    return parsed.pathname + parsed.search + parsed.hash;
  } catch {
    return raw.startsWith("/") ? raw : `/${raw}`;
  }
}

/** Booking from org subdomain always opens on the main app host (e.g. localhost:8083). */
export function resolveMainAppBookingUrl(href: string): string {
  const path = resolveTemplateBookingPath(href);
  if (!path) return "";
  return getMainAppAuthUrl(path);
}

/**
 * Book now from org website → main app booking page (/book-appointment/:org/:loc).
 */
export function navigateToTemplateBooking(href: string, navigate: NavigateFunction): void {
  const path = resolveTemplateBookingPath(href);
  if (!path) return;

  const onOrgSite = isOrgSubdomainHost();
  const target = onOrgSite ? resolveMainAppBookingUrl(href) : path;

  if (isUserLoggedIn()) {
    if (target.startsWith("http://") || target.startsWith("https://")) {
      window.location.href = target;
      return;
    }
    navigate(target);
    return;
  }

  redirectToLogin(onOrgSite ? target : path);
}

export function buildBookAppointmentPath(
  organisationId: number,
  locationId: number,
  serviceId?: number,
): string {
  const base = `/book-appointment/${organisationId}/${locationId}`;
  if (serviceId && serviceId > 0) {
    return `${base}?serviceId=${serviceId}`;
  }
  return base;
}

const MAIN_APP_ORIGIN_RESOLVER = `
function appointzaResolveMainAppOrigin() {
  try {
    if (window.parent && window.parent !== window && window.parent.__APPOINTZA_MAIN_ORIGIN__) {
      return window.parent.__APPOINTZA_MAIN_ORIGIN__;
    }
  } catch (_) {}
  var h = (window.location.hostname || '').toLowerCase();
  if (h === 'localhost' || h === '127.0.0.1' || (h.length > 10 && h.slice(-10) === '.localhost')) {
    var p = window.location.port || '8083';
    return window.location.protocol + '//localhost:' + p;
  }
  return 'https://appointza.com';
}`;

/** Script injected into published template HTML — resolves login host at click time (not baked). */
export function buildTemplateBookingClickScript(): string {
  return `
(function () {
${MAIN_APP_ORIGIN_RESOLVER}
  function toPath(href) {
    try {
      var u = new URL(href, window.location.origin);
      return u.pathname + u.search + u.hash;
    } catch (_) {
      return href.indexOf('/') === 0 ? href : '/' + href;
    }
  }
  document.addEventListener('click', function (e) {
    var el = e.target && e.target.closest ? e.target.closest('a[href]') : null;
    if (!el) return;
    var href = el.getAttribute('href') || '';
    var isBooking =
      href.indexOf('/book-appointment/') !== -1 ||
      href.indexOf('/user/events/') !== -1;
    if (!isBooking) return;
    e.preventDefault();
    var path = toPath(href);
    var mainOrigin = appointzaResolveMainAppOrigin();
    var bookingUrl = href.indexOf('http://') === 0 || href.indexOf('https://') === 0
      ? href
      : mainOrigin + path;
    var token = null;
    try { token = localStorage.getItem('auth_token'); } catch (_) {}
    if (!token) {
      try { sessionStorage.setItem('appointza_auth_return', bookingUrl); } catch (_) {}
      var loginUrl = mainOrigin + '/login?from=' + encodeURIComponent(bookingUrl);
      if (window.parent && window.parent !== window) {
        try { window.top.location.href = loginUrl; } catch (_) {
          window.parent.postMessage({ type: 'appointza:login-required', returnUrl: bookingUrl }, '*');
        }
      } else {
        window.location.href = loginUrl;
      }
      return;
    }
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: 'appointza:booking-nav', url: bookingUrl }, '*');
    } else {
      window.location.href = bookingUrl;
    }
  });
})();
`;
}
