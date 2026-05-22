import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'dark' | 'light' | 'system';
type Language = 'uz' | 'ru';

interface UIState {
  // Theme State
  theme: Theme;
  setTheme: (theme: Theme) => void;
  
  // Language State
  language: Language;
  setLanguage: (lang: Language) => void;
  
  // Sidebar State
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (isOpen: boolean) => void;
  
  // Modal State (Global simple modals, specific complex ones belong in feature stores)
  activeModal: string | null;
  openModal: (modalId: string) => void;
  closeModal: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      theme: 'dark', // Default to enterprise dark mode
      setTheme: (theme) => set({ theme }),
      
      language: 'uz', // Default language
      setLanguage: (language) => set({ language }),
      
      isSidebarOpen: true,
      toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
      setSidebarOpen: (isSidebarOpen) => set({ isSidebarOpen }),
      
      activeModal: null,
      openModal: (activeModal) => set({ activeModal }),
      closeModal: () => set({ activeModal: null }),
    }),
    {
      name: 'ui-storage',
      // Only persist theme and language
      partialize: (state) => ({ theme: state.theme, language: state.language }),
    }
  )
);
