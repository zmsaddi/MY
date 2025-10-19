// src/utils/formatters.js

/**
 * Centralized formatting utilities
 * Provides consistent formatting across the application
 */

/**
 * Format number with locale and options
 */
export function formatNumber(value, decimals = 2) {
  const num = Number(value ?? 0);
  return num.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Format currency
 */
export function formatCurrency(value, currencySymbol = '$', decimals = 2) {
  return `${currencySymbol}${formatNumber(value, decimals)}`;
}

/**
 * Format date
 */
export function formatDate(dateString, format = 'long') {
  if (!dateString) return '';

  const date = new Date(dateString);

  if (format === 'short') {
    return date.toLocaleDateString('ar-SA');
  }

  if (format === 'long') {
    return date.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  if (format === 'time') {
    return date.toLocaleTimeString('ar-SA', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  if (format === 'datetime') {
    return `${formatDate(dateString, 'long')} ${formatDate(dateString, 'time')}`;
  }

  return dateString;
}

/**
 * Format percentage
 */
export function formatPercentage(value, decimals = 1) {
  const num = Number(value ?? 0);
  return `${num.toFixed(decimals)}%`;
}

/**
 * Format phone number
 */
export function formatPhone(phone) {
  if (!phone) return '';

  // Remove all non-digits
  const digits = phone.replace(/\D/g, '');

  // Format based on length
  if (digits.length === 10) {
    return digits.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
  }

  return phone;
}

/**
 * Format file size
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(dateString) {
  if (!dateString) return '';

  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return 'الآن';
  if (diffInSeconds < 3600) return `منذ ${Math.floor(diffInSeconds / 60)} دقيقة`;
  if (diffInSeconds < 86400) return `منذ ${Math.floor(diffInSeconds / 3600)} ساعة`;
  if (diffInSeconds < 2592000) return `منذ ${Math.floor(diffInSeconds / 86400)} يوم`;
  if (diffInSeconds < 31536000) return `منذ ${Math.floor(diffInSeconds / 2592000)} شهر`;
  return `منذ ${Math.floor(diffInSeconds / 31536000)} سنة`;
}

/**
 * Parse number from formatted string
 */
export function parseFormattedNumber(formattedValue) {
  if (typeof formattedValue === 'number') return formattedValue;
  if (!formattedValue) return 0;

  return Number(formattedValue.toString().replace(/[^0-9.-]/g, ''));
}

/**
 * Short format for large numbers (e.g., 1.5K, 2.3M)
 */
export function formatCompact(value) {
  const num = Number(value ?? 0);

  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }

  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }

  return num.toString();
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text, maxLength = 50) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}
