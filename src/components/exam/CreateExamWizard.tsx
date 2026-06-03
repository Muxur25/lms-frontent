import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Check, ChevronRight, ChevronLeft, Save, Plus, Trash2, Settings,
  FileText, Layers, Sparkles, Activity, Lock, Shuffle, Eye,
  Clock, Award, Zap, BookOpen, BarChart2, AlignLeft, Calendar, Key, Copy, Users, Search
} from 'lucide-react';
import { examsApi } from '@/api/exams.api';
import { apiClient } from '@/api/axios';
import toast from 'react-hot-toast';
import type { TestQuestion, Exam } from '@/api/exams.api';

interface CreateExamWizardProps {
  examToEdit?: Exam | null;
  onClose: () => void;
  onSuccess: (exam: Exam) => void;
}

const COLORS = [
  { hex: '#3b82f6', label: 'Ko\'k' },
  { hex: '#8b5cf6', label: 'Binafsha' },
  { hex: '#ec4899', label: 'Pushti' },
  { hex: '#ef4444', label: 'Qizil' },
  { hex: '#f59e0b', label: 'Sariq' },
  { hex: '#10b981', label: 'Yashil' },
  { hex: '#06b6d4', label: 'Moviy' },
  { hex: '#f97316', label: 'To\'q sariq' },
];

const CATEGORIES = [
  'Sifat Menejmenti', 'Xavfsizlik texnikasi', 'Ishlab chiqarish',
  'Metallurgiya', 'Kimyo texnologiyasi', 'Ekologiya', 'Iqtisodiyot', 'Boshqaruv',
  'IT va Raqamli texnologiyalar', 'Huquq va Compliance', 'Moliya va Audit',
  'Kadrlar boshqaruvi', 'Logistika', 'Sog\'liqni saqlash', 'Muhandislik',
];

const VALIDITY_OPTIONS = [
  { value: 'months_3', label: '3 oy' },
  { value: 'months_6', label: '6 oy' },
  { value: 'year_1', label: '1 yil' },
  { value: 'years_2', label: '2 yil' },
  { value: 'lifetime', label: 'Butun umr' },
];

const STEPS = [
  { id: 1, label: 'Asosiy ma\'lumot', icon: FileText, desc: 'Test nomi va tavsifi' },
  { id: 2, label: 'Sozlamalar', icon: Settings, desc: 'Vaqt, ball va qoidalar' },
  { id: 3, label: 'Savollar', icon: Layers, desc: 'Savollar va javoblar' },
];

export function CreateExamWizard({ examToEdit, onClose, onSuccess }: CreateExamWizardProps) {
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [exam, setExam] = useState<Partial<Exam> & {
    startAt?: string; endAt?: string; password?: string;
    copyProtection?: boolean; validityPeriod?: string; allowedUsers?: string[];
    customCategory?: string;
  }>({
    title: '',
    description: '',
    category: '',
    customCategory: '',
    timeLimitMinutes: 60,
    passingScore: 70,
    maxAttempts: 3,
    shuffleQuestions: false,
    proctored: false,
    visibility: 'public',
    color: '#3b82f6',
    copyProtection: false,
    validityPeriod: 'year_1',
    allowedUsers: [],
  });

  // allowedUsers search
  const [userSearch, setUserSearch] = useState('');
  const [userResults, setUserResults] = useState<any[]>([]);
  const [userSearchLoading, setUserSearchLoading] = useState(false);

  const searchUsers = async (q: string) => {
    if (!q.trim()) { setUserResults([]); return; }
    setUserSearchLoading(true);
    try {
      const res = await apiClient.get(`/users?search=${encodeURIComponent(q)}`);
      const data = res.data?.data ?? res.data ?? [];
      setUserResults(Array.isArray(data) ? data.slice(0, 10) : []);
    } catch { setUserResults([]); }
    finally { setUserSearchLoading(false); }
  };

  useEffect(() => {
    const t = setTimeout(() => searchUsers(userSearch), 300);
    return () => clearTimeout(t);
  }, [userSearch]);

  useEffect(() => {
    if (examToEdit) {
      const isCustomCategory = examToEdit.category && !CATEGORIES.includes(examToEdit.category);
      setExam({
        title: examToEdit.title || '',
        description: examToEdit.description || '',
        category: isCustomCategory ? '__custom__' : (examToEdit.category || ''),
        customCategory: isCustomCategory ? examToEdit.category : '',
        timeLimitMinutes: examToEdit.timeLimitMinutes || 60,
        passingScore: examToEdit.passingScore || 70,
        maxAttempts: examToEdit.maxAttempts || 3,
        shuffleQuestions: examToEdit.shuffleQuestions || false,
        proctored: examToEdit.proctored || false,
        visibility: examToEdit.visibility || 'public',
        color: examToEdit.color || '#3b82f6',
        copyProtection: (examToEdit as any).copyProtection || false,
        validityPeriod: (examToEdit as any).validityPeriod || 'year_1',
        allowedUsers: (examToEdit as any).allowedUsers || [],
        startAt: (examToEdit as any).startAt ? new Date((examToEdit as any).startAt).toISOString().split('T')[0] : '',
        endAt: (examToEdit as any).endAt ? new Date((examToEdit as any).endAt).toISOString().split('T')[0] : '',
        password: (examToEdit as any).password || '',
      });

      if ((examToEdit as any).questions && (examToEdit as any).questions.length > 0) {
        setQuestions((examToEdit as any).questions.map((q: any) => ({
          type: q.type || 'single',
          question: q.text || q.question || '',
          options: q.options || ['', '', '', ''],
          correctAnswers: q.correctAnswers || [0],
          difficulty: q.difficulty || 'medium',
          points: q.points || 1,
          order: q.order || 0,
        })));
      }
    }
  }, [examToEdit]);

  const [questions, setQuestions] = useState<Partial<TestQuestion>[]>([
    {
      type: 'single',
      question: '',
      options: ['', '', '', ''],
      correctAnswers: [0],
      difficulty: 'medium',
      points: 1,
      order: 0,
    }
  ]);

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        type: 'single',
        question: '',
        options: ['', '', '', ''],
        correctAnswers: [0],
        difficulty: 'medium',
        points: 1,
        order: questions.length,
      }
    ]);
  };

  const updateQuestion = (index: number, updates: Partial<TestQuestion>) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], ...updates };
    setQuestions(updated);
  };

  const updateOption = (qIndex: number, optIndex: number, val: string) => {
    const updated = [...questions];
    const newOptions = [...(updated[qIndex].options || [])];
    newOptions[optIndex] = val;
    updated[qIndex].options = newOptions;
    setQuestions(updated);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const nextStep = () => {
    if (step < 3) { setDirection(1); setStep(prev => prev + 1); }
  };
  const prevStep = () => {
    if (step > 1) { setDirection(-1); setStep(prev => prev - 1); }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const payload = {
        ...exam,
        category: exam.customCategory?.trim() || exam.category,
        questions,
      };
      delete (payload as any).customCategory;
      
      let result;
      if (examToEdit) {
        result = await examsApi.update(examToEdit.id, payload as any);
        toast.success('Imtihon muvaffaqiyatli yangilandi! 🎉', { position: 'bottom-right' });
      } else {
        result = await examsApi.create(payload as any);
        toast.success('Imtihon muvaffaqiyatli yaratildi! 🎉', { position: 'bottom-right' });
      }
      onSuccess(result);
    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.message;
      const errorMsg = Array.isArray(msg) ? msg[0] : msg || (examToEdit ? 'Imtihonni yangilashda xatolik yuz berdi' : 'Imtihon yaratishda xatolik yuz berdi');
      toast.error(errorMsg, { position: 'bottom-right' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
  };

  const progress = ((step - 1) / 2) * 100;

  return createPortal(
    <AnimatePresence>
      <div className="cew-overlay">
        <style dangerouslySetInnerHTML={{ __html: `
          .cew-overlay {
            position: fixed; inset: 0; z-index: 1000;
            display: flex; align-items: center; justify-content: center;
            padding: 12px;
            background: rgba(4, 6, 14, 0.88);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
          }
          .cew-container {
            width: 100%; max-width: 1280px;
            height: 98vh;
            display: flex; flex-direction: column;
            background: var(--bg-1);
            border: 1px solid var(--border-2);
            border-radius: 28px;
            box-shadow: 0 32px 80px rgba(0,0,0,0.7), 0 0 60px rgba(59,130,246,0.08);
            overflow: hidden; position: relative;
            color: var(--text-primary);
          }

          /* ─── HEADER (3-column: brand | steps | close) ─── */
          .cew-header {
            display: grid;
            grid-template-columns: auto 1fr auto;
            align-items: center;
            gap: 24px;
            padding: 14px 24px;
            background: var(--bg-2);
            border-bottom: 1px solid var(--border-1);
            flex-shrink: 0;
          }
          .cew-header-brand { display: flex; align-items: center; gap: 12px; white-space: nowrap; }
          .cew-brand-icon {
            width: 38px; height: 38px; border-radius: 12px;
            background: linear-gradient(135deg, rgba(59,130,246,0.2), rgba(139,92,246,0.15));
            border: 1px solid rgba(59,130,246,0.2);
            display: flex; align-items: center; justify-content: center; flex-shrink: 0;
          }
          .cew-brand-title { font-size: 15px; font-weight: 800; letter-spacing: -0.3px; }
          .cew-brand-sub { font-size: 10px; color: var(--text-tertiary); font-weight: 500; margin-top: 1px; }
          .cew-close {
            width: 36px; height: 36px; border-radius: 10px;
            background: transparent; border: 1px solid transparent;
            color: var(--text-tertiary); display: flex; align-items: center; justify-content: center;
            cursor: pointer; transition: all var(--transition);
          }
          .cew-close:hover { background: var(--surface-2); border-color: var(--border-2); color: var(--text-primary); }

          /* ─── INLINE STEPS (inside header) ─── */
          .cew-steps-inline {
            display: flex; align-items: center; justify-content: center;
            gap: 4px; position: relative;
          }
          .cew-step-inline {
            display: flex; align-items: center; gap: 8px;
            padding: 8px 14px; border-radius: 12px;
            cursor: pointer; transition: background var(--transition);
            border: 1px solid transparent;
          }
          .cew-step-inline.active {
            background: rgba(59,130,246,0.1);
            border-color: rgba(59,130,246,0.2);
          }
          .cew-step-inline.done { cursor: pointer; }
          .cew-step-inline.done:hover { background: var(--surface-1); }
          .cew-step-dot-sm {
            width: 28px; height: 28px; border-radius: 9px; flex-shrink: 0;
            display: flex; align-items: center; justify-content: center;
            font-weight: 800; font-size: 12px;
            background: var(--bg-1); border: 1px solid var(--border-2);
            color: var(--text-muted); transition: all 0.3s;
          }
          .cew-step-inline.active .cew-step-dot-sm {
            background: var(--blue-500); border-color: var(--blue-600); color: #fff;
            box-shadow: 0 0 16px rgba(59,130,246,0.4);
          }
          .cew-step-inline.done .cew-step-dot-sm {
            background: rgba(34,197,94,0.12); border-color: rgba(34,197,94,0.25); color: var(--green-400);
          }
          .cew-step-label-sm { font-size: 12px; font-weight: 700; color: var(--text-tertiary); transition: color var(--transition); }
          .cew-step-inline.active .cew-step-label-sm { color: var(--text-primary); }
          .cew-step-inline.done .cew-step-label-sm { color: var(--text-secondary); }
          .cew-step-connector {
            width: 28px; height: 2px; border-radius: 99px;
            background: var(--border-2); flex-shrink: 0; transition: background 0.4s;
          }
          .cew-step-connector.done { background: var(--green-500); }
          /* Progress bar now at bottom of header */
          .cew-header-progress {
            position: absolute; bottom: 0; left: 0; right: 0;
            height: 2px; background: transparent;
          }
          .cew-header-progress-fill {
            height: 100%;
            background: linear-gradient(90deg, var(--blue-500), var(--violet-500));
            transition: width 0.5s cubic-bezier(0.4,0,0.2,1);
          }



          /* ─── BODY ─── */
          .cew-body {
            flex: 1; overflow-y: auto; overflow-x: hidden;
            background: var(--bg-0);
          }
          .cew-body::-webkit-scrollbar { width: 5px; }
          .cew-body::-webkit-scrollbar-track { background: transparent; }
          .cew-body::-webkit-scrollbar-thumb { background: var(--border-3); border-radius: 99px; }
          .cew-body::-webkit-scrollbar-thumb:hover { background: var(--text-muted); }
          .cew-page { padding: 32px 40px; min-height: 100%; }
          .cew-page-header { margin-bottom: 28px; }
          .cew-page-title { font-size: 20px; font-weight: 800; letter-spacing: -0.4px; }
          .cew-page-subtitle { font-size: 13px; color: var(--text-tertiary); margin-top: 4px; }

          /* ─── FORM ELEMENTS ─── */
          .cew-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
          .cew-grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
          .cew-field { display: flex; flex-direction: column; gap: 8px; }
          .cew-label {
            font-size: 11px; font-weight: 700; text-transform: uppercase;
            letter-spacing: 0.08em; color: var(--text-secondary);
          }
          .cew-input {
            background: var(--bg-1); border: 1px solid var(--border-2);
            border-radius: 12px; padding: 12px 16px;
            color: var(--text-primary); font-size: 14px; font-weight: 500;
            outline: none; transition: all var(--transition); width: 100%;
            font-family: var(--font);
          }
          .cew-input::placeholder { color: var(--text-muted); }
          .cew-input:focus { border-color: var(--blue-500); background: var(--bg-2); box-shadow: 0 0 0 3px rgba(59,130,246,0.12); }
          .cew-textarea { height: 96px; resize: none; }
          .cew-select {
            background: var(--bg-1); border: 1px solid var(--border-2);
            border-radius: 12px; padding: 12px 40px 12px 16px;
            color: var(--text-primary); font-size: 14px; font-weight: 500;
            outline: none; cursor: pointer; transition: all var(--transition);
            appearance: none; width: 100%; font-family: var(--font);
            background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
            background-repeat: no-repeat; background-position: right 14px center; background-size: 16px;
          }
          .cew-select:focus { border-color: var(--blue-500); }

          /* ─── SECTION CARD ─── */
          .cew-section-card {
            background: var(--bg-1); border: 1px solid var(--border-1);
            border-radius: 18px; padding: 22px 24px; margin-bottom: 20px;
          }
          .cew-section-card-title {
            font-size: 12px; font-weight: 700; text-transform: uppercase;
            letter-spacing: 0.1em; color: var(--text-tertiary); margin-bottom: 18px;
            display: flex; align-items: center; gap: 8px;
          }
          .cew-section-card-title-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--blue-500); }

          /* ─── COLOR PICKER ─── */
          .cew-colors { display: flex; gap: 10px; flex-wrap: wrap; }
          .cew-color-btn {
            width: 30px; height: 30px; border-radius: 50%; cursor: pointer;
            border: 2px solid transparent; transition: all 0.2s; position: relative;
          }
          .cew-color-btn:hover { transform: scale(1.15); }
          .cew-color-btn.selected { border-color: #fff; box-shadow: 0 0 0 3px rgba(255,255,255,0.15); }
          .cew-color-btn.selected::after {
            content: ''; position: absolute; inset: 0;
            display: flex; align-items: center; justify-content: center;
            background: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23fff' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M20 6 9 17l-5-5'/%3E%3C/svg%3E") center/14px no-repeat;
          }

          /* ─── METRIC CARDS ─── */
          .cew-metric-card {
            background: var(--bg-1); border: 1px solid var(--border-1);
            border-radius: 18px; padding: 20px;
            display: flex; flex-direction: column; gap: 14px;
          }
          .cew-metric-top { display: flex; align-items: center; gap: 10px; }
          .cew-metric-icon {
            width: 36px; height: 36px; border-radius: 11px;
            display: flex; align-items: center; justify-content: center;
          }
          .cew-metric-name { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-secondary); }
          .cew-metric-input {
            background: var(--bg-0); border: 1px solid var(--border-2);
            border-radius: 10px; padding: 10px;
            color: var(--text-primary); font-size: 26px; font-weight: 800;
            text-align: center; outline: none; width: 100%;
            transition: border-color var(--transition); font-family: var(--font);
          }
          .cew-metric-input:focus { border-color: var(--blue-500); }
          .cew-metric-unit { font-size: 11px; color: var(--text-muted); text-align: center; font-weight: 600; }

          /* ─── TOGGLE ─── */
          .cew-toggle-list { display: flex; flex-direction: column; gap: 0; }
          .cew-toggle-item {
            display: flex; align-items: center; justify-content: space-between;
            padding: 16px 0;
            border-bottom: 1px solid var(--border-1);
          }
          .cew-toggle-item:last-child { border-bottom: none; padding-bottom: 0; }
          .cew-toggle-item:first-child { padding-top: 0; }
          .cew-toggle-left { display: flex; align-items: center; gap: 12px; }
          .cew-toggle-icon {
            width: 34px; height: 34px; border-radius: 10px;
            background: var(--bg-0); border: 1px solid var(--border-1);
            display: flex; align-items: center; justify-content: center;
            color: var(--text-secondary);
          }
          .cew-toggle-text { }
          .cew-toggle-label { font-size: 13px; font-weight: 600; color: var(--text-primary); }
          .cew-toggle-desc { font-size: 11px; color: var(--text-tertiary); margin-top: 2px; }
          .cew-switch {
            width: 46px; height: 26px; border-radius: 99px;
            background: var(--border-3); position: relative;
            cursor: pointer; transition: background 0.2s; border: none; flex-shrink: 0;
          }
          .cew-switch.on-green { background: var(--green-500); }
          .cew-switch.on-blue { background: var(--blue-500); }
          .cew-switch-knob {
            width: 18px; height: 18px; border-radius: 50%;
            background: #fff; position: absolute; top: 4px; left: 4px;
            transition: transform 0.2s; box-shadow: 0 1px 3px rgba(0,0,0,0.3);
          }
          .cew-switch.on-green .cew-switch-knob,
          .cew-switch.on-blue .cew-switch-knob { transform: translateX(20px); }

          /* ─── QUESTIONS ─── */
          .cew-q-list { display: flex; flex-direction: column; gap: 16px; }
          .cew-q-card {
            background: var(--bg-1); border: 1px solid var(--border-1);
            border-radius: 18px; overflow: hidden;
            transition: border-color var(--transition), box-shadow var(--transition);
            position: relative;
          }
          .cew-q-card:hover { border-color: var(--border-3); }
          .cew-q-card-top {
            display: flex; align-items: center; gap: 14px;
            padding: 16px 20px; border-bottom: 1px solid var(--border-1);
            background: var(--bg-2);
          }
          .cew-q-num {
            width: 30px; height: 30px; border-radius: 9px; flex-shrink: 0;
            background: linear-gradient(135deg, rgba(59,130,246,0.15), rgba(139,92,246,0.1));
            border: 1px solid rgba(59,130,246,0.15);
            color: var(--blue-400); font-weight: 800; font-size: 13px;
            display: flex; align-items: center; justify-content: center;
          }
          .cew-q-type-select {
            background: var(--bg-1); border: 1px solid var(--border-2);
            border-radius: 9px; padding: 6px 28px 6px 10px;
            font-size: 11px; font-weight: 700; color: var(--blue-400);
            outline: none; cursor: pointer; appearance: none;
            background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2360a5fa' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
            background-repeat: no-repeat; background-position: right 8px center; background-size: 11px;
            font-family: var(--font);
          }
          .cew-q-del {
            margin-left: auto; width: 30px; height: 30px; border-radius: 9px;
            background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.15);
            color: var(--red-400); cursor: pointer;
            display: flex; align-items: center; justify-content: center;
            transition: all var(--transition); opacity: 0;
          }
          .cew-q-card:hover .cew-q-del { opacity: 1; }
          .cew-q-del:hover { background: var(--red-500); border-color: var(--red-500); color: #fff; }
          .cew-q-body { padding: 20px; display: flex; flex-direction: column; gap: 16px; }
          .cew-options-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
          .cew-opt {
            display: flex; align-items: center; gap: 10px;
            padding: 10px 14px; border-radius: 12px;
            background: var(--bg-0); border: 1px solid var(--border-2);
            cursor: pointer; transition: all 0.15s;
          }
          .cew-opt.correct { background: rgba(34,197,94,0.07); border-color: rgba(34,197,94,0.3); }
          .cew-opt-sel {
            width: 18px; height: 18px; flex-shrink: 0;
            border: 2px solid var(--border-3);
            display: flex; align-items: center; justify-content: center;
            transition: all 0.15s;
          }
          .cew-opt-sel.radio { border-radius: 50%; }
          .cew-opt-sel.checkbox { border-radius: 5px; }
          .cew-opt-sel.correct { background: var(--green-500); border-color: var(--green-500); color: #fff; }
          .cew-opt-input {
            background: transparent; border: none; outline: none;
            color: var(--text-primary); font-size: 13px; font-weight: 600;
            flex: 1; font-family: var(--font);
          }
          .cew-add-q {
            width: 100%; padding: 18px; margin-top: 4px;
            border: 1.5px dashed var(--border-3); border-radius: 18px;
            background: transparent; color: var(--text-secondary);
            font-size: 13px; font-weight: 700; cursor: pointer;
            display: flex; align-items: center; justify-content: center; gap: 10px;
            transition: all var(--transition); font-family: var(--font);
          }
          .cew-add-q:hover { border-color: var(--blue-500); color: var(--blue-400); background: rgba(59,130,246,0.04); }
          .cew-add-q-circle {
            width: 26px; height: 26px; border-radius: 50%;
            background: var(--border-3); display: flex; align-items: center; justify-content: center;
            transition: all var(--transition);
          }
          .cew-add-q:hover .cew-add-q-circle { background: var(--blue-500); color: #fff; }
          .cew-q-count {
            margin-left: auto;
            display: inline-flex; align-items: center; gap: 6px;
            background: rgba(59,130,246,0.1); border: 1px solid rgba(59,130,246,0.15);
            border-radius: 20px; padding: 3px 10px;
            font-size: 11px; font-weight: 700; color: var(--blue-400);
          }

          /* ─── FOOTER ─── */
          .cew-footer {
            display: flex; align-items: center; justify-content: space-between;
            padding: 18px 32px;
            background: var(--bg-2); border-top: 1px solid var(--border-1);
            flex-shrink: 0;
          }
          .cew-footer-info { display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--text-muted); font-weight: 500; }
          .cew-footer-actions { display: flex; align-items: center; gap: 12px; }
          .cew-btn {
            display: inline-flex; align-items: center; justify-content: center; gap: 7px;
            padding: 10px 20px; border-radius: 12px; font-size: 13px; font-weight: 700;
            cursor: pointer; border: none; transition: all var(--transition);
            font-family: var(--font);
          }
          .cew-btn-ghost { background: transparent; color: var(--text-secondary); }
          .cew-btn-ghost:hover { color: var(--text-primary); background: var(--surface-1); }
          .cew-btn-secondary {
            background: var(--surface-2); border: 1px solid var(--border-2); color: var(--text-primary);
          }
          .cew-btn-secondary:hover { background: var(--surface-3); }
          .cew-btn-primary {
            background: var(--blue-500); color: #fff;
            box-shadow: 0 2px 12px rgba(59,130,246,0.25);
          }
          .cew-btn-primary:hover { background: var(--blue-600); transform: translateY(-1px); box-shadow: 0 6px 20px rgba(59,130,246,0.35); }
          .cew-btn-save {
            background: linear-gradient(135deg, #2563eb, #7c3aed);
            color: #fff; box-shadow: 0 2px 16px rgba(99,70,250,0.3);
          }
          .cew-btn-save:hover { transform: translateY(-1px); box-shadow: 0 6px 24px rgba(99,70,250,0.45); }
          .cew-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none !important; }

          /* ─── RESPONSIVE ─── */
          @media (max-width: 768px) {
            .cew-grid-2, .cew-grid-3, .cew-options-grid { grid-template-columns: 1fr; }
            .cew-container { max-width: 100%; height: 96vh; border-radius: 20px; }
            .cew-page { padding: 20px; }
            .cew-step-desc { display: none; }
          }
        `}} />

        {/* Modal container */}
        <motion.div
          initial={{ scale: 0.94, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.94, opacity: 0, y: 20 }}
          transition={{ type: 'spring', duration: 0.5, bounce: 0.2 }}
          className="cew-container"
        >

          {/* ── HEADER + STEPS (bir qatorda) ── */}
          <div className="cew-header" style={{ position: 'relative' }}>
            {/* Chap: Brand */}
            <div className="cew-header-brand">
              <div className="cew-brand-icon">
                <Sparkles style={{ color: 'var(--blue-400)', width: 18, height: 18 }} />
              </div>
              <div>
                <div className="cew-brand-title">{examToEdit ? 'Imtihonni Tahrirlash' : 'Yangi Imtihon Yaratish'}</div>
                <div className="cew-brand-sub">AGMK Enterprise LMS</div>
              </div>
            </div>

            {/* O'rta: Steps */}
            <div className="cew-steps-inline">
              {STEPS.map((s, idx) => {
                const isActive = step === s.id;
                const isDone = step > s.id;
                const Icon = s.icon;
                return (
                  <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    {idx > 0 && (
                      <div className={clsx('cew-step-connector', isDone && 'done')} />
                    )}
                    <div
                      className={clsx('cew-step-inline', isActive && 'active', isDone && 'done')}
                      onClick={() => { if (isDone) { setDirection(s.id < step ? -1 : 1); setStep(s.id); } }}
                    >
                      <div className="cew-step-dot-sm">
                        {isDone ? <Check style={{ width: 13, height: 13 }} /> : <Icon style={{ width: 13, height: 13 }} />}
                      </div>
                      <span className="cew-step-label-sm">{s.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* O'ng: Yopish */}
            <motion.button
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={onClose} className="cew-close"
            >
              <X style={{ width: 16, height: 16 }} />
            </motion.button>

            {/* Progress bar - header pastki qirrasi */}
            <div className="cew-header-progress">
              <div className="cew-header-progress-fill" style={{ width: `${progress}%` }} />
            </div>
          </div>

          {/* ── BODY ── */}
          <div className="cew-body">
            <AnimatePresence initial={false} custom={direction} mode="wait">
              <motion.div
                key={step}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: 'tween', duration: 0.22, ease: 'easeInOut' }}
                className="cew-page"
              >

                {/* ═══ STEP 1: Asosiy ma'lumot ═══ */}
                {step === 1 && (
                  <div>
                    <div className="cew-page-header">
                      <div className="cew-page-title">Test haqida asosiy ma'lumot</div>
                      <div className="cew-page-subtitle">Test nomi, tavsifi va vizual identifikatsiyasini kiriting</div>
                    </div>

                    <div className="cew-section-card">
                      <div className="cew-section-card-title">
                        <AlignLeft style={{ width: 14, height: 14, color: 'var(--blue-400)' }} />
                        Test identifikatsiyasi
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                        <div className="cew-field">
                          <label className="cew-label">Imtihon nomi *</label>
                          <input
                            type="text"
                            value={exam.title}
                            onChange={(e) => setExam({ ...exam, title: e.target.value })}
                            className="cew-input"
                            placeholder="Masalan: ISO 9001 Sifat Menejmenti Tizimi"
                          />
                        </div>
                        <div className="cew-field">
                          <label className="cew-label">Tavsif va Yo'riqnoma</label>
                          <textarea
                            value={exam.description}
                            onChange={(e) => setExam({ ...exam, description: e.target.value })}
                            className="cew-input cew-textarea"
                            placeholder="Ushbu imtihonning maqsadi va qoidalari haqida qisqacha ma'lumot bering..."
                          />
                        </div>
                        <div className="cew-grid-2">
                          <div className="cew-field">
                            <label className="cew-label">Kategoriya</label>
                            <select
                              value={exam.category}
                              onChange={(e) => setExam({ ...exam, category: e.target.value, customCategory: '' })}
                              className="cew-select"
                            >
                              <option value="">— Kategoriyani tanlang —</option>
                              {CATEGORIES.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                              ))}
                              <option value="__custom__">+ Qo'lda yozish</option>
                            </select>
                            {exam.category === '__custom__' && (
                              <input
                                type="text"
                                value={exam.customCategory}
                                onChange={e => setExam({ ...exam, customCategory: e.target.value })}
                                className="cew-input"
                                placeholder="Kategoriya nomini yozing..."
                                style={{ marginTop: 8 }}
                              />
                            )}
                          </div>
                          <div className="cew-field">
                            <label className="cew-label">Kimlarga ruxsat</label>
                            <select
                              value={exam.visibility}
                              onChange={(e) => setExam({ ...exam, visibility: e.target.value as any })}
                              className="cew-select"
                            >
                              <option value="public">Barchaga Ochiq</option>
                              <option value="department">Faqat Mening Bo'limim</option>
                              <option value="employees">Maxsus Belgilangan Xodimlar</option>
                            </select>
                          </div>
                        </div>

                        {/* allowedUsers qidiruv */}
                        {exam.visibility === 'employees' && (
                          <div className="cew-field">
                            <label className="cew-label">Xodimlarni belgilash</label>
                            <div style={{ position: 'relative' }}>
                              <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                              <input
                                type="text"
                                value={userSearch}
                                onChange={e => setUserSearch(e.target.value)}
                                className="cew-input"
                                placeholder="Xodim ismi yoki email bo'yicha qidirish..."
                                style={{ paddingLeft: 36 }}
                              />
                            </div>
                            {userSearchLoading && <div style={{ fontSize: 12, color: 'var(--text-muted)', padding: '4px 0' }}>Qidirilmoqda...</div>}
                            {userResults.length > 0 && (
                              <div style={{ background: 'var(--bg-1)', border: '1px solid var(--border-2)', borderRadius: 12, overflow: 'hidden', marginTop: 4 }}>
                                {userResults.map((u: any) => {
                                  const uid = u.id || u._id;
                                  const selected = exam.allowedUsers?.includes(uid);
                                  return (
                                    <div key={uid}
                                      onClick={() => {
                                        const next = selected
                                          ? exam.allowedUsers?.filter(id => id !== uid)
                                          : [...(exam.allowedUsers || []), uid];
                                        setExam({ ...exam, allowedUsers: next });
                                      }}
                                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', cursor: 'pointer', background: selected ? 'rgba(59,130,246,0.08)' : 'transparent', borderBottom: '1px solid var(--border-1)' }}
                                    >
                                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'var(--blue-400)', flexShrink: 0 }}>
                                        {(u.fullName || u.name || 'X')[0]}
                                      </div>
                                      <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: 13, fontWeight: 600 }}>{u.fullName || u.name}</div>
                                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{u.email}</div>
                                      </div>
                                      {selected && <Check size={14} color="var(--blue-400)" />}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                            {(exam.allowedUsers?.length || 0) > 0 && (
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                                {exam.allowedUsers?.map(uid => (
                                  <span key={uid} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 99, padding: '3px 10px', fontSize: 11, fontWeight: 700, color: 'var(--blue-400)' }}>
                                    <Users size={10} /> {uid.slice(0, 8)}...
                                    <button type="button" onClick={() => setExam({ ...exam, allowedUsers: exam.allowedUsers?.filter(id => id !== uid) })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0, lineHeight: 1 }}>×</button>
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="cew-section-card">
                      <div className="cew-section-card-title">
                        <Sparkles style={{ width: 14, height: 14, color: 'var(--violet-400)' }} />
                        Vizual dizayn rangi
                      </div>
                      <div className="cew-colors">
                        {COLORS.map(c => (
                          <button
                            key={c.hex}
                            type="button"
                            title={c.label}
                            onClick={() => setExam({ ...exam, color: c.hex })}
                            className={clsx('cew-color-btn', exam.color === c.hex && 'selected')}
                            style={{ backgroundColor: c.hex }}
                          />
                        ))}
                      </div>
                      {exam.color && (
                        <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            height: 36, borderRadius: 10, flex: 1, overflow: 'hidden',
                            background: `linear-gradient(135deg, ${exam.color}22, ${exam.color}11)`,
                            border: `1px solid ${exam.color}30`,
                            display: 'flex', alignItems: 'center', paddingLeft: 14,
                            gap: 8
                          }}>
                            <div style={{ width: 10, height: 10, borderRadius: '50%', background: exam.color }} />
                            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
                              {exam.title || 'Test nomi ko\'rinishi'}
                            </span>
                          </div>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>Oldindan ko'rish</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ═══ STEP 2: Sozlamalar ═══ */}
                {step === 2 && (
                  <div>
                    <div className="cew-page-header">
                      <div className="cew-page-title">Test sozlamalari</div>
                      <div className="cew-page-subtitle">Vaqt chegarasi, o'tish bali va xavfsizlik parametrlarini belgilang</div>
                    </div>

                    <div className="cew-section-card" style={{ marginBottom: 20 }}>
                      <div className="cew-section-card-title">
                        <BarChart2 style={{ width: 14, height: 14, color: 'var(--blue-400)' }} />
                        Test parametrlari
                      </div>
                      <div className="cew-grid-3">
                        <div className="cew-metric-card">
                          <div className="cew-metric-top">
                            <div className="cew-metric-icon" style={{ background: 'rgba(59,130,246,0.12)' }}>
                              <Clock style={{ width: 18, height: 18, color: 'var(--blue-400)' }} />
                            </div>
                            <span className="cew-metric-name">Vaqt limiti</span>
                          </div>
                          <input
                            type="number" value={exam.timeLimitMinutes}
                            onChange={(e) => setExam({ ...exam, timeLimitMinutes: Number(e.target.value) })}
                            className="cew-metric-input" style={{ color: 'var(--blue-400)' }}
                            min={5} max={300}
                          />
                          <div className="cew-metric-unit">daqiqa</div>
                        </div>

                        <div className="cew-metric-card">
                          <div className="cew-metric-top">
                            <div className="cew-metric-icon" style={{ background: 'rgba(34,197,94,0.12)' }}>
                              <Award style={{ width: 18, height: 18, color: 'var(--green-400)' }} />
                            </div>
                            <span className="cew-metric-name">O'tish bali</span>
                          </div>
                          <input
                            type="number" value={exam.passingScore}
                            onChange={(e) => setExam({ ...exam, passingScore: Number(e.target.value) })}
                            className="cew-metric-input" style={{ color: 'var(--green-400)' }}
                            min={1} max={100}
                          />
                          <div className="cew-metric-unit">foiz (%)</div>
                        </div>

                        <div className="cew-metric-card">
                          <div className="cew-metric-top">
                            <div className="cew-metric-icon" style={{ background: 'rgba(139,92,246,0.12)' }}>
                              <Zap style={{ width: 18, height: 18, color: 'var(--violet-400)' }} />
                            </div>
                            <span className="cew-metric-name">Urinishlar</span>
                          </div>
                          <input
                            type="number" value={exam.maxAttempts}
                            onChange={(e) => setExam({ ...exam, maxAttempts: Number(e.target.value) })}
                            className="cew-metric-input" style={{ color: 'var(--violet-400)' }}
                            min={1} max={10}
                          />
                          <div className="cew-metric-unit">marta</div>
                        </div>
                      </div>
                    </div>

                    <div className="cew-section-card">
                      <div className="cew-section-card-title">
                        <Lock style={{ width: 14, height: 14, color: 'var(--violet-400)' }} />
                        Xavfsizlik va qoidalar
                      </div>
                      <div className="cew-toggle-list">
                        <div className="cew-toggle-item">
                          <div className="cew-toggle-left">
                            <div className="cew-toggle-icon">
                              <Eye style={{ width: 16, height: 16 }} />
                            </div>
                            <div className="cew-toggle-text">
                              <div className="cew-toggle-label">AI Proctoring (Anti-Cheat)</div>
                              <div className="cew-toggle-desc">Kamera va ekran monitoringi yoqiladi</div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setExam({ ...exam, proctored: !exam.proctored })}
                            className={clsx('cew-switch', exam.proctored && 'on-green')}
                          >
                            <div className="cew-switch-knob" />
                          </button>
                        </div>

                        <div className="cew-toggle-item">
                          <div className="cew-toggle-left">
                            <div className="cew-toggle-icon">
                              <Shuffle style={{ width: 16, height: 16 }} />
                            </div>
                            <div className="cew-toggle-text">
                              <div className="cew-toggle-label">Savollarni aralashtirish</div>
                              <div className="cew-toggle-desc">Har bir urinishda savollar tartiblanadi</div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setExam({ ...exam, shuffleQuestions: !exam.shuffleQuestions })}
                            className={clsx('cew-switch', exam.shuffleQuestions && 'on-blue')}
                          >
                            <div className="cew-switch-knob" />
                          </button>
                        </div>

                        <div className="cew-toggle-item">
                          <div className="cew-toggle-left">
                            <div className="cew-toggle-icon">
                              <Copy style={{ width: 16, height: 16 }} />
                            </div>
                            <div className="cew-toggle-text">
                              <div className="cew-toggle-label">Nusxa olishni o'chirish</div>
                              <div className="cew-toggle-desc">Imtihon davomida copy/paste bloklash</div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setExam({ ...exam, copyProtection: !exam.copyProtection })}
                            className={clsx('cew-switch', exam.copyProtection && 'on-green')}
                          >
                            <div className="cew-switch-knob" />
                          </button>
                        </div>

                        <div className="cew-toggle-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 10 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                            <div className="cew-toggle-left">
                              <div className="cew-toggle-icon">
                                <Key style={{ width: 16, height: 16 }} />
                              </div>
                              <div className="cew-toggle-text">
                                <div className="cew-toggle-label">Imtihon paroli</div>
                                <div className="cew-toggle-desc">Faqat parolni bilganlar kirishi mumkin</div>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => setExam({ ...exam, password: exam.password ? '' : 'exam123' })}
                              className={clsx('cew-switch', exam.password && 'on-blue')}
                            >
                              <div className="cew-switch-knob" />
                            </button>
                          </div>
                          {exam.password !== undefined && exam.password !== '' && (
                            <input
                              type="text"
                              value={exam.password}
                              onChange={e => setExam({ ...exam, password: e.target.value })}
                              className="cew-input"
                              placeholder="Parolni kiriting..."
                              style={{ width: '100%' }}
                            />
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="cew-section-card">
                      <div className="cew-section-card-title">
                        <Calendar style={{ width: 14, height: 14, color: 'var(--blue-400)' }} />
                        Boshlash va tugash vaqti
                      </div>
                      <div className="cew-grid-2">
                        <div className="cew-field">
                          <label className="cew-label">Boshlash sanasi va vaqti</label>
                          <input
                            type="datetime-local"
                            value={exam.startAt || ''}
                            onChange={e => setExam({ ...exam, startAt: e.target.value })}
                            className="cew-input"
                          />
                        </div>
                        <div className="cew-field">
                          <label className="cew-label">Tugash sanasi va vaqti</label>
                          <input
                            type="datetime-local"
                            value={exam.endAt || ''}
                            onChange={e => setExam({ ...exam, endAt: e.target.value })}
                            className="cew-input"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="cew-section-card">
                      <div className="cew-section-card-title">
                        <Award style={{ width: 14, height: 14, color: 'var(--amber-400)' }} />
                        Sertifikat amal qilish muddati
                      </div>
                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        {VALIDITY_OPTIONS.map(opt => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setExam({ ...exam, validityPeriod: opt.value })}
                            style={{
                              padding: '8px 18px', borderRadius: 99, border: '1px solid',
                              borderColor: exam.validityPeriod === opt.value ? 'var(--amber-400)' : 'var(--border-2)',
                              background: exam.validityPeriod === opt.value ? 'rgba(245,158,11,0.1)' : 'var(--bg-1)',
                              color: exam.validityPeriod === opt.value ? 'var(--amber-400)' : 'var(--text-secondary)',
                              fontWeight: 700, fontSize: 13, cursor: 'pointer', transition: 'all 0.2s',
                            }}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* ═══ STEP 3: Savollar ═══ */}
                {step === 3 && (
                  <div>
                    <div className="cew-page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                      <div>
                        <div className="cew-page-title">Savollar ro'yxati</div>
                        <div className="cew-page-subtitle">Savol va to'g'ri javob variantlarini kiriting</div>
                      </div>
                      <span className="cew-q-count">
                        <BookOpen style={{ width: 12, height: 12 }} />
                        {questions.length} ta savol
                      </span>
                    </div>

                    <div className="cew-q-list">
                      {questions.map((q, qIndex) => (
                        <motion.div
                          key={qIndex}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: qIndex * 0.04 }}
                          className="cew-q-card"
                        >
                          {/* Card top bar */}
                          <div className="cew-q-card-top">
                            <div className="cew-q-num">{qIndex + 1}</div>
                            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                              Savol {qIndex + 1}
                            </span>
                            <select
                              value={q.type || 'single'}
                              onChange={(e) => {
                                const newType = e.target.value as any;
                                let opts = q.options || ['', '', '', ''];
                                let ans = q.correctAnswers || [0];
                                if (newType === 'truefalse') { opts = ['Rost', "Yolg'on"]; ans = [0]; }
                                else if (q.type === 'truefalse') { opts = ['', '', '', '']; ans = [0]; }
                                updateQuestion(qIndex, { type: newType, options: opts, correctAnswers: ans });
                              }}
                              className="cew-q-type-select"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <option value="single">Yagona tanlovli</option>
                              <option value="multiple">Ko'p tanlovli</option>
                              <option value="truefalse">Rost / Yolg'on</option>
                            </select>
                            <button type="button" onClick={() => removeQuestion(qIndex)} className="cew-q-del" title="O'chirish">
                              <Trash2 style={{ width: 14, height: 14 }} />
                            </button>
                          </div>

                          {/* Card body */}
                          <div className="cew-q-body">
                            <textarea
                              value={q.question}
                              onChange={(e) => updateQuestion(qIndex, { question: e.target.value })}
                              className="cew-input cew-textarea"
                              placeholder="Savol matnini bu yerga yozing..."
                            />
                            <div>
                              <div className="cew-label" style={{ marginBottom: 10 }}>
                                Variantlar — {q.type === 'multiple' ? "To'g'ri javoblarni belgilang" : "To'g'ri javobni belgilang"}
                              </div>
                              <div className="cew-options-grid">
                                {q.options?.map((opt, oIndex) => {
                                  const isCorrect = q.correctAnswers?.includes(oIndex);
                                  const isMultiple = q.type === 'multiple';
                                  const isTF = q.type === 'truefalse';
                                  const handleToggle = () => {
                                    if (isMultiple) {
                                      const next = isCorrect
                                        ? q.correctAnswers?.filter(i => i !== oIndex) || []
                                        : [...(q.correctAnswers || []), oIndex];
                                      updateQuestion(qIndex, { correctAnswers: next });
                                    } else {
                                      updateQuestion(qIndex, { correctAnswers: [oIndex] });
                                    }
                                  };
                                  return (
                                    <div
                                      key={oIndex}
                                      className={clsx('cew-opt', isCorrect && 'correct')}
                                      onClick={handleToggle}
                                    >
                                      <div className={clsx('cew-opt-sel', isMultiple ? 'checkbox' : 'radio', isCorrect && 'correct')}>
                                        {isCorrect && <Check style={{ width: 10, height: 10 }} />}
                                      </div>
                                      <input
                                        type="text"
                                        value={opt}
                                        readOnly={isTF}
                                        onClick={(e) => {
                                          if (isTF) handleToggle();
                                          else e.stopPropagation();
                                        }}
                                        onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                                        className="cew-opt-input"
                                        placeholder={isTF ? opt : `Variant ${['A', 'B', 'C', 'D'][oIndex] || oIndex + 1}`}
                                      />
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    <button type="button" onClick={addQuestion} className="cew-add-q" style={{ marginTop: 16 }}>
                      <div className="cew-add-q-circle">
                        <Plus style={{ width: 13, height: 13 }} />
                      </div>
                      Yangi Savol Qo'shish
                    </button>
                  </div>
                )}

              </motion.div>
            </AnimatePresence>
          </div>

          {/* ── FOOTER ── */}
          <div className="cew-footer">
            <div className="cew-footer-info">
              <Activity style={{ width: 13, height: 13 }} />
              {step === 1 && 'Bosqich 1 / 3 — Asosiy ma\'lumot'}
              {step === 2 && 'Bosqich 2 / 3 — Sozlamalar'}
              {step === 3 && `Bosqich 3 / 3 — ${questions.length} ta savol qo'shilgan`}
            </div>
            <div className="cew-footer-actions">
              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={prevStep}
                disabled={step === 1}
                className="cew-btn cew-btn-secondary"
                style={{ visibility: step === 1 ? 'hidden' : 'visible' }}
              >
                <ChevronLeft style={{ width: 15, height: 15 }} /> Orqaga
              </motion.button>

              {step < 3 ? (
                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={nextStep}
                  className="cew-btn cew-btn-primary"
                >
                  Keyingisi <ChevronRight style={{ width: 15, height: 15 }} />
                </motion.button>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={handleSubmit}
                  disabled={isSubmitting || !exam.title || questions.some(q => !q.question)}
                  className="cew-btn cew-btn-save"
                >
                  <Save style={{ width: 15, height: 15 }} />
                  {isSubmitting ? 'Saqlanmoqda...' : examToEdit ? 'Imtihonni Saqlash' : 'Imtihonni Yaratish'}
                </motion.button>
              )}
            </div>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
