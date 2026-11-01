import { useState, useEffect } from 'react';

export function navigate(path) {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

export function useCurrentPath() {
  const [path, setPath] = useState(window.location.pathname);

  useEffect(() => {
    const handlePopState = () => {
      setPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Normalize: handle \admin, /admin/, /admin
  const normalized = path.replace(/\\/g, '/').toLowerCase().replace(/\/$/, '') || '/';
  return normalized;
}

