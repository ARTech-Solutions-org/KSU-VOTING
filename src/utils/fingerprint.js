// Device Fingerprint & Voter Token Utility
// Privacy-respecting: no personal data, purely technical device attributes + localStorage token

const TOKEN_KEY = 'ksu_voter_token_v1';

export function getOrCreateVoterToken() {
  let token = localStorage.getItem(TOKEN_KEY);
  if (!token) {
    // Generate secure random UUID
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      token = crypto.randomUUID();
    } else {
      token = 'vt_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 10);
    }
    localStorage.setItem(TOKEN_KEY, token);
  }
  return token;
}

export function generateFingerprint() {
  try {
    const nav = window.navigator;
    const screen = window.screen;

    // Collect standard non-PII attributes
    const components = [
      nav.userAgent || '',
      nav.language || '',
      screen.width || 0,
      screen.height || 0,
      screen.colorDepth || 0,
      new Date().getTimezoneOffset(),
      nav.hardwareConcurrency || 1,
      nav.maxTouchPoints || 0,
    ];

    // Simple canvas fingerprint
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 120;
      canvas.height = 30;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.fillStyle = '#248675';
        ctx.fillText('KSUMC 2026', 2, 2);
        ctx.fillStyle = '#00f2fe';
        ctx.fillRect(50, 5, 20, 20);
        components.push(canvas.toDataURL().slice(-50));
      }
    } catch {
      // Ignore canvas errors
    }

    // DJB2 hash of components string
    const str = components.join('###');
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
      hash = (hash * 33) ^ str.charCodeAt(i);
    }
    return (hash >>> 0).toString(16);
  } catch (err) {
    return 'fp_fallback_' + Math.random().toString(36).substring(2, 8);
  }
}

