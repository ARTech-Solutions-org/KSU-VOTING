// Unicode Bidi & Text Formatting Helper

// Tests if a string contains Arabic characters (U+0600 - U+06FF, etc.)
export function hasArabic(text) {
  if (!text) return false;
  return /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(text);
}

// Tests if a string is predominantly Latin/English
export function isLatin(text) {
  if (!text) return false;
  return /^[A-Za-z0-9\s.,!?:;'"()/#+&%-]+$/.test(text.trim());
}

// Determines the recommended text direction
export function getDir(text) {
  return hasArabic(text) ? 'rtl' : 'ltr';
}

// Parses an option name to extract line 1 (title) and line 2 (subtitle)
// Supports "RxCompass Ai | بوصلة الصرف الذكي" -> title: "RxCompass Ai", subtitle: "بوصلة الصرف الذكي"
export function parseOptionName(option) {
  if (!option) return { title: '', subtitle: '', raw: '' };

  let title = option.title || '';
  let subtitle = option.subtitle || '';
  const raw = option.rawName || (subtitle ? `${title} | ${subtitle}` : title);

  if (!subtitle && title.includes('|')) {
    const parts = title.split('|').map((s) => s.trim());
    title = parts[0];
    subtitle = parts.slice(1).join(' | ');
  } else if (!title && raw.includes('|')) {
    const parts = raw.split('|').map((s) => s.trim());
    title = parts[0];
    subtitle = parts.slice(1).join(' | ');
  } else if (!title) {
    title = raw;
  }

  return {
    title,
    subtitle,
    titleDir: getDir(title),
    subtitleDir: getDir(subtitle),
    hasSubtitle: Boolean(subtitle && subtitle.trim().length > 0),
  };
}

