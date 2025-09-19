import translations, { TranslationKey } from "@/constants/Translations";
import { getLang } from "./SettingsManager";

// Function to list available languages
export function listLanguages(): string[] {
  return Object.keys(translations);
};
// Function to convert various date formats to a timestamp
export function smDate(value?: any): number {
  const now = new Date(Date.now());
  let date = now.getTime();
  if (value) {
    if (value instanceof Date) {
      date = value.getTime();
    }
    if (typeof value === "string") {
      const re = RegExp(/^(19[0-9]{2}|20[0-9]{2}|2100)(0[1-9]|1[0-2])(0[1-9]|[12][0-9]|3[01])$/);
      if (re.test(value)) {
        const yyyy = Number(value.slice(0, 4))
        const mm = Number(value.slice(4, 6))
        const dd = Number(value.slice(6, 8))
        date = new Date(yyyy, mm, dd).getTime() + (now.getTime() - new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime());
      }
      try {
        date = new Date(value).getTime();
      } catch { }
    }
    if (typeof value === "number") {
      if (value.toString().length === 8) {
        const yyyy: number = Math.floor(value / 10000);
        const mm: number = Math.floor((value - yyyy * 10000) / 100);
        const dd: number = (value - yyyy * 10000 - mm * 100);
        date = new Date(yyyy, mm, dd).getTime() + (now.getTime() - new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime());
      }
    }
  }
  return date;
};

export function t(key: TranslationKey): string {
  return translations[getLang()][key];
}

export function localeDate(date: number, options?: Intl.DateTimeFormatOptions): string {
  return new Date(date).toLocaleDateString(getLang(), options);
}

export function localeTime(date: number, options?: Intl.DateTimeFormatOptions): string {
  return new Date(date).toLocaleTimeString(getLang(), options);
}

export function localeDateTime(date: number, options?: Intl.DateTimeFormatOptions): string {
  return new Date(date).toLocaleString(getLang(), options);
}