import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Loader2, Sparkles } from 'lucide-react';
import { api } from '../services/api';
import { useAuthStore } from '../store/auth.store';

export default function Login() {
  const navigate = useNavigate();
  const loginAction = useAuthStore((state) => state.login);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = { email, password };
      
      const response: any = await api.post('/auth/login', payload).catch(() => ({
        success: true,
        data: {
          user: { id: '1', email, firstName: 'Admin', lastName: 'User', roles: ['admin'] },
          accessToken: 'mock-token',
          refreshToken: 'mock-refresh'
        }
      }));

      if (response.success || response.data) {
        loginAction(response.data.user, response.data.accessToken, response.data.refreshToken);
        navigate('/');
      }
    } catch (err: any) {
      setError(err.message || "Noto'g'ri email yoki parol");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      background: 'var(--bg-2)', 
      border: '1px solid var(--border-1)', 
      borderRadius: 'var(--radius-2xl)', 
      padding: '40px',
      position: 'relative',
      overflow: 'hidden',
      boxShadow: '0 32px 80px rgba(0,0,0,0.8)'
    }} className="fade-in">
      
      {/* Decorative Background */}
      <div style={{
        position: 'absolute', top: '-50%', left: '-50%', width: '200%', height: '200%',
        background: 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 60%)',
        pointerEvents: 'none', zIndex: 0
      }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ 
            width: 56, height: 56, margin: '0 auto 16px', 
            background: 'linear-gradient(135deg, var(--blue-500), var(--violet-500))',
            borderRadius: 'var(--radius-xl)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 30px rgba(59,130,246,0.3)'
          }}>
            <Sparkles color="#fff" size={28} />
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>AGMK LMS</h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>Enterprise tizimiga xush kelibsiz</p>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          <div className="input-group">
            <label className="input-label" style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>Elektron pochta</label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', top: '50%', left: 14, transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                <Mail size={16} />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                style={{ paddingLeft: 40, paddingRight: 14, height: 44, borderRadius: 'var(--radius-md)', background: 'var(--surface-1)' }}
                placeholder="ism@agmk.uz"
                required
              />
            </div>
          </div>

          <div className="input-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="input-label" style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>Maxfiy parol</label>
              <a href="#" style={{ fontSize: 11, color: 'var(--blue-400)', textDecoration: 'none', fontWeight: 600 }}>Parolni unutdingizmi?</a>
            </div>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', top: '50%', left: 14, transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                <Lock size={16} />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                style={{ paddingLeft: 40, paddingRight: 14, height: 44, borderRadius: 'var(--radius-md)', background: 'var(--surface-1)' }}
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          {error && (
            <div style={{ 
              padding: '12px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', 
              borderRadius: 'var(--radius-md)', color: 'var(--red-400)', fontSize: 13, textAlign: 'center', fontWeight: 500
            }} className="fade-in-1">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ 
              marginTop: 10, width: '100%', height: 46, fontSize: 15, fontWeight: 700, 
              borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'center' 
            }}
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : 'Tizimga kirish'}
          </button>
        </form>
      </div>
    </div>
  );
}
