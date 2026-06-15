import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, LogOut, ShieldAlert } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';

export default function Unauthorized() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const handleLogout = async () => {
    await logout();
    navigate('/auth/login');
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10 bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <section className="w-full max-w-lg text-center bg-[var(--surface-1)] border border-[var(--border-1)] rounded-2xl p-8 shadow-xl">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-red-500/10 text-red-400 flex items-center justify-center mb-5">
          <ShieldAlert size={34} />
        </div>
        <h1 className="text-2xl font-black mb-2">{t('unauthorized.title')}</h1>
        <p className="text-sm leading-6 text-[var(--text-tertiary)] mb-6">{t('unauthorized.subtitle')}</p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to={isAuthenticated ? '/dashboard' : '/auth/login'} className="btn btn-primary">
            <ArrowLeft size={16} />
            {isAuthenticated ? t('unauthorized.backDashboard') : t('common.login')}
          </Link>
          {isAuthenticated && (
            <button type="button" onClick={handleLogout} className="btn btn-ghost">
              <LogOut size={16} />
              {t('common.logout')}
            </button>
          )}
        </div>
      </section>
    </main>
  );
}
