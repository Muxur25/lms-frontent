/**
 * Enterprise Secure Storage Utility
 * Provides an abstraction layer over localStorage/sessionStorage.
 * In a real production environment, this can be enhanced with AES encryption.
 */

const PREFIX = 'agmk_lms_';

export const secureStorage = {
  setItem: (key: string, value: any): void => {
    try {
      const serializedValue = JSON.stringify(value);
      // In a strict security environment, encrypt serializedValue here
      localStorage.setItem(`${PREFIX}${key}`, serializedValue);
    } catch (error) {
      console.error('Error saving to secure storage', error);
    }
  },

  getItem: <T>(key: string): T | null => {
    try {
      const item = localStorage.getItem(`${PREFIX}${key}`);
      if (!item) return null;
      // In a strict security environment, decrypt item here
      return JSON.parse(item) as T;
    } catch (error) {
      console.error('Error reading from secure storage', error);
      return null;
    }
  },

  removeItem: (key: string): void => {
    try {
      localStorage.removeItem(`${PREFIX}${key}`);
    } catch (error) {
      console.error('Error removing from secure storage', error);
    }
  },

  clearAll: (): void => {
    try {
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith(PREFIX)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error('Error clearing secure storage', error);
    }
  }
};
