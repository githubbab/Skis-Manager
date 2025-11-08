import * as Device from 'expo-device';

let logID = Device.deviceName;

type DateInput = Date | string | number | undefined;

/**
 * Convert various date formats to a timestamp (milliseconds)
 * Supported formats:
 * - Date object
 * - String YYYYMMDD (e.g., "20241225")
 * - ISO date string (e.g., "2024-12-25")
 * - Number YYYYMMDD (e.g., 20241225)
 * - Timestamp in milliseconds
 * - undefined → returns Date.now()
 */
export function smDate(value?: DateInput): number {
  // No value provided → return current timestamp
  if (value === undefined || value === null) {
    return Date.now();
  }
  
  // Date object → convert to timestamp
  if (value instanceof Date) {
    return value.getTime();
  }
  
  // String format YYYYMMDD (e.g., "20241225")
  if (typeof value === 'string' && /^\d{8}$/.test(value)) {
    const year = parseInt(value.slice(0, 4), 10);
    const month = parseInt(value.slice(4, 6), 10) - 1; // JS months are 0-indexed
    const day = parseInt(value.slice(6, 8), 10);
    return new Date(year, month, day).getTime();
  }
  
  // ISO string or other parseable format
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    if (!isNaN(parsed)) {
      return parsed;
    }
    Logger.warn(`Invalid date string: "${value}"`);
    return Date.now();
  }
  
  // Number format YYYYMMDD (e.g., 20241225)
  if (typeof value === 'number' && value >= 19000101 && value <= 21001231) {
    const year = Math.floor(value / 10000);
    const month = Math.floor((value % 10000) / 100) - 1;
    const day = value % 100;
    return new Date(year, month, day).getTime();
  }
  
  // Timestamp in milliseconds (large number)
  if (typeof value === 'number') {
    return value;
  }
  
  // Fallback
  Logger.warn(`Unexpected date value type: ${typeof value}`, value);
  return Date.now();
};

// Simple logger that only logs in development mode
class Logger {
  static debug(...args: any[]) {
    if (__DEV__) {
      console.debug(`${logID}:`, ...args);
    }
  }
  static log(...args: any[]) {
    if (__DEV__) {
      console.log(`${logID}:`, ...args);
    }
  }
  static warn(...args: any[]) {
    if (__DEV__) {
      console.warn(`${logID}:`, ...args);
    }
  }
  static error(...args: any[]) {
    if (__DEV__) {
      console.error(`${logID}:`, ...args);
    }
  }
  static info(...args: any[]) {
    if (__DEV__) {
      console.info(`${logID}:`, ...args);
    }
  }
}

export { Logger };