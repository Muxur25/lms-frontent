import { useState } from 'react';
import { Send, Bot, User, Sparkles, StopCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { apiClient } from '@/api/axios';

export default function AiAssistant() {
  const { t } = useTranslation();
  const [messages, setMessages] = useState([
    { id: 1, role: 'ai', text: t('ai.greeting') }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async (e: any) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const currentInput = input;
    const userMsg = { id: Date.now(), role: 'user', text: currentInput };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const response = await apiClient.post('/ai/chat', { prompt: currentInput });
      const aiReply = response.data?.response || t('ai.apiError');
      setMessages(prev => [...prev, { 
        id: Date.now() + 1, 
        role: 'ai', 
        text: aiReply 
      }]);
    } catch (err) {
      console.error('AI chat error:', err);
      setMessages(prev => [...prev, { 
        id: Date.now() + 1, 
        role: 'ai', 
        text: t('ai.error')
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in" style={{ height: 'calc(100vh - var(--topbar-h) - 60px)', display: 'flex', flexDirection: 'column' }}>
      
      <div className="page-header" style={{ flexShrink: 0, marginBottom: 20 }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Sparkles color="var(--violet-400)" size={24} />
            AI {t('ai.title')}
          </h1>
          <p className="page-sub" style={{ marginTop: 6 }}>{t('ai.subtitle')}</p>
        </div>
      </div>

      <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden', position: 'relative' }}>
        {/* Messages Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>
          {messages.map(msg => (
            <div key={msg.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flexDirection: msg.role === 'user' ? 'row-reverse' : 'row' }}>
              <div style={{ 
                width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                background: msg.role === 'user' ? 'var(--blue-600)' : 'linear-gradient(135deg, var(--violet-500), var(--blue-500))',
                boxShadow: msg.role === 'user' ? 'none' : '0 0 20px rgba(139,92,246,0.2)'
              }}>
                {msg.role === 'user' ? <User size={16} color="#fff" /> : <Bot size={16} color="#fff" />}
              </div>
              <div style={{ 
                maxWidth: '80%', padding: 16, fontSize: 14, lineHeight: 1.6,
                background: msg.role === 'user' ? 'var(--surface-2)' : 'var(--ai-msg-bg)',
                border: msg.role === 'user' ? '1px solid var(--border-2)' : '1px solid var(--ai-msg-border)',
                color: 'var(--text-primary)',
                borderRadius: 'var(--radius-xl)',
                borderTopRightRadius: msg.role === 'user' ? 4 : 'var(--radius-xl)',
                borderTopLeftRadius: msg.role === 'user' ? 'var(--radius-xl)' : 4
              }}>
                {msg.text}
              </div>
            </div>
          ))}
          
          {loading && (
            <div className="fade-in" style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <div style={{ 
                width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'linear-gradient(135deg, var(--violet-500), var(--blue-500))',
                boxShadow: '0 0 20px rgba(139,92,246,0.2)'
              }}>
                <Bot size={16} color="#fff" />
              </div>
              <div style={{ 
                background: 'var(--ai-msg-bg)', border: '1px solid var(--ai-msg-border)',
                borderRadius: 'var(--radius-xl)', borderTopLeftRadius: 4, padding: '16px',
                display: 'flex', gap: 6, alignItems: 'center'
              }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--violet-400)', animation: 'bounce 1s infinite' }} />
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--violet-400)', animation: 'bounce 1s infinite 0.2s' }} />
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--violet-400)', animation: 'bounce 1s infinite 0.4s' }} />
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div style={{ padding: 16, borderTop: '1px solid var(--border-1)', background: 'var(--bg-2)' }}>
          <form onSubmit={handleSend} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t('ai.placeholder')}
              style={{ 
                width: '100%', background: 'var(--surface-1)', border: '1px solid var(--border-2)',
                borderRadius: 'var(--radius-xl)', padding: '16px 64px 16px 16px',
                color: 'var(--text-primary)', outline: 'none', fontSize: 14,
                transition: 'all 0.2s'
              }}
              disabled={loading}
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              style={{ 
                position: 'absolute', right: 8, width: 40, height: 40, 
                borderRadius: 'var(--radius-lg)', background: 'var(--violet-600)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', border: 'none', cursor: (!input.trim() || loading) ? 'not-allowed' : 'pointer',
                opacity: (!input.trim() || loading) ? 0.5 : 1, transition: 'all 0.2s'
              }}
            >
              {loading ? <StopCircle size={18} /> : <Send size={18} style={{ marginLeft: 2 }} />}
            </button>
          </form>
          <div style={{ textAlign: 'center', marginTop: 10 }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t('ai.disclaimer')}</span>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); opacity: 0.5; }
          50% { transform: translateY(-4px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
