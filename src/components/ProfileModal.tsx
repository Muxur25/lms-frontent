import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  X, Camera, User, Mail, Building2, BadgeCheck, IdCard, CheckCircle2, ShieldCheck, LockKeyhole
} from 'lucide-react';
import { useAuthStore } from '../store/auth.store';
import { api } from '../services/api';
import { getInitials } from '../shared/lib/auth-user';

export default function ProfileModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const { user, updateUser } = useAuthStore();
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [position, setPosition] = useState('');
  const [department, setDepartment] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (user && isOpen) {
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
      setEmail(user.email || '');
      setPosition(user.position || '');
      setDepartment(user.departmentName || user.department || '');
      
      // Fetch latest user data to ensure we have employeeId
      api.get('/users/me').then(res => {
        const payload: any = res;
        const data = payload.data?.user || payload.user || payload.data;
        if (data) updateUser(data);
      }).catch(() => {});
    }
  }, [user?.id, isOpen]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await api.patch('/users/me', {
        firstName,
        lastName,
        email,
        position,
        department
      });
      const payload: any = res;
      const updatedData = payload.user || payload.data?.user || payload.data;
      updateUser({
        firstName: updatedData.firstName || firstName,
        lastName: updatedData.lastName || lastName,
        email: updatedData.email || email,
        fullName: updatedData.fullName || `${firstName} ${lastName}`.trim(),
        position: updatedData.position || position,
        department: updatedData.department || department,
      });
      showToast(t('settings.profileSuccess'), 'success');
      setTimeout(onClose, 1500);
    } catch (err: any) {
      showToast(err?.response?.data?.message || err?.message || 'Xatolik yuz berdi', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('visibility', 'public');
    formData.append('folder', 'avatars');

    setIsUploading(true);
    try {
      // 1. Upload file
      const uploadRes = await api.post('/uploads/file', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const fileUrl = uploadRes.data?.url || uploadRes.data?.path || (uploadRes as any).url;

      if (!fileUrl) throw new Error('Fayl manzili olinmadi');

      // 2. Update user profile
      await api.patch('/users/me', { avatarName: fileUrl });
      
      updateUser({ avatarName: fileUrl } as any);
      showToast(t('settings.profileSuccess') || 'Rasm yangilandi', 'success');
    } catch (err: any) {
      showToast(err?.response?.data?.message || err?.message || 'Rasm yuklashda xatolik', 'error');
    } finally {
      setIsUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  const initials = getInitials(user?.firstName, user?.lastName, user?.fullName);
  const fallbackRole = user?.roleLabel || user?.roles?.[0] || 'User';
  let roleLabel = fallbackRole;
  if (user?.role) {
    const translation = t(`userRoles.${user.role}`);
    roleLabel = translation !== `userRoles.${user.role}` ? translation : fallbackRole;
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="pm-overlay" onClick={onClose}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="pm-modal"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Toast Feedback */}
            <AnimatePresence>
              {toast && (
                <motion.div 
                  initial={{ opacity: 0, y: -20 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  exit={{ opacity: 0, y: -20 }}
                  className={`pm-toast ${toast.type}`}
                >
                  {toast.type === 'success' && <CheckCircle2 size={16} />}
                  <span>{toast.message}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="pm-header">
              <h2>{t('profile.modalTitle') || 'Profil ma\'lumotlari'}</h2>
              <button className="pm-close" onClick={onClose}><X size={20} /></button>
            </div>

            <div className="pm-body">
              {/* Left Column: Avatar & Read-only info */}
              <div className="pm-sidebar">
                  <div className="pm-avatar-wrap">
                  <div className="pm-avatar" style={{ overflow: 'hidden' }}>
                    {((user as any)?.avatarName) ? (
                      <img src={(user as any).avatarName} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      initials
                    )}
                    <button 
                      className="pm-avatar-edit" 
                      type="button" 
                      onClick={() => document.getElementById('avatar-upload')?.click()}
                      disabled={isUploading}
                    >
                      {isUploading ? <div className="spinner" style={{width: 16, height: 16}} /> : <Camera size={20} />}
                    </button>
                    <input 
                      type="file" 
                      id="avatar-upload" 
                      style={{ display: 'none' }} 
                      accept="image/*" 
                      onChange={handleFileUpload}
                    />
                  </div>
                  <h3>{user?.fullName || `${firstName} ${lastName}`.trim()}</h3>
                  <div className="pm-badge">{roleLabel}</div>
                </div>

                <div className="pm-readonly-group">
                  <div className="pm-readonly-item">
                    <ShieldCheck size={18} className="pm-icon-blue" />
                    <div className="pm-ro-content">
                      <label>{t('profile.userRole') || 'Foydalanuvchi roli'}</label>
                      <span>{roleLabel} <LockKeyhole size={12} className="pm-lock" /></span>
                    </div>
                  </div>
                  <div className="pm-readonly-item">
                    <IdCard size={18} className="pm-icon-purple" />
                    <div className="pm-ro-content">
                      <label>{t('profile.employeeId') || 'Tabel raqami'}</label>
                      <span>{user?.employeeId || user?.id?.slice(0, 8).toUpperCase() || 'AGMK-1234'} <LockKeyhole size={12} className="pm-lock" /></span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Edit Form */}
              <div className="pm-form-area">
                <form onSubmit={handleSubmit}>
                  <div className="pm-grid-2">
                    <div className="pm-input-group">
                      <label><User size={14} /> {t('settings.firstName')}</label>
                      <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} required />
                    </div>
                    <div className="pm-input-group">
                      <label><User size={14} /> {t('settings.lastName')}</label>
                      <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} required />
                    </div>
                  </div>

                  <div className="pm-input-group">
                    <label><Mail size={14} /> {t('settings.email')}</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} />
                  </div>

                  <div className="pm-grid-2">
                    <div className="pm-input-group">
                      <label><Building2 size={14} /> {t('settings.department')}</label>
                      <input type="text" value={department} onChange={e => setDepartment(e.target.value)} required />
                    </div>
                    <div className="pm-input-group">
                      <label><BadgeCheck size={14} /> {t('settings.position')}</label>
                      <input type="text" value={position} onChange={e => setPosition(e.target.value)} required />
                    </div>
                  </div>

                  <div className="pm-actions">
                    <button type="button" className="btn btn-ghost" onClick={onClose}>{t('settings.cancel')}</button>
                    <button type="submit" className="btn btn-primary" disabled={isSaving}>
                      {isSaving ? t('settings.saving') || 'Saqlanmoqda...' : t('settings.save')}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
