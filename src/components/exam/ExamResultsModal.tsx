import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { clsx } from 'clsx';
import { X, Users, Target, Award, Clock, Activity, Loader2, Download, Search, Edit3, XCircle, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { examsApi } from '@/api/exams.api';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { apiClient } from '@/api/axios';
import { useAuthStore } from '@/store/auth.store';

function AttemptDetailsModal({ attemptId, onClose }: { attemptId: string, onClose: () => void }) {
  const { t } = useTranslation();
  const [details, setDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    examsApi.getAttemptResultDetails(attemptId)
      .then((res: any) => { if (!cancelled) setDetails(res); })
      .catch((err: any) => {
        if (!cancelled) {
          console.error(err);
          toast.error(err.response?.data?.message || t('examResults.messages.errorLoading', "Ma'lumotlarni yuklashda xatolik"));
        }
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [attemptId, t]);

  const detailQuestions = Array.isArray(details?.questions) ? details.questions : [];

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: 'var(--bg-1)', borderRadius: 16, width: '100%', maxWidth: 700, maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-2)' }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{t('examResults.modals.detailsTitle', 'Natija tafsilotlari')}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
        </div>
        <div style={{ padding: 24, overflowY: 'auto', flex: 1 }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Loader2 className="spin" size={32} color="var(--blue-500)" /></div>
          ) : details ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {detailQuestions.length === 0 ? (
                <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>
                  {t('common.noData', "Ma'lumot topilmadi")}
                </div>
              ) : detailQuestions.map((q: any, i: number) => (
                <div key={q.questionId} style={{ padding: 16, border: '1px solid var(--border-2)', borderRadius: 12, background: 'var(--surface-1)' }}>
                  <div style={{ fontWeight: 600, marginBottom: 12 }}>{i + 1}. {q.question}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13 }}>
                    <div style={{ color: q.correct ? 'var(--green-500)' : 'var(--red-500)' }}>
                      <strong>{t('examResults.modals.employeeAnswer', 'Xodim javobi:')}</strong> {q.skipped ? t('examResults.status.unknown', "O'tkazib yuborilgan") : (Array.isArray(q.selectedAnswer) ? q.selectedAnswer.join(', ') : '-')}
                    </div>
                    {!q.correct && (
                      <div style={{ color: 'var(--green-500)' }}>
                        <strong>{t('examResults.modals.correctAnswer', "To'g'ri javob:")}</strong> {Array.isArray(q.correctAnswer) ? q.correctAnswer.join(', ') : '-'}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function ExamResultsModal({ exam, onClose }: { exam: any, onClose: () => void }) {
  const { t, i18n } = useTranslation();
  const { user } = useAuthStore();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [detailsAttemptId, setDetailsAttemptId] = useState<string | null>(null);

  // Modals state
  const [addScoreModal, setAddScoreModal] = useState<{ isOpen: boolean; attemptId: string; amount: number | string }>({ isOpen: false, attemptId: '', amount: 10 });
  const [addAttemptModal, setAddAttemptModal] = useState<{ isOpen: boolean; userId: string; amount: number | string }>({ isOpen: false, userId: '', amount: 1 });
  const [cancelModal, setCancelModal] = useState<{ isOpen: boolean; attemptId: string }>({ isOpen: false, attemptId: '' });
  const canMutateResults = ['super_admin', 'admin'].includes(user?.role || '');

  const fetchResults = async (signal?: AbortSignal) => {
    try {
      setLoading(true);
      const res = await examsApi.getResultsAnalytics({ examId: exam.id, search: debouncedSearch || undefined, page, limit: pageSize });
      if (signal?.aborted) return;
      setData(res);
    } catch (err: any) {
      if (!signal?.aborted) {
        toast.error(err.response?.data?.message || t('examResults.messages.errorLoading', "Natijalarni yuklashda xatolik yuz berdi"));
      }
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPage(1);
      setDebouncedSearch(search.trim());
    }, 350);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const controller = new AbortController();
    fetchResults(controller.signal);
    return () => controller.abort();
  }, [exam.id, debouncedSearch, page]);

  const handleExport = async () => {
    try {
      toast.loading(t('examResults.messages.exporting', "Eksport qilinmoqda..."), { id: 'export-csv' });
      const csvData = await examsApi.exportResultsCsv({ examId: exam.id, search: debouncedSearch || undefined });
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `Natijalar_${exam.title}_${new Date().toISOString().slice(0,10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(t('examResults.messages.exportSuccess', "Muvaffaqiyatli yuklab olindi"), { id: 'export-csv' });
    } catch (err) {
      toast.error(t('examResults.messages.exportError', "Eksport qilishda xatolik"), { id: 'export-csv' });
    }
  };

  const handleCancelResult = async () => {
    try {
      await apiClient.post(`/exams/results/${cancelModal.attemptId}/cancel`);
      toast.success(t('examResults.messages.cancelSuccess', "Natija bekor qilindi"));
      setCancelModal({ isOpen: false, attemptId: '' });
      fetchResults();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || t('common.error', 'Xatolik yuz berdi'));
    }
  };

  const handleAddScore = async () => {
    const amount = parseInt(addScoreModal.amount as string);
    if (isNaN(amount) || amount <= 0 || amount > 100) {
      toast.error(t('examResults.messages.invalidAmount', "Qiymat 1 dan 100 gacha bo'lishi kerak"));
      return;
    }

    try {
      await apiClient.post(`/exams/results/${addScoreModal.attemptId}/add-score`, { amount });
      toast.success(t('examResults.messages.addScoreSuccess', "Ball qo'shildi!"));
      setAddScoreModal({ isOpen: false, attemptId: '', amount: 10 });
      fetchResults();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || t('common.error', 'Xatolik yuz berdi'));
    }
  };

  const handleAddAttempt = async () => {
    const amount = parseInt(addAttemptModal.amount as string);
    if (isNaN(amount) || amount <= 0 || amount > 10) {
      toast.error(t('examResults.messages.invalidAttemptAmount', "Urinishlar soni 1 dan 10 gacha bo'lishi kerak"));
      return;
    }

    try {
      await apiClient.post(`/exams/${exam.id}/users/${addAttemptModal.userId}/add-attempt`, { amount });
      toast.success(t('examResults.messages.addAttemptSuccess', "Qo'shimcha urinish muvaffaqiyatli berildi!"));
      setAddAttemptModal({ isOpen: false, userId: '', amount: 1 });
      fetchResults();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Xatolik yuz berdi");
    }
  };

  const paginatedResults = useMemo(() => Array.isArray(data?.results) ? data.results : [], [data?.results]);
  const totalResults = Number(data?.pagination?.total || paginatedResults.length || 0);
  const totalPages = Number(data?.pagination?.totalPages || 1);

  const css = `
    .erm-overlay {
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      background: rgba(15,23,42,0.6); backdrop-filter: blur(8px);
      z-index: 9999; display: flex; align-items: center; justify-content: center;
      font-family: var(--font);
    }
    .erm-container {
      width: 100vw; height: 100vh; max-width: none; max-height: none;
      background: var(--bg-1); border-radius: 0;
      display: flex; flex-direction: column; overflow: hidden;
    }
    .erm-header {
      padding: 24px 32px; background: var(--bg-2); border-bottom: 1px solid var(--border-1);
      display: flex; align-items: flex-start; justify-content: space-between; gap: 20px;
    }
    .erm-title { font-size: 20px; font-weight: 800; color: var(--text-primary); margin-bottom: 6px; }
    .erm-subtitle { font-size: 13px; color: var(--text-muted); font-weight: 500; display: flex; align-items: center; gap: 8px; }
    .erm-badge {
      padding: 4px 10px; border-radius: 99px; font-size: 11px; font-weight: 700;
      background: rgba(59,130,246,0.1); color: var(--blue-400); border: 1px solid rgba(59,130,246,0.2);
    }
    .erm-close {
      width: 36px; height: 36px; border-radius: 50%; background: var(--surface-2);
      border: 1px solid var(--border-2); display: flex; align-items: center; justify-content: center;
      color: var(--text-secondary); cursor: pointer; transition: all 0.2s;
    }
    .erm-close:hover { background: var(--surface-3); color: var(--text-primary); }
    .erm-body { flex: 1; overflow-y: auto; padding: 32px; }
    .erm-kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 32px; }
    .erm-kpi-card {
      background: var(--surface-1); border: 1px solid var(--border-1); border-radius: 16px;
      padding: 20px; display: flex; flex-direction: column; gap: 12px;
    }
    .erm-kpi-icon { width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; }
    .erm-kpi-value { font-size: 24px; font-weight: 800; color: var(--text-primary); }
    .erm-kpi-label { font-size: 12px; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em; }

    .erm-toolbar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; gap: 16px; flex-wrap: wrap; }
    .erm-search {
      position: relative; flex: 1; min-width: 260px; max-width: 400px;
    }
    .erm-search input {
      width: 100%; height: 42px; background: var(--bg-2); border: 1px solid var(--border-2);
      border-radius: 12px; padding: 0 16px 0 42px; font-size: 13px; color: var(--text-primary);
      transition: all 0.2s; font-family: var(--font);
    }
    .erm-search input:focus { border-color: var(--blue-500); outline: none; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
    .erm-search svg { position: absolute; left: 14px; top: 12px; width: 16px; height: 16px; color: var(--text-muted); }
    .erm-btn {
      height: 42px; padding: 0 20px; border-radius: 12px; font-size: 13px; font-weight: 600; cursor: pointer;
      display: flex; align-items: center; gap: 8px; transition: all 0.2s; border: none; font-family: var(--font);
    }
    .erm-btn-primary { background: linear-gradient(135deg, #2563eb, #3b82f6); color: #fff; box-shadow: 0 4px 12px rgba(59,130,246,0.25); }
    .erm-btn-primary:hover { box-shadow: 0 6px 16px rgba(59,130,246,0.35); transform: translateY(-1px); }

    .erm-table-container {
      background: var(--bg-2); border: 1px solid var(--border-1); border-radius: 16px; overflow: hidden;
    }
    .erm-table { width: 100%; border-collapse: collapse; text-align: left; }
    .erm-table th {
      padding: 16px 20px; font-size: 11px; font-weight: 700; color: var(--text-tertiary);
      text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid var(--border-1);
      background: var(--surface-1);
    }
    .erm-table td {
      padding: 16px 20px; border-bottom: 1px solid var(--border-1); font-size: 13px; font-weight: 500;
      color: var(--text-secondary);
    }
    .erm-table tr:last-child td { border-bottom: none; }
    .erm-table tr:hover td { background: var(--surface-1); }
    .erm-user { display: flex; align-items: center; gap: 12px; }
    .erm-avatar {
      width: 32px; height: 32px; border-radius: 8px; background: linear-gradient(135deg, var(--blue-500), var(--violet-500));
      display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 700; font-size: 13px;
    }
    .erm-user-info { display: flex; flex-direction: column; gap: 2px; }
    .erm-user-name { color: var(--text-primary); font-weight: 700; }
    .erm-user-dept { font-size: 11px; color: var(--text-muted); }
    .erm-score { font-size: 15px; font-weight: 800; }
    .erm-status {
      display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 99px;
      font-size: 11px; font-weight: 700;
    }
    .erm-status.passed { background: rgba(34,197,94,0.1); color: var(--green-500); border: 1px solid rgba(34,197,94,0.2); }
    .erm-status.failed { background: rgba(239,68,68,0.1); color: var(--red-500); border: 1px solid rgba(239,68,68,0.2); }

    .erm-actions { display: flex; gap: 6px; }
    .erm-action-btn { width: 32px; height: 32px; border-radius: 8px; border: none; background: var(--surface-2); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.2s; }
    .erm-action-btn:hover { background: var(--surface-3); }
    .erm-action-btn:disabled { opacity: 0.45; cursor: not-allowed; }

    /* Custom Input Modal */
    .erm-mini-modal-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 10001;
      display: flex; align-items: center; justify-content: center; padding: 20px;
    }
    .erm-mini-modal {
      background: var(--bg-1); border-radius: 16px; width: 100%; max-width: 400px;
      padding: 24px; box-shadow: 0 20px 40px rgba(0,0,0,0.4); border: 1px solid var(--border-1);
    }
    .erm-mini-modal h4 { margin: 0 0 8px 0; font-size: 18px; font-weight: 700; color: var(--text-primary); }
    .erm-mini-modal p { margin: 0 0 20px 0; font-size: 13px; color: var(--text-secondary); line-height: 1.5; }
    .erm-input {
      width: 100%; height: 42px; background: var(--bg-2); border: 1px solid var(--border-2);
      border-radius: 12px; padding: 0 16px; font-size: 14px; color: var(--text-primary);
      margin-bottom: 20px; font-family: var(--font); box-sizing: border-box;
    }
    .erm-input:focus { border-color: var(--blue-500); outline: none; }
    .erm-modal-actions { display: flex; gap: 12px; justify-content: flex-end; }
    .erm-modal-btn {
      height: 40px; padding: 0 20px; border-radius: 10px; font-size: 13px; font-weight: 600; cursor: pointer;
      display: flex; align-items: center; border: none; font-family: var(--font);
    }
    .erm-modal-btn-cancel { background: var(--surface-2); color: var(--text-primary); }
    .erm-modal-btn-cancel:hover { background: var(--surface-3); }
    .erm-modal-btn-confirm { background: var(--blue-500); color: #fff; }
    .erm-modal-btn-confirm:hover { background: var(--blue-600); }
    .erm-modal-btn-danger { background: var(--red-500); color: #fff; }
    .erm-modal-btn-danger:hover { background: var(--red-600); }

    @media (max-width: 768px) {
      .erm-kpi-grid { grid-template-columns: 1fr 1fr; }
      .erm-table th, .erm-table td { padding: 12px 14px; }
    }
  `;

  return createPortal(
    <AnimatePresence>
      <div className="erm-overlay">
        <style>{css}</style>
        <motion.div
          className="erm-container"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
        >
          <div className="erm-header">
            <div>
              <div className="erm-title">{t('examResults.title', `Test natijalari (${i18n.language === 'ru' ? exam.titleRu || exam.title : exam.title})`, { title: i18n.language === 'ru' ? exam.titleRu || exam.title : exam.title })}</div>
              <div className="erm-subtitle">
                <span>{exam.category || "Test"}</span>
                <span style={{ color: 'var(--border-2)' }}>•</span>
                <span className="erm-badge">Pass: {exam.passingScore}%</span>
              </div>
            </div>
            <button className="erm-close" onClick={onClose}><X size={18} /></button>
          </div>

          <div className="erm-body">
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 300, gap: 16, color: 'var(--text-muted)' }}>
                <Loader2 size={32} className="spin" style={{ color: 'var(--blue-500)' }} />
                <div style={{ fontWeight: 600 }}>{t('common.loading', 'Yuklanmoqda')}...</div>
              </div>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="erm-kpi-grid">
                  <div className="erm-kpi-card">
                    <div className="erm-kpi-icon" style={{ background: 'rgba(59,130,246,0.1)', color: 'var(--blue-400)' }}><Users size={18} /></div>
                    <div>
                      <div className="erm-kpi-value">{data?.kpis?.totalAttempts || 0}</div>
                      <div className="erm-kpi-label">{t('dash.kpi.totalUsers', 'Urinishlar')}</div>
                    </div>
                  </div>
                  <div className="erm-kpi-card">
                    <div className="erm-kpi-icon" style={{ background: 'rgba(34,197,94,0.1)', color: 'var(--green-500)' }}><Target size={18} /></div>
                    <div>
                      <div className="erm-kpi-value">{data?.kpis?.averageScore || 0}%</div>
                      <div className="erm-kpi-label">{t('dash.kpi.averageScore', "O'rtacha ball")}</div>
                    </div>
                  </div>
                  <div className="erm-kpi-card">
                    <div className="erm-kpi-icon" style={{ background: 'rgba(139,92,246,0.1)', color: 'var(--violet-400)' }}><Award size={18} /></div>
                    <div>
                      <div className="erm-kpi-value">{data?.kpis?.passRate || 0}%</div>
                      <div className="erm-kpi-label">{t('dash.kpi.examPassRate', "O'tish ko'rsatkichi")}</div>
                    </div>
                  </div>
                  <div className="erm-kpi-card">
                    <div className="erm-kpi-icon" style={{ background: 'rgba(245,158,11,0.1)', color: 'var(--amber-400)' }}><Clock size={18} /></div>
                    <div>
                      <div className="erm-kpi-value">{data?.kpis?.averageDuration || '0m'}</div>
                      <div className="erm-kpi-label">{t('dash.duration', "O'rtacha vaqt")}</div>
                    </div>
                  </div>
                </div>

                <div className="erm-toolbar">
                  <div className="erm-search">
                    <Search />
                    <input
                      type="text"
                      placeholder={t('examResults.search', "Xodim ismi yoki bo'limi bo'yicha qidirish...")}
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                    />
                  </div>
                  <button className="erm-btn erm-btn-primary" onClick={handleExport}>
                    <Download size={16} /> {t('examResults.exportCsv', 'Export CSV')}
                  </button>
                </div>

                <div className="erm-table-container">
                  <table className="erm-table">
                    <thead>
                      <tr>
                        <th>{t('examResults.table.fullName', 'Xodim')}</th>
                        <th>{t('examResults.table.score', 'Natija')}</th>
                        <th>{t('examResults.table.status', 'Holat')}</th>
                        <th>{t('examResults.table.tabel', 'Urinish')}</th>
                        <th>{t('examResults.table.time', 'Vaqt')}</th>
                        <th style={{ textAlign: 'right' }}>{t('examResults.table.actions', 'Amallar')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedResults.length === 0 ? (
                        <tr>
                          <td colSpan={6} style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                            <Activity size={32} style={{ opacity: 0.3, marginBottom: 12, margin: '0 auto' }} />
                            {t('common.noData', "Hech qanday ma'lumot topilmadi")}
                          </td>
                        </tr>
                      ) : (
                        paginatedResults.map((row: any) => (
                          <tr key={row.attemptId}>
                            <td>
                              <div className="erm-user">
                                <div className="erm-avatar">{String(row.employeeName || '?').charAt(0).toUpperCase()}</div>
                                <div className="erm-user-info">
                                  <div className="erm-user-name">{row.employeeName || '-'}</div>
                                  <div className="erm-user-dept">
                                    {row.department || '-'}{row.employeeId ? ` • ${row.employeeId}` : ''}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td>
                              <span className="erm-score" style={{ color: row.passed ? 'var(--green-400)' : 'var(--red-400)' }}>
                                {row.score}%
                              </span>
                            </td>
                            <td>
                              <span className={clsx('erm-status', row.passed ? 'passed' : 'failed')}>
                                {row.passed ? t('examResults.status.passed', "O'tdi") : t('examResults.status.failed', "Yiqildi")}
                              </span>
                            </td>
                            <td>
                              {row.attemptNumber}-{t('examResults.table.attemptSuffix', 'urinish')}
                            </td>
                            <td>
                              <span style={{ color: 'var(--text-secondary)' }}>
                                {row.submittedAt ? new Date(row.submittedAt).toLocaleString('uz-UZ', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
                              </span>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <div className="erm-actions" style={{ justifyContent: 'flex-end' }}>
                                <button className="erm-action-btn" title={t('examResults.actions.details', "Tafsilotlar")} onClick={() => setDetailsAttemptId(row.attemptId)}>
                                  <Eye size={16} color="var(--blue-400)" />
                                </button>
                                {canMutateResults && (
                                  <>
                                    <button className="erm-action-btn" title={t('examResults.actions.addScore', "Foiz qo'shish")} onClick={() => setAddScoreModal({ isOpen: true, attemptId: row.attemptId, amount: 10 })}>
                                      <Edit3 size={16} color="var(--amber-500)" />
                                    </button>
                                    <button
                                      className="erm-action-btn"
                                      title={t('examResults.actions.addAttempt', "Urinish qo'shish")}
                                      disabled={!row.userId}
                                      onClick={() => row.userId && setAddAttemptModal({ isOpen: true, userId: row.userId, amount: 1 })}
                                    >
                                      <Activity size={16} color="var(--violet-400)" />
                                    </button>
                                    <button className="erm-action-btn" title={t('examResults.actions.cancel', "Bekor qilish")} onClick={() => setCancelModal({ isOpen: true, attemptId: row.attemptId })}>
                                      <XCircle size={16} color="var(--red-500)" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>

                  {totalPages > 1 && (
                    <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border-1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--surface-1)' }}>
                      <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>
                        {totalResults} {t('common.all', 'tadan')} {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, totalResults)} {t('common.view', "ko'rsatilmoqda")}
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          className="erm-action-btn"
                          disabled={page === 1}
                          onClick={() => setPage(prev => Math.max(1, prev - 1))}
                          style={{ opacity: page === 1 ? 0.5 : 1 }}
                        >
                          <ChevronLeft size={16} />
                        </button>
                        <button
                          className="erm-action-btn"
                          disabled={page === totalPages}
                          onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                          style={{ opacity: page === totalPages ? 0.5 : 1 }}
                        >
                          <ChevronRight size={16} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>

      {detailsAttemptId && (
        <AttemptDetailsModal
          attemptId={detailsAttemptId}
          onClose={() => setDetailsAttemptId(null)}
        />
      )}

      {/* Modern Modals */}
      {addScoreModal.isOpen && (
        <div className="erm-mini-modal-overlay">
          <div className="erm-mini-modal">
            <h4>{t('examResults.modals.addScoreTitle', "Qo'shimcha foiz (ball) qo'shish")}</h4>
            <p>{t('examResults.modals.addScoreDesc', "Agar testda xatolik ketgan bo'lsa, xodim natijasiga foiz qo'shishingiz mumkin.")}</p>
            <input
              type="number"
              className="erm-input"
              placeholder={t('examResults.modals.scoreAmount', "Qo'shiladigan foiz (%)")}
              value={addScoreModal.amount}
              onChange={e => setAddScoreModal({...addScoreModal, amount: e.target.value})}
            />
            <div className="erm-modal-actions">
              <button className="erm-modal-btn erm-modal-btn-cancel" onClick={() => setAddScoreModal({ isOpen: false, attemptId: '', amount: 10 })}>{t('common.cancel', 'Bekor qilish')}</button>
              <button className="erm-modal-btn erm-modal-btn-confirm" onClick={handleAddScore}>{t('common.save', 'Saqlash')}</button>
            </div>
          </div>
        </div>
      )}

      {addAttemptModal.isOpen && (
        <div className="erm-mini-modal-overlay">
          <div className="erm-mini-modal">
            <h4>{t('examResults.modals.addAttemptTitle', "Qo'shimcha urinish berish")}</h4>
            <p>{t('examResults.modals.addAttemptDesc', "Xodimning oldingi muvaffaqiyatsiz urinishlari arxivlanadi va yana test ishlash imkoni beriladi.")}</p>
            <input
              type="number"
              className="erm-input"
              placeholder={t('examResults.modals.attemptAmount', "Arxivlanadigan urinishlar soni")}
              value={addAttemptModal.amount}
              onChange={e => setAddAttemptModal({...addAttemptModal, amount: e.target.value})}
            />
            <div className="erm-modal-actions">
              <button className="erm-modal-btn erm-modal-btn-cancel" onClick={() => setAddAttemptModal({ isOpen: false, userId: '', amount: 1 })}>{t('common.cancel', 'Bekor qilish')}</button>
              <button className="erm-modal-btn erm-modal-btn-confirm" onClick={handleAddAttempt}>{t('common.save', 'Saqlash')}</button>
            </div>
          </div>
        </div>
      )}

      {cancelModal.isOpen && (
        <div className="erm-mini-modal-overlay">
          <div className="erm-mini-modal">
            <h4>{t('examResults.modals.cancelTitle', "Natijani bekor qilish")}</h4>
            <p>{t('examResults.modals.cancelDesc', "Rostdan ham ushbu natijani bekor qilmoqchimisiz? Agar o'tish balidan o'tib sertifikat olgan bo'lsa, u ham bekor qilinadi!")}</p>
            <div className="erm-modal-actions">
              <button className="erm-modal-btn erm-modal-btn-cancel" onClick={() => setCancelModal({ isOpen: false, attemptId: '' })}>{t('common.cancel', 'Bekor qilish')}</button>
              <button className="erm-modal-btn erm-modal-btn-danger" onClick={handleCancelResult}>{t('common.delete', 'O`chirish')}</button>
            </div>
          </div>
        </div>
      )}

    </AnimatePresence>,
    document.body
  );
}
