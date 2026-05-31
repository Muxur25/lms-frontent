import { useState, useEffect, useRef } from 'react';
import { Video, Calendar, Users, PlayCircle, Clock, Plus, X, Upload, Link2, Image, Pencil, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { webinarsApi } from '@/api/webinars.api';
import type { Webinar } from '@/api/webinars.api';
import { useAuthStore } from '@/store/auth.store';
import { useSocket } from '@/hooks/useSocket';
import { apiClient } from '@/api/axios';
import toast from 'react-hot-toast';
import { customConfirm } from '@/shared/lib/toast-utils';

const MOCK: Webinar[] = [
  { id: 'm1', title: 'Ochiq konlarni qazishda xavfsizlik', titleRu: 'Безопасность при открытой добыче', speaker: 'Alisher Rahimov', scheduledAt: new Date(Date.now() + 86400000).toISOString(), durationMinutes: 90, meetingLink: '#', imageUrl: 'https://images.unsplash.com/photo-1542621334-a254cf47733d?auto=format&fit=crop&q=80&w=800', joinCount: 120 },
  { id: 'm2', title: "Yangi uskunalar bilan ishlash bo'yicha brifing", titleRu: 'Брифинг по работе с новым оборудованием', speaker: 'Rustam Karimov', scheduledAt: new Date(Date.now() + 3 * 86400000).toISOString(), durationMinutes: 45, meetingLink: '#', imageUrl: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=800', joinCount: 85 },
  { id: 'm3', title: 'Korporativ etika va menejment', titleRu: 'Корпоративная этика и менеджмент', speaker: "Nodira To'rayeva", scheduledAt: new Date(Date.now() + 5 * 86400000).toISOString(), durationMinutes: 60, meetingLink: '#', imageUrl: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80&w=800', joinCount: 250 },
];

function formatDate(iso: string | Date) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return String(iso).slice(0, 16).replace('T', ' ');
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  const time = d.toLocaleTimeString('uz', { hour: '2-digit', minute: '2-digit' });
  return `${dd}.${mm}.${yyyy}, ${time}`;
}

function formatDuration(min?: number) {
  if (!min) return '';
  if (min < 60) return `${min} daq`;
  const h = Math.floor(min / 60), m = min % 60;
  return m ? `${h} soat ${m} daq` : `${h} soat`;
}

const EMPTY_FORM = { title: '', titleRu: '', speaker: '', scheduledAt: '', durationMinutes: 60, meetingLink: '', imageUrl: '' };

export default function Webinars() {
  const [webinars, setWebinars] = useState<Webinar[]>([]);
  const [, setUseMock] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [, setJoined] = useState<Set<string>>(new Set());
  const [registered, setRegistered] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem('webinar_registered') || '[]')); } catch { return new Set(); }
  });
  const { user } = useAuthStore();
  const { i18n } = useTranslation();
  const isRu = i18n.language === 'ru';
  const socket = useSocket();

  const isAdmin = user?.role && ['super_admin', 'admin', 'hr_manager', 'trainer'].includes(user.role);
  const [editingWebinar, setEditingWebinar] = useState<Webinar | null>(null);

  const canManage = (w: Webinar, status: string) => {
    if (!user) return false;
    if (user.role === 'super_admin') return true;
    if (status === 'starting' || status === 'live') return false;
    if (user.role === 'admin') return true;
    return (w as any).createdBy === user.id;
  };

  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(t);
  }, []);

  // Socket.io real-time events
  useEffect(() => {
    if (!socket) return;
    socket.on('webinar.joinCount', ({ id, joinCount }: { id: string; joinCount: number }) => {
      setWebinars(prev => prev.map(w => w.id === id ? { ...w, joinCount } : w));
    });
    socket.on('webinar.status', ({ status }: { id: string; status: string }) => {
      if (status === 'live') setNow(Date.now());
    });
    socket.on('webinar.ended', ({ id }: { id: string }) => {
      setWebinars(prev => prev.filter(w => w.id !== id));
    });
    return () => {
      socket.off('webinar.joinCount');
      socket.off('webinar.status');
      socket.off('webinar.ended');
    };
  }, [socket]);

  // status helper
  const getStatus = (w: Webinar) => {
    const start = new Date(w.scheduledAt).getTime();
    const end = start + 15 * 60000; // 15 min after start
    if (now > end) return 'ended';
    if (now >= start) return 'live';
    if (now >= start - 5 * 60000) return 'starting'; // 5 min before
    return 'upcoming';
  };

  // sort: registered first → live → upcoming → ended
  const sortedWebinars = [...webinars]
    .filter(w => getStatus(w) !== 'ended')
    .sort((a, b) => {
      const aReg = registered.has(a.id) ? 0 : 1;
      const bReg = registered.has(b.id) ? 0 : 1;
      if (aReg !== bReg) return aReg - bReg;
      const aLive = getStatus(a) === 'live' ? 0 : 1;
      const bLive = getStatus(b) === 'live' ? 0 : 1;
      if (aLive !== bLive) return aLive - bLive;
      return new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime();
    });

  useEffect(() => {
    webinarsApi.getAll()
      .then((res: any) => {
        const data = Array.isArray(res) ? res : (res?.data ?? res);
        if (Array.isArray(data) && data.length) setWebinars(data);
        else { setWebinars(MOCK); setUseMock(true); }
      })
      .catch(() => { setWebinars(MOCK); setUseMock(true); });
  }, []);

  const handleRegister = async (w: Webinar) => {
    const next = new Set(registered).add(w.id);
    setRegistered(next);
    localStorage.setItem('webinar_registered', JSON.stringify([...next]));
    try {
      const updated = await webinarsApi.join(w.id);
      setWebinars(prev => prev.map(x => x.id === w.id ? { ...x, joinCount: updated.joinCount } : x));
    } catch {
      setWebinars(prev => prev.map(x => x.id === w.id ? { ...x, joinCount: x.joinCount + 1 } : x));
    }
  };

  const handleJoin = (w: Webinar) => {
    window.open(w.meetingLink, '_blank');
    setJoined(prev => new Set(prev).add(w.id));
  };

  const handleDelete = (w: Webinar) => {
    customConfirm(`"${isRu ? (w.titleRu || w.title) : (w.title || w.titleRu)}" vebinarini o'chirish?`, async () => {
      await webinarsApi.delete(w.id);
      setWebinars(prev => prev.filter(x => x.id !== w.id));
      toast.success('Vebinar o\'chirildi', { position: 'bottom-right' });
    });
  };

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWebinar) return;
    setSaving(true);
    const payload = {
      title: form.title || form.titleRu,
      titleRu: form.titleRu || form.title,
      speaker: form.speaker,
      durationMinutes: Number(form.durationMinutes),
      scheduledAt: new Date(form.scheduledAt).toISOString(),
      meetingLink: form.meetingLink,
      imageUrl: form.imageUrl,
    };
    try {
      await webinarsApi.update(editingWebinar.id, payload);
      setWebinars(prev => prev.map(x => x.id === editingWebinar.id ? { ...x, ...payload } : x));
      setEditingWebinar(null);
      setShowModal(false);
      setForm(EMPTY_FORM);
      toast.success('Vebinar yangilandi', { position: 'bottom-right' });
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imgTab, setImgTab] = useState<'url' | 'upload'>('url');
  const [uploading, setUploading] = useState(false);
  const [imgPreview, setImgPreview] = useState('');

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('visibility', 'public');
      const res = await apiClient.post('/uploads/file', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      const payload = res.data?.data ?? res.data;
      const url = payload?.url || `${apiClient.defaults.baseURL}/uploads/download/${payload?.id}`;
      setForm(p => ({ ...p, imageUrl: url }));
      setImgPreview(URL.createObjectURL(file));
    } catch (e) {
      console.error('Upload error:', e);
    } finally {
      setUploading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title && !form.titleRu) return;
    setSaving(true);
    try {
      const created = await webinarsApi.create({
        ...form,
        title: form.title || form.titleRu,
        titleRu: form.titleRu || form.title,
        durationMinutes: Number(form.durationMinutes),
        scheduledAt: new Date(form.scheduledAt).toISOString(),
      });
      setWebinars(prev => {
        const filtered = prev.filter(w => !w.id.startsWith('m')); // mock larni olib tashlash
        return [...filtered, created];
      });
      setUseMock(false);
      setShowModal(false);
      setImgPreview('');
      setForm(EMPTY_FORM);
      toast.success('Vebinar yaratildi! 🎉', { position: 'bottom-right' });
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fade-in">
      {/* Premium Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ width: '100%', maxWidth: 560, background: 'var(--bg-2)', border: '1px solid var(--border-2)', borderRadius: 24, overflow: 'hidden', boxShadow: '0 32px 80px rgba(0,0,0,0.5)' }}>
            {/* Header */}
            <div style={{ padding: '24px 28px 20px', borderBottom: '1px solid var(--border-1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'linear-gradient(135deg,rgba(59,130,246,0.08),rgba(139,92,246,0.05))' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(59,130,246,0.3)' }}>
                  <Video size={18} color="#fff" />
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--text-primary)' }}>{editingWebinar ? 'Vebinarni tahrirlash' : 'Yangi vebinar'}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{editingWebinar ? 'Ma\'lumotlarni yangilash' : 'Jonli efir rejalashtirish'}</div>
                </div>
              </div>
              <button onClick={() => { setShowModal(false); setImgPreview(''); setForm(EMPTY_FORM); }} style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--surface-1)', border: '1px solid var(--border-1)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <form onSubmit={editingWebinar ? handleEditSave : handleCreate}>
              <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 18, maxHeight: '70vh', overflowY: 'auto' }}>

                {/* Title */}
                <div className="form-grid-2">
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 6 }}>Nomi (UZ)</label>
                    <input className="input" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Vebinar nomi" style={{ width: '100%' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 6 }}>Nomi (RU)</label>
                    <input className="input" value={form.titleRu} onChange={e => setForm(p => ({ ...p, titleRu: e.target.value }))} placeholder="Название" style={{ width: '100%' }} />
                  </div>
                </div>

                {/* Speaker */}
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 6 }}>Spiker</label>
                  <input className="input" value={form.speaker} onChange={e => setForm(p => ({ ...p, speaker: e.target.value }))} placeholder="F.I.O." style={{ width: '100%' }} />
                </div>

                {/* Date + Duration */}
                <div className="form-grid-2-140">
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 6 }}>Vaqti *</label>
                    <input className="input" type="datetime-local" required value={form.scheduledAt} onChange={e => setForm(p => ({ ...p, scheduledAt: e.target.value }))} style={{ width: '100%' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 6 }}>Davomiylik (daq)</label>
                    <input className="input" type="number" min={1} value={form.durationMinutes} onChange={e => setForm(p => ({ ...p, durationMinutes: Number(e.target.value) }))} style={{ width: '100%' }} />
                  </div>
                </div>

                {/* Meeting link */}
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 6 }}>Meeting link *</label>
                  <div style={{ position: 'relative' }}>
                    <Link2 size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input className="input" required value={form.meetingLink} onChange={e => setForm(p => ({ ...p, meetingLink: e.target.value }))} placeholder="https://meet.google.com/ yoki zoom.us/j/..." style={{ width: '100%', paddingLeft: 36 }} />
                  </div>
                </div>

                {/* Image */}
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: 8 }}>Muqova rasmi</label>
                  {/* Tabs */}
                  <div style={{ display: 'flex', gap: 4, marginBottom: 10, background: 'var(--surface-1)', borderRadius: 10, padding: 4 }}>
                    {(['url', 'upload'] as const).map(tab => (
                      <button key={tab} type="button" onClick={() => setImgTab(tab)}
                        style={{ flex: 1, padding: '6px 0', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, transition: 'all 0.2s',
                          background: imgTab === tab ? 'var(--surface-3)' : 'transparent',
                          color: imgTab === tab ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                        {tab === 'url' ? <><Link2 size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />URL</> : <><Upload size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />Yuklash</>}
                      </button>
                    ))}
                  </div>

                  {imgTab === 'url' ? (
                    <input className="input" value={form.imageUrl} onChange={e => { setForm(p => ({ ...p, imageUrl: e.target.value })); setImgPreview(e.target.value); }} placeholder="https://..." style={{ width: '100%' }} />
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={e => e.preventDefault()}
                      onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFileUpload(f); }}
                      style={{ border: '2px dashed var(--border-2)', borderRadius: 12, padding: '20px', textAlign: 'center', cursor: 'pointer', transition: 'border-color 0.2s', background: 'var(--surface-1)' }}
                    >
                      {uploading ? (
                        <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Yuklanmoqda...</div>
                      ) : (
                        <>
                          <Image size={24} color="var(--text-muted)" style={{ marginBottom: 8 }} />
                          <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600 }}>Rasm tanlash yoki bu yerga tashlang</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>PNG, JPG, WEBP</div>
                        </>
                      )}
                    </div>
                  )}
                  <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); }} />

                  {/* Preview */}
                  {(imgPreview || form.imageUrl) && (
                    <div style={{ marginTop: 10, borderRadius: 10, overflow: 'hidden', height: 100, position: 'relative' }}>
                      <img src={imgPreview || form.imageUrl} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={() => setImgPreview('')} />
                      <button type="button" onClick={() => { setForm(p => ({ ...p, imageUrl: '' })); setImgPreview(''); }}
                        style={{ position: 'absolute', top: 6, right: 6, width: 24, height: 24, borderRadius: 6, background: 'rgba(0,0,0,0.6)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                        <X size={12} />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div style={{ padding: '16px 28px', borderTop: '1px solid var(--border-1)', display: 'flex', gap: 10 }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center', background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', boxShadow: '0 8px 20px rgba(59,130,246,0.25)' }} disabled={saving || uploading}>
                  {saving ? 'Saqlanmoqda...' : editingWebinar ? <><Pencil size={15} /> Saqlash</> : <><Plus size={15} /> Vebinar yaratish</>}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => { setShowModal(false); setEditingWebinar(null); setImgPreview(''); setForm(EMPTY_FORM); }}>Bekor</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="page-header" style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Video color="var(--blue-400)" size={24} />
            Jonli Vebinarlar
          </h1>
          <p className="page-sub" style={{ marginTop: 6 }}>Mutaxassislar bilan jonli darslar va brifinglar</p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={16} /> Yangi vebinar yaratish
          </button>
        )}
      </div>

      <div className="grid grid-3">
        {sortedWebinars.map(w => {
          const status = getStatus(w);
          const isLive = status === 'live';
          const isStarting = status === 'starting';
          const isReg = registered.has(w.id);
          return (
          <div key={w.id} className="course-card">
            <div className="course-thumb" style={{ height: 160, position: 'relative', overflow: 'hidden' }}>
              {w.imageUrl
                ? <img src={w.imageUrl} alt={w.title} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }} />
                : <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg,#1e3a8a,#3b82f6)' }} />
              }
              <div style={{ position: 'absolute', top: 12, left: 12, background: isLive ? 'rgba(239,68,68,0.9)' : isStarting ? 'rgba(245,158,11,0.9)' : 'rgba(59,130,246,0.85)', color: '#fff', fontSize: 10, fontWeight: 800, padding: '4px 8px', borderRadius: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                {isLive ? <><span style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff', display: 'inline-block', animation: 'pulse 1.5s infinite' }} />JONLI</> : isStarting ? '5 DAQIQADA' : 'REJALASHTIRILGAN'}
              </div>
              {isReg && !isLive && <div style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(34,197,94,0.9)', color: '#fff', fontSize: 10, fontWeight: 800, padding: '4px 8px', borderRadius: 4 }}>YOZILGAN</div>}
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, var(--bg-2), transparent)' }} />
            </div>
            <div className="course-body" style={{ padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
                <h3 className="course-title" style={{ fontSize: 16, margin: 0 }}>{isRu ? (w.titleRu || w.title) : (w.title || w.titleRu)}</h3>
                {canManage(w, status) && (
                  <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                    <button className="btn btn-ghost btn-sm" style={{ padding: '4px 8px', borderRadius: 8 }} onClick={() => {
                      setEditingWebinar(w);
                      const dt = new Date(w.scheduledAt);
                      const local = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
                      setForm({ title: w.title || '', titleRu: w.titleRu || '', speaker: w.speaker || '', scheduledAt: local, durationMinutes: w.durationMinutes ?? 60, meetingLink: w.meetingLink, imageUrl: w.imageUrl || '' });
                      setImgPreview(w.imageUrl || '');
                      setShowModal(true);
                    }}>
                      <Pencil size={13} />
                    </button>
                    <button className="btn btn-ghost btn-sm" style={{ padding: '4px 8px', borderRadius: 8, color: 'var(--red-400)' }} onClick={() => handleDelete(w)}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                )}
              </div>
              {w.speaker && <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>{w.speaker}</p>}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-tertiary)' }}>
                  <Calendar size={14} /> {formatDate(w.scheduledAt)}
                </div>
                {w.durationMinutes && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-tertiary)' }}>
                    <Clock size={14} /> {formatDuration(w.durationMinutes)}
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-tertiary)' }}>
                  <Users size={14} /> {w.joinCount} ishtirokchilar
                </div>
              </div>

              {isLive || isStarting ? (
                <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', background: isLive ? 'linear-gradient(135deg,#ef4444,#dc2626)' : 'linear-gradient(135deg,#f59e0b,#d97706)' }} onClick={() => handleJoin(w)}>
                  <PlayCircle size={16} /> {isLive ? "Qo'shilish" : "Qo'shilish (tez boshlanadi)"}
                </button>
              ) : isReg ? (
                <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center', color: 'var(--green-400)', borderColor: 'var(--green-500)' }} disabled>
                  ✓ Yozilgansiz
                </button>
              ) : (
                <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center', color: 'var(--blue-400)', borderColor: 'var(--blue-500)' }} onClick={() => handleRegister(w)}>
                  <Users size={16} /> Yozilish
                </button>
              )}
            </div>
          </div>
          );
        })}
      </div>
    </div>
  );
}
