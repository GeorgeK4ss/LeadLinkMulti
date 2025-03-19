import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format bytes to human-readable file size
 * @param bytes Number of bytes
 * @param decimals Number of decimal places to display
 * @returns Formatted string (e.g. "1.5 MB")
 */
export function formatFileSize(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Create a download link for a document
 * @param url The URL of the document
 * @param filename The name to save the file as
 */
export function downloadDocument(url: string, filename: string): void {
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Format a date to a readable string
 * @param date Date to format
 * @param format Format to use (default: 'medium')
 * @returns Formatted date string
 */
export const formatDate = (date: Date | string | number | undefined | null, format: 'short' | 'medium' | 'long' = 'medium'): string => {
  if (!date) return 'N/A';
  
  const dateObj = typeof date === 'object' ? date : new Date(date);
  
  if (isNaN(dateObj.getTime())) {
    return 'Invalid Date';
  }
  
  try {
    switch (format) {
      case 'short':
        return dateObj.toLocaleDateString('en-US', {
          month: 'numeric',
          day: 'numeric',
          year: '2-digit'
        });
      case 'long':
        return dateObj.toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      case 'medium':
      default:
        return dateObj.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        });
    }
  } catch (error) {
    console.error('Error formatting date:', error);
    return String(date);
  }
};

/**
 * Format a number as currency
 * @param amount Amount to format
 * @param currency Currency code (default: 'USD')
 * @param locale Locale to use for formatting (default: 'en-US')
 * @returns Formatted currency string
 */
export const formatCurrency = (
  amount: number | string | undefined | null,
  currency: string = 'USD',
  locale: string = 'en-US'
): string => {
  if (amount === undefined || amount === null) return 'N/A';
  
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numAmount)) {
    return 'Invalid Amount';
  }
  
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(numAmount);
  } catch (error) {
    console.error('Error formatting currency:', error);
    return String(amount);
  }
};

/**
 * Format a number with commas and decimal places
 * @param num Number to format
 * @param decimals Number of decimal places (default: 2)
 * @returns Formatted number string
 */
export const formatNumber = (
  num: number | string | undefined | null,
  decimals: number = 2
): string => {
  if (num === undefined || num === null) return 'N/A';
  
  const numValue = typeof num === 'string' ? parseFloat(num) : num;
  
  if (isNaN(numValue)) {
    return 'Invalid Number';
  }
  
  try {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(numValue);
  } catch (error) {
    console.error('Error formatting number:', error);
    return String(num);
  }
};

/**
 * Format bytes to a human-readable string (KB, MB, GB, etc.)
 * @param bytes Bytes to format
 * @param decimals Number of decimal places (default: 2)
 * @returns Formatted bytes string
 */
export const formatBytes = (
  bytes: number | undefined | null,
  decimals: number = 2
): string => {
  if (bytes === undefined || bytes === null) return 'N/A';
  
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
}; 