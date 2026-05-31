import { useEffect, useCallback } from 'react';
import { apiClient } from '@/api/axios';

export type ViolationType =
  | 'TAB_SWITCH'
  | 'WINDOW_BLUR'
  | 'FULLSCREEN_EXIT'
  | 'F12_ATTEMPT'
  | 'DEVTOOLS_ATTEMPT'
  | 'VIEW_SOURCE_ATTEMPT'
  | 'RIGHT_CLICK_ATTEMPT';

interface AntiCheatOptions {
  attemptId: string;
  enabled: boolean;
  onViolation: (type: ViolationType, count: number, status: string) => void;
  onAutoSubmit: () => void;
}

export function useAntiCheat({ attemptId, enabled, onViolation, onAutoSubmit }: AntiCheatOptions) {

  const reportViolation = useCallback(async (type: ViolationType) => {
    if (!enabled || !attemptId) return;
    try {
      const res = await apiClient.post('/exams/violations/log', { attemptId, type });
      const data = res.data?.data ?? res.data;
      onViolation(type, data.violationCount, data.securityStatus);
      if (data.autoSubmitted) onAutoSubmit();
    } catch { /* silent */ }
  }, [attemptId, enabled, onViolation, onAutoSubmit]);

  // ── Fullscreen enforcement ──
  const requestFullscreen = useCallback(() => {
    const el = document.documentElement;
    if (el.requestFullscreen) el.requestFullscreen();
    else if ((el as any).webkitRequestFullscreen) (el as any).webkitRequestFullscreen();
  }, []);

  useEffect(() => {
    if (!enabled) return;
    requestFullscreen();

    const onFsChange = () => {
      const isFs = !!(document.fullscreenElement || (document as any).webkitFullscreenElement);
      if (!isFs) reportViolation('FULLSCREEN_EXIT');
    };
    document.addEventListener('fullscreenchange', onFsChange);
    document.addEventListener('webkitfullscreenchange', onFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', onFsChange);
      document.removeEventListener('webkitfullscreenchange', onFsChange);
      // Exit fullscreen on cleanup
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    };
  }, [enabled, requestFullscreen, reportViolation]);

  // ── Tab switch / visibility ──
  useEffect(() => {
    if (!enabled) return;
    const onVisibility = () => {
      if (document.hidden) reportViolation('TAB_SWITCH');
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [enabled, reportViolation]);

  // ── Window blur ──
  useEffect(() => {
    if (!enabled) return;
    const onBlur = () => reportViolation('WINDOW_BLUR');
    window.addEventListener('blur', onBlur);
    return () => window.removeEventListener('blur', onBlur);
  }, [enabled, reportViolation]);

  // ── Right click block ──
  useEffect(() => {
    if (!enabled) return;
    const onContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      reportViolation('RIGHT_CLICK_ATTEMPT');
    };
    document.addEventListener('contextmenu', onContextMenu);
    return () => document.removeEventListener('contextmenu', onContextMenu);
  }, [enabled, reportViolation]);

  // ── Keyboard security (F12, devtools shortcuts) ──
  useEffect(() => {
    if (!enabled) return;
    const onKeyDown = (e: KeyboardEvent) => {
      // F12
      if (e.key === 'F12') {
        e.preventDefault();
        reportViolation('F12_ATTEMPT');
        return;
      }
      // Ctrl+Shift+I/J/C (devtools)
      if (e.ctrlKey && e.shiftKey && ['i', 'I', 'j', 'J', 'c', 'C'].includes(e.key)) {
        e.preventDefault();
        reportViolation('DEVTOOLS_ATTEMPT');
        return;
      }
      // Ctrl+U (view source)
      if (e.ctrlKey && (e.key === 'u' || e.key === 'U')) {
        e.preventDefault();
        reportViolation('VIEW_SOURCE_ATTEMPT');
        return;
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [enabled, reportViolation]);

  return { requestFullscreen };
}
