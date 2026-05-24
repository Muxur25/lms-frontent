import { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Sidebar, Topbar } from '@/components/Layout';
import { useTranslation } from 'react-i18next';
import { useSocket } from '@/hooks/useSocket';
import { useUIStore } from '@/store/useUIStore';

/**
 * Enterprise Application Layout
 * Wraps the protected areas of the application with Sidebar and Topbar.
 * Provides the React Router <Outlet /> for nested pages.
 */
export default function AppLayout() {
  useSocket();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { i18n } = useTranslation();
  const { theme, setTheme, language, setLanguage } = useUIStore();
  
  // Example of syncing local UI state with Router
  const location = useLocation();
  const navigate = useNavigate();
  const activePage = location.pathname.split('/')[1] || 'dashboard';

  useEffect(() => {
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => {
        document.documentElement.setAttribute('data-theme', mediaQuery.matches ? 'dark' : 'light');
      };
      handleChange();
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      document.documentElement.setAttribute('data-theme', theme);
    }
  }, [theme]);

  useEffect(() => {
    if (i18n.language !== language) {
      i18n.changeLanguage(language);
    }
  }, [language, i18n]);

  const handlePageChange = (pageId: string) => {
    navigate(`/${pageId}`);
  };

  return (
    <div className="app-layout" data-theme={theme}>
      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        activePage={activePage}
        setActivePage={handlePageChange}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />
      
      <div className="main-area">
        <Topbar
          activePage={activePage}
          setActivePage={handlePageChange}
          setMobileOpen={setMobileOpen}
          lang={language}
          setLang={(l) => setLanguage(l as 'uz' | 'ru')}
          theme={theme}
          setTheme={(t) => setTheme(t as 'dark' | 'light' | 'system')}
        />
        
        {/* Animated Page Transition Wrapper */}
        <main className="page-content blur-fade" key={location.pathname}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

