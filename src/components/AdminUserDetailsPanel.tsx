import { X, User, Building, Briefcase, Shield, BookOpen, Target, Award, Clock } from 'lucide-react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';
import { roleLabel } from './AdminUserModal';

export default function AdminUserDetailsPanel({
  isOpen,
  onClose,
  user,
  tr,
  onEdit
}: any) {
  const _tr = (k: string, d: string) => {
    const r = tr(k, { defaultValue: d });
    return r === k ? d : r;
  };

  if (!isOpen) return null;
  const safeUser = user || {};

  const initials = (safeUser.name || safeUser.fullName || 'F U')
    .split(' ')
    .filter(Boolean)
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <>
      <div
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999,
          opacity: isOpen ? 1 : 0, pointerEvents: isOpen ? 'auto' : 'none', transition: 'opacity 0.2s'
        }}
        onClick={onClose}
      />
      <div
        style={{
          position: 'fixed', top: 0, right: 0, bottom: 0, width: '100%', maxWidth: 450,
          background: 'var(--bg-1)', zIndex: 10000, boxShadow: '-4px 0 24px rgba(0,0,0,0.1)',
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)', transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          display: 'flex', flexDirection: 'column'
        }}
        className="modal-animate"
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid var(--border-1)' }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>{_tr('admin.users.panel.title', 'Foydalanuvchi profili')}</h2>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-secondary btn-sm" onClick={() => onEdit(safeUser)}>
              <Briefcase size={14} />
              {_tr('common.edit', 'Tahrirlash')}
            </button>
            <button className="btn btn-ghost btn-sm btn-icon" onClick={onClose}><X size={18} /></button>
          </div>
        </div>

        <div style={{ padding: 24, overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Header Info */}
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, color: 'var(--text-secondary)' }}>
              {initials}
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>{safeUser.name || safeUser.fullName}</div>
              <div style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>{safeUser.email || _tr('admin.users.panel.emptyEmail', 'Email kiritilmagan')}</div>
              <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                <span className={clsx('badge', safeUser.isActive ? 'badge-green' : 'badge-gray')}>
                  {safeUser.isActive ? _tr('common.active', 'Faol') : _tr('common.inactive', 'Nofaol')}
                </span>
                <span className="badge badge-blue">{roleLabel(safeUser.role || 'employee')}</span>
              </div>
            </div>
          </div>

          <div style={{ height: 1, background: 'var(--border-1)' }} />

          {/* Details */}
          <div>
            <h3 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-tertiary)', letterSpacing: '0.5px', marginBottom: 12 }}>
              {_tr('admin.users.panel.basicInfo', 'Asosiy ma\'lumotlar')}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <DetailRow icon={Building} label={_tr('admin.users.panel.department', 'Bo\'lim')} value={safeUser.departmentName || safeUser.dept || _tr('admin.users.panel.unknown', 'Noma\'lum')} />
              <DetailRow icon={Briefcase} label={_tr('admin.users.panel.position', 'Lavozim')} value={safeUser.position || safeUser.positionRu || _tr('admin.users.panel.unknown', 'Noma\'lum')} />
              <DetailRow icon={User} label={_tr('admin.users.panel.username', 'Username')} value={safeUser.username || '-'} />
              <DetailRow icon={Shield} label={_tr('admin.users.panel.pinfl', 'JSHSHIR / PINFL')} value={safeUser.jshshir || _tr('admin.users.panel.unknown', 'Kiritilmagan')} />
            </div>
          </div>

          <div style={{ height: 1, background: 'var(--border-1)' }} />

          {/* Stats */}
          <div>
            <h3 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-tertiary)', letterSpacing: '0.5px', marginBottom: 12 }}>
              {_tr('admin.users.panel.stats', 'Ta\'lim ko\'rsatkichlari')}
            </h3>
            <div className="grid grid-2" style={{ gap: 12 }}>
              <div className="stat-card" style={{ padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-tertiary)', marginBottom: 8 }}>
                  <BookOpen size={16} /> <span style={{ fontSize: 12, fontWeight: 600 }}>{_tr('admin.users.panel.courses', 'Kurslar')}</span>
                </div>
                <div style={{ fontSize: 24, fontWeight: 800 }}>{safeUser.courses || 0}</div>
              </div>

              <div className="stat-card" style={{ padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-tertiary)', marginBottom: 8 }}>
                  <Target size={16} /> <span style={{ fontSize: 12, fontWeight: 600 }}>{_tr('admin.users.panel.progress', 'O\'rtacha progress')}</span>
                </div>
                <div style={{ fontSize: 24, fontWeight: 800 }}>{safeUser.progress || 0}%</div>
              </div>

              <div className="stat-card" style={{ padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-tertiary)', marginBottom: 8 }}>
                  <Award size={16} /> <span style={{ fontSize: 12, fontWeight: 600 }}>{_tr('admin.users.panel.level', 'Daraja (XP)')}</span>
                </div>
                <div style={{ fontSize: 24, fontWeight: 800 }}>Lvl {safeUser.level || 1} <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-tertiary)' }}>({safeUser.xp || 0} XP)</span></div>
              </div>

              <div className="stat-card" style={{ padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-tertiary)', marginBottom: 8 }}>
                  <Clock size={16} /> <span style={{ fontSize: 12, fontWeight: 600 }}>{_tr('admin.users.panel.lastLogin', 'So\'nggi kirish')}</span>
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, marginTop: 4, color: 'var(--text-primary)' }}>
                  {safeUser.lastLoginAt ? new Date(safeUser.lastLoginAt).toLocaleDateString('uz') : _tr('admin.users.panel.never', 'Kirmagan')}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </>,
    document.body
  );
}

function DetailRow({ icon: Icon, label, value }: any) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
      <div style={{ marginTop: 2, color: 'var(--text-tertiary)' }}><Icon size={16} /></div>
      <div>
        <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{label}</div>
        <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', marginTop: 2 }}>{value}</div>
      </div>
    </div>
  );
}
