import { useState, useEffect } from 'react';

export function navigate(path) {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

export function parseRoute(pathname = (typeof window !== 'undefined' ? window.location.pathname : '/'), search = (typeof window !== 'undefined' ? window.location.search : '')) {
  const normalized = pathname.replace(/\\/g, '/').toLowerCase().replace(/\/$/, '') || '/';
  const searchParams = new URLSearchParams(search);
  const queryPin = searchParams.get('pin');

  // Exact voting route
  if (normalized === '/vote') {
    return { type: 'vote' };
  }

  // Exact admin route
  if (normalized === '/admin') {
    return { type: 'admin' };
  }

  // Root route (domain.com or domain.com/) -> Must redirect to voting
  if (normalized === '/') {
    return { type: 'root' };
  }

  // Direct PIN after root: e.g. /2026
  const directPinMatch = normalized.match(/^\/(\d{3,8})$/);
  if (directPinMatch) {
    return { type: 'screen', pin: directPinMatch[1] };
  }

  // PIN after screen/bigscreen/display/live: e.g. /screen/2026, /display/2026
  const screenPinMatch = normalized.match(/^\/(?:screen|bigscreen|display|live)\/(\d{3,8})$/);
  if (screenPinMatch) {
    return { type: 'screen', pin: screenPinMatch[1] };
  }

  // Generic screen route: /screen, /bigscreen, /display, /live
  if (['/screen', '/bigscreen', '/display', '/live'].includes(normalized)) {
    return { type: 'screen', pin: queryPin || null };
  }

  // Fallback for any unknown route -> redirect to voting
  return { type: 'unknown', path: normalized };
}

export function useCurrentPath() {
  const [path, setPath] = useState(typeof window !== 'undefined' ? window.location.pathname : '/');

  useEffect(() => {
    const handlePopState = () => {
      setPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const normalized = path.replace(/\\/g, '/').toLowerCase().replace(/\/$/, '') || '/';
  return normalized;
}

export function useRouteInfo() {
  const [routeInfo, setRouteInfo] = useState(() => parseRoute());

  useEffect(() => {
    const handlePopState = () => {
      setRouteInfo(parseRoute(window.location.pathname, window.location.search));
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  return routeInfo;
}
