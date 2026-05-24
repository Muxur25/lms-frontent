import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, Download, FileText, Info, Calendar, Eye, Tag, Lock, Loader2, ZoomIn, ZoomOut } from 'lucide-react';
import { apiClient } from '@/api/axios';
import toast from 'react-hot-toast';

// ─── URL Helpers ────────────────────────────────────────────────────────────

const API_BASE = () => import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

const isLocalFile = (url: string): boolean => {
  if (!url) return false;
  if (url.startsWith('/') || url.startsWith('api/v1')) return true;
  try {
    return url.startsWith(new URL(API_BASE()).origin);
  } catch {
    return false;
  }
};

const getRequestUrl = (url: string): string => {

  if (!url) return '';
  let clean = url;
  try {
    const origin = new URL(API_BASE()).origin;
    if (clean.startsWith(origin)) clean = clean.slice(origin.length);
  } catch {}
  if (clean.startsWith('/api/v1')) clean = clean.slice(7);
  else if (clean.startsWith('api/v1')) clean = clean.slice(6);
  return clean;
};

// ─── Types ───────────────────────────────────────────────────────────────────

interface Book {
  id: string;
  title: string;
  description: string;
  type: string;
  size: string;
  url: string;
  views: number;
  downloadable: boolean;
  createdBy: string;
  createdAt: string;
}

interface BookReaderProps {
  book: Book;
  onClose: () => void;
  isRu: boolean;
  onDownload: (e: React.MouseEvent, book: Book) => void;
}

// ─── BookReader ───────────────────────────────────────────────────────────────

export default function BookReader({ book, onClose, isRu, onDownload }: BookReaderProps) {
  const [fileBlob, setFileBlob] = useState<Uint8Array | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [scale, setScale] = useState(1.25);

  const zoom = useCallback((dir: 1 | -1) => {
    setScale(s => Math.max(0.5, Math.min(3.0, +(s + dir * 0.25).toFixed(2))));
  }, []);

  // Block print for non-downloadable
  useEffect(() => {
    if (book.downloadable) return;
    const style = document.createElement('style');
    style.id = 'no-print-style';
    style.innerHTML = '@media print { body { display: none !important; } }';
    document.head.appendChild(style);
    return () => document.getElementById('no-print-style')?.remove();
  }, [book.downloadable]);

  // Override parent .page-content layout so the reader fills the viewport
  useEffect(() => {
    const el = document.querySelector<HTMLElement>('.page-content');
    if (!el) return;
    const prev = {
      overflow: el.style.overflow,
      padding: el.style.padding,
      display: el.style.display,
      flexDirection: el.style.flexDirection,
    };
    el.style.overflow = 'hidden';
    el.style.padding = '16px';
    el.style.display = 'flex';
    el.style.flexDirection = 'column';
    return () => {
      el.style.overflow = prev.overflow;
      el.style.padding = prev.padding;
      el.style.display = prev.display;
      el.style.flexDirection = prev.flexDirection;
    };
  }, []);

  // Load the PDF as a binary Uint8Array
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setFileBlob(null);

    const load = async () => {
      const url = book.url;
      try {
        if (isLocalFile(url)) {
          const res = await apiClient.get(getRequestUrl(url), { responseType: 'arraybuffer' });
          if (!cancelled) setFileBlob(new Uint8Array(res.data));
        } else {
          const res = await fetch(url);
          const buf = await res.arrayBuffer();
          if (!cancelled) setFileBlob(new Uint8Array(buf));
        }
      } catch (err) {
        console.error('BookReader: failed to load file', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [book.url]);

  const formatDate = (s: string) => {
    if (!s) return '';
    const d = new Date(s);
    return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
  };

  const isPdf = book.type?.toUpperCase() === 'PDF';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        background: '#090d16',
        borderRadius: 16,
        border: '1px solid rgba(255,255,255,0.08)',
        overflow: 'hidden',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      {/* ── Header ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 20px',
          background: 'rgba(13,20,35,0.97)',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          gap: 12,
          flexShrink: 0,
          flexWrap: 'wrap',
        }}
      >
        {/* Left */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          <button
            onClick={onClose}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
              color: '#e2e8f0', padding: '6px 12px', borderRadius: 8,
              cursor: 'pointer', fontSize: 13, fontWeight: 600, flexShrink: 0,
            }}
          >
            <ChevronLeft size={15} />
            {isRu ? 'Назад' : 'Ortga'}
          </button>
          <div style={{ borderLeft: '1px solid rgba(255,255,255,0.12)', height: 24 }} />
          <div style={{ minWidth: 0 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 400 }}>
              {book.title}
            </h2>
            <div style={{ display: 'flex', gap: 8, marginTop: 2, alignItems: 'center' }}>
              <span style={{ background: 'rgba(6,182,212,0.15)', color: '#22d3ee', fontSize: 10, padding: '1px 6px', borderRadius: 4, fontWeight: 600 }}>
                {book.type}
              </span>
              {book.size && <span style={{ fontSize: 11, color: '#64748b' }}>{book.size}</span>}
            </div>
          </div>
        </div>

        {/* Right */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {isPdf && (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              padding: '4px', background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.05)', borderRadius: 10, marginRight: 8
            }}>
              <button onClick={() => zoom(-1)} style={zoomBtnStyle} title={isRu ? 'Уменьшить' : 'Kichraytirish'}>
                <ZoomOut size={14} />
              </button>
              <span style={{ fontSize: 13, color: '#94a3b8', fontWeight: 600, minWidth: 46, textAlign: 'center' }}>
                {Math.round(scale * 100)}%
              </span>
              <button onClick={() => zoom(1)} style={zoomBtnStyle} title={isRu ? 'Увеличить' : 'Kattalashtirish'}>
                <ZoomIn size={14} />
              </button>
              <button onClick={() => setScale(1.0)} style={{ ...zoomBtnStyle, fontSize: 11, padding: '4px 8px', width: 'auto' }}>
                100%
              </button>
              <button onClick={() => setScale(2.2)} style={{ ...zoomBtnStyle, fontSize: 11, padding: '4px 8px', width: 'auto', color: '#22d3ee', borderColor: 'rgba(6,182,212,0.3)' }}>
                {isRu ? 'Крупно' : 'Katta'}
              </button>
            </div>
          )}

          <button
            onClick={() => setSidebarOpen(o => !o)}
            title={isRu ? 'Информация о документе' : "Hujjat ma'lumotlari"}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 34, height: 34,
              background: sidebarOpen ? 'rgba(6,182,212,0.15)' : 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: sidebarOpen ? '#22d3ee' : '#94a3b8',
              borderRadius: 8, cursor: 'pointer',
            }}
          >
            <Info size={16} />
          </button>

          {book.downloadable && (
            <button
              onClick={(e) => onDownload(e, book)}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                background: 'linear-gradient(135deg,#06b6d4,#0891b2)',
                border: 'none', color: '#fff',
                padding: '7px 14px', borderRadius: 8,
                fontWeight: 600, fontSize: 13, cursor: 'pointer',
              }}
            >
              <Download size={14} />
              {isRu ? 'Скачать' : 'Yuklab olish'}
            </button>
          )}
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* Viewer */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#0f172a' }}>
          {loading ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, color: '#94a3b8' }}>
              <Loader2 size={40} className="animate-spin" style={{ color: '#22d3ee' }} />
              <span style={{ fontSize: 14 }}>{isRu ? 'Загрузка документа...' : 'Hujjat yuklanmoqda...'}</span>
            </div>
          ) : isPdf && fileBlob ? (
            <PDFViewer
              data={fileBlob}
              downloadable={book.downloadable}
              isRu={isRu}
              scale={scale}
            />
          ) : (
            <NonPDFCard book={book} isRu={isRu} onDownload={onDownload} />
          )}
        </div>

        {/* Info Sidebar */}
        <div
          style={{
            width: sidebarOpen ? 300 : 0,
            opacity: sidebarOpen ? 1 : 0,
            overflow: 'hidden',
            flexShrink: 0,
            background: '#0d1423',
            borderLeft: sidebarOpen ? '1px solid rgba(255,255,255,0.08)' : 'none',
            transition: 'width 0.25s ease, opacity 0.2s ease',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ width: 300, height: '100%', overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 20 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: '#f8fafc', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Info size={15} style={{ color: '#22d3ee' }} />
              {isRu ? 'Детали документа' : 'Hujjat tafsilotlari'}
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <SidebarRow icon={<Calendar size={15} />} label={isRu ? 'Дата добавления' : 'Yuklangan sana'} value={formatDate(book.createdAt)} />
              <SidebarRow icon={<Eye size={15} />} label={isRu ? 'Просмотры' : "Ko'rishlar"} value={`${book.views || 0} ${isRu ? 'раз' : 'marta'}`} />
              <SidebarRow
                icon={<Tag size={15} />}
                label={isRu ? 'Права доступа' : 'Yuklab olish huquqi'}
                value={book.downloadable ? (isRu ? 'Разрешено' : 'Ruxsat bor') : (isRu ? 'Только чтение' : "Faqat o'qish")}
                valueColor={book.downloadable ? '#34d399' : '#f87171'}
              />
            </div>

            {book.description && (
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 16 }}>
                <div style={{ fontSize: 10, color: '#475569', textTransform: 'uppercase', fontWeight: 700, marginBottom: 6 }}>
                  {isRu ? 'Описание' : 'Tafsif'}
                </div>
                <p style={{ fontSize: 13, color: '#cbd5e1', lineHeight: 1.6, margin: 0 }}>{book.description}</p>
              </div>
            )}

            <div style={{ marginTop: 'auto', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 10, padding: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#cbd5e1', marginBottom: 6 }}>
                🛡️ {isRu ? 'Конфиденциально' : 'Maxfiylik'}
              </div>
              <p style={{ fontSize: 11, color: '#475569', lineHeight: 1.5, margin: 0 }}>
                {isRu
                  ? 'Этот документ предназначен только для внутреннего использования.'
                  : "Ushbu hujjat faqatgina AGMK xodimlari uchun mo'ljallangan."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Sidebar Row ─────────────────────────────────────────────────────────────

function SidebarRow({ icon, label, value, valueColor }: { icon: React.ReactNode; label: string; value: string; valueColor?: string }) {
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
      <span style={{ color: '#475569', marginTop: 2, flexShrink: 0 }}>{icon}</span>
      <div>
        <div style={{ fontSize: 10, color: '#475569', textTransform: 'uppercase', fontWeight: 600 }}>{label}</div>
        <div style={{ fontSize: 13, color: valueColor || '#cbd5e1', fontWeight: 500 }}>{value}</div>
      </div>
    </div>
  );
}

// ─── Non-PDF Card ─────────────────────────────────────────────────────────────

function NonPDFCard({ book, isRu, onDownload }: { book: Book; isRu: boolean; onDownload: (e: React.MouseEvent, book: Book) => void }) {
  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{
        maxWidth: 440, width: '100%', textAlign: 'center', padding: '40px 32px',
        background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20
      }}>
        <div style={{ width: 64, height: 64, borderRadius: 16, background: 'rgba(6,182,212,0.1)', color: '#22d3ee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <FileText size={32} />
        </div>
        <div>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: '#f8fafc', marginBottom: 8 }}>{book.title}</h3>
          <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.6 }}>
            {isRu ? 'Просмотр этого формата не поддерживается в браузере.' : "Ushbu format brauzerda ko'rib bo'lmaydi."}
          </p>
        </div>
        {book.downloadable ? (
          <button onClick={(e) => onDownload(e, book)} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'linear-gradient(135deg,#06b6d4,#0891b2)', border: 'none',
            color: '#fff', padding: '10px 24px', borderRadius: 10,
            fontWeight: 600, fontSize: 14, cursor: 'pointer', width: '100%', justifyContent: 'center'
          }}>
            <Download size={16} />
            {isRu ? 'Скачать файл' : 'Faylni yuklab olish'}
          </button>
        ) : (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: 12,
            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: 10, color: '#f87171', fontSize: 13
          }}>
            <Lock size={15} />
            {isRu ? 'Скачивание ограничено' : 'Yuklab olish cheklangan'}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── PDF Viewer ───────────────────────────────────────────────────────────────

interface PDFViewerProps {
  data: Uint8Array;
  downloadable: boolean;
  isRu: boolean;
  scale: number;
}

function PDFViewer({ data, downloadable, isRu, scale }: PDFViewerProps) {
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [numPages, setNumPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Block keyboard shortcuts for protected docs
  useEffect(() => {
    if (downloadable) return;
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && ['p', 'P', 's', 'S'].includes(e.key)) {
        e.preventDefault();
        toast.error(isRu ? 'Печать и скачивание ограничены.' : "Chop etish va yuklab olish cheklangan.");
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [downloadable, isRu]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setPdfDoc(null);

    const initPdf = async () => {
      try {
        // Dynamic import to avoid Vite ESM worker resolution issues
        const pdfjs = await import('pdfjs-dist');
        
        // Set worker path dynamically
        if (!pdfjs.GlobalWorkerOptions.workerSrc) {
          pdfjs.GlobalWorkerOptions.workerSrc = new URL(
            'pdfjs-dist/build/pdf.worker.min.js',
            import.meta.url
          ).toString();
        }

        const task = pdfjs.getDocument({ data: data.slice(0) });
        const doc = await task.promise;
        if (cancelled) { doc.destroy(); return; }

        setPdfDoc(doc);
        setNumPages(doc.numPages);
      } catch (err: any) {
        console.error('PDFViewer: failed to load PDF', err);
        if (!cancelled) setError(isRu ? 'PDF yuklanmadi. Fayl buzilgan bo\'lishi mumkin.' : "PDF yuklanmadi. Fayl buzilgan bo'lishi mumkin.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    initPdf();
    return () => { cancelled = true; };
  }, [data]);


  if (loading) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, color: '#94a3b8' }}>
        <Loader2 size={40} className="animate-spin" style={{ color: '#22d3ee' }} />
        <span style={{ fontSize: 14 }}>{isRu ? 'Загрузка PDF...' : 'PDF yuklanmoqda...'}</span>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, color: '#f87171', padding: 24 }}>
        <FileText size={48} style={{ color: '#475569' }} />
        <p style={{ textAlign: 'center', fontSize: 14, maxWidth: 400 }}>{error}</p>
      </div>
    );
  }

  return (
    <div
      style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
      onContextMenu={!downloadable ? e => e.preventDefault() : undefined}
    >

      {/* Scrollable pages */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        overflowX: 'auto',
        padding: '20px 16px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 20,
        background: '#111827',
      }}>
        {pdfDoc && Array.from({ length: numPages }, (_, i) => (
          <PDFPage key={i + 1} doc={pdfDoc} pageNum={i + 1} scale={scale} />
        ))}
      </div>
    </div>
  );
}

const zoomBtnStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  width: 32, height: 32, background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)', color: '#cbd5e1',
  borderRadius: 7, cursor: 'pointer',
};

// ─── Single PDF Page ──────────────────────────────────────────────────────────

function PDFPage({ doc, pageNum, scale }: { doc: any; pageNum: number; scale: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rendered, setRendered] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let task: any = null;

    const render = async () => {
      try {
        setRendered(false);
        const page = await doc.getPage(pageNum);
        if (cancelled) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        // Use devicePixelRatio for crisp rendering on retina screens
        const dpr = window.devicePixelRatio || 1;
        const viewport = page.getViewport({ scale: scale * dpr });

        canvas.width = viewport.width;
        canvas.height = viewport.height;
        canvas.style.width = `${viewport.width / dpr}px`;
        canvas.style.height = `${viewport.height / dpr}px`;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        task = page.render({ canvasContext: ctx, viewport });
        await task.promise;
        if (!cancelled) setRendered(true);
      } catch (err: any) {
        if (err?.name !== 'RenderingCancelledException') {
          console.error(`Page ${pageNum} render error:`, err);
        }
      }
    };

    render();
    return () => {
      cancelled = true;
      task?.cancel?.();
    };
  }, [doc, pageNum, scale]);

  return (
    <div style={{
      position: 'relative',
      background: '#ffffff',
      borderRadius: 6,
      overflow: 'hidden',
      boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
      userSelect: 'none',
      flexShrink: 0,
    }}>
      <canvas ref={canvasRef} style={{ display: 'block' }} />
      {!rendered && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(255,255,255,0.85)',
          minWidth: 400, minHeight: 200,
        }}>
          <Loader2 size={28} className="animate-spin" style={{ color: '#0ea5e9' }} />
        </div>
      )}
    </div>
  );
}
