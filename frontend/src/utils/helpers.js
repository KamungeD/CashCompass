import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { debounce, throttle, memoize } from './performance';

/**
 * Utility function to merge Tailwind CSS classes
 * Combines clsx for conditional classes and tailwind-merge for conflict resolution
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Format currency value
 */
export const formatCurrency = (amount, currency = 'KES', hideSymbolForEmpty = false) => {
  // If hideSymbolForEmpty is true and amount is 0, null, undefined, or empty string, return empty string
  if (hideSymbolForEmpty && (!amount || amount === 0 || amount === '0' || amount === '')) {
    return '';
  }
  
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
  }).format(amount);
};

/**
 * Format number with commas
 */
export const formatNumber = (number) => {
  return new Intl.NumberFormat('en-KE').format(number);
};

/**
 * Format date
 */
export const formatDate = (date, options = {}) => {
  const defaultOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };
  
  return new Intl.DateTimeFormat('en-KE', { ...defaultOptions, ...options }).format(new Date(date));
};

/**
 * Format relative time (e.g., "2 hours ago")
 */
export const formatRelativeTime = (date) => {
  const rtf = new Intl.RelativeTimeFormat('en-KE', { numeric: 'auto' });
  const now = new Date();
  const target = new Date(date);
  const diffInSeconds = (target - now) / 1000;
  
  const units = [
    { unit: 'year', seconds: 31536000 },
    { unit: 'month', seconds: 2628000 },
    { unit: 'day', seconds: 86400 },
    { unit: 'hour', seconds: 3600 },
    { unit: 'minute', seconds: 60 },
  ];
  
  for (const { unit, seconds } of units) {
    const interval = diffInSeconds / seconds;
    if (Math.abs(interval) >= 1) {
      return rtf.format(Math.round(interval), unit);
    }
  }
  
  return 'just now';
};

/**
 * Truncate text with ellipsis
 */
export const truncateText = (text, maxLength = 50) => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

/**
 * Validate email format
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Generate random color for categories
 */
export const generateRandomColor = () => {
  const colors = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
    '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1',
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

/**
 * Sleep/delay function
 */
export const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Get initials from name
 */
export const getInitials = (name) => {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

/**
 * Calculate percentage
 */
export const calculatePercentage = (value, total) => {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
};

/**
 * Group array by key
 */
export const groupBy = (array, key) => {
  return array.reduce((result, item) => {
    const group = item[key];
    if (!result[group]) {
      result[group] = [];
    }
    result[group].push(item);
    return result;
  }, {});
};

// Re-export performance utilities for convenience
export { debounce, throttle, memoize };
