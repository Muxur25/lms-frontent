import { useState, useEffect } from 'react';
import { clsx } from 'clsx';
import {
  X, Check, ChevronRight, ChevronLeft, Save, Plus, Trash2, Settings, FileText, Database,
  Sparkles, Target, Layers, Activity, Lock, ChevronDown
} from 'lucide-react';
import { examsApi } from '@/api/exams.api';
import type { TestQuestion, Exam } from '@/api/exams.api';

interface CreateExamWizardProps {
  onClose: () => void;
  onSuccess: (exam: Exam) => void;
}

export function CreateExamWizard({ onClose, onSuccess }: CreateExamWizardProps) {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [exam, setExam] = useState<Partial<Exam>>({
    title: '',
    description: '',
    category: '',
    timeLimitMinutes: 60,
    passingScore: 70,
    maxAttempts: 3,
    shuffleQuestions: false,
    proctored: false,
    visibility: 'public',
    color: '#3b82f6',
  });

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

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const created = await examsApi.create({ ...exam, questions });
      onSuccess(created);
    } catch (err) {
      console.error(err);
      alert('Xatolik yuz berdi. Konsolni tekshiring.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={clsx(
      "fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 transition-all duration-500",
      mounted ? "bg-[#020617]/80 backdrop-blur-md" : "bg-transparent backdrop-blur-none"
    )}>
      {/* Ambient background glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[20%] left-[30%] w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] mix-blend-screen" />
        <div className="absolute bottom-[20%] right-[30%] w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[100px] mix-blend-screen" />
      </div>

      <div className={clsx(
        "relative w-full max-w-5xl max-h-[92vh] flex flex-col bg-[#0f172a]/90 backdrop-blur-xl border border-white/[0.05] shadow-[0_0_80px_-20px_rgba(59,130,246,0.3)] rounded-[24px] overflow-hidden transition-all duration-500 transform",
        mounted ? "translate-y-0 opacity-100 scale-100" : "translate-y-8 opacity-0 scale-95"
      )}>
        
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-white/[0.05] bg-white/[0.02] relative z-10">
          <div className="flex items-center gap-4">
            <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center border border-white/10 shadow-[0_0_20px_rgba(59,130,246,0.2)]">
              <Sparkles className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 tracking-tight">
                Enterprise Exam Builder
              </h2>
              <p className="text-sm font-medium text-blue-400/80 flex items-center gap-2 mt-0.5">
                <Database className="w-3.5 h-3.5" /> AGMK Intelligence System
              </p>
            </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Steps Indicator - Apple Style */}
        <div className="relative px-8 py-6 border-b border-white/[0.05] bg-[#0b1120]/50">
          <div className="flex justify-between items-center relative z-10">
            {[
              { id: 1, label: 'Asosiy', icon: FileText, desc: 'Test ma\'lumotlari' },
              { id: 2, label: 'Sozlamalar', icon: Settings, desc: 'Qoidalar va xavfsizlik' },
              { id: 3, label: 'Savollar', icon: Layers, desc: 'Kontent yaratish' },
            ].map((s) => {
              const isActive = step === s.id;
              const isPast = step > s.id;
              return (
                <div key={s.id} className="flex flex-col items-center relative w-1/3">
                  <div className={clsx(
                    "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 relative z-10",
                    isActive ? "bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-[0_0_25px_rgba(59,130,246,0.5)] scale-110" :
                    isPast ? "bg-white/10 text-blue-400 border border-blue-500/30" : "bg-white/5 text-slate-500"
                  )}>
                    {isPast ? <Check className="w-6 h-6" /> : <s.icon className="w-5 h-5" />}
                  </div>
                  <div className="text-center mt-4 transition-opacity duration-300">
                    <p className={clsx("text-sm font-bold tracking-wide", isActive ? "text-white" : isPast ? "text-slate-300" : "text-slate-500")}>
                      {s.label}
                    </p>
                    <p className="text-xs text-slate-500 mt-1 hidden sm:block">{s.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
          {/* Progress Bar Background */}
          <div className="absolute top-12 left-0 w-full px-[16.66%] z-0">
            <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-700 ease-out"
                style={{ width: `${((step - 1) / 2) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar relative">
          
          {step === 1 && (
            <div className="max-w-2xl mx-auto space-y-8 animate-in slide-in-from-right-8 duration-500 fade-in">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Imtihon nomi</label>
                <input 
                  type="text" 
                  value={exam.title} 
                  onChange={(e) => setExam({...exam, title: e.target.value})}
                  className="w-full bg-[#0b1120]/50 border border-white/10 rounded-2xl px-5 py-4 text-white text-lg font-medium focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 outline-none transition-all placeholder:text-slate-600 shadow-inner"
                  placeholder="Masalan: React Advanced Certification"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Tavsif (Ixtiyoriy)</label>
                <textarea 
                  value={exam.description} 
                  onChange={(e) => setExam({...exam, description: e.target.value})}
                  className="w-full bg-[#0b1120]/50 border border-white/10 rounded-2xl px-5 py-4 text-white font-medium focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 outline-none transition-all placeholder:text-slate-600 shadow-inner h-32 resize-none"
                  placeholder="Ushbu imtihon kimlar uchun va nimalarni o'z ichiga oladi..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Kategoriya</label>
                  <input 
                    type="text" 
                    value={exam.category} 
                    onChange={(e) => setExam({...exam, category: e.target.value})}
                    className="w-full bg-[#0b1120]/50 border border-white/10 rounded-2xl px-5 py-3.5 text-white font-medium focus:ring-2 focus:ring-blue-500/50 outline-none transition-all placeholder:text-slate-600"
                    placeholder="Masalan: Frontend"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Mavzu Rangi</label>
                  <div className="flex gap-3 bg-[#0b1120]/50 border border-white/10 rounded-2xl px-5 py-3.5 items-center justify-between">
                    {['#3b82f6', '#8b5cf6', '#ec4899', '#ef4444', '#f59e0b', '#10b981'].map(c => (
                      <button
                        key={c}
                        onClick={() => setExam({...exam, color: c})}
                        className={clsx(
                          "w-7 h-7 rounded-full transition-all duration-300 relative",
                          exam.color === c ? "scale-125 shadow-[0_0_15px_currentColor]" : "hover:scale-110 opacity-60 hover:opacity-100"
                        )}
                        style={{ backgroundColor: c, color: c }}
                      >
                        {exam.color === c && <div className="absolute inset-0 border-2 border-white rounded-full opacity-50" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="max-w-3xl mx-auto space-y-8 animate-in slide-in-from-right-8 duration-500 fade-in">
              {/* Top grid metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Duration */}
                <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-5 hover:bg-white/[0.04] transition-colors group">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                      <Target className="w-5 h-5 text-blue-400" />
                    </div>
                    <label className="text-sm font-bold text-slate-300">Vaqt (Minut)</label>
                  </div>
                  <input 
                    type="number" 
                    value={exam.timeLimitMinutes} 
                    onChange={(e) => setExam({...exam, timeLimitMinutes: Number(e.target.value)})}
                    className="w-full bg-[#0b1120] border border-white/10 rounded-xl px-4 py-3 text-2xl font-black text-white outline-none text-center focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  />
                </div>
                
                {/* Score */}
                <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-5 hover:bg-white/[0.04] transition-colors group">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                      <Activity className="w-5 h-5 text-emerald-400" />
                    </div>
                    <label className="text-sm font-bold text-slate-300">O'tish Bali (%)</label>
                  </div>
                  <input 
                    type="number" 
                    value={exam.passingScore} 
                    onChange={(e) => setExam({...exam, passingScore: Number(e.target.value)})}
                    className="w-full bg-[#0b1120] border border-white/10 rounded-xl px-4 py-3 text-2xl font-black text-emerald-400 outline-none text-center focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                  />
                </div>

                {/* Attempts */}
                <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-5 hover:bg-white/[0.04] transition-colors group">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                      <Layers className="w-5 h-5 text-purple-400" />
                    </div>
                    <label className="text-sm font-bold text-slate-300">Urinishlar</label>
                  </div>
                  <input 
                    type="number" 
                    value={exam.maxAttempts} 
                    onChange={(e) => setExam({...exam, maxAttempts: Number(e.target.value)})}
                    className="w-full bg-[#0b1120] border border-white/10 rounded-xl px-4 py-3 text-2xl font-black text-purple-400 outline-none text-center focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                  />
                </div>
              </div>

              {/* Security & Access */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Kimlarga ruxsat</label>
                  <div className="relative">
                    <select 
                      value={exam.visibility}
                      onChange={(e) => setExam({...exam, visibility: e.target.value as any})}
                      className="w-full appearance-none bg-[#0b1120]/50 border border-white/10 rounded-2xl px-5 py-4 text-white font-medium outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer"
                    >
                      <option value="public">Barchaga Ochiq</option>
                      <option value="department">Faqat Mening Bo'limim</option>
                      <option value="employees">Tanlangan Xodimlar</option>
                    </select>
                    <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                <div className="flex flex-col justify-center gap-4 bg-[#0b1120]/50 border border-white/10 rounded-2xl p-5">
                  <label className="flex items-center justify-between cursor-pointer group">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                        <Lock className="w-4 h-4 text-slate-300" />
                      </div>
                      <span className="text-sm font-semibold text-white">Proctoring (Anti-cheat)</span>
                    </div>
                    <div className={clsx(
                      "w-12 h-6 rounded-full relative transition-colors duration-300",
                      exam.proctored ? "bg-emerald-500" : "bg-slate-700"
                    )}>
                      <input 
                        type="checkbox" 
                        className="opacity-0 w-0 h-0 absolute"
                        checked={exam.proctored} 
                        onChange={(e) => setExam({...exam, proctored: e.target.checked})}
                      />
                      <div className={clsx(
                        "absolute top-1 bg-white w-4 h-4 rounded-full transition-all duration-300 shadow-md",
                        exam.proctored ? "left-7" : "left-1"
                      )} />
                    </div>
                  </label>

                  <div className="h-px w-full bg-white/5" />

                  <label className="flex items-center justify-between cursor-pointer group">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                        <Database className="w-4 h-4 text-slate-300" />
                      </div>
                      <span className="text-sm font-semibold text-white">Savollarni aralashtirish</span>
                    </div>
                    <div className={clsx(
                      "w-12 h-6 rounded-full relative transition-colors duration-300",
                      exam.shuffleQuestions ? "bg-blue-500" : "bg-slate-700"
                    )}>
                      <input 
                        type="checkbox" 
                        className="opacity-0 w-0 h-0 absolute"
                        checked={exam.shuffleQuestions} 
                        onChange={(e) => setExam({...exam, shuffleQuestions: e.target.checked})}
                      />
                      <div className={clsx(
                        "absolute top-1 bg-white w-4 h-4 rounded-full transition-all duration-300 shadow-md",
                        exam.shuffleQuestions ? "left-7" : "left-1"
                      )} />
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="max-w-4xl mx-auto space-y-6 animate-in slide-in-from-right-8 duration-500 fade-in pb-10">
              {questions.map((q, qIndex) => (
                <div key={qIndex} className="bg-white/[0.02] border border-white/[0.08] hover:border-white/[0.15] rounded-3xl p-6 md:p-8 relative group transition-all duration-300 shadow-lg">
                  <button 
                    onClick={() => removeQuestion(qIndex)}
                    className="absolute top-6 right-6 w-10 h-10 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:text-white transition-all duration-300"
                    title="Savolni o'chirish"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                  
                  <div className="flex items-center gap-3 mb-6">
                    <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 font-bold text-sm">
                      {qIndex + 1}
                    </span>
                    <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest">
                      Savol matni
                    </h3>
                  </div>
                  
                  <div className="space-y-6">
                    <textarea 
                      value={q.question} 
                      onChange={(e) => updateQuestion(qIndex, { question: e.target.value })}
                      className="w-full bg-[#0b1120]/80 border border-white/5 rounded-2xl px-6 py-5 text-white text-lg font-medium outline-none focus:border-blue-500/50 focus:bg-[#0b1120] transition-all placeholder:text-slate-600 shadow-inner resize-none min-h-[100px]"
                      placeholder="Savolingizni shu yerga yozing..."
                    />

                    <div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 ml-1">Javob Variantlari (To'g'risini belgilang)</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {q.options?.map((opt, oIndex) => {
                          const isCorrect = q.correctAnswers?.includes(oIndex);
                          return (
                            <div key={oIndex} className={clsx(
                              "flex items-center gap-4 p-2 pl-4 rounded-2xl border transition-all duration-300",
                              isCorrect ? "bg-emerald-500/10 border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.15)]" : "bg-[#0b1120]/50 border-white/5 hover:border-white/20"
                            )}>
                              <div className="relative flex items-center justify-center w-6 h-6">
                                <input 
                                  type="radio" 
                                  name={`correct-${qIndex}`}
                                  checked={isCorrect}
                                  onChange={() => updateQuestion(qIndex, { correctAnswers: [oIndex] })}
                                  className="w-5 h-5 opacity-0 absolute inset-0 cursor-pointer z-10"
                                />
                                <div className={clsx(
                                  "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                                  isCorrect ? "border-emerald-500 bg-emerald-500" : "border-slate-600"
                                )}>
                                  {isCorrect && <Check className="w-3 h-3 text-white" />}
                                </div>
                              </div>
                              <input 
                                type="text" 
                                value={opt} 
                                onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                                className={clsx(
                                  "flex-1 bg-transparent border-none py-3 text-sm font-medium outline-none placeholder:text-slate-600",
                                  isCorrect ? "text-emerald-50" : "text-slate-300"
                                )}
                                placeholder={`Variant ${['A', 'B', 'C', 'D'][oIndex] || oIndex + 1}`}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <button 
                onClick={addQuestion}
                className="w-full py-6 rounded-3xl border-2 border-dashed border-white/10 hover:border-blue-500/50 bg-white/[0.01] hover:bg-blue-500/5 text-slate-400 hover:text-blue-400 font-bold tracking-wide transition-all duration-300 flex items-center justify-center gap-3 group"
              >
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-all">
                  <Plus className="w-5 h-5" />
                </div>
                Yangi Savol Qo'shish
              </button>
            </div>
          )}

        </div>

        {/* Premium Footer */}
        <div className="px-8 py-5 border-t border-white/[0.05] bg-[#0b1120]/80 backdrop-blur-md flex items-center justify-between relative z-10">
          <button 
            onClick={() => setStep(step - 1)}
            disabled={step === 1}
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-slate-400 hover:text-white hover:bg-white/5 disabled:opacity-0 transition-all duration-300"
          >
            <ChevronLeft className="w-5 h-5" /> Orqaga
          </button>
          
          {step < 3 ? (
            <button 
              onClick={() => setStep(step + 1)}
              className="flex items-center gap-2 px-8 py-3 rounded-xl font-bold bg-white text-slate-900 hover:bg-blue-50 hover:scale-105 transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.2)]"
            >
              Keyingisi <ChevronRight className="w-5 h-5" />
            </button>
          ) : (
            <button 
              onClick={handleSubmit}
              disabled={isSubmitting || !exam.title || questions.some(q => !q.question)}
              className="flex items-center gap-3 px-8 py-3 rounded-xl font-black bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:scale-105 transition-all duration-300 shadow-[0_0_30px_rgba(59,130,246,0.5)] disabled:opacity-50 disabled:hover:scale-100 disabled:shadow-none"
            >
              <Save className="w-5 h-5" /> 
              {isSubmitting ? "YARATILMOQDA..." : "IMTIHONNI SAQLASH"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
