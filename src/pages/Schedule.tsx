import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Award,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Clock,
  ExternalLink,
  Loader2,
  MapPin,
  RefreshCw,
  Video,
  X,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { scheduleApi, type ScheduleEvent, type ScheduleResponse } from '@/api/schedule.api';

const EMPTY_SUMMARY: ScheduleResponse['summary'] = {
  total: 0,
  today: 0,
  exams: 0,
  webinars: 0,
  certificates: 0,
  upcoming: 0,
  live: 0,
  overdue: 0,
};

const EVENT_META = {
  exam: { icon: ClipboardCheck, className: 'schedule-event-exam' },
  webinar: { icon: Video, className: 'schedule-event-webinar' },
  certificate: { icon: Award, className: 'schedule-event-certificate' },
};

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function addMonths(date: Date, count: number) {
  return new Date(date.getFullYear(), date.getMonth() + count, 1);
}

export default function Schedule() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const locale = i18n.language?.startsWith('ru') ? 'ru-RU' : 'uz-UZ';
  const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState(() => toDateKey(new Date()));
  const [data, setData] = useState<ScheduleResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<ScheduleEvent | null>(null);

  const range = useMemo(() => {
    const from = startOfMonth(currentMonth);
    const to = endOfMonth(currentMonth);
    return { from: toDateKey(from), to: toDateKey(to) };
  }, [currentMonth]);

  const loadSchedule = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await scheduleApi.get(range);
      setData(response);
    } catch (err) {
      setError(t('schedule.loadError', 'Jadvalni yuklashda xatolik yuz berdi.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSchedule();
  }, [range.from, range.to]);

  const events = data?.events || [];
  const summary = data?.summary || EMPTY_SUMMARY;
  const dayMap = useMemo(
    () => new Map((data?.days || []).map((day) => [day.date, day])),
    [data],
  );

  const selectedEvents = useMemo(
    () => events.filter((event) => event.date === selectedDate),
    [events, selectedDate],
  );

  const upcomingEvents = useMemo(
    () =>
      events
        .filter((event) => new Date(event.startsAt).getTime() >= Date.now())
        .slice(0, 6),
    [events],
  );

  const calendarCells = useMemo(() => {
    const first = startOfMonth(currentMonth);
    const last = endOfMonth(currentMonth);
    const offset = (first.getDay() + 6) % 7;
    const cells: Date[] = [];
    const cursor = new Date(first);
    cursor.setDate(first.getDate() - offset);

    while (cells.length < 42) {
      cells.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }

    const lastInGrid = cells[cells.length - 1];
    if (lastInGrid < last) {
      while (cells[cells.length - 1] < last) {
        cells.push(new Date(cursor));
        cursor.setDate(cursor.getDate() + 1);
      }
    }

    return cells;
  }, [currentMonth]);

  const monthTitle = currentMonth.toLocaleDateString(locale, {
    month: 'long',
    year: 'numeric',
  });

  const selectedDateLabel = new Date(selectedDate).toLocaleDateString(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  const eventTypeLabel = (type: ScheduleEvent['type']) =>
    t(`schedule.types.${type}`, {
      defaultValue:
        type === 'exam' ? 'Imtihon' : type === 'webinar' ? 'Vebinar' : 'Sertifikat',
    });

  const eventStatusLabel = (status: ScheduleEvent['status']) =>
    t(`schedule.status.${status}`, {
      defaultValue:
        status === 'live'
          ? 'Jonli'
          : status === 'completed'
            ? 'Yakunlangan'
            : status === 'expired'
              ? 'Muddati tugagan'
              : status === 'expiring'
                ? 'Muddati tugayapti'
                : 'Rejalashtirilgan',
    });

  const getTitle = (event: ScheduleEvent) =>
    locale === 'ru-RU' && event.titleRu ? event.titleRu : event.title;

  const goToday = () => {
    const today = new Date();
    setCurrentMonth(startOfMonth(today));
    setSelectedDate(toDateKey(today));
  };

  const openEvent = (event: ScheduleEvent) => {
    if (event.type === 'exam') navigate('/assessments');
    if (event.type === 'webinar') navigate('/webinars');
    if (event.type === 'certificate') navigate('/certifications');
  };

  return (
    <div className="schedule-page fade-in">
      <div className="page-header schedule-header">
        <div>
          <h1 className="page-title schedule-title">
            <CalendarIcon color="var(--green-400)" size={24} />
            {t('schedule.title')}
          </h1>
          <p className="page-sub">{t('schedule.subtitle')}</p>
        </div>
        <div className="schedule-actions">
          <button className="btn btn-ghost schedule-icon-btn" onClick={() => setCurrentMonth(addMonths(currentMonth, -1))} aria-label={t('schedule.previousMonth', 'Oldingi oy')}>
            <ChevronLeft size={18} />
          </button>
          <button className="btn btn-ghost schedule-today-btn" onClick={goToday}>
            {t('schedule.today', 'Bugun')}
          </button>
          <button className="btn btn-ghost schedule-icon-btn" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} aria-label={t('schedule.nextMonth', 'Keyingi oy')}>
            <ChevronRight size={18} />
          </button>
          <button className="btn btn-primary schedule-refresh-btn" onClick={loadSchedule} disabled={loading}>
            {loading ? <Loader2 className="spin" size={17} /> : <RefreshCw size={17} />}
            <span>{t('schedule.refresh', 'Yangilash')}</span>
          </button>
        </div>
      </div>

      <div className="schedule-stats">
        <StatCard label={t('schedule.stats.total', 'Jami tadbirlar')} value={summary.total} tone="green" />
        <StatCard label={t('schedule.stats.today', 'Bugun')} value={summary.today} tone="blue" />
        <StatCard label={t('schedule.stats.exams', 'Imtihonlar')} value={summary.exams} tone="emerald" />
        <StatCard label={t('schedule.stats.webinars', 'Vebinarlar')} value={summary.webinars} tone="sky" />
        <StatCard label={t('schedule.stats.certificates', 'Sertifikatlar')} value={summary.certificates} tone="amber" />
      </div>

      {error && (
        <div className="schedule-alert">
          <AlertCircle size={18} />
          <span>{error}</span>
          <button className="btn btn-ghost" onClick={loadSchedule}>{t('schedule.retry', 'Qayta urinish')}</button>
        </div>
      )}

      <div className="schedule-grid">
        <section className="schedule-panel schedule-calendar-panel">
          <div className="schedule-panel-head">
            <div>
              <h2>{monthTitle}</h2>
              <p>{t('schedule.calendarHint', "Kun tanlang va shu kundagi rejalarni ko'ring")}</p>
            </div>
          </div>
          <div className="schedule-weekdays">
            {['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya'].map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>
          <div className="schedule-calendar">
            {calendarCells.map((cell) => {
              const key = toDateKey(cell);
              const day = dayMap.get(key);
              const inMonth = cell.getMonth() === currentMonth.getMonth();
              const isSelected = key === selectedDate;
              const isToday = key === toDateKey(new Date());

              return (
                <button
                  key={key}
                  className={[
                    'schedule-day',
                    inMonth ? '' : 'is-muted',
                    isSelected ? 'is-selected' : '',
                    isToday ? 'is-today' : '',
                  ].join(' ')}
                  onClick={() => setSelectedDate(key)}
                >
                  <span className="schedule-day-number">{cell.getDate()}</span>
                  {day?.count ? <span className="schedule-day-count">{day.count}</span> : null}
                  <span className="schedule-day-dots">
                    {day?.types.exam ? <i className="dot exam" /> : null}
                    {day?.types.webinar ? <i className="dot webinar" /> : null}
                    {day?.types.certificate ? <i className="dot certificate" /> : null}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="schedule-panel schedule-timeline-panel">
          <div className="schedule-panel-head">
            <div>
              <h2>{selectedDateLabel}</h2>
              <p>{t('schedule.dayEvents', '{{count}} ta reja', { count: selectedEvents.length })}</p>
            </div>
          </div>

          {loading ? (
            <div className="schedule-state">
              <Loader2 className="spin" size={26} />
              <span>{t('common.loading', 'Yuklanmoqda...')}</span>
            </div>
          ) : selectedEvents.length ? (
            <div className="schedule-timeline">
              {selectedEvents.map((event) => (
                <EventRow
                  key={event.id}
                  event={event}
                  title={getTitle(event)}
                  typeLabel={eventTypeLabel(event.type)}
                  statusLabel={eventStatusLabel(event.status)}
                  onDetails={() => setSelectedEvent(event)}
                />
              ))}
            </div>
          ) : (
            <div className="schedule-empty">
              <CalendarIcon size={34} />
              <h3>{t('schedule.emptyTitle', 'Bu kunda reja yo\'q')}</h3>
              <p>{t('schedule.emptyText', 'Imtihon, vebinar yoki sertifikat muddati qo\'shilganda shu yerda ko\'rinadi.')}</p>
            </div>
          )}
        </section>
      </div>

      <section className="schedule-panel schedule-upcoming">
        <div className="schedule-panel-head">
          <div>
            <h2>{t('schedule.upcomingTitle', 'Yaqin rejalar')}</h2>
            <p>{t('schedule.upcomingSubtitle', 'Oy ichidagi eng yaqin tadbirlar')}</p>
          </div>
        </div>
        {loading ? (
          <div className="schedule-state compact">
            <Loader2 className="spin" size={22} />
            <span>{t('common.loading', 'Yuklanmoqda...')}</span>
          </div>
        ) : upcomingEvents.length ? (
          <div className="schedule-upcoming-list">
            {upcomingEvents.map((event) => (
              <button key={event.id} className="schedule-upcoming-item" onClick={() => setSelectedEvent(event)}>
                <span className={`schedule-upcoming-icon ${EVENT_META[event.type].className}`}>
                  {renderEventIcon(event.type, 18)}
                </span>
                <span>
                  <strong>{getTitle(event)}</strong>
                  <small>{new Date(event.startsAt).toLocaleDateString(locale, { day: 'numeric', month: 'short' })} · {event.time}</small>
                </span>
              </button>
            ))}
          </div>
        ) : (
          <div className="schedule-empty compact">
            <CalendarIcon size={28} />
            <span>{t('schedule.noUpcoming', 'Yaqin reja topilmadi.')}</span>
          </div>
        )}
      </section>

      {selectedEvent && (
        <div className="schedule-modal-backdrop" role="dialog" aria-modal="true" onMouseDown={() => setSelectedEvent(null)}>
          <div className="schedule-modal" onMouseDown={(event) => event.stopPropagation()}>
            <button className="schedule-modal-close" onClick={() => setSelectedEvent(null)} aria-label={t('common.close', 'Yopish')}>
              <X size={18} />
            </button>
            <div className={`schedule-modal-icon ${EVENT_META[selectedEvent.type].className}`}>
              {renderEventIcon(selectedEvent.type, 24)}
            </div>
            <div className="schedule-modal-kicker">{eventTypeLabel(selectedEvent.type)} · {eventStatusLabel(selectedEvent.status)}</div>
            <h2>{getTitle(selectedEvent)}</h2>
            <div className="schedule-modal-meta">
              <span><CalendarIcon size={16} /> {new Date(selectedEvent.startsAt).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              <span><Clock size={16} /> {selectedEvent.time}</span>
              <span><MapPin size={16} /> {selectedEvent.location}</span>
            </div>
            <div className="schedule-modal-details">
              {selectedEvent.meta?.speaker && <p><strong>{t('schedule.speaker', 'Spiker')}:</strong> {selectedEvent.meta.speaker}</p>}
              {selectedEvent.meta?.passingScore && <p><strong>{t('schedule.passingScore', 'O\'tish bali')}:</strong> {selectedEvent.meta.passingScore}%</p>}
              {selectedEvent.meta?.timeLimitMinutes && <p><strong>{t('schedule.duration', 'Davomiyligi')}:</strong> {selectedEvent.meta.timeLimitMinutes} {t('schedule.minutes', 'daqiqa')}</p>}
              {selectedEvent.meta?.certificateId && <p><strong>{t('schedule.certificateId', 'Sertifikat ID')}:</strong> {selectedEvent.meta.certificateId}</p>}
              {selectedEvent.meta?.holderName && <p><strong>{t('schedule.holder', 'Egasi')}:</strong> {selectedEvent.meta.holderName}</p>}
            </div>
            <button className="btn btn-primary schedule-modal-action" onClick={() => openEvent(selectedEvent)}>
              <ExternalLink size={17} />
              <span>{t('schedule.openSection', 'Bo\'limga o\'tish')}</span>
            </button>
          </div>
        </div>
      )}

      <style>{`
        .schedule-page { display: flex; flex-direction: column; gap: 22px; }
        .schedule-header { margin-bottom: 0; align-items: flex-start; gap: 16px; }
        .schedule-title { display: flex; align-items: center; gap: 10px; }
        .schedule-actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        .schedule-icon-btn { width: 40px; height: 40px; padding: 0; display: inline-flex; align-items: center; justify-content: center; }
        .schedule-today-btn { min-height: 40px; }
        .schedule-refresh-btn { min-height: 40px; display: inline-flex; gap: 8px; align-items: center; }
        .spin { animation: schedule-spin 0.8s linear infinite; }
        @keyframes schedule-spin { to { transform: rotate(360deg); } }

        .schedule-stats { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 12px; }
        .schedule-stat { background: var(--bg-2); border: 1px solid var(--border-1); border-radius: 8px; padding: 16px; min-height: 92px; display: flex; flex-direction: column; justify-content: space-between; box-shadow: var(--shadow-sm); }
        .schedule-stat span { color: var(--text-tertiary); font-size: 13px; font-weight: 600; }
        .schedule-stat strong { color: var(--text-primary); font-size: 30px; line-height: 1; }
        .schedule-stat-green { border-top: 3px solid var(--green-500); }
        .schedule-stat-blue { border-top: 3px solid #3b82f6; }
        .schedule-stat-emerald { border-top: 3px solid #10b981; }
        .schedule-stat-sky { border-top: 3px solid #0ea5e9; }
        .schedule-stat-amber { border-top: 3px solid #f59e0b; }

        .schedule-alert { display: flex; align-items: center; gap: 12px; padding: 12px 14px; border-radius: 8px; border: 1px solid rgba(239, 68, 68, 0.32); color: #ef4444; background: rgba(239, 68, 68, 0.08); }
        .schedule-alert .btn { margin-left: auto; }

        .schedule-grid { display: grid; grid-template-columns: minmax(320px, 0.92fr) minmax(360px, 1.08fr); gap: 18px; align-items: start; }
        .schedule-panel { background: var(--bg-2); border: 1px solid var(--border-1); border-radius: 8px; padding: 18px; box-shadow: var(--shadow-sm); }
        .schedule-panel-head { display: flex; align-items: center; justify-content: space-between; gap: 14px; margin-bottom: 18px; }
        .schedule-panel-head h2 { margin: 0; color: var(--text-primary); font-size: 19px; font-weight: 800; text-transform: capitalize; }
        .schedule-panel-head p { margin: 5px 0 0; color: var(--text-tertiary); font-size: 13px; }

        .schedule-weekdays { display: grid; grid-template-columns: repeat(7, 1fr); gap: 7px; margin-bottom: 8px; color: var(--text-tertiary); font-size: 12px; font-weight: 700; text-align: center; }
        .schedule-calendar { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 7px; }
        .schedule-day { position: relative; aspect-ratio: 1 / 1; min-height: 48px; border: 1px solid var(--border-1); border-radius: 8px; background: var(--surface-1); color: var(--text-primary); cursor: pointer; padding: 7px; display: flex; align-items: flex-start; justify-content: flex-start; transition: border-color 0.2s, background 0.2s, transform 0.2s; }
        .schedule-day:hover { transform: translateY(-1px); border-color: var(--green-400); }
        .schedule-day.is-muted { opacity: 0.42; }
        .schedule-day.is-selected { background: rgba(22, 163, 74, 0.12); border-color: var(--green-500); box-shadow: inset 0 0 0 1px var(--green-500); }
        .schedule-day.is-today .schedule-day-number { color: var(--green-400); font-weight: 800; }
        .schedule-day-number { font-size: 14px; font-weight: 700; }
        .schedule-day-count { position: absolute; top: 6px; right: 6px; min-width: 18px; height: 18px; border-radius: 999px; background: var(--green-500); color: white; font-size: 11px; display: inline-flex; align-items: center; justify-content: center; padding: 0 5px; }
        .schedule-day-dots { position: absolute; left: 7px; bottom: 7px; display: flex; gap: 3px; }
        .dot { width: 6px; height: 6px; border-radius: 999px; display: block; }
        .dot.exam { background: #10b981; }
        .dot.webinar { background: #0ea5e9; }
        .dot.certificate { background: #f59e0b; }

        .schedule-timeline { position: relative; display: flex; flex-direction: column; gap: 12px; }
        .schedule-event { display: grid; grid-template-columns: 64px 1fr; gap: 12px; align-items: stretch; }
        .schedule-event-time { color: var(--text-tertiary); font-size: 13px; font-weight: 800; padding-top: 14px; text-align: right; }
        .schedule-event-body { border: 1px solid var(--border-1); border-left: 4px solid var(--green-500); background: var(--surface-1); border-radius: 8px; padding: 14px; display: grid; gap: 12px; }
        .schedule-event-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
        .schedule-event-title { display: flex; gap: 10px; align-items: flex-start; min-width: 0; }
        .schedule-event-title h3 { margin: 0; color: var(--text-primary); font-size: 15px; line-height: 1.35; overflow-wrap: anywhere; }
        .schedule-event-icon, .schedule-upcoming-icon, .schedule-modal-icon { width: 38px; height: 38px; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; flex: 0 0 auto; }
        .schedule-event-exam { background: rgba(16, 185, 129, 0.14); color: #10b981; }
        .schedule-event-webinar { background: rgba(14, 165, 233, 0.14); color: #0ea5e9; }
        .schedule-event-certificate { background: rgba(245, 158, 11, 0.16); color: #f59e0b; }
        .schedule-event-badges { display: flex; gap: 7px; flex-wrap: wrap; justify-content: flex-end; }
        .schedule-badge { border-radius: 999px; padding: 5px 9px; font-size: 11px; font-weight: 800; background: var(--bg-3); color: var(--text-secondary); white-space: nowrap; }
        .schedule-badge-status { background: rgba(22, 163, 74, 0.12); color: var(--green-400); }
        .schedule-event-meta { display: flex; gap: 14px; flex-wrap: wrap; color: var(--text-tertiary); font-size: 12px; }
        .schedule-event-meta span { display: inline-flex; align-items: center; gap: 5px; min-width: 0; }
        .schedule-event-detail { justify-self: flex-start; min-height: 34px; }

        .schedule-state, .schedule-empty { min-height: 260px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; color: var(--text-tertiary); gap: 10px; }
        .schedule-state.compact, .schedule-empty.compact { min-height: 92px; }
        .schedule-empty h3 { margin: 0; color: var(--text-primary); font-size: 17px; }
        .schedule-empty p { max-width: 360px; margin: 0; line-height: 1.5; }

        .schedule-upcoming-list { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }
        .schedule-upcoming-item { border: 1px solid var(--border-1); border-radius: 8px; background: var(--surface-1); color: var(--text-primary); padding: 12px; display: flex; gap: 11px; align-items: center; cursor: pointer; text-align: left; min-width: 0; }
        .schedule-upcoming-item:hover { border-color: var(--green-400); }
        .schedule-upcoming-item strong { display: block; font-size: 14px; line-height: 1.3; overflow-wrap: anywhere; }
        .schedule-upcoming-item small { display: block; margin-top: 4px; color: var(--text-tertiary); font-size: 12px; }

        .schedule-modal-backdrop { position: fixed; inset: 0; z-index: 1000; background: rgba(5, 10, 20, 0.58); backdrop-filter: blur(10px); display: flex; align-items: center; justify-content: center; padding: 18px; }
        .schedule-modal { position: relative; width: min(520px, 100%); background: var(--bg-2); border: 1px solid var(--border-1); border-radius: 8px; padding: 24px; box-shadow: var(--shadow-xl); }
        .schedule-modal-close { position: absolute; top: 14px; right: 14px; width: 36px; height: 36px; border: 1px solid var(--border-1); background: var(--surface-1); color: var(--text-secondary); border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; }
        .schedule-modal-kicker { margin-top: 12px; color: var(--green-400); font-size: 12px; font-weight: 900; text-transform: uppercase; letter-spacing: 0; }
        .schedule-modal h2 { margin: 8px 0 16px; color: var(--text-primary); font-size: 24px; line-height: 1.2; overflow-wrap: anywhere; }
        .schedule-modal-meta { display: grid; gap: 8px; color: var(--text-secondary); font-size: 14px; margin-bottom: 16px; }
        .schedule-modal-meta span { display: flex; align-items: center; gap: 8px; }
        .schedule-modal-details { background: var(--surface-1); border: 1px solid var(--border-1); border-radius: 8px; padding: 12px; margin-bottom: 16px; display: grid; gap: 7px; }
        .schedule-modal-details p { margin: 0; color: var(--text-secondary); font-size: 14px; }
        .schedule-modal-action { width: 100%; display: inline-flex; align-items: center; justify-content: center; gap: 8px; min-height: 42px; }

        @media (max-width: 1120px) {
          .schedule-stats { grid-template-columns: repeat(3, minmax(0, 1fr)); }
          .schedule-grid { grid-template-columns: 1fr; }
          .schedule-upcoming-list { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
        @media (max-width: 720px) {
          .schedule-header { flex-direction: column; }
          .schedule-actions { width: 100%; }
          .schedule-refresh-btn { flex: 1; justify-content: center; }
          .schedule-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .schedule-panel { padding: 14px; }
          .schedule-calendar { gap: 5px; }
          .schedule-weekdays { gap: 5px; }
          .schedule-day { min-height: 42px; padding: 6px; }
          .schedule-event { grid-template-columns: 1fr; gap: 6px; }
          .schedule-event-time { text-align: left; padding-top: 0; }
          .schedule-event-top { flex-direction: column; }
          .schedule-event-badges { justify-content: flex-start; }
          .schedule-upcoming-list { grid-template-columns: 1fr; }
          .schedule-modal { padding: 20px; }
        }
      `}</style>
    </div>
  );
}

function StatCard({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className={`schedule-stat schedule-stat-${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function EventRow({
  event,
  title,
  typeLabel,
  statusLabel,
  onDetails,
}: {
  event: ScheduleEvent;
  title: string;
  typeLabel: string;
  statusLabel: string;
  onDetails: () => void;
}) {
  const { t } = useTranslation();
  const meta = EVENT_META[event.type];

  return (
    <article className="schedule-event">
      <div className="schedule-event-time">{event.time}</div>
      <div className="schedule-event-body" style={{ borderLeftColor: event.accent }}>
        <div className="schedule-event-top">
          <div className="schedule-event-title">
            <span className={`schedule-event-icon ${meta.className}`}>{renderEventIcon(event.type, 18)}</span>
            <h3>{title}</h3>
          </div>
          <div className="schedule-event-badges">
            <span className="schedule-badge">{typeLabel}</span>
            <span className="schedule-badge schedule-badge-status">{statusLabel}</span>
          </div>
        </div>
        <div className="schedule-event-meta">
          <span><Clock size={14} /> {event.time}</span>
          <span><MapPin size={14} /> {event.location}</span>
        </div>
        <button className="btn btn-ghost schedule-event-detail" onClick={onDetails}>
          {t('schedule.details', 'Batafsil')}
        </button>
      </div>
    </article>
  );
}

function renderEventIcon(type: ScheduleEvent['type'], size: number) {
  const Icon = EVENT_META[type].icon;
  return <Icon size={size} />;
}
