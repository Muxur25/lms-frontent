import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Fingerprint,
  Globe2,
  Laptop,
  LogOut,
  Monitor,
  ShieldAlert,
  Smartphone,
  Tablet,
  X,
} from 'lucide-react';

interface Device {
  sessionId: string;
  deviceId: string;
  browser: string;
  os: string;
  deviceType: string;
  ipAddress?: string;
  lastActivity: string;
}

interface DeviceLimitModalProps {
  isOpen: boolean;
  devices: Device[];
  onDeviceRemoved: (sessionId: string) => void;
  onCancel: () => void;
}

const copy = {
  uz: {
    close: 'Yopish',
    eyebrow: 'Account protection',
    title: "Qurilmalar limiti to'ldi",
    subtitle: "Yangi qurilmadan kirish uchun avval bitta faol sessiyani tugating.",
    rule1: "Har bir hisob uchun 3 ta faol qurilma ruxsat etilgan.",
    rule2: "Chiqarilgan qurilmadagi sessiya darhol bloklanadi.",
    rule3: "Tanlovdan keyin login avtomatik davom etadi.",
    activeDevices: 'Faol qurilmalar',
    deviceType: 'Tur',
    ipAddress: 'IP',
    lastActivity: 'Faollik',
    unknown: "Noma'lum",
    remove: 'Chiqarish',
    removing: 'Kutilmoqda',
    cancel: 'Loginni bekor qilish',
    desktop: 'Kompyuter',
    mobile: 'Telefon',
    tablet: 'Planshet',
  },
  ru: {
    close: 'Закрыть',
    eyebrow: 'Account protection',
    title: 'Достигнут лимит устройств',
    subtitle: 'Чтобы войти с нового устройства, завершите одну активную сессию.',
    rule1: 'Для аккаунта разрешены 3 активных устройства.',
    rule2: 'Отключенная сессия будет заблокирована сразу.',
    rule3: 'После выбора вход продолжится автоматически.',
    activeDevices: 'Активные устройства',
    deviceType: 'Тип',
    ipAddress: 'IP',
    lastActivity: 'Активность',
    unknown: 'Неизвестно',
    remove: 'Отключить',
    removing: 'Ожидание',
    cancel: 'Отменить вход',
    desktop: 'Компьютер',
    mobile: 'Телефон',
    tablet: 'Планшет',
  },
};

export function DeviceLimitModal({ isOpen, devices, onDeviceRemoved, onCancel }: DeviceLimitModalProps) {
  const [loading, setLoading] = React.useState<string | null>(null);
  const { i18n } = useTranslation();
  const lang = i18n.language === 'ru' ? 'ru' : 'uz';
  const text = copy[lang];

  const handleRemove = (sessionId: string) => {
    setLoading(sessionId);
    setTimeout(() => {
      onDeviceRemoved(sessionId);
      setLoading(null);
    }, 450);
  };

  const getDeviceMeta = (type: string) => {
    const normalized = (type || '').toLowerCase();
    if (normalized.includes('mobile')) {
      return { icon: Smartphone, label: text.mobile, color: '#5eead4', accent: 'rgba(20,184,166,.22)' };
    }
    if (normalized.includes('tablet')) {
      return { icon: Tablet, label: text.tablet, color: '#c4b5fd', accent: 'rgba(139,92,246,.22)' };
    }
    return { icon: Monitor, label: text.desktop, color: '#93c5fd', accent: 'rgba(59,130,246,.22)' };
  };

  const formatLastActivity = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return text.unknown;
    return new Intl.DateTimeFormat(lang === 'ru' ? 'ru-RU' : 'uz-UZ', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#020617]/75 backdrop-blur-xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 18 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="relative w-full max-w-5xl overflow-hidden rounded-[28px] border border-white/12 bg-[#0a1020]/95 text-white shadow-[0_40px_120px_rgba(0,0,0,.65)]"
          >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(34,211,238,.16),transparent_34%),radial-gradient(circle_at_92%_12%,rgba(248,113,113,.16),transparent_32%),linear-gradient(135deg,rgba(255,255,255,.055),transparent_38%)]" />
            <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/60 to-transparent" />

            <button
              onClick={onCancel}
              className="absolute right-5 top-5 z-10 grid h-10 w-10 place-items-center rounded-2xl border border-white/10 bg-white/[.06] text-slate-300 transition hover:bg-white/[.12] hover:text-white"
              aria-label={text.close}
            >
              <X size={18} />
            </button>

            <div className="relative grid lg:grid-cols-[340px_1fr]">
              <aside className="border-b border-white/10 p-7 lg:border-b-0 lg:border-r">
                <div className="mb-8 grid h-16 w-16 place-items-center rounded-3xl border border-red-300/20 bg-red-500/10 text-red-300 shadow-[0_0_48px_rgba(239,68,68,.18)]">
                  <ShieldAlert size={32} />
                </div>

                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-[11px] font-black uppercase tracking-[.18em] text-cyan-100">
                  <Fingerprint size={13} />
                  {text.eyebrow}
                </div>
                <h2 className="text-[30px] font-black leading-[1.05] tracking-tight text-white">
                  {text.title}
                </h2>
                <p className="mt-4 text-sm leading-6 text-slate-300">
                  {text.subtitle}
                </p>

                <div className="mt-7 space-y-3">
                  {[text.rule1, text.rule2, text.rule3].map((rule) => (
                    <div key={rule} className="flex gap-3 rounded-2xl border border-white/8 bg-white/[.045] p-3">
                      <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-300" size={16} />
                      <span className="text-xs font-semibold leading-5 text-slate-300">{rule}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={onCancel}
                  className="mt-7 w-full rounded-2xl border border-white/10 bg-white/[.06] px-4 py-3 text-sm font-extrabold text-slate-200 transition hover:bg-white/[.1] hover:text-white"
                >
                  {text.cancel}
                </button>
              </aside>

              <section className="p-5 sm:p-7">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-black text-white">{text.activeDevices}</h3>
                    <p className="mt-1 text-xs font-semibold text-slate-400">Select one device to revoke</p>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[.06] px-3 py-2">
                    <AlertTriangle size={15} className="text-amber-300" />
                    <span className="text-xs font-black text-slate-200">{devices.length}/3</span>
                  </div>
                </div>

                <div className="grid max-h-[560px] gap-3 overflow-y-auto pr-1">
                  {devices.map((device, index) => {
                    const meta = getDeviceMeta(device.deviceType);
                    const Icon = meta.icon;
                    const isLoading = loading === device.sessionId;

                    return (
                      <motion.div
                        key={device.sessionId}
                        initial={{ opacity: 0, x: 12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.04 }}
                        className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[.055] p-4 transition hover:border-cyan-300/25 hover:bg-white/[.075]"
                      >
                        <div
                          className="absolute inset-y-0 left-0 w-1"
                          style={{ background: meta.color }}
                        />
                        <div
                          className="pointer-events-none absolute -right-16 -top-16 h-36 w-36 rounded-full blur-2xl transition group-hover:opacity-100"
                          style={{ background: meta.accent }}
                        />

                        <div className="relative grid gap-4 xl:grid-cols-[1fr_auto] xl:items-center">
                          <div className="flex min-w-0 gap-4">
                            <div
                              className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-white/10"
                              style={{ color: meta.color, background: meta.accent }}
                            >
                              <Icon size={27} />
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <h4 className="truncate text-base font-black text-white">
                                  {device.browser || text.unknown}
                                </h4>
                                <span className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-[11px] font-bold text-slate-300">
                                  {device.os || text.unknown}
                                </span>
                              </div>

                              <div className="mt-4 grid gap-2 md:grid-cols-3">
                                <MetaPill
                                  icon={<Laptop size={14} />}
                                  label={text.deviceType}
                                  value={meta.label}
                                  color={meta.color}
                                />
                                <MetaPill
                                  icon={<Globe2 size={14} />}
                                  label={text.ipAddress}
                                  value={device.ipAddress || text.unknown}
                                  mono
                                  color="#67e8f9"
                                />
                                <MetaPill
                                  icon={<Clock3 size={14} />}
                                  label={text.lastActivity}
                                  value={formatLastActivity(device.lastActivity)}
                                  color="#fcd34d"
                                />
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() => handleRemove(device.sessionId)}
                            disabled={isLoading}
                            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-red-300/20 bg-red-500/12 px-5 text-sm font-black text-red-200 transition hover:border-red-300/40 hover:bg-red-500/20 disabled:cursor-wait disabled:opacity-70"
                          >
                            {isLoading ? (
                              <span className="h-4 w-4 rounded-full border-2 border-red-200/30 border-t-red-200 animate-spin" />
                            ) : (
                              <LogOut size={17} />
                            )}
                            {isLoading ? text.removing : text.remove}
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </section>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function MetaPill({
  icon,
  label,
  value,
  color,
  mono = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
  mono?: boolean;
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-white/8 bg-black/18 px-3 py-2">
      <div className="mb-1 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wide text-slate-500">
        <span style={{ color }}>{icon}</span>
        {label}
      </div>
      <div className={`truncate text-xs font-extrabold text-slate-100 ${mono ? 'font-mono' : ''}`}>
        {value}
      </div>
    </div>
  );
}
