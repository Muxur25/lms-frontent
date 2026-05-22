import { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Sidebar, Topbar } from '@/components/Layout';
import { useTranslation } from 'react-i18next';

/**
 * Enterprise Application Layout
 * Wraps the protected areas of the application with Sidebar and Topbar.
 * Provides the React Router <Outlet /> for nested pages.
 */
export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { i18n } = useTranslation();
  
  // Example of syncing local UI state with Router
  const location = useLocation();
  const navigate = useNavigate();
  const activePage = location.pathname.split('/')[1] || 'dashboard';

  const [theme, setTheme] = useState(() => document.documentElement.getAttribute('data-theme') || 'dark');
  
  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

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
          lang={i18n.language}
          setLang={(l) => i18n.changeLanguage(l)}
          theme={theme}
          setTheme={handleThemeChange}
        />
        
        {/* Animated Page Transition Wrapper */}
        <main className="page-content blur-fade" key={location.pathname}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
