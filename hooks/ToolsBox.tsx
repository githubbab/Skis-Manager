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

// Types pour les moments de la journée
export type PartOfDay = "morning" | "noon" | "afternoon" | "evening";

// Utilitaires pour les moments de la journée
export const PartOfDayUtils = {
  /**
   * Convertit un moment de la journée en heure fixe
   */
  getHourFromPartOfDay: (part: PartOfDay): number => {
    switch (part) {
      case "morning": return 9;  // 9h00
      case "noon": return 12;     // 12h00
      case "afternoon": return 14; // 14h00
      case "evening": return 18;   // 18h00
    }
  },

  /**
   * Détermine le moment de la journée à partir d'une heure
   */
  getPartOfDayFromHour: (hour: number): PartOfDay => {
    if (hour < 11) return "morning";
    if (hour < 13) return "noon";
    if (hour < 17) return "afternoon";
    return "evening";
  },

  /**
   * Retourne le nom de l'icône Feather pour un moment de la journée
   */
  getPartOfDayIcon: (part: PartOfDay): "sunrise" | "sun" | "sunset" | "moon" => {
    switch (part) {
      case "morning": return "sunrise";    // Lever du soleil
      case "noon": return "sun";           // Soleil
      case "afternoon": return "sunset";   // Coucher du soleil
      case "evening": return "moon";       // Lune
    }
  },

  /**
   * Retourne le label en français pour un moment de la journée
   */
  getPartOfDayLabel: (part: PartOfDay): string => {
    switch (part) {
      case "morning": return "Matin";
      case "noon": return "Midi";
      case "afternoon": return "Après-midi";
      case "evening": return "Soir";
    }
  },

  /**
   * Crée une nouvelle date avec le moment de la journée spécifié
   */
  setPartOfDayToDate: (date: Date, part: PartOfDay): Date => {
    const hour = PartOfDayUtils.getHourFromPartOfDay(part);
    return new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      hour,
      0 // Minutes à 0
    );
  },

  /**
   * Liste de tous les moments de la journée
   */
  allParts: ["morning", "noon", "afternoon", "evening"] as const,
};

// Utilitaires pour les évaluations de hors-pistes
export const RatingUtils = {
  /**
   * Convertit une note numérique (1-5) en emoji
   */
  ratingToEmoji: (rating: number): string => {
    switch (rating) {
      case 1: return "🤮";
      case 2: return "😕";
      case 3: return "🙂";
      case 4: return "😊";
      case 5: return "😍";
      default: return "🙂"; // Par défaut
    }
  },

  /**
   * Liste de toutes les évaluations possibles avec leurs émojis
   * Le label est une clé de traduction à utiliser avec t()
   */
  allRatings: [
    { value: 5, emoji: "😍", label: "rating_excellent" },
    { value: 4, emoji: "😊", label: "rating_very_good" },
    { value: 3, emoji: "🙂", label: "rating_good" },
    { value: 2, emoji: "😕", label: "rating_not_great" },
    { value: 1, emoji: "🤮", label: "rating_very_bad" },
  ] as const,
};