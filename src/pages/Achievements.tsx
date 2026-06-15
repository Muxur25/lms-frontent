import { useState, useEffect } from 'react';
import { Trophy, Star, Shield, Medal, Lock, Sparkles, CheckCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { apiClient } from '@/api/axios';

export default function Achievements() {
  const { t, i18n } = useTranslation();
  const [achievements, setAchievements] = useState<any[]>([]);
  const [recent, setRecent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let mounted = true;
    Promise.all([
      apiClient.get('/achievements'),
      apiClient.get('/achievements/recent')
    ]).then(([achRes, recRes]) => {
      if (!mounted) return;
      const achData = achRes.data?.data || achRes.data;
      const recData = recRes.data?.data || recRes.data;
      setAchievements(Array.isArray(achData) ? achData : []);
      setRecent(Array.isArray(recData) ? recData : []);
      setError(false);
    }).catch(err => {
      console.error(err);
      if (!mounted) return;
      setAchievements([]);
      setRecent([]);
      setError(true);
    }).finally(() => {
      if (mounted) setLoading(false);
    });
    return () => { mounted = false; };
  }, []);

  const totalEarned = achievements.filter(a => a.isUnlocked).length;
  const totalAvailable = achievements.length;
  const totalProgress = totalAvailable > 0 ? Math.round((totalEarned / totalAvailable) * 100) : 0;

  const categories = Array.from(new Set(achievements.map(a => a.category)));
  const trName = (ach: any) => t(`achievements.items.${ach.name}`, ach.name) as string;
  const trDesc = (ach: any) => t(`achievements.items.${ach.name}_desc`, ach.description) as string;

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'COMMON': return { text: 'var(--blue-400)', bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.2)' };
      case 'RARE': return { text: 'var(--cyan-400)', bg: 'rgba(6,182,212,0.1)', border: 'rgba(6,182,212,0.3)', glow: 'var(--cyan-glow)' };
      case 'EPIC': return { text: 'var(--violet-400)', bg: 'rgba(139,92,246,0.1)', border: 'rgba(139,92,246,0.4)', glow: 'var(--violet-glow)' };
      case 'LEGENDARY': return { text: '#fbbf24', bg: 'rgba(251,191,36,0.1)', border: 'rgba(251,191,36,0.5)', glow: '0 0 20px rgba(251,191,36,0.2)' };
      default: return { text: 'var(--text-secondary)', bg: 'var(--surface-2)', border: 'var(--border-2)' };
    }
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'COURSES': return <CheckCircle size={16} />;
      case 'EXAMS': return <Star size={16} />;
      case 'VIDEOS': return <Sparkles size={16} />;
      case 'CERTIFICATES': return <Medal size={16} />;
      case 'ASSIGNMENTS': return <Shield size={16} />;
      default: return <Trophy size={16} />;
    }
  };

  if (loading) {
    return <div className="page-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="skeleton" style={{ width: 100, height: 100, borderRadius: 20 }} />
    </div>;
  }

  return (
    <div className="page-content">
      {/* HEADER */}
      <div className="page-header" style={{ marginBottom: 32 }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Trophy color="#fbbf24" size={28} /> {t('achievements.title', 'Yutuqlar markazi')}
          </h1>
          <p className="page-sub">{t('achievements.subtitle', "O'quv jarayonidagi yutuqlaringiz va marralaringiz")}</p>
        </div>
        <div className="card" style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t('achievements.totalEarned', 'Jami yutuqlar')}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#fbbf24' }}>{totalEarned} <span style={{ fontSize: 14, color: 'var(--text-tertiary)' }}>/ {totalAvailable}</span></div>
          </div>
          <div className="progress-bar" style={{ width: 100, height: 8 }}>
            <div className="progress-fill" style={{ width: `${totalProgress}%`, background: '#fbbf24' }} />
          </div>
        </div>
      </div>

      {(error || totalAvailable === 0) && (
        <div className="card" style={{ minHeight: 220, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: 10, marginBottom: 28 }}>
          <Trophy size={34} color="var(--text-muted)" />
          <div style={{ fontWeight: 800 }}>{error ? t('achievements.errorTitle', "Yutuqlar yuklanmadi") : t('achievements.noData', "Hozircha yutuqlar yo'q")}</div>
          <div style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>
            {error ? t('achievements.errorText', "Ma'lumotlarni yuklashda xatolik yuz berdi.") : t('achievements.noDataSub', "Yangi yutuqlar shakllanganda shu yerda ko'rinadi.")}
          </div>
        </div>
      )}

      {/* RECENT UNLOCKS */}
      {!error && recent.length > 0 && (
        <div style={{ marginBottom: 36 }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sparkles size={16} color="var(--blue-400)" /> {t('achievements.recent', 'Yaqinda olingan')}
          </div>
          <div className="grid grid-4 fade-in">
            {recent.map((ua, i) => {
              const ach = ua.achievement;
              const style = getRarityColor(ach.rarity);
              return (
                <div key={i} className="card stat-card" style={{ padding: 20, borderColor: style.border, boxShadow: style.glow }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: style.bg, color: style.text, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Trophy size={22} />
                    </div>
                    <span className="badge" style={{ background: style.bg, color: style.text, borderColor: style.border, fontSize: 10 }}>{ach.rarity}</span>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', marginBottom: 4 }}>{trName(ach)}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{trDesc(ach)}</div>
                  <div style={{ marginTop: 14, fontSize: 11, color: 'var(--text-tertiary)' }}>
                    {new Date(ua.unlockedAt).toLocaleDateString(i18n.language === 'ru' ? 'ru-RU' : 'uz-UZ')}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ACHIEVEMENT LIST BY CATEGORY */}
      {!error && totalAvailable > 0 && <div className="fade-in fade-in-1">
        {categories.map(cat => {
          const categoryAchievements = achievements.filter(a => a.category === cat);
          if (categoryAchievements.length === 0) return null;

          return (
            <div key={cat} style={{ marginBottom: 40 }}>
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16, paddingBottom: 8, borderBottom: '1px solid var(--border-1)', display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-primary)' }}>
                {getCategoryIcon(cat)} {t(`achievements.categories.${cat}`, cat) as string}
              </div>
              <div className="r-grid-5">
                {categoryAchievements.map(ach => {
                  const style = getRarityColor(ach.rarity);
                  return (
                    <div key={ach.id} className="card" style={{
                      padding: 16,
                      display: 'flex',
                      flexDirection: 'column',
                      borderColor: ach.isUnlocked ? style.border : 'var(--border-1)',
                      background: ach.isUnlocked ? 'var(--bg-2)' : 'var(--surface-1)',
                      opacity: ach.isUnlocked ? 1 : 0.6,
                      transition: 'all 0.3s',
                      boxShadow: ach.isUnlocked ? style.glow : 'none'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: 10,
                          background: ach.isUnlocked ? style.bg : 'var(--surface-2)',
                          color: ach.isUnlocked ? style.text : 'var(--text-muted)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                          {ach.isUnlocked ? <Trophy size={18} /> : <Lock size={16} />}
                        </div>
                        {ach.isUnlocked && (
                          <span className="badge" style={{ background: style.bg, color: style.text, borderColor: style.border, fontSize: 9 }}>{ach.rarity}</span>
                        )}
                      </div>

                      <div style={{ fontWeight: 700, fontSize: 13, color: ach.isUnlocked ? 'var(--text-primary)' : 'var(--text-secondary)', marginBottom: 4 }}>
                        {trName(ach)}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-tertiary)', flex: 1, marginBottom: 12 }}>
                        {trDesc(ach)}
                      </div>

                      {/* Progress Bar for Locked */}
                      {!ach.isUnlocked && (
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)', marginBottom: 4, fontWeight: 600 }}>
                            <span>{ach.currentProgress} / {ach.requirementValue}</span>
                            <span>{ach.progressPercent}%</span>
                          </div>
                          <div className="progress-bar" style={{ height: 4, background: 'var(--border-2)' }}>
                            <div className="progress-fill" style={{ width: `${ach.progressPercent}%`, background: 'var(--text-muted)' }} />
                          </div>
                        </div>
                      )}

                      {/* Checkmark for Unlocked */}
                      {ach.isUnlocked && (
                        <div style={{ fontSize: 10, color: style.text, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <CheckCircle size={12} /> {t('achievements.unlockedShort', 'Yutuq ochilgan')}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>}
    </div>
  );
}
