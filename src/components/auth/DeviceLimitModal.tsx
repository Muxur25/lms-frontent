import React from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Fingerprint,
  Globe2,
  Laptop,
  Loader2,
  LogOut,
  Monitor,
  ShieldCheck,
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
    eyebrow: 'Xavfsiz kirish',
    title: "Qurilmalar limiti to'ldi",
    subtitle: "Yangi qurilmadan kirish uchun ro'yxatdan bitta faol sessiyani yakunlang.",
    allowed: 'Ruxsat etilgan limit',
    activeDevices: 'Faol qurilmalar',
    chooseDevice: "Chiqariladigan qurilmani tanlang. Tanlovdan keyin login avtomatik davom etadi.",
    deviceType: 'Qurilma',
    ipAddress: 'IP manzil',
    lastActivity: 'Oxirgi faollik',
    unknown: "Noma'lum",
    remove: 'Chiqarish',
    removing: 'Chiqarilmoqda',
    cancel: 'Loginni bekor qilish',
    desktop: 'Kompyuter',
    mobile: 'Telefon',
    tablet: 'Planshet',
    empty: "Faol qurilmalar topilmadi. Oynani yopib qayta urinib ko'ring.",
    ruleOne: 'Chiqarilgan sessiya darhol bloklanadi.',
    ruleTwo: 'Parol va shaxsiy maʼlumotlar saqlanmaydi.',
  },
  ru: {
    close: 'Закрыть',
    eyebrow: 'Безопасный вход',
    title: 'Лимит устройств достигнут',
    subtitle: 'Чтобы войти с нового устройства, завершите одну активную сессию из списка.',
    allowed: 'Разрешенный лимит',
    activeDevices: 'Активные устройства',
    chooseDevice: 'Выберите устройство для отключения. После выбора вход продолжится автоматически.',
    deviceType: 'Устройство',
    ipAddress: 'IP адрес',
    lastActivity: 'Последняя активность',
    unknown: 'Неизвестно',
    remove: 'Отключить',
    removing: 'Отключение',
    cancel: 'Отменить вход',
    desktop: 'Компьютер',
    mobile: 'Телефон',
    tablet: 'Планшет',
    empty: 'Активные устройства не найдены. Закройте окно и попробуйте снова.',
    ruleOne: 'Отключенная сессия будет заблокирована сразу.',
    ruleTwo: 'Пароль и личные данные не сохраняются.',
  },
};

export function DeviceLimitModal({ isOpen, devices, onDeviceRemoved, onCancel }: DeviceLimitModalProps) {
  const [loading, setLoading] = React.useState<string | null>(null);
  const { i18n } = useTranslation();
  const lang = i18n.language === 'ru' ? 'ru' : 'uz';
  const text = copy[lang];

  React.useEffect(() => {
    if (!isOpen) {
      setLoading(null);
    }
  }, [isOpen]);

  const handleRemove = (sessionId: string) => {
    setLoading(sessionId);
    setTimeout(() => {
      onDeviceRemoved(sessionId);
      setLoading(null);
    }, 350);
  };

  const getDeviceMeta = (type: string) => {
    const normalized = (type || '').toLowerCase();
    if (normalized.includes('mobile')) {
      return { icon: Smartphone, label: text.mobile, color: '#2dd4bf', bg: 'rgba(45,212,191,.14)' };
    }
    if (normalized.includes('tablet')) {
      return { icon: Tablet, label: text.tablet, color: '#a78bfa', bg: 'rgba(167,139,250,.14)' };
    }
    return { icon: Monitor, label: text.desktop, color: '#60a5fa', bg: 'rgba(96,165,250,.14)' };
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
        <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-[#030712]/78 p-3 backdrop-blur-xl sm:p-6">
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.98 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="relative w-full max-w-4xl overflow-hidden rounded-[26px] border border-white/12 bg-[#07111f]/96 text-white shadow-[0_38px_120px_rgba(0,0,0,.62)]"
          >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_0%,rgba(45,212,191,.22),transparent_30%),radial-gradient(circle_at_88%_5%,rgba(96,165,250,.18),transparent_32%),linear-gradient(135deg,rgba(255,255,255,.08),transparent_44%)]" />
            <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-cyan-200/70 to-transparent" />

            <button
              type="button"
              onClick={onCancel}
              className="absolute right-4 top-4 z-20 grid h-10 w-10 place-items-center rounded-2xl border border-white/10 bg-white/[.07] text-slate-300 transition hover:bg-white/[.13] hover:text-white"
              aria-label={text.close}
            >
              <X size={18} />
            </button>

            <div className="relative grid lg:grid-cols-[310px_1fr]">
              <aside className="border-b border-white/10 p-6 sm:p-7 lg:border-b-0 lg:border-r">
                <div className="mb-6 flex items-center gap-3">
                  <div className="grid h-14 w-14 place-items-center rounded-2xl border border-cyan-200/20 bg-cyan-200/10 text-cyan-100 shadow-[0_0_46px_rgba(34,211,238,.16)]">
                    <ShieldCheck size={28} />
                  </div>
                  <div className="min-w-0">
                    <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200/20 bg-cyan-200/10 px-3 py-1 text-[10px] font-black uppercase tracking-[.16em] text-cyan-100">
                      <Fingerprint size={12} />
                      {text.eyebrow}
                    </div>
                  </div>
                </div>

                <h2 className="max-w-[260px] text-[28px] font-black leading-[1.08] text-white sm:text-[32px]">
                  {text.title}
                </h2>
                <p className="mt-4 text-sm font-semibold leading-6 text-slate-300">
                  {text.subtitle}
                </p>

                <div className="mt-6 rounded-3xl border border-white/10 bg-white/[.055] p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wide text-slate-400">{text.allowed}</span>
                    <span className="rounded-full bg-emerald-400/14 px-2.5 py-1 text-xs font-black text-emerald-200">
                      {devices.length}/3
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[0, 1, 2].map((slot) => (
                      <div
                        key={slot}
                        className={`h-2 rounded-full ${slot < devices.length ? 'bg-cyan-300' : 'bg-white/12'}`}
                      />
                    ))}
                  </div>
                </div>

                <div className="mt-5 grid gap-3">
                  {[text.ruleOne, text.ruleTwo].map((rule) => (
                    <div key={rule} className="flex gap-3 rounded-2xl border border-white/8 bg-black/18 p-3">
                      <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-300" size={16} />
                      <span className="text-xs font-semibold leading-5 text-slate-300">{rule}</span>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={onCancel}
                  className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-2xl border border-white/10 bg-white/[.06] px-4 text-sm font-black text-slate-200 transition hover:bg-white/[.12] hover:text-white"
                >
                  {text.cancel}
                </button>
              </aside>

              <section className="p-5 sm:p-7">
                <div className="mb-5 flex flex-wrap items-start justify-between gap-3 pr-12">
                  <div>
                    <h3 className="text-xl font-black text-white">{text.activeDevices}</h3>
                    <p className="mt-1 max-w-xl text-sm font-semibold leading-6 text-slate-400">
                      {text.chooseDevice}
                    </p>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-2xl border border-amber-200/20 bg-amber-300/10 px-3 py-2 text-amber-100">
                    <AlertTriangle size={15} />
                    <span className="text-xs font-black">{devices.length}/3</span>
                  </div>
                </div>

                {devices.length === 0 ? (
                  <div className="grid min-h-64 place-items-center rounded-3xl border border-dashed border-white/14 bg-white/[.04] p-8 text-center">
                    <div>
                      <Laptop className="mx-auto mb-4 text-slate-400" size={38} />
                      <p className="max-w-md text-sm font-semibold leading-6 text-slate-300">{text.empty}</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid max-h-[58vh] gap-3 overflow-y-auto pr-1">
                    {devices.map((device, index) => {
                      const meta = getDeviceMeta(device.deviceType);
                      const Icon = meta.icon;
                      const isLoading = loading === device.sessionId;

                      return (
                        <motion.article
                          key={device.sessionId}
                          initial={{ opacity: 0, x: 14 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.035 }}
                          className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[.055] p-4 transition hover:border-cyan-200/30 hover:bg-white/[.08]"
                        >
                          <div className="absolute inset-y-0 left-0 w-1" style={{ background: meta.color }} />
                          <div className="relative grid gap-4 xl:grid-cols-[1fr_auto] xl:items-center">
                            <div className="flex min-w-0 gap-4">
                              <div
                                className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-white/10"
                                style={{ color: meta.color, background: meta.bg }}
                              >
                                <Icon size={27} />
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h4 className="max-w-full truncate text-base font-black text-white">
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
                                    color="#67e8f9"
                                    mono
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
                              type="button"
                              onClick={() => handleRemove(device.sessionId)}
                              disabled={Boolean(loading)}
                              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-red-300/20 bg-red-500/12 px-5 text-sm font-black text-red-100 transition hover:border-red-300/40 hover:bg-red-500/20 disabled:cursor-wait disabled:opacity-70"
                            >
                              {isLoading ? <Loader2 className="animate-spin" size={17} /> : <LogOut size={17} />}
                              {isLoading ? text.removing : text.remove}
                            </button>
                          </div>
                        </motion.article>
                      );
                    })}
                  </div>
                )}
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
