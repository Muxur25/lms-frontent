import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, User, Briefcase, Mail, Hash, Shield, Key, Building } from 'lucide-react';
import clsx from 'clsx';
import { apiClient } from '@/api/axios';
import toast from 'react-hot-toast';

const ROLE_OPTIONS = ['employee', 'trainer', 'department_manager', 'hr_manager', 'executive', 'admin', 'super_admin'];

export function roleLabel(role: string, trFn?: any): string {
  const getLabel = () => {
    switch (role) {
      case 'super_admin': return 'Super Admin';
      case 'admin': return 'Admin';
      case 'hr_manager': return 'HR Menejeri';
      case 'executive': return 'Boshqaruvchi';
      case 'department_manager': return 'Bo‘lim boshlig‘i';
      case 'trainer': return 'O‘qituvchi (Trainer)';
      case 'employee': return 'Xodim (Employee)';
      default: return role;
    }
  };
  if (trFn) {
    return trFn(`common.roles.${role}`, getLabel());
  }
  return getLabel();
}

export default function AdminUserModal({
  isOpen,
  onClose,
  onSave,
  user,
  tr,
  departments,
  currentUser
}: any) {
  const _tr = (k: string, d: string) => {
    const r = tr(k, { defaultValue: d });
    return r === k ? d : r;
  };

  const isEditing = !!user;
  const [activeTab, setActiveTab] = useState<'info' | 'security'>('info');
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    username: '',
    fullName: '',
    email: '',
    employeeId: '',
    jshshir: '',
    departmentName: '',
    position: '',
    role: 'employee',
    isActive: true,
    password: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (isOpen) {
      if (user) {
        setFormData({
          username: user.username || '',
          fullName: user.fullName || '',
          email: user.email || '',
          employeeId: user.employeeId || '',
          jshshir: user.jshshir || '',
          departmentName: user.departmentName || user.dept || '',
          position: user.position || '',
          role: user.role || 'employee',
          isActive: user.isActive !== false,
          password: '',
          confirmPassword: ''
        });
        setActiveTab('info');
      } else {
        setFormData({
          username: '',
          fullName: '',
          email: '',
          employeeId: '',
          jshshir: '',
          departmentName: '',
          position: '',
          role: 'employee',
          isActive: true,
          password: '',
          confirmPassword: ''
        });
        setActiveTab('info');
      }
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSaveInfo = async () => {
    if (!formData.username || !formData.fullName) {
      toast.error(_tr('admin.users.modal.reqFields', 'Foydalanuvchi nomi (username) va To‘liq ismni kiriting'));
      return;
    }
    if (!isEditing && (!formData.password || formData.password !== formData.confirmPassword)) {
      toast.error(_tr('admin.users.modal.passMismatch', 'Parollar mos emas yoki kiritilmagan'));
      return;
    }

    try {
      setSaving(true);
      if (isEditing) {
        await apiClient.patch(`/users/${user.id}`, {
          username: formData.username,
          fullName: formData.fullName,
          email: formData.email,
          employeeId: formData.employeeId,
          jshshir: formData.jshshir,
          departmentName: formData.departmentName,
          position: formData.position,
          role: formData.role,
          isActive: formData.isActive
        });

        if (formData.password) {
          if (formData.password !== formData.confirmPassword) {
            toast.error(_tr('admin.users.modal.passMismatch', 'Parollar mos emas'));
            setSaving(false);
            return;
          }
          await apiClient.patch(`/users/${user.id}/reset-password`, { newPassword: formData.password });
        }

        toast.success(_tr('admin.users.modal.updated', 'Foydalanuvchi yangilandi'));
      } else {
        await apiClient.post('/users', {
          username: formData.username,
          password: formData.password,
          fullName: formData.fullName,
          email: formData.email,
          employeeId: formData.employeeId,
          jshshir: formData.jshshir,
          departmentName: formData.departmentName,
          position: formData.position,
          role: formData.role,
          isActive: formData.isActive
        });
        toast.success(_tr('admin.users.modal.created', 'Yangi foydalanuvchi yaratildi'));
      }
      onSave();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Xatolik yuz berdi');
    } finally {
      setSaving(false);
    }
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div className="card modal-animate" style={{ width: '100%', maxWidth: 600, padding: 0 }}>
        <div className="modal-header" style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-1)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              {isEditing
                ? _tr('admin.users.modal.editTitle', 'Foydalanuvchini tahrirlash')
                : _tr('admin.users.modal.addTitle', 'Yangi foydalanuvchi')}
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-tertiary)' }}>
              {isEditing
                ? _tr('admin.users.modal.editDesc', 'Ma’lumotlarni yoki rolni yangilang')
                : _tr('admin.users.modal.addDesc', 'Yangi xodimni tizimga qo‘shish')}
            </p>
          </div>
          <button className="btn btn-ghost btn-sm btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-1)', padding: '0 24px' }}>
          <button
            className={clsx('admin-tab-btn', activeTab === 'info' && 'active')}
            onClick={() => setActiveTab('info')}
          >
            {_tr('admin.users.modal.tabs.info', 'Ma\'lumotlar')}
          </button>
          <button
            className={clsx('admin-tab-btn', activeTab === 'security' && 'active')}
            onClick={() => setActiveTab('security')}
          >
            {_tr('admin.users.modal.tabs.security', 'Xavfsizlik & Parol')}
          </button>
        </div>

        <div style={{ padding: 24, maxHeight: '60vh', overflowY: 'auto' }}>
          {activeTab === 'info' && (
            <div className="grid grid-2" style={{ gap: 20 }}>
              <div className="input-group" style={{ gridColumn: 'span 2' }}>
                <label className="input-label" style={{ display: 'flex', gap: 6, alignItems: 'center' }}><User size={14} /> {_tr('admin.users.modal.fields.fullName', 'To\'liq ism (F.I.SH) *')}</label>
                <input name="fullName" value={formData.fullName} onChange={handleChange} className="input" placeholder="Toshmatov Eshmat" />
              </div>

              <div className="input-group">
                <label className="input-label" style={{ display: 'flex', gap: 6, alignItems: 'center' }}><User size={14} /> {_tr('admin.users.modal.fields.username', 'Username *')}</label>
                <input name="username" value={formData.username} onChange={handleChange} className="input" placeholder="eshmat" />
              </div>

              <div className="input-group">
                <label className="input-label" style={{ display: 'flex', gap: 6, alignItems: 'center' }}><Mail size={14} /> {_tr('admin.users.modal.fields.email', 'Email')}</label>
                <input name="email" type="email" value={formData.email} onChange={handleChange} className="input" placeholder="email@agmk.uz" />
              </div>

              <div className="input-group">
                <label className="input-label" style={{ display: 'flex', gap: 6, alignItems: 'center' }}><Building size={14} /> {_tr('admin.users.modal.fields.department', 'Bo\'lim (Department)')}</label>
                <input name="departmentName" value={formData.departmentName} onChange={handleChange} className="input" placeholder="Bo'lim nomini yozing..." list="modal-depts" />
                <datalist id="modal-depts">
                  {departments?.map((d: string) => <option key={d} value={d} />)}
                </datalist>
              </div>

              <div className="input-group">
                <label className="input-label" style={{ display: 'flex', gap: 6, alignItems: 'center' }}><Briefcase size={14} /> {_tr('admin.users.modal.fields.position', 'Lavozim')}</label>
                <input name="position" value={formData.position} onChange={handleChange} className="input" placeholder="Inzhener" />
              </div>

              <div className="input-group">
                <label className="input-label" style={{ display: 'flex', gap: 6, alignItems: 'center' }}><Hash size={14} /> {_tr('admin.users.modal.fields.employeeId', 'Tabel raqami')}</label>
                <input name="employeeId" value={formData.employeeId} onChange={handleChange} className="input" placeholder="Tabel №" />
              </div>

              <div className="input-group">
                <label className="input-label" style={{ display: 'flex', gap: 6, alignItems: 'center' }}><Hash size={14} /> {_tr('admin.users.modal.fields.jshshir', 'JSHSHIR (PINFL)')}</label>
                <input name="jshshir" value={formData.jshshir} onChange={handleChange} className="input" placeholder="14 xonali raqam" maxLength={14} />
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div className="input-group">
                <label className="input-label" style={{ display: 'flex', gap: 6, alignItems: 'center' }}><Shield size={14} /> {_tr('admin.users.modal.fields.role', 'Rol va huquq')}</label>
                <select name="role" value={formData.role} onChange={handleChange} className="input">
                  {ROLE_OPTIONS.map((role) => {
                    if (currentUser?.role === 'admin' && (role === 'super_admin' || role === 'admin')) return null;
                    return <option key={role} value={role}>{roleLabel(role, _tr)}</option>;
                  })}
                </select>
                <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4 }}>
                  {_tr('admin.users.modal.roleHint', 'Tizimda foydalanuvchi qanday amallarni bajara olishini belgilaydi.')}
                </p>
              </div>

              <div className="input-group" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <input
                  type="checkbox"
                  id="isActiveCheck"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleChange}
                  style={{ width: 16, height: 16 }}
                />
                <label htmlFor="isActiveCheck" style={{ fontSize: 14, fontWeight: 500 }}>
                  {_tr('admin.users.modal.fields.isActive', 'Akkount faol')}
                </label>
              </div>

              <div style={{ padding: '16px', background: 'var(--surface-1)', borderRadius: 12, border: '1px solid var(--border-1)', marginTop: 10 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Key size={16} color="var(--blue-400)" />
                  {isEditing ? _tr('admin.users.modal.fields.updatePassword', 'Parolni yangilash (ixtiyoriy)') : _tr('admin.users.modal.fields.setPassword', 'Parol o\'rnatish *')}
                </h3>
                <div className="grid grid-2" style={{ gap: 16 }}>
                  <div className="input-group">
                    <label className="input-label">{_tr('admin.users.modal.fields.password', 'Parol')}</label>
                    <input name="password" type="password" value={formData.password} onChange={handleChange} className="input" placeholder="***" />
                  </div>
                  <div className="input-group">
                    <label className="input-label">{_tr('admin.users.modal.fields.confirmPassword', 'Parolni takrorlang')}</label>
                    <input name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} className="input" placeholder="***" />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer" style={{ padding: '16px 24px', borderTop: '1px solid var(--border-1)', display: 'flex', justifyContent: 'flex-end', gap: 10, background: 'var(--bg-1)' }}>
          <button className="btn btn-secondary" onClick={onClose} disabled={saving}>{_tr('common.cancel', 'Bekor qilish')}</button>
          <button className="btn btn-primary" onClick={handleSaveInfo} disabled={saving}>
            {saving ? _tr('common.saving', 'Saqlanmoqda...') : _tr('common.save', 'Saqlash')}
          </button>
        </div>

      </div>

      <style>{`
        .admin-tab-btn {
          flex: 1;
          padding: 12px;
          background: transparent;
          border: none;
          border-bottom: 2px solid transparent;
          color: var(--text-secondary);
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .admin-tab-btn:hover {
          color: var(--text-primary);
        }
        .admin-tab-btn.active {
          color: var(--blue-400);
          border-bottom-color: var(--blue-400);
        }
      `}</style>
    </div>,
    document.body
  );
}
