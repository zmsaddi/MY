// src/utils/formatters.js
//
// Arabic-aware formatting helpers used across the application.
// These helpers keep all number/date/size formatting consistent while
// allowing us to control the digit style (eastern Arabic vs latin).

const DEFAULT_NUMBER_LOCALE = 'ar-SY';
const DEFAULT_DATE_LOCALE = 'ar-SY';

const EASTERN_ARABIC_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
const EASTERN_TO_LATIN_MAP = {
  '٠': '0',
  '١': '1',
  '٢': '2',
  '٣': '3',
  '٤': '4',
  '٥': '5',
  '٦': '6',
  '٧': '7',
  '٨': '8',
  '٩': '9'
};

function ensureNumber(value) {
  if (value === null || value === undefined || value === '') return 0;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function applyDigitStyle(value, digitStyle = 'eastern') {
  if (!value) return value;

  if (digitStyle === 'latin') {
    return toLatinDigits(value);
  }

  if (digitStyle === 'eastern') {
    return toArabicDigits(value);
  }

  return value;
}

export function toArabicDigits(value) {
  if (value === null || value === undefined) return '';
  return value
    .toString()
    .replace(/\d/g, (digit) => EASTERN_ARABIC_DIGITS[Number(digit)]);
}

export function toLatinDigits(value) {
  if (value === null || value === undefined) return '';
  return value
    .toString()
    .replace(/[٠-٩]/g, (digit) => EASTERN_TO_LATIN_MAP[digit] ?? digit);
}

export function formatNumber(value, options = {}) {
  const {
    minimumFractionDigits = 0,
    maximumFractionDigits = 2,
    locale = DEFAULT_NUMBER_LOCALE,
    digitStyle = 'eastern'
  } = options;

  const num = ensureNumber(value);

  const formatted = num.toLocaleString(locale, {
    minimumFractionDigits,
    maximumFractionDigits
  });

  return applyDigitStyle(formatted, digitStyle);
}

export function formatCurrency(value, options = {}) {
  const {
    symbol = '',
    locale = DEFAULT_NUMBER_LOCALE,
    digitStyle = 'eastern',
    minimumFractionDigits = 2,
    maximumFractionDigits = 2,
    symbolPosition = 'suffix', // 'suffix' | 'prefix'
    separator = '\u00A0'
  } = options;

  const number = formatNumber(value, {
    locale,
    digitStyle,
    minimumFractionDigits,
    maximumFractionDigits
  });

  if (!symbol) {
    return number;
  }

  return symbolPosition === 'prefix'
    ? `${symbol}${separator}${number}`
    : `${number}${separator}${symbol}`;
}

export function formatDate(dateValue, format = 'long', options = {}) {
  if (!dateValue) return '';

  const { locale = DEFAULT_DATE_LOCALE, digitStyle = 'eastern' } = options;
  const date = new Date(dateValue);

  const formatOptionsMap = {
    short: {},
    long: {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    },
    time: {
      hour: '2-digit',
      minute: '2-digit'
    },
    datetime: null
  };

  if (format === 'datetime') {
    const dayPart = formatDate(dateValue, 'long', { locale, digitStyle });
    const timePart = formatDate(dateValue, 'time', { locale, digitStyle });
    return `${dayPart} ${timePart}`.trim();
  }

  const formatOptions = formatOptionsMap[format] ?? formatOptionsMap.long;
  const formatted = date.toLocaleString(locale, formatOptions);

  return applyDigitStyle(formatted, digitStyle);
}

export function formatPercentage(value, options = {}) {
  const {
    digitStyle = 'eastern',
    locale = DEFAULT_NUMBER_LOCALE,
    minimumFractionDigits = 1,
    maximumFractionDigits = 1
  } = options;

  const num = ensureNumber(value);
  const formatted = `${formatNumber(num, {
    locale,
    digitStyle,
    minimumFractionDigits,
    maximumFractionDigits
  })}%`;

  return formatted;
}

export function formatPhone(phone, options = {}) {
  if (!phone) return '';

  const { digitStyle = 'eastern', separator = ' ' } = options;
  const digitsOnly = toLatinDigits(phone).replace(/\D/g, '');

  if (!digitsOnly) return phone;

  const grouped =
    digitsOnly.length === 10
      ? digitsOnly.replace(/(\d{3})(\d{3})(\d{4})/, `$1${separator}$2${separator}$3`)
      : digitsOnly.replace(/(\d{4})(?=\d)/g, `$1${separator}`);

  return applyDigitStyle(grouped, digitStyle);
}

export function formatFileSize(bytes, options = {}) {
  const { digitStyle = 'eastern', locale = DEFAULT_NUMBER_LOCALE } = options;

  if (!bytes || bytes === 0) {
    return applyDigitStyle('0 بايت', digitStyle);
  }

  const k = 1024;
  const units = ['بايت', 'ك.ب', 'م.ب', 'ج.ب', 'ت.ب'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), units.length - 1);
  const size = bytes / Math.pow(k, index);

  const formattedSize = formatNumber(size, {
    locale,
    digitStyle,
    minimumFractionDigits: 0,
    maximumFractionDigits: size >= 10 ? 1 : 2
  });

  return `${formattedSize} ${units[index]}`;
}

export function formatRelativeTime(dateValue, options = {}) {
  if (!dateValue) return '';

  const { digitStyle = 'eastern', locale = DEFAULT_NUMBER_LOCALE } = options;
  const date = new Date(dateValue);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'الآن';

  const minutes = Math.floor(diffInSeconds / 60);
  if (minutes < 60) {
    return `منذ ${formatNumber(minutes, { locale, digitStyle })} دقيقة`;
  }

  const hours = Math.floor(diffInSeconds / 3600);
  if (hours < 24) {
    return `منذ ${formatNumber(hours, { locale, digitStyle })} ساعة`;
  }

  const days = Math.floor(diffInSeconds / 86400);
  if (days < 30) {
    return `منذ ${formatNumber(days, { locale, digitStyle })} يوم`;
  }

  const months = Math.floor(diffInSeconds / 2592000);
  if (months < 12) {
    return `منذ ${formatNumber(months, { locale, digitStyle })} شهر`;
  }

  const years = Math.floor(diffInSeconds / 31536000);
  return `منذ ${formatNumber(years, { locale, digitStyle })} سنة`;
}

export function parseFormattedNumber(formattedValue) {
  if (typeof formattedValue === 'number') return formattedValue;
  if (!formattedValue) return 0;

  const normalized = toLatinDigits(formattedValue)
    .replace(/[^\d.-]/g, '')
    .trim();

  return Number(normalized || 0);
}

export function formatCompact(value, options = {}) {
  const { digitStyle = 'eastern', locale = DEFAULT_NUMBER_LOCALE } = options;
  const num = ensureNumber(value);

  if (Math.abs(num) >= 1_000_000_000) {
    const amount = num / 1_000_000_000;
    return `${formatNumber(amount, {
      locale,
      digitStyle,
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    })} مليار`;
  }

  if (Math.abs(num) >= 1_000_000) {
    const amount = num / 1_000_000;
    return `${formatNumber(amount, {
      locale,
      digitStyle,
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    })} مليون`;
  }

  if (Math.abs(num) >= 1_000) {
    const amount = num / 1_000;
    return `${formatNumber(amount, {
      locale,
      digitStyle,
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    })} ألف`;
  }

  return formatNumber(num, { locale, digitStyle, minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

export function truncate(text, maxLength = 50, suffix = '…') {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}${suffix}`;
}

/**
 * Get language-appropriate name from object with name_ar and name_en properties
 * @param {Object} item - Object with name_ar and name_en properties
 * @param {string} language - Current language ('ar' or 'en')
 * @returns {string} - The appropriate name based on language
 */
export const getLocalizedName = (item, language = 'ar') => {
  if (!item) return '';
  if (language === 'en' && item.name_en) {
    return item.name_en;
  }
  return item.name_ar || item.name_en || '';
};

export function fmt(value, options = {}) {
  const num = ensureNumber(value);
  const {
    maximumFractionDigits = 2,
    minimumFractionDigits = 0
  } = options;

  return num.toLocaleString(undefined, {
    maximumFractionDigits,
    minimumFractionDigits
  });
}

export const localeHelpers = {
  DEFAULT_NUMBER_LOCALE,
  DEFAULT_DATE_LOCALE,
  applyDigitStyle,
  ensureNumber
};
