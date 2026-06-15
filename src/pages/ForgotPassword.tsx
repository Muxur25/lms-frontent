import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Building2, CheckCircle2, IdCard, KeyRound, Mail } from 'lucide-react';

export default function ForgotPassword() {
  const { t } = useTranslation();
  const [credential, setCredential] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (credential.trim()) {
      setSubmitted(true);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10 bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <section className="w-full max-w-xl bg-[var(--surface-1)] border border-[var(--border-1)] rounded-2xl p-6 shadow-xl">
        <Link to="/auth/login" className="inline-flex items-center gap-2 text-sm text-[var(--text-tertiary)] hover:text-[var(--text-primary)] mb-6">
          <ArrowLeft size={16} />
          {t('forgotPassword.backLogin')}
        </Link>

        <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-4">
          <KeyRound size={24} />
        </div>
        <h1 className="text-2xl font-black mb-2">{t('forgotPassword.title')}</h1>
        <p className="text-sm leading-6 text-[var(--text-tertiary)] mb-6">{t('forgotPassword.subtitle')}</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="block text-sm font-bold mb-2">{t('forgotPassword.credential')}</span>
            <div className="flex items-center gap-3 bg-[var(--surface-2)] border border-[var(--border-1)] rounded-xl px-3">
              <IdCard size={18} className="text-[var(--text-tertiary)]" />
              <input
                value={credential}
                onChange={(event) => setCredential(event.target.value)}
                required
                className="w-full bg-transparent outline-none py-3 text-sm"
                placeholder={t('forgotPassword.placeholder')}
              />
            </div>
          </label>

          <button type="submit" className="btn btn-primary w-full">
            {t('forgotPassword.submit')}
          </button>
        </form>

        {submitted && (
          <div className="mt-5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-300">
            <div className="flex items-start gap-3">
              <CheckCircle2 size={18} className="mt-0.5" />
              <div>
                <strong className="block text-[var(--text-primary)]">{t('forgotPassword.nextTitle')}</strong>
                <span className="block mt-1 leading-6">{t('forgotPassword.nextText')}</span>
              </div>
            </div>
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-3 mt-6">
          <div className="rounded-xl bg-[var(--surface-2)] border border-[var(--border-1)] p-4">
            <Building2 size={18} className="text-blue-400 mb-2" />
            <div className="text-sm font-bold">{t('forgotPassword.hrTitle')}</div>
            <div className="text-xs text-[var(--text-tertiary)] mt-1">{t('forgotPassword.hrText')}</div>
          </div>
          <div className="rounded-xl bg-[var(--surface-2)] border border-[var(--border-1)] p-4">
            <Mail size={18} className="text-blue-400 mb-2" />
            <div className="text-sm font-bold">{t('forgotPassword.adminTitle')}</div>
            <div className="text-xs text-[var(--text-tertiary)] mt-1">{t('forgotPassword.adminText')}</div>
          </div>
        </div>
      </section>
    </main>
  );
}
