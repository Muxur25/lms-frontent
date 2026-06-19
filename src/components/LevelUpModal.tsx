import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Star, X } from 'lucide-react';
import confetti from 'canvas-confetti';
import { io } from 'socket.io-client';
import { SOCKET_IO_PATH, getRealtimeUrl } from '@/shared/lib/api-config';
import { useAuthStore } from '@/store/auth.store';

export const LevelUpModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [levelData, setLevelData] = useState<{ newLevel: number; newTitle: string; xp: number } | null>(null);
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    const socket = io(getRealtimeUrl(), {
      auth: { token },
      path: SOCKET_IO_PATH,
      withCredentials: true,
      transports: ['websocket', 'polling']
    });

    socket.on('level_up', (payload) => {
      setLevelData(payload);
      setIsOpen(true);
      
      // Update local store immediately
      updateUser({ level: payload.newLevel, title: payload.newTitle, xp: payload.xp });

      // Trigger premium confetti
      const duration = 3000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 10000 };

      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      const interval: any = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
        confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
      }, 250);
    });

    return () => {
      socket.disconnect();
    };
  }, [updateUser]);

  if (!isOpen || !levelData) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <motion.div
            initial={{ scale: 0.5, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 50 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            style={{
              background: 'linear-gradient(145deg, #1e1e1e 0%, #121212 100%)',
              border: '1px solid rgba(251, 191, 36, 0.3)',
              borderRadius: 24,
              padding: '40px 32px',
              maxWidth: 420,
              width: '90%',
              textAlign: 'center',
              boxShadow: '0 25px 50px -12px rgba(251, 191, 36, 0.25)',
              position: 'relative'
            }}
          >
            <button 
              onClick={() => setIsOpen(false)}
              style={{
                position: 'absolute', top: 16, right: 16,
                background: 'transparent', border: 'none',
                color: 'var(--text-muted)', cursor: 'pointer',
                padding: 8
              }}
            >
              <X size={20} />
            </button>

            <motion.div
              initial={{ rotate: -180, scale: 0 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              style={{
                width: 96, height: 96,
                margin: '0 auto 24px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 40px rgba(245, 158, 11, 0.4)'
              }}
            >
              <Trophy size={48} color="white" />
            </motion.div>

            <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8, background: 'linear-gradient(to right, #fbbf24, #f59e0b)', WebkitBackgroundClip: 'text', color: 'transparent' }}>
              Level Up!
            </h2>
            
            <p style={{ fontSize: 16, color: 'var(--text-secondary)', marginBottom: 24 }}>
              Congratulations {user?.firstName}, you've reached a new milestone.
            </p>

            <div style={{
              background: 'rgba(0,0,0,0.3)',
              borderRadius: 16, padding: 20,
              border: '1px solid rgba(255,255,255,0.05)',
              marginBottom: 32
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 12 }}>
                <Star size={24} color="#fbbf24" fill="#fbbf24" />
                <span style={{ fontSize: 32, fontWeight: 800, color: '#fff' }}>Level {levelData.newLevel}</span>
              </div>
              <div style={{ fontSize: 14, color: '#fbbf24', textTransform: 'uppercase', letterSpacing: 2, fontWeight: 600 }}>
                {levelData.newTitle}
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              style={{
                width: '100%',
                padding: '16px',
                borderRadius: 12,
                background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                color: '#000',
                fontWeight: 700,
                fontSize: 16,
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(245, 158, 11, 0.4)'
              }}
            >
              Continue Learning
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
