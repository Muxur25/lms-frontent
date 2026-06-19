import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { Trophy, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SOCKET_IO_PATH, getRealtimeUrl } from '@/shared/lib/api-config';
import { useAuthStore } from '@/store/auth.store';

export default function AchievementUnlockModal() {
  const { t } = useTranslation();
  const [achievement, setAchievement] = useState<any>(null);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) return;
    const token = localStorage.getItem('access_token');
    if (!token) return;

    const socket = io(getRealtimeUrl(), {
      auth: { token },
      path: SOCKET_IO_PATH,
      transports: ['websocket', 'polling'],
    });

    socket.on('achievement_unlocked', (payload: { achievement?: any }) => {
      if (!payload?.achievement) return;
      setAchievement(payload.achievement);
      setTimeout(() => setAchievement(null), 5000);
    });

    return () => {
      socket.disconnect();
    };
  }, [isAuthenticated]);

  if (!achievement) return null;

  const style = getRarityColor(achievement.rarity);
  const achievementName = t(`achievements.items.${achievement.name}`, achievement.name) as string;
  const achievementDescription = t(`achievements.items.${achievement.name}_desc`, achievement.description) as string;

  return (
    <div className="fade-in" style={{
      position: 'fixed',
      bottom: 40,
      right: 40,
      zIndex: 9999,
      background: 'var(--surface-1)',
      border: `2px solid ${style.border}`,
      borderRadius: 'var(--radius-lg)',
      padding: '20px 24px',
      boxShadow: `0 10px 40px -10px rgba(0,0,0,0.5), ${style.glow}`,
      display: 'flex',
      alignItems: 'center',
      gap: 20,
      minWidth: 320,
      animation: 'slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
    }}>
      <div style={{
        width: 50, height: 50, borderRadius: 12,
        background: style.bg, color: style.text,
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        <Trophy size={28} />
      </div>
      
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: style.text, letterSpacing: 1, marginBottom: 4 }}>
          {t('achievements.unlocked', '🏆 Yutuq ochildi!')}
        </div>
        <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 2 }}>
          {achievementName}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
          {achievementDescription}
        </div>
      </div>

      <button 
        onClick={() => setAchievement(null)}
        style={{
          background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', padding: 4
        }}
      >
        <X size={18} />
      </button>
      
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(40px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

const getRarityColor = (rarity: string) => {
  switch (rarity) {
    case 'COMMON': return { text: 'var(--blue-400)', bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.2)', glow: '0 0 10px rgba(59,130,246,0.1)' };
    case 'RARE': return { text: 'var(--cyan-400)', bg: 'rgba(6,182,212,0.1)', border: 'rgba(6,182,212,0.3)', glow: '0 0 15px var(--cyan-glow)' };
    case 'EPIC': return { text: 'var(--violet-400)', bg: 'rgba(139,92,246,0.1)', border: 'rgba(139,92,246,0.4)', glow: '0 0 20px var(--violet-glow)' };
    case 'LEGENDARY': return { text: '#fbbf24', bg: 'rgba(251,191,36,0.1)', border: 'rgba(251,191,36,0.5)', glow: '0 0 30px rgba(251,191,36,0.3)' };
    default: return { text: 'var(--text-secondary)', bg: 'var(--surface-2)', border: 'var(--border-2)', glow: 'none' };
  }
};
