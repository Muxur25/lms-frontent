import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Award,
  CalendarDays,
  Crown,
  History,
  Loader2,
  Medal,
  RefreshCw,
  Star,
  Target,
  Trophy,
  UserRound,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useAuthStore } from '@/store/auth.store';
import {
  useLeaderboardStore,
  type LeaderboardRanking,
  type LeaderboardTimeFilter,
  type UserPoints,
} from '@/store/leaderboard.store';
import { useSocket } from '@/hooks/useSocket';

const FILTERS: LeaderboardTimeFilter[] = ['all_time', 'month', 'week', 'today'];

const SOURCE_LABELS: Record<string, string> = {
  VIDEO_COMPLETED: 'Video yakunlandi',
  EXAM_PASSED: 'Imtihon topshirildi',
  ASSIGNMENT_APPROVED: 'Topshiriq tasdiqlandi',
  COURSE_COMPLETED: 'Kurs yakunlandi',
  CERTIFICATE_EARNED: 'Sertifikat olindi',
};

export default function Leaderboard() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language?.startsWith('ru') ? 'ru-RU' : 'uz-UZ';
  const user = useAuthStore((state) => state.user);
  const socket = useSocket();
  const {
    rankings,
    myRanking,
    history,
    timeFilter,
    loading,
    historyLoading,
    error,
    setTimeFilter,
    fetchRankings,
    fetchMyRanking,
    fetchMyHistory,
    subscribeToEvents,
    unsubscribeFromEvents,
  } = useLeaderboardStore();
  const [activeTab, setActiveTab] = useState<'leaders' | 'history'>('leaders');

  useEffect(() => {
    fetchRankings();
    fetchMyRanking();
    fetchMyHistory();

    if (socket && user?.id) {
      subscribeToEvents(socket, user.id);
    }

    return () => {
      if (socket) unsubscribeFromEvents(socket);
    };
  }, [user?.id, socket]);

  const topThree = useMemo(() => rankings.slice(0, 3), [rankings]);
  const rest = useMemo(() => rankings.slice(3), [rankings]);
  const currentUserRanking = useMemo(
    () => rankings.find((item) => item.userId === user?.id) || myRanking,
    [rankings, myRanking, user?.id],
  );
  const totalPeriodPoints = useMemo(
    () => rankings.reduce((sum, item) => sum + item.periodPoints, 0),
    [rankings],
  );

  const reloadAll = () => {
    fetchRankings();
    fetchMyRanking();
    fetchMyHistory();
  };

  const filterLabel = (filter: LeaderboardTimeFilter) =>
    t(`leaderboard.filters.${filter}`, {
      defaultValue:
        filter === 'today'
          ? 'Bugun'
          : filter === 'week'
            ? 'Hafta'
            : filter === 'month'
              ? 'Oy'
              : 'Umumiy',
    });

  return (
    <div className="leaderboard-page fade-in">
      <section className="leaderboard-hero">
        <div className="leaderboard-hero-copy">
          <div className="leaderboard-kicker">
            <Trophy size={16} />
            <span>{t('leaderboard.kicker', 'AGMK bilim reytingi')}</span>
          </div>
          <h1>{t('leaderboard.title', 'Peshqadamlar reytingi')}</h1>
          <p>
            {t(
              'leaderboard.subtitle',
              "Kurslar, imtihonlar va sertifikatlar bo'yicha real ballar asosida shakllangan reyting.",
            )}
          </p>
        </div>

        <div className="leaderboard-me-card">
          <div className="leaderboard-me-top">
            <span>{t('leaderboard.myPosition', 'Mening natijam')}</span>
            <strong>#{currentUserRanking?.rank || 0}</strong>
          </div>
          <div className="leaderboard-me-score">
            <span>{formatNumber(currentUserRanking?.totalPoints || 0, locale)}</span>
            <small>{t('leaderboard.totalPoints', 'jami ball')}</small>
          </div>
          <StarRating stars={currentUserRanking?.stars || 1} />
        </div>
      </section>

      <section className="leaderboard-toolbar">
        <div className="leaderboard-tabs" role="tablist">
          <button
            className={clsx(activeTab === 'leaders' && 'is-active')}
            onClick={() => setActiveTab('leaders')}
          >
            <Trophy size={17} />
            <span>{t('leaderboard.rankings', 'Reyting')}</span>
          </button>
          <button
            className={clsx(activeTab === 'history' && 'is-active')}
            onClick={() => setActiveTab('history')}
          >
            <History size={17} />
            <span>{t('leaderboard.myHistory', 'Tarix')}</span>
          </button>
        </div>

        <div className="leaderboard-filters" aria-label={t('leaderboard.period', 'Davr')}>
          {FILTERS.map((filter) => (
            <button
              key={filter}
              className={clsx(timeFilter === filter && 'is-active')}
              onClick={() => setTimeFilter(filter)}
            >
              {filterLabel(filter)}
            </button>
          ))}
        </div>

        <button className="leaderboard-refresh" onClick={reloadAll} disabled={loading || historyLoading}>
          {loading || historyLoading ? <Loader2 className="spin" size={17} /> : <RefreshCw size={17} />}
          <span>{t('leaderboard.refresh', 'Yangilash')}</span>
        </button>
      </section>

      {error && (
        <div className="leaderboard-alert">
          <span>{error}</span>
          <button onClick={reloadAll}>{t('leaderboard.retry', 'Qayta urinish')}</button>
        </div>
      )}

      <section className="leaderboard-stats">
        <MetricCard icon={UserRound} label={t('leaderboard.stats.participants', 'Ishtirokchilar')} value={rankings.length} />
        <MetricCard icon={Target} label={t('leaderboard.stats.periodPoints', 'Davrdagi ball')} value={totalPeriodPoints} />
        <MetricCard icon={Award} label={t('leaderboard.stats.myStars', 'Mening darajam')} value={currentUserRanking?.stars || 1} suffix="/5" />
        <MetricCard icon={CalendarDays} label={t('leaderboard.stats.period', 'Davr')} textValue={filterLabel(timeFilter)} />
      </section>

      {activeTab === 'leaders' ? (
        <main className="leaderboard-content">
          {loading ? (
            <LoadingState label={t('leaderboard.loading', 'Reyting yuklanmoqda...')} />
          ) : rankings.length ? (
            <>
              <section className="leaderboard-podium" aria-label={t('leaderboard.topThree', 'Top 3')}>
                {topThree[1] && <PodiumCard ranking={topThree[1]} place={2} locale={locale} />}
                {topThree[0] && <PodiumCard ranking={topThree[0]} place={1} locale={locale} />}
                {topThree[2] && <PodiumCard ranking={topThree[2]} place={3} locale={locale} />}
              </section>

              <section className="leaderboard-list-panel">
                <div className="leaderboard-panel-head">
                  <div>
                    <h2>{t('leaderboard.participants', 'Ishtirokchilar')}</h2>
                    <p>{t('leaderboard.participantsSub', 'Ball, bo\'lim va yulduz darajasi bo\'yicha tartiblangan ro\'yxat')}</p>
                  </div>
                </div>
                <div className="leaderboard-list">
                  {rest.map((ranking) => (
                    <RankingRow
                      key={ranking.id}
                      ranking={ranking}
                      isMe={ranking.userId === user?.id}
                      locale={locale}
                    />
                  ))}
                </div>
              </section>
            </>
          ) : (
            <EmptyState
              icon={Trophy}
              title={t('leaderboard.emptyTitle', 'Reyting hali shakllanmagan')}
              text={t('leaderboard.emptyText', 'Kurs yoki imtihon yakunlanganda ballar shu yerda ko\'rinadi.')}
            />
          )}
        </main>
      ) : (
        <HistoryPanel history={history} loading={historyLoading} locale={locale} />
      )}

      <style>{`
        .leaderboard-page { display: flex; flex-direction: column; gap: 20px; padding-bottom: 28px; }
        .leaderboard-hero { display: grid; grid-template-columns: minmax(0, 1fr) 360px; gap: 18px; align-items: stretch; background: var(--bg-2); border: 1px solid var(--border-1); border-radius: 8px; padding: 24px; box-shadow: var(--shadow-sm); }
        .leaderboard-hero-copy { min-width: 0; display: flex; flex-direction: column; justify-content: center; }
        .leaderboard-kicker { width: fit-content; display: inline-flex; align-items: center; gap: 8px; color: var(--green-400); background: rgba(22, 163, 74, 0.11); border: 1px solid rgba(22, 163, 74, 0.24); border-radius: 999px; padding: 7px 11px; font-size: 13px; font-weight: 800; margin-bottom: 14px; }
        .leaderboard-hero h1 { margin: 0; color: var(--text-primary); font-size: 34px; line-height: 1.1; font-weight: 900; letter-spacing: 0; }
        .leaderboard-hero p { margin: 12px 0 0; max-width: 760px; color: var(--text-secondary); line-height: 1.6; font-size: 15px; }
        .leaderboard-me-card { background: var(--surface-1); border: 1px solid var(--border-1); border-radius: 8px; padding: 18px; display: flex; flex-direction: column; justify-content: space-between; gap: 16px; }
        .leaderboard-me-top { display: flex; align-items: center; justify-content: space-between; gap: 12px; color: var(--text-secondary); font-weight: 700; }
        .leaderboard-me-top strong { color: var(--green-400); font-size: 22px; }
        .leaderboard-me-score span { display: block; color: var(--text-primary); font-size: 38px; line-height: 1; font-weight: 900; }
        .leaderboard-me-score small { color: var(--text-tertiary); font-size: 12px; text-transform: uppercase; font-weight: 800; }

        .leaderboard-toolbar { display: grid; grid-template-columns: auto 1fr auto; gap: 12px; align-items: center; }
        .leaderboard-tabs, .leaderboard-filters { display: flex; align-items: center; gap: 4px; padding: 4px; background: var(--bg-2); border: 1px solid var(--border-1); border-radius: 8px; min-width: 0; }
        .leaderboard-tabs button, .leaderboard-filters button, .leaderboard-refresh, .leaderboard-alert button { border: 0; border-radius: 6px; min-height: 36px; padding: 0 12px; color: var(--text-secondary); background: transparent; font-weight: 800; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 7px; white-space: nowrap; }
        .leaderboard-tabs button.is-active, .leaderboard-filters button.is-active { background: var(--surface-1); color: var(--text-primary); box-shadow: var(--shadow-sm); }
        .leaderboard-filters { justify-self: center; overflow-x: auto; max-width: 100%; }
        .leaderboard-refresh { background: var(--green-500); color: white; border: 1px solid var(--green-500); }
        .leaderboard-refresh:disabled { opacity: 0.66; cursor: wait; }
        .spin { animation: leaderboard-spin 0.8s linear infinite; }
        @keyframes leaderboard-spin { to { transform: rotate(360deg); } }

        .leaderboard-alert { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 13px 14px; color: #ef4444; background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.28); border-radius: 8px; }
        .leaderboard-alert button { color: #ef4444; background: rgba(239, 68, 68, 0.08); }

        .leaderboard-stats { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
        .leaderboard-metric { min-height: 96px; background: var(--bg-2); border: 1px solid var(--border-1); border-radius: 8px; padding: 15px; display: flex; align-items: center; gap: 13px; box-shadow: var(--shadow-sm); }
        .leaderboard-metric-icon { width: 42px; height: 42px; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; color: var(--green-400); background: rgba(22, 163, 74, 0.11); flex: 0 0 auto; }
        .leaderboard-metric span { color: var(--text-tertiary); font-size: 12px; font-weight: 800; }
        .leaderboard-metric strong { display: block; margin-top: 4px; color: var(--text-primary); font-size: 26px; line-height: 1; font-weight: 900; overflow-wrap: anywhere; }

        .leaderboard-content { display: flex; flex-direction: column; gap: 18px; }
        .leaderboard-podium { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; align-items: end; }
        .leaderboard-podium-card { position: relative; overflow: hidden; background: var(--bg-2); border: 1px solid var(--border-1); border-radius: 8px; padding: 18px; box-shadow: var(--shadow-sm); min-height: 230px; display: flex; flex-direction: column; justify-content: space-between; }
        .leaderboard-podium-card.place-1 { min-height: 275px; border-top: 3px solid #eab308; }
        .leaderboard-podium-card.place-2 { min-height: 245px; border-top: 3px solid #94a3b8; }
        .leaderboard-podium-card.place-3 { min-height: 220px; border-top: 3px solid #f59e0b; }
        .leaderboard-place-badge { width: 48px; height: 48px; display: inline-flex; align-items: center; justify-content: center; border-radius: 8px; background: var(--surface-1); border: 1px solid var(--border-1); color: var(--text-primary); }
        .leaderboard-podium-name { margin-top: 16px; color: var(--text-primary); font-size: 18px; font-weight: 900; overflow-wrap: anywhere; }
        .leaderboard-podium-dept { color: var(--text-tertiary); font-size: 13px; margin-top: 5px; }
        .leaderboard-podium-score { display: flex; align-items: end; justify-content: space-between; gap: 12px; margin-top: 18px; }
        .leaderboard-podium-score strong { color: var(--text-primary); font-size: 28px; line-height: 1; }
        .leaderboard-podium-score span { color: var(--text-tertiary); font-size: 12px; font-weight: 800; }

        .leaderboard-list-panel, .leaderboard-history-panel { background: var(--bg-2); border: 1px solid var(--border-1); border-radius: 8px; overflow: hidden; box-shadow: var(--shadow-sm); }
        .leaderboard-panel-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 18px; border-bottom: 1px solid var(--border-1); background: var(--surface-1); }
        .leaderboard-panel-head h2 { margin: 0; color: var(--text-primary); font-size: 18px; font-weight: 900; }
        .leaderboard-panel-head p { margin: 5px 0 0; color: var(--text-tertiary); font-size: 13px; }
        .leaderboard-list { display: flex; flex-direction: column; }
        .leaderboard-row { display: grid; grid-template-columns: 72px minmax(0, 1fr) auto; align-items: center; gap: 14px; padding: 15px 18px; border-bottom: 1px solid var(--border-1); background: var(--bg-2); }
        .leaderboard-row:last-child { border-bottom: 0; }
        .leaderboard-row.is-me { background: rgba(22, 163, 74, 0.08); box-shadow: inset 3px 0 0 var(--green-500); }
        .leaderboard-rank { color: var(--text-tertiary); font-size: 18px; font-weight: 900; }
        .leaderboard-user { display: flex; align-items: center; gap: 12px; min-width: 0; }
        .leaderboard-avatar { width: 44px; height: 44px; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; background: var(--surface-1); border: 1px solid var(--border-1); color: var(--green-400); font-weight: 900; flex: 0 0 auto; }
        .leaderboard-user strong { display: block; color: var(--text-primary); font-size: 15px; overflow-wrap: anywhere; }
        .leaderboard-user small { display: block; margin-top: 3px; color: var(--text-tertiary); font-size: 12px; }
        .leaderboard-row-score { display: flex; align-items: center; gap: 18px; }
        .leaderboard-score { text-align: right; }
        .leaderboard-score strong { display: block; color: var(--text-primary); font-size: 18px; }
        .leaderboard-score span { color: var(--text-tertiary); font-size: 11px; font-weight: 800; text-transform: uppercase; }
        .leaderboard-stars { display: flex; align-items: center; gap: 3px; color: var(--text-muted); }
        .leaderboard-stars .filled { color: #f59e0b; fill: #f59e0b; }

        .leaderboard-history-list { display: flex; flex-direction: column; }
        .leaderboard-history-row { display: grid; grid-template-columns: 46px minmax(0, 1fr) auto; gap: 13px; align-items: center; padding: 15px 18px; border-bottom: 1px solid var(--border-1); }
        .leaderboard-history-row:last-child { border-bottom: 0; }
        .leaderboard-history-icon { width: 42px; height: 42px; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; color: var(--green-400); background: rgba(22, 163, 74, 0.11); }
        .leaderboard-history-row strong { color: var(--text-primary); font-size: 15px; }
        .leaderboard-history-row small { display: block; color: var(--text-tertiary); margin-top: 4px; }
        .leaderboard-history-points { color: var(--green-400); font-size: 20px; font-weight: 900; white-space: nowrap; }

        .leaderboard-state { min-height: 280px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; text-align: center; color: var(--text-tertiary); background: var(--bg-2); border: 1px solid var(--border-1); border-radius: 8px; padding: 24px; }
        .leaderboard-state h3 { margin: 0; color: var(--text-primary); font-size: 20px; }
        .leaderboard-state p { margin: 0; max-width: 420px; line-height: 1.5; }

        @media (max-width: 1120px) {
          .leaderboard-hero { grid-template-columns: 1fr; }
          .leaderboard-toolbar { grid-template-columns: 1fr; }
          .leaderboard-tabs, .leaderboard-filters, .leaderboard-refresh { width: 100%; }
          .leaderboard-refresh { min-height: 40px; }
          .leaderboard-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
        @media (max-width: 760px) {
          .leaderboard-hero { padding: 18px; }
          .leaderboard-hero h1 { font-size: 27px; }
          .leaderboard-stats { grid-template-columns: 1fr; }
          .leaderboard-podium { grid-template-columns: 1fr; }
          .leaderboard-podium-card, .leaderboard-podium-card.place-1, .leaderboard-podium-card.place-2, .leaderboard-podium-card.place-3 { min-height: auto; }
          .leaderboard-row { grid-template-columns: 48px minmax(0, 1fr); }
          .leaderboard-row-score { grid-column: 2; justify-content: space-between; }
          .leaderboard-stars { display: none; }
          .leaderboard-history-row { grid-template-columns: 42px minmax(0, 1fr); }
          .leaderboard-history-points { grid-column: 2; }
          .leaderboard-tabs button, .leaderboard-filters button { flex: 1; padding: 0 8px; }
          .leaderboard-filters { justify-self: stretch; }
        }
      `}</style>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  suffix = '',
  textValue,
}: {
  icon: any;
  label: string;
  value?: number;
  suffix?: string;
  textValue?: string;
}) {
  return (
    <div className="leaderboard-metric">
      <span className="leaderboard-metric-icon"><Icon size={20} /></span>
      <div>
        <span>{label}</span>
        <strong>{textValue || `${formatNumber(value || 0)}${suffix}`}</strong>
      </div>
    </div>
  );
}

function PodiumCard({ ranking, place, locale }: { ranking: LeaderboardRanking; place: 1 | 2 | 3; locale: string }) {
  const Icon = place === 1 ? Crown : Medal;
  return (
    <article className={`leaderboard-podium-card place-${place}`}>
      <div>
        <span className="leaderboard-place-badge"><Icon size={24} /></span>
        <div className="leaderboard-podium-name">{ranking.userFullName}</div>
        <div className="leaderboard-podium-dept">{ranking.userDepartment || 'AGMK'}</div>
      </div>
      <div>
        <StarRating stars={ranking.stars} />
        <div className="leaderboard-podium-score">
          <div>
            <strong>{formatNumber(ranking.totalPoints, locale)}</strong>
            <span>ball</span>
          </div>
          <span>#{ranking.rank}</span>
        </div>
      </div>
    </article>
  );
}

function RankingRow({ ranking, isMe, locale }: { ranking: LeaderboardRanking; isMe: boolean; locale: string }) {
  return (
    <article className={clsx('leaderboard-row', isMe && 'is-me')}>
      <div className="leaderboard-rank">#{ranking.rank}</div>
      <div className="leaderboard-user">
        <span className="leaderboard-avatar">{getInitial(ranking.userFullName)}</span>
        <div>
          <strong>{ranking.userFullName}</strong>
          <small>{ranking.userDepartment || 'AGMK'}</small>
        </div>
      </div>
      <div className="leaderboard-row-score">
        <StarRating stars={ranking.stars} />
        <div className="leaderboard-score">
          <strong>{formatNumber(ranking.totalPoints, locale)}</strong>
          <span>ball</span>
        </div>
      </div>
    </article>
  );
}

function HistoryPanel({ history, loading, locale }: { history: UserPoints[]; loading: boolean; locale: string }) {
  const { t } = useTranslation();

  if (loading) {
    return <LoadingState label={t('leaderboard.historyLoading', 'Tarix yuklanmoqda...')} />;
  }

  return (
    <section className="leaderboard-history-panel">
      <div className="leaderboard-panel-head">
        <div>
          <h2>{t('leaderboard.pointsHistory', 'Ballar tarixi')}</h2>
          <p>{t('leaderboard.historySub', 'Oxirgi ball berilgan amallar')}</p>
        </div>
      </div>
      {history.length ? (
        <div className="leaderboard-history-list">
          {history.map((item) => (
            <article key={item.id} className="leaderboard-history-row">
              <span className="leaderboard-history-icon"><Award size={20} /></span>
              <div>
                <strong>{t(`leaderboard.sources.${item.sourceType}`, SOURCE_LABELS[item.sourceType] || item.sourceType)}</strong>
                <small>{formatDateTime(item.createdAt, locale)}</small>
              </div>
              <div className="leaderboard-history-points">+{formatNumber(item.pointsAwarded, locale)}</div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={History}
          title={t('leaderboard.historyEmptyTitle', "Tarix bo'sh")}
          text={t('leaderboard.historyEmptyText', "Sizda hozircha ballar tarixi yo'q.")}
        />
      )}
    </section>
  );
}

function StarRating({ stars }: { stars: number }) {
  return (
    <div className="leaderboard-stars" aria-label={`${stars}/5`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <Star key={index} size={15} className={index < stars ? 'filled' : ''} />
      ))}
    </div>
  );
}

function LoadingState({ label }: { label: string }) {
  return (
    <div className="leaderboard-state">
      <Loader2 className="spin" size={30} />
      <span>{label}</span>
    </div>
  );
}

function EmptyState({ icon: Icon, title, text }: { icon: any; title: string; text: string }) {
  return (
    <div className="leaderboard-state">
      <Icon size={38} />
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}

function formatNumber(value: number, locale = 'uz-UZ') {
  return new Intl.NumberFormat(locale).format(value || 0);
}

function formatDateTime(value: string, locale: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getInitial(name: string) {
  return (name || 'A').trim().charAt(0).toUpperCase();
}
