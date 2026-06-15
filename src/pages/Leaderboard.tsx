import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Award,
  CalendarDays,
  Crown,
  History,
  Loader2,
  RefreshCw,
  Star,
  Target,
  Trophy,
  UserRound,
  Sparkles,
  TrendingUp,
  Building2,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useAuthStore } from '@/store/auth.store';
import {
  useLeaderboardStore,
  type DepartmentLeaderboardRanking,
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
    departmentRankings,
    myRanking,
    history,
    timeFilter,
    loading,
    departmentLoading,
    historyLoading,
    error,
    departmentError,
    setTimeFilter,
    fetchRankings,
    fetchDepartmentRankings,
    fetchMyRanking,
    fetchMyHistory,
    subscribeToEvents,
    unsubscribeFromEvents,
  } = useLeaderboardStore();
  const [activeTab, setActiveTab] = useState<'leaders' | 'departments' | 'history'>('leaders');

  useEffect(() => {
    fetchRankings();
    fetchDepartmentRankings();
    fetchMyRanking();
    fetchMyHistory();

    if (socket && user?.id) {
      subscribeToEvents(socket, user.id);
    }

    return () => {
      if (socket) unsubscribeFromEvents(socket);
    };
  }, [user?.id, socket, fetchRankings, fetchDepartmentRankings, fetchMyRanking, fetchMyHistory, subscribeToEvents, unsubscribeFromEvents]);

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
    fetchDepartmentRankings();
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
    <div className="leaderboard-root blur-fade">
      {/* Dynamic Animated Background elements for the whole page */}
      <div className="leaderboard-bg-glow glow-1"></div>
      <div className="leaderboard-bg-glow glow-2"></div>

      {/* Hero Section */}
      <section className="leaderboard-hero-premium">
        <div className="hero-mesh-bg"></div>
        <div className="hero-content">
          <div className="hero-badge">
            <Sparkles size={14} className="hero-badge-icon" />
            <span>{t('leaderboard.kicker', 'AGMK bilim reytingi')}</span>
          </div>
          <h1 className="hero-title">{t('leaderboard.title', 'Peshqadamlar reytingi')}</h1>
          <p className="hero-subtitle">
            {t(
              'leaderboard.subtitle',
              "Kurslar, imtihonlar va sertifikatlar bo'yicha real ballar asosida shakllangan reyting.",
            )}
          </p>
        </div>

        <div className="hero-me-card">
          <div className="me-card-glass"></div>
          <div className="me-card-content">
            <div className="me-top-row">
              <span className="me-label">{t('leaderboard.myPosition', 'Mening natijam')}</span>
              <div className="me-rank-badge">#{currentUserRanking?.rank || '-'}</div>
            </div>
            <div className="me-score-wrap">
              <span className="me-score-value">{formatNumber(currentUserRanking?.totalPoints || 0, locale)}</span>
              <span className="me-score-label">{t('leaderboard.totalPoints', 'jami ball')}</span>
            </div>
            <div className="me-bottom-row">
              <StarRating stars={currentUserRanking?.stars || 1} />
              <div className="me-trend">
                <TrendingUp size={14} /> +{formatNumber(currentUserRanking?.periodPoints || 0, locale)} {filterLabel(timeFilter).toLowerCase()}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Toolbar & Filters */}
      <section className="leaderboard-toolbar-premium">
        <div className="segmented-control" role="tablist">
          <button
            className={clsx('segment-btn', activeTab === 'leaders' && 'active')}
            onClick={() => setActiveTab('leaders')}
          >
            <Trophy size={16} />
            <span>{t('leaderboard.rankings', 'Reyting')}</span>
          </button>
          <button
            className={clsx('segment-btn', activeTab === 'departments' && 'active')}
            onClick={() => setActiveTab('departments')}
          >
            <Building2 size={16} />
            <span>{t('leaderboard.departments', 'Bo\'limlar')}</span>
          </button>
          <button
            className={clsx('segment-btn', activeTab === 'history' && 'active')}
            onClick={() => setActiveTab('history')}
          >
            <History size={16} />
            <span>{t('leaderboard.myHistory', 'Tarix')}</span>
          </button>
        </div>

        <div className="filter-pills" aria-label={t('leaderboard.period', 'Davr')}>
          {FILTERS.map((filter) => (
            <button
              key={filter}
              className={clsx('filter-pill', timeFilter === filter && 'active')}
              onClick={() => setTimeFilter(filter)}
            >
              {filterLabel(filter)}
            </button>
          ))}
        </div>

        <button className="btn-refresh-premium" onClick={reloadAll} disabled={loading || departmentLoading || historyLoading}>
          {loading || departmentLoading || historyLoading ? <Loader2 className="spin" size={16} /> : <RefreshCw size={16} />}
          <span>{t('leaderboard.refresh', 'Yangilash')}</span>
        </button>
      </section>

      {error && (
        <div className="alert-premium error">
          <span>{error}</span>
          <button onClick={reloadAll}>{t('leaderboard.retry', 'Qayta urinish')}</button>
        </div>
      )}

      {/* Metrics Row */}
      <section className="metrics-grid-premium">
        <MetricCardPremium icon={UserRound} label={t('leaderboard.stats.participants', 'Ishtirokchilar')} value={rankings.length} color="blue" />
        <MetricCardPremium icon={Target} label={t('leaderboard.stats.periodPoints', 'Davrdagi ball')} value={totalPeriodPoints} color="emerald" />
        <MetricCardPremium icon={Award} label={t('leaderboard.stats.myStars', 'Mening darajam')} value={currentUserRanking?.stars || 1} suffix="/5" color="amber" />
        <MetricCardPremium icon={CalendarDays} label={t('leaderboard.stats.period', 'Davr')} textValue={filterLabel(timeFilter)} color="purple" />
      </section>

      {/* Main Content Area */}
      <div className="main-content-area">
        {activeTab === 'leaders' ? (
          <main className="leaders-view">
            {loading ? (
              <LoadingStatePremium label={t('leaderboard.loading', 'Reyting yuklanmoqda...')} />
            ) : rankings.length ? (
              <>
                <section className="podium-premium" aria-label={t('leaderboard.topThree', 'Top 3')}>
                  {topThree[1] && <PodiumCardPremium ranking={topThree[1]} place={2} locale={locale} delay={0.1} />}
                  {topThree[0] && <PodiumCardPremium ranking={topThree[0]} place={1} locale={locale} delay={0} />}
                  {topThree[2] && <PodiumCardPremium ranking={topThree[2]} place={3} locale={locale} delay={0.2} />}
                </section>

                <section className="list-panel-premium">
                  <div className="panel-header">
                    <div>
                      <h2>{t('leaderboard.participants', 'Ishtirokchilar')}</h2>
                      <p>{t('leaderboard.participantsSub', 'Ball, bo\'lim va yulduz darajasi bo\'yicha tartiblangan ro\'yxat')}</p>
                    </div>
                  </div>
                  <div className="list-body">
                    {rest.map((ranking, idx) => (
                      <RankingRowPremium
                        key={ranking.id}
                        ranking={ranking}
                        isMe={ranking.userId === user?.id}
                        locale={locale}
                        index={idx}
                      />
                    ))}
                  </div>
                </section>
              </>
            ) : (
              <EmptyStatePremium
                icon={Trophy}
                title={t('leaderboard.emptyTitle', 'Reyting hali shakllanmagan')}
                text={t('leaderboard.emptyText', 'Kurs yoki imtihon yakunlanganda ballar shu yerda ko\'rinadi.')}
              />
            )}
          </main>
        ) : activeTab === 'departments' ? (
          <DepartmentsPanelPremium
            departments={departmentRankings}
            loading={departmentLoading}
            error={departmentError}
            onRetry={() => fetchDepartmentRankings()}
            locale={locale}
          />
        ) : (
          <HistoryPanelPremium history={history} loading={historyLoading} locale={locale} />
        )}
      </div>

      <style>{`
        .leaderboard-root {
          position: relative;
          display: flex;
          flex-direction: column;
          gap: 28px;
          padding-bottom: 40px;
          min-height: 100vh;
        }

        /* Ambient Background Glows */
        .leaderboard-bg-glow {
          position: fixed;
          border-radius: 50%;
          filter: blur(120px);
          z-index: -1;
          opacity: 0.4;
          pointer-events: none;
          animation: floatGlow 20s ease-in-out infinite alternate;
        }
        .leaderboard-bg-glow.glow-1 {
          top: -10%; left: -5%; width: 50vw; height: 50vw;
          background: radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%);
        }
        .leaderboard-bg-glow.glow-2 {
          bottom: -10%; right: -5%; width: 60vw; height: 60vw;
          background: radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%);
          animation-delay: -10s;
        }
        @keyframes floatGlow {
          0% { transform: translate(0, 0) scale(1); }
          100% { transform: translate(5%, 10%) scale(1.1); }
        }

        /* Premium Hero Section */
        .leaderboard-hero-premium {
          position: relative;
          display: grid;
          grid-template-columns: 1fr 380px;
          gap: 24px;
          align-items: stretch;
          border-radius: 24px;
          padding: 32px;
          overflow: hidden;
          background: var(--surface-1);
          border: 1px solid rgba(255, 255, 255, 0.05);
          box-shadow: 0 20px 40px -10px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.05);
        }
        .hero-mesh-bg {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(at 0% 0%, rgba(59, 130, 246, 0.15) 0px, transparent 50%),
            radial-gradient(at 100% 100%, rgba(139, 92, 246, 0.15) 0px, transparent 50%);
          z-index: 0;
          opacity: 0.8;
        }
        .hero-content {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 14px;
          border-radius: 999px;
          background: rgba(59, 130, 246, 0.1);
          border: 1px solid rgba(59, 130, 246, 0.2);
          color: #3b82f6;
          font-size: 13px;
          font-weight: 800;
          width: fit-content;
          margin-bottom: 20px;
          box-shadow: 0 0 20px rgba(59, 130, 246, 0.15);
        }
        .hero-title {
          margin: 0 0 12px 0;
          font-size: 42px;
          font-weight: 900;
          line-height: 1.1;
          letter-spacing: -1.5px;
          background: linear-gradient(135deg, var(--text-primary) 0%, var(--text-secondary) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .hero-subtitle {
          margin: 0;
          font-size: 16px;
          line-height: 1.6;
          color: var(--text-secondary);
          max-width: 480px;
        }

        /* Hero 'Me' Card */
        .hero-me-card {
          position: relative;
          border-radius: 20px;
          padding: 24px;
          overflow: hidden;
          z-index: 1;
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 10px 30px -10px rgba(0,0,0,0.2);
          transform: translateY(0);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .hero-me-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 40px -10px rgba(0,0,0,0.3);
        }
        .me-card-glass {
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.01));
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          z-index: 0;
        }
        .me-card-content {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          height: 100%;
          justify-content: space-between;
        }
        .me-top-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .me-label {
          font-size: 14px;
          font-weight: 700;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .me-rank-badge {
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
          padding: 4px 12px;
          border-radius: 12px;
          font-weight: 900;
          font-size: 18px;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
        }
        .me-score-value {
          display: block;
          font-size: 48px;
          font-weight: 900;
          line-height: 1;
          color: var(--text-primary);
          letter-spacing: -2px;
          margin-top: 16px;
        }
        .me-score-label {
          display: block;
          font-size: 13px;
          color: var(--text-tertiary);
          font-weight: 800;
          text-transform: uppercase;
          margin-top: 6px;
        }
        .me-bottom-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 20px;
          padding-top: 16px;
          border-top: 1px solid rgba(255,255,255,0.08);
        }
        .me-trend {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          font-weight: 800;
          color: #10b981;
          background: rgba(16, 185, 129, 0.1);
          padding: 4px 10px;
          border-radius: 8px;
        }

        /* Toolbar */
        .leaderboard-toolbar-premium {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
          padding: 8px;
          background: var(--surface-1);
          border-radius: 16px;
          border: 1px solid var(--border-1);
          box-shadow: 0 4px 20px rgba(0,0,0,0.05);
        }
        .segmented-control {
          display: flex;
          background: var(--bg-2);
          padding: 4px;
          border-radius: 12px;
          border: 1px solid var(--border-1);
        }
        .segment-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          border-radius: 8px;
          border: none;
          background: transparent;
          color: var(--text-secondary);
          font-weight: 700;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .segment-btn.active {
          background: var(--surface-1);
          color: var(--text-primary);
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }
        .filter-pills {
          display: flex;
          gap: 6px;
          overflow-x: auto;
          flex: 1;
          justify-content: center;
        }
        .filter-pill {
          padding: 8px 16px;
          border-radius: 99px;
          border: 1px solid var(--border-1);
          background: var(--bg-2);
          color: var(--text-secondary);
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
        }
        .filter-pill.active {
          background: rgba(59, 130, 246, 0.1);
          color: #3b82f6;
          border-color: rgba(59, 130, 246, 0.3);
        }
        .filter-pill:hover:not(.active) {
          border-color: var(--text-tertiary);
          color: var(--text-primary);
        }
        .btn-refresh-premium {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 20px;
          border-radius: 12px;
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          color: white;
          border: none;
          font-weight: 800;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }
        .btn-refresh-premium:hover:not(:disabled) {
          box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4);
          transform: translateY(-1px);
        }
        .btn-refresh-premium:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        .alert-premium {
          padding: 16px 20px; border-radius: 12px; background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.2); color: #ef4444;
          display: flex; justify-content: space-between; align-items: center;
        }
        .alert-premium button { background: transparent; border: 1px solid #ef4444; color: #ef4444; padding: 6px 12px; border-radius: 6px; cursor: pointer; }

        /* Metrics Grid */
        .metrics-grid-premium {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }
        .metric-card-premium {
          background: var(--surface-1);
          border-radius: 20px;
          padding: 20px;
          border: 1px solid var(--border-1);
          display: flex;
          align-items: center;
          gap: 16px;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          position: relative;
          overflow: hidden;
        }
        .metric-card-premium:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 24px rgba(0,0,0,0.08);
        }
        .metric-icon-wrap {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .metric-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
          z-index: 1;
        }
        .metric-val {
          font-size: 24px;
          font-weight: 900;
          color: var(--text-primary);
          line-height: 1;
        }
        .metric-lbl {
          font-size: 13px;
          font-weight: 700;
          color: var(--text-tertiary);
        }

        /* 3D Podium */
        .podium-premium {
          display: grid;
          grid-template-columns: 1fr 1.2fr 1fr;
          gap: 20px;
          align-items: end;
          margin: 40px 0 60px 0;
          padding: 0 20px;
        }
        .podium-card {
          position: relative;
          border-radius: 24px;
          padding: 32px 24px 24px 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          background: var(--surface-1);
          border: 1px solid var(--border-1);
          transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          animation: slideUpFade 0.6s ease forwards;
          opacity: 0;
          transform: translateY(30px);
        }
        @keyframes slideUpFade {
          to { opacity: 1; transform: translateY(0); }
        }
        .podium-card:hover {
          transform: translateY(-12px) scale(1.02) !important;
          z-index: 10;
        }
        .podium-card::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 24px;
          background: linear-gradient(180deg, rgba(255,255,255,0.05) 0%, transparent 100%);
          pointer-events: none;
        }
        .podium-rank-badge {
          position: absolute;
          top: -24px;
          width: 56px;
          height: 56px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          font-weight: 900;
          color: white;
          box-shadow: 0 8px 24px rgba(0,0,0,0.2);
          border: 4px solid var(--bg-1);
          z-index: 2;
        }
        /* Gold */
        .podium-card.place-1 { height: 320px; border-color: rgba(250, 204, 21, 0.3); box-shadow: 0 20px 40px rgba(250, 204, 21, 0.08); z-index: 3; }
        .podium-card.place-1 .podium-rank-badge { background: linear-gradient(135deg, #fde047, #eab308); color: #713f12; }
        .podium-card.place-1 .podium-score { color: #eab308; }
        /* Silver */
        .podium-card.place-2 { height: 280px; border-color: rgba(148, 163, 184, 0.3); box-shadow: 0 20px 40px rgba(148, 163, 184, 0.08); z-index: 2; }
        .podium-card.place-2 .podium-rank-badge { background: linear-gradient(135deg, #cbd5e1, #94a3b8); color: #1e293b; }
        .podium-card.place-2 .podium-score { color: #94a3b8; }
        /* Bronze */
        .podium-card.place-3 { height: 250px; border-color: rgba(245, 158, 11, 0.3); box-shadow: 0 20px 40px rgba(245, 158, 11, 0.08); z-index: 1; }
        .podium-card.place-3 .podium-rank-badge { background: linear-gradient(135deg, #fcd34d, #f59e0b); color: #78350f; }
        .podium-card.place-3 .podium-score { color: #f59e0b; }

        .podium-avatar {
          width: 72px;
          height: 72px;
          border-radius: 20px;
          background: var(--bg-2);
          border: 2px solid var(--border-1);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          font-weight: 900;
          color: var(--text-secondary);
          margin-top: 10px;
          margin-bottom: 16px;
        }
        .podium-name { font-size: 18px; font-weight: 900; color: var(--text-primary); line-height: 1.2; margin-bottom: 4px; }
        .podium-dept { font-size: 13px; font-weight: 600; color: var(--text-tertiary); margin-bottom: auto; }
        .podium-score-wrap { margin-top: 20px; text-align: center; }
        .podium-score { font-size: 32px; font-weight: 900; line-height: 1; letter-spacing: 0; }
        .podium-score-lbl { font-size: 11px; font-weight: 800; text-transform: uppercase; color: var(--text-tertiary); margin-top: 4px; }

        /* List Panel */
        .list-panel-premium {
          background: var(--surface-1);
          border-radius: 24px;
          border: 1px solid var(--border-1);
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0,0,0,0.05);
        }
        .panel-header {
          padding: 24px 32px;
          border-bottom: 1px solid var(--border-1);
          background: rgba(255,255,255,0.02);
        }
        .panel-header h2 { margin: 0 0 4px 0; font-size: 20px; font-weight: 900; }
        .panel-header p { margin: 0; font-size: 14px; color: var(--text-tertiary); }
        .list-body { display: flex; flex-direction: column; }
        .row-premium {
          display: grid;
          grid-template-columns: 60px minmax(0, 1fr) auto;
          align-items: center;
          gap: 20px;
          padding: 20px 32px;
          border-bottom: 1px solid var(--border-1);
          background: transparent;
          transition: background 0.2s, transform 0.2s;
          animation: slideUpFade 0.4s ease forwards;
          opacity: 0;
        }
        .row-premium:hover {
          background: var(--bg-2);
        }
        .row-premium:last-child { border-bottom: none; }
        .row-premium.is-me {
          background: linear-gradient(90deg, rgba(59, 130, 246, 0.08) 0%, rgba(59, 130, 246, 0.02) 100%);
          position: relative;
        }
        .row-premium.is-me::before {
          content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 4px;
          background: #3b82f6; border-radius: 0 4px 4px 0;
          box-shadow: 0 0 10px #3b82f6;
        }
        .row-rank {
          font-size: 20px; font-weight: 900; color: var(--text-tertiary);
        }
        .row-user {
          display: flex; align-items: center; gap: 16px;
        }
        .row-avatar {
          width: 48px; height: 48px; border-radius: 14px; background: var(--bg-2);
          border: 1px solid var(--border-1); display: flex; align-items: center; justify-content: center;
          font-size: 18px; font-weight: 900; color: var(--text-secondary);
        }
        .row-user-info strong { display: block; font-size: 16px; font-weight: 800; color: var(--text-primary); }
        .row-user-info small { display: block; font-size: 13px; color: var(--text-tertiary); margin-top: 4px; }
        .row-stats {
          display: flex; align-items: center; gap: 32px;
        }
        .row-score { text-align: right; }
        .row-score strong { display: block; font-size: 22px; font-weight: 900; color: var(--text-primary); line-height: 1; }
        .row-score span { display: block; font-size: 11px; font-weight: 800; color: var(--text-tertiary); text-transform: uppercase; margin-top: 6px; }

        .leaderboard-stars { display: flex; gap: 4px; }
        .leaderboard-stars svg { color: var(--border-1); fill: transparent; }
        .leaderboard-stars svg.filled { color: #f59e0b; fill: #f59e0b; filter: drop-shadow(0 0 4px rgba(245, 158, 11, 0.4)); }

        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }

        /* Responsive */
        @media (max-width: 1024px) {
          .leaderboard-hero-premium { grid-template-columns: 1fr; }
          .metrics-grid-premium { grid-template-columns: repeat(2, 1fr); }
          .podium-premium { gap: 12px; }
        }
        @media (max-width: 768px) {
          .podium-premium { display: flex; flex-direction: column; align-items: center; gap: 32px; margin: 32px 0; }
          .podium-card { width: 100%; max-width: 320px; height: auto !important; min-height: 200px; }
          .podium-card:hover { transform: translateY(-4px) scale(1.02) !important; }
          .row-premium { grid-template-columns: 40px 1fr; padding: 16px 20px; }
          .row-stats { grid-column: 1 / -1; justify-content: space-between; margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--border-1); }
          .leaderboard-toolbar-premium { flex-direction: column; align-items: stretch; }
          .filter-pills { overflow-x: auto; padding-bottom: 8px; justify-content: flex-start; }
          .hero-title { font-size: 32px; }
        }
      `}</style>
    </div>
  );
}

// ─── Subcomponents ───

function MetricCardPremium({ icon: Icon, label, value, suffix = '', textValue, color }: { icon: any; label: string; value?: number; suffix?: string; textValue?: string; color: string }) {
  const colorMap: Record<string, string> = {
    blue: '#3b82f6',
    emerald: '#10b981',
    amber: '#f59e0b',
    purple: '#8b5cf6',
  };
  const hex = colorMap[color] || colorMap.blue;
  return (
    <div className="metric-card-premium">
      <div className="metric-icon-wrap" style={{ background: `${hex}15`, color: hex }}>
        <Icon size={24} />
      </div>
      <div className="metric-info">
        <span className="metric-lbl">{label}</span>
        <span className="metric-val">{textValue || `${formatNumber(value || 0)}${suffix}`}</span>
      </div>
    </div>
  );
}

function PodiumCardPremium({ ranking, place, locale, delay }: { ranking: LeaderboardRanking; place: 1 | 2 | 3; locale: string; delay: number }) {
  const { t } = useTranslation();
  return (
    <article className={`podium-card place-${place}`} style={{ animationDelay: `${delay}s` }}>
      <div className="podium-rank-badge">{place === 1 ? <Crown size={28} /> : `#${place}`}</div>
      <div className="podium-avatar">{getInitial(ranking.userFullName)}</div>
      <div className="podium-name">{ranking.userFullName}</div>
      <div className="podium-dept">{ranking.userDepartment || 'AGMK'}</div>

      <div className="podium-score-wrap">
        <StarRating stars={ranking.stars} />
        <div className="podium-score" style={{ marginTop: '16px' }}>{formatNumber(ranking.totalPoints, locale)}</div>
        <div className="podium-score-lbl">{t('leaderboard.totalScoreLabel', 'Umumiy ball')}</div>
      </div>
    </article>
  );
}

function RankingRowPremium({ ranking, isMe, locale, index }: { ranking: LeaderboardRanking; isMe: boolean; locale: string; index: number }) {
  const { t } = useTranslation();
  return (
    <article className={clsx('row-premium', isMe && 'is-me')} style={{ animationDelay: `${0.1 + index * 0.05}s` }}>
      <div className="row-rank">#{ranking.rank}</div>
      <div className="row-user">
        <div className="row-avatar">{getInitial(ranking.userFullName)}</div>
        <div className="row-user-info">
          <strong>{ranking.userFullName}</strong>
          <small>{ranking.userDepartment || 'AGMK'}</small>
        </div>
      </div>
      <div className="row-stats">
        <StarRating stars={ranking.stars} />
        <div className="row-score">
          <strong>{formatNumber(ranking.totalPoints, locale)}</strong>
          <span>{t('leaderboard.pointsLabel', 'Ball')}</span>
        </div>
      </div>
    </article>
  );
}

function HistoryPanelPremium({ history, loading, locale }: { history: UserPoints[]; loading: boolean; locale: string }) {
  const { t } = useTranslation();

  if (loading) {
    return <LoadingStatePremium label={t('leaderboard.historyLoading', 'Tarix yuklanmoqda...')} />;
  }

  return (
    <section className="list-panel-premium">
      <div className="panel-header">
        <div>
          <h2>{t('leaderboard.pointsHistory', 'Ballar tarixi')}</h2>
          <p>{t('leaderboard.historySub', 'Oxirgi ball berilgan amallar')}</p>
        </div>
      </div>
      {history.length ? (
        <div className="list-body">
          {history.map((item, idx) => (
            <article key={item.id} className="row-premium" style={{ animationDelay: `${0.05 * idx}s` }}>
              <div className="metric-icon-wrap" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
                <Award size={20} />
              </div>
              <div className="row-user-info">
                <strong>{t(`leaderboard.sources.${item.sourceType}`, SOURCE_LABELS[item.sourceType] || item.sourceType)}</strong>
                <small>{formatDateTime(item.createdAt, locale)}</small>
              </div>
              <div className="row-score">
                <strong style={{ color: '#10b981' }}>+{formatNumber(item.pointsAwarded, locale)}</strong>
                <span>{t('leaderboard.pointsLabel', 'Ball')}</span>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyStatePremium
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
        <Star key={index} size={16} className={index < stars ? 'filled' : ''} />
      ))}
    </div>
  );
}

function LoadingStatePremium({ label }: { label: string }) {
  return (
    <div style={{ padding: '100px 20px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
      <Loader2 className="spin" size={40} style={{ margin: '0 auto 16px auto', color: '#3b82f6' }} />
      <div style={{ fontSize: 16, fontWeight: 600 }}>{label}</div>
    </div>
  );
}

function EmptyStatePremium({ icon: Icon, title, text }: { icon: any; title: string; text: string }) {
  return (
    <div style={{ padding: '80px 20px', textAlign: 'center', background: 'var(--surface-1)', borderRadius: '24px', border: '1px dashed var(--border-1)' }}>
      <div style={{ width: 80, height: 80, borderRadius: '24px', background: 'var(--bg-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px auto', color: 'var(--text-muted)' }}>
        <Icon size={40} />
      </div>
      <h3 style={{ fontSize: 24, fontWeight: 900, color: 'var(--text-primary)', marginBottom: 12 }}>{title}</h3>
      <p style={{ fontSize: 15, color: 'var(--text-tertiary)', maxWidth: '400px', margin: '0 auto', lineHeight: 1.6 }}>{text}</p>
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

function DepartmentsPanelPremium({
  departments,
  loading,
  error,
  onRetry,
  locale,
}: {
  departments: DepartmentLeaderboardRanking[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  locale: string;
}) {
  const { t } = useTranslation();

  if (loading) return <LoadingStatePremium label={t('leaderboard.departmentsLoading', "Bo'limlar reytingi yuklanmoqda...")} />;
  if (error) {
    return (
      <div className="alert-premium error">
        <span>{t('leaderboard.departmentsLoadError', "Bo'limlar reytingini yuklab bo'lmadi")}</span>
        <button onClick={onRetry}>{t('leaderboard.retry', 'Qayta urinish')}</button>
      </div>
    );
  }
  if (!departments.length) {
    return (
      <EmptyStatePremium
        icon={Building2}
        title={t('leaderboard.departmentsEmptyTitle', "Bo'limlar reytingi bo'sh")}
        text={t('leaderboard.departmentsEmptyText', "Hali hech qaysi bo'lim yetarli ball to'plamadi.")}
      />
    );
  }
  return (
    <section className="list-panel-premium">
      <div className="panel-header">
        <div>
          <h2>{t('leaderboard.departmentsPanelTitle', "Bo'limlar kesimida")}</h2>
          <p>{t('leaderboard.departmentsPanelSub', "O'zlashtirish va faollik bo'yicha kuchli bo'limlar")}</p>
        </div>
      </div>
      <div className="list-body">
        {departments.map((dept, idx) => (
          <div key={dept.departmentId || idx} className="ranking-row" style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '16px 24px', borderBottom: '1px solid var(--border-1)', background: 'var(--surface-1)', borderRadius: 12, marginBottom: 8 }}>
            <div style={{ width: '40px', fontWeight: 800, fontSize: '18px', color: idx < 3 ? '#fbbf24' : 'var(--text-tertiary)', textAlign: 'center' }}>
              #{dept.rank}
            </div>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg, rgba(59,130,246,0.1), rgba(139,92,246,0.1))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#60a5fa' }}>
              <Building2 size={24} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: '16px', color: 'var(--text-primary)', marginBottom: 4 }}>{dept.displayName}</div>
              <div style={{ fontSize: '13px', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <UserRound size={14} /> {t('leaderboard.participantsCount', '{{value}} ishtirokchi', { value: formatNumber(dept.participants, locale) })}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 800, fontSize: '18px', color: 'var(--text-primary)' }}>{formatNumber(dept.points, locale)}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: 0 }}>{t('leaderboard.totalPointsLabel', 'Jami ball')}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
