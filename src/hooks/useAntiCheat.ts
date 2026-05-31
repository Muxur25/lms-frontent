import { useEffect, useRef } from 'react';
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
  const fsActiveRef = useRef(false);

  // Callback larni ref da saqlash — dependency loop oldini olish
  const cbRef = useRef({ attemptId, enabled, onViolation, onAutoSubmit });
  useEffect(() => { cbRef.current = { attemptId, enabled, onViolation, onAutoSubmit }; });

  const reportViolation = (type: ViolationType) => {
    const { attemptId: id, enabled: en } = cbRef.current;
    if (!en || !id) return;
    apiClient.post('/exams/violations/log', { attemptId: id, type })
      .then(res => {
        const data = res.data?.data ?? res.data;
        cbRef.current.onViolation(type, data.violationCount, data.securityStatus);
        if (data.autoSubmitted) cbRef.current.onAutoSubmit();
      })
      .catch(() => {});
  };

  // ── Fullscreen — faqat bir marta mount/unmount ──
  useEffect(() => {
    if (!enabled) return;

    const enterFullscreen = async () => {
      const el = document.documentElement;
      try {
        if (el.requestFullscreen) await el.requestFullscreen();
        else if ((el as any).webkitRequestFullscreen) await (el as any).webkitRequestFullscreen();
        fsActiveRef.current = true;
      } catch { fsActiveRef.current = false; }
    };

    const onFsChange = () => {
      const isFs = !!(document.fullscreenElement || (document as any).webkitFullscreenElement);
      if (!isFs && fsActiveRef.current) {
        fsActiveRef.current = false;
        reportViolation('FULLSCREEN_EXIT');
      } else if (isFs) {
        fsActiveRef.current = true;
      }
    };

    document.addEventListener('fullscreenchange', onFsChange);
    document.addEventListener('webkitfullscreenchange', onFsChange);
    enterFullscreen();

    return () => {
      document.removeEventListener('fullscreenchange', onFsChange);
      document.removeEventListener('webkitfullscreenchange', onFsChange);
      // Cleanup da fullscreendan chiqmaymiz — foydalanuvchi o'zi chiqadi
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]); // faqat enabled o'zgarganda

  // ── Tab switch ──
  useEffect(() => {
    if (!enabled) return;
    const fn = () => { if (document.hidden) reportViolation('TAB_SWITCH'); };
    document.addEventListener('visibilitychange', fn);
    return () => document.removeEventListener('visibilitychange', fn);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  // ── Window blur — faqat fullscreen aktiv bo'lganda ──
  useEffect(() => {
    if (!enabled) return;
    const fn = () => { if (fsActiveRef.current) reportViolation('WINDOW_BLUR'); };
    window.addEventListener('blur', fn);
    return () => window.removeEventListener('blur', fn);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  // ── Right click ──
  useEffect(() => {
    if (!enabled) return;
    const fn = (e: MouseEvent) => { e.preventDefault(); reportViolation('RIGHT_CLICK_ATTEMPT'); };
    document.addEventListener('contextmenu', fn);
    return () => document.removeEventListener('contextmenu', fn);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  // ── Keyboard ──
  useEffect(() => {
    if (!enabled) return;
    const fn = (e: KeyboardEvent) => {
      if (e.key === 'F12') { e.preventDefault(); reportViolation('F12_ATTEMPT'); return; }
      if (e.ctrlKey && e.shiftKey && ['i','I','j','J','c','C'].includes(e.key)) {
        e.preventDefault(); reportViolation('DEVTOOLS_ATTEMPT'); return;
      }
      if (e.ctrlKey && (e.key === 'u' || e.key === 'U')) {
        e.preventDefault(); reportViolation('VIEW_SOURCE_ATTEMPT');
      }
    };
    document.addEventListener('keydown', fn);
    return () => document.removeEventListener('keydown', fn);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);
}
