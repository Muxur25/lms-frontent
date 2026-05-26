import React, { useState } from 'react';
import { Plus, X, Trash2, Edit3, CheckCircle, Clock, Award } from 'lucide-react';
import { clsx } from 'clsx';
import type { QuizData, QuizQuestion } from '../pages/CoursePage';

// Helper for generating unique ids
const nextId = () => Math.random().toString(36).substr(2, 9);

interface QuizBuilderProps {
  initialData?: QuizData;
  onSave: (data: QuizData) => void;
  onClose: () => void;
  isRu?: boolean;
}

export function QuizBuilderModal({ initialData, onSave, onClose, isRu }: QuizBuilderProps) {
  const [data, setData] = useState<QuizData>(initialData || {
    timeLimit: 15,
    passingScore: 70,
    questions: []
  });

  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion | null>(null);

  const startEdit = (index: number) => {
    setEditingIndex(index);
    setCurrentQuestion({ ...data.questions[index], options: [...data.questions[index].options] });
  };

  const startAdd = () => {
    setEditingIndex(data.questions.length);
    setCurrentQuestion({
      id: nextId(),
      text: '',
      options: ['', '', '', ''],
      correctAnswer: 0
    });
  };

  const saveQuestion = () => {
    if (!currentQuestion) return;
    if (!currentQuestion.text.trim()) return alert("Savol matnini kiriting!");
    if (currentQuestion.options.some(o => !o.trim())) return alert("Barcha variantlarni to'ldiring!");

    const newQuestions = [...data.questions];
    if (editingIndex !== null && editingIndex < newQuestions.length) {
      newQuestions[editingIndex] = currentQuestion;
    } else {
      newQuestions.push(currentQuestion);
    }
    setData({ ...data, questions: newQuestions });
    setEditingIndex(null);
    setCurrentQuestion(null);
  };

  const deleteQuestion = (index: number) => {
    const newQuestions = [...data.questions];
    newQuestions.splice(index, 1);
    setData({ ...data, questions: newQuestions });
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, overflowY: 'auto'
    }}>
      <div className="card modal-animate" style={{ width: '100%', maxWidth: 700, padding: 30, background: 'var(--bg-1)', border: '1px solid var(--border-3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 800 }}>{isRu ? 'Настройки теста' : 'Test sozlamalari'}</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>{isRu ? 'Установите проходной балл, время и вопросы' : 'O\'tish balli, vaqt va savollarni kiriting'}</p>
          </div>
          <button className="btn btn-ghost btn-sm btn-icon" onClick={onClose}><X size={20} /></button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24, padding: 16, background: 'var(--surface-1)', borderRadius: 12 }}>
          <div className="input-group">
            <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Clock size={14} color="#3b82f6" /> {isRu ? 'Время (минут)' : 'Vaqt (daqiqa)'}</label>
            <input type="number" className="input" value={data.timeLimit} onChange={e => setData({...data, timeLimit: parseInt(e.target.value) || 0})} min={1} />
          </div>
          <div className="input-group">
            <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Award size={14} color="#f59e0b" /> {isRu ? 'Проходной балл (%)' : 'O\'tish balli (%)'}</label>
            <input type="number" className="input" value={data.passingScore} onChange={e => setData({...data, passingScore: parseInt(e.target.value) || 0})} min={1} max={100} />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700 }}>{isRu ? 'Список вопросов' : 'Savollar ro\'yxati'} ({data.questions.length})</h3>
          {!currentQuestion && (
            <button className="btn btn-primary btn-sm" onClick={startAdd}><Plus size={14} /> {isRu ? 'Новый вопрос' : 'Yangi savol'}</button>
          )}
        </div>

        {currentQuestion ? (
          <div style={{ background: 'var(--surface-2)', padding: 20, borderRadius: 12, border: '1px solid var(--blue-400)', marginBottom: 24 }}>
            <h4 style={{ marginBottom: 12, fontSize: 14, fontWeight: 700 }}>{editingIndex !== null && editingIndex < data.questions.length ? (isRu ? 'Редактировать вопрос' : 'Savolni tahrirlash') : (isRu ? 'Добавить вопрос' : 'Yangi savol qo\'shish')}</h4>
            <div className="input-group" style={{ marginBottom: 16 }}>
              <label className="input-label">{isRu ? 'Текст вопроса' : 'Savol matni'}</label>
              <textarea className="input" rows={2} value={currentQuestion.text} onChange={e => setCurrentQuestion({...currentQuestion, text: e.target.value})} placeholder={isRu ? "Введите вопрос..." : "Savol kiriting..."} />
            </div>
            <label className="input-label" style={{ marginBottom: 8, display: 'block' }}>{isRu ? 'Варианты (отметьте правильный)' : 'Variantlar (to\'g\'ri javobni belgilang)'}</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {currentQuestion.options.map((opt, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <button
                    className="btn btn-icon"
                    style={{ background: currentQuestion.correctAnswer === i ? 'var(--green-500)' : 'var(--surface-1)', color: currentQuestion.correctAnswer === i ? '#fff' : 'var(--text-muted)', border: 'none', borderRadius: '50%', width: 32, height: 32 }}
                    onClick={() => setCurrentQuestion({...currentQuestion, correctAnswer: i})}
                    title="To'g'ri javobni belgilash"
                  >
                    <CheckCircle size={16} />
                  </button>
                  <input
                    className="input"
                    style={{ flex: 1, borderColor: currentQuestion.correctAnswer === i ? 'var(--green-500)' : 'var(--border-1)' }}
                    placeholder={`${i+1}-variant...`}
                    value={opt}
                    onChange={e => {
                      const newOpts = [...currentQuestion.options];
                      newOpts[i] = e.target.value;
                      setCurrentQuestion({...currentQuestion, options: newOpts});
                    }}
                  />
                  {currentQuestion.options.length > 2 && (
                    <button className="btn btn-ghost btn-sm btn-icon" onClick={() => {
                      const newOpts = [...currentQuestion.options];
                      newOpts.splice(i, 1);
                      let newCorrect = currentQuestion.correctAnswer;
                      if (newCorrect === i) newCorrect = 0;
                      else if (newCorrect > i) newCorrect--;
                      setCurrentQuestion({...currentQuestion, options: newOpts, correctAnswer: newCorrect});
                    }}>
                      <Trash2 size={16} color="var(--red-400)" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button className="btn btn-ghost btn-sm" style={{ marginTop: 10, color: 'var(--blue-400)' }} onClick={() => setCurrentQuestion({...currentQuestion, options: [...currentQuestion.options, '']})}>
              + Variant qo'shish
            </button>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
              <button className="btn btn-secondary btn-sm" onClick={() => { setCurrentQuestion(null); setEditingIndex(null); }}>Bekor qilish</button>
              <button className="btn btn-primary btn-sm" onClick={saveQuestion}>Saqlash</button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 300, overflowY: 'auto', paddingRight: 10, marginBottom: 24 }}>
            {data.questions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)', background: 'var(--surface-1)', borderRadius: 12 }}>
                Hali hech qanday savol qo'shilmagan.
              </div>
            ) : (
              data.questions.map((q, i) => (
                <div key={q.id} style={{ padding: 16, background: 'var(--surface-1)', borderRadius: 12, border: '1px solid var(--border-1)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8 }}>{i + 1}. {q.text}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                      To'g'ri javob: <span style={{ color: 'var(--green-500)', fontWeight: 600 }}>{q.options[q.correctAnswer]}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-ghost btn-sm btn-icon" onClick={() => startEdit(i)}><Edit3 size={15} color="var(--blue-400)" /></button>
                    <button className="btn btn-ghost btn-sm btn-icon" onClick={() => deleteQuestion(i)}><Trash2 size={15} color="var(--red-400)" /></button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, paddingTop: 20, borderTop: '1px solid var(--border-1)' }}>
          <button className="btn btn-secondary" onClick={onClose}>Bekor qilish</button>
          <button className="btn btn-primary" onClick={() => onSave(data)}>Testni tizimga saqlash</button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// QUIZ PLAYER COMPONENT
// ==========================================
interface QuizPlayerProps {
  quizData: QuizData;
  onComplete: (score: number, passed: boolean) => void;
  isRu?: boolean;
}

export function QuizPlayer({ quizData, onComplete, isRu }: QuizPlayerProps) {
  const [started, setStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [finished, setFinished] = useState(false);
  const [timeLeft, setTimeLeft] = useState(quizData.timeLimit * 60);

  // Timer logic
  React.useEffect(() => {
    if (!started || finished || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          finishQuiz(answers);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [started, finished, timeLeft]);

  const startQuiz = () => {
    setStarted(true);
  };

  const handleSelect = (optionIndex: number) => {
    setAnswers({ ...answers, [currentIndex]: optionIndex });
  };

  const finishQuiz = (finalAnswers = answers) => {
    setFinished(true);
    let correctCount = 0;
    quizData.questions.forEach((q, i) => {
      if (finalAnswers[i] === q.correctAnswer) correctCount++;
    });
    const score = Math.round((correctCount / quizData.questions.length) * 100) || 0;
    const passed = score >= quizData.passingScore;
    onComplete(score, passed);
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (!quizData || !quizData.questions || quizData.questions.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 40 }}>
        <h2 style={{ color: 'var(--red-400)', marginBottom: 10 }}>Xatolik</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Bu testda savollar mavjud emas!</p>
      </div>
    );
  }

  if (!started) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-1)' }}>
        <div className="card" style={{ maxWidth: 500, width: '100%', textAlign: 'center', background: 'var(--surface-1)', border: '1px solid var(--border-2)', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <Award size={40} color="#3b82f6" />
          </div>
          <h2 style={{ fontSize: 26, fontWeight: 800, marginBottom: 12 }}>{isRu ? 'Проверка знаний' : 'Bilimni sinash testi'}</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 24, fontSize: 14 }}>
            {isRu ? `Этот тест состоит из ${quizData.questions.length} вопросов. Проходной балл ${quizData.passingScore}%.` : `Ushbu test ${quizData.questions.length} ta savoldan iborat. O'tish balli ${quizData.passingScore}%.`}
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginBottom: 30 }}>
            <div style={{ background: 'var(--surface-2)', padding: '12px 20px', borderRadius: 12, border: '1px solid var(--border-1)' }}>
              <Clock size={18} color="#f59e0b" style={{ marginBottom: 4 }} />
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{isRu ? 'Время' : 'Vaqt'}</div>
              <div style={{ fontWeight: 700 }}>{quizData.timeLimit} {isRu ? 'мин' : 'daqiqa'}</div>
            </div>
            <div style={{ background: 'var(--surface-2)', padding: '12px 20px', borderRadius: 12, border: '1px solid var(--border-1)' }}>
              <CheckCircle size={18} color="#22c55e" style={{ marginBottom: 4 }} />
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{isRu ? 'Проход' : 'O\'tish'}</div>
              <div style={{ fontWeight: 700 }}>{quizData.passingScore}%</div>
            </div>
          </div>
          <button className="btn btn-primary" style={{ width: '100%', fontSize: 16, padding: 14 }} onClick={startQuiz}>
            {isRu ? 'Начать тест' : 'Testni boshlash'}
          </button>
        </div>
      </div>
    );
  }

  if (finished) {
    let correctCount = 0;
    quizData.questions.forEach((q, i) => {
      if (answers[i] === q.correctAnswer) correctCount++;
    });
    const score = Math.round((correctCount / quizData.questions.length) * 100) || 0;
    const passed = score >= quizData.passingScore;

    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-1)' }}>
        <div className="card fade-in" style={{ maxWidth: 500, width: '100%', textAlign: 'center', background: 'var(--surface-1)', border: '1px solid var(--border-2)', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
          <div style={{ width: 100, height: 100, borderRadius: '50%', background: passed ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            {passed ? <Award size={50} color="#22c55e" /> : <X size={50} color="#ef4444" />}
          </div>
          <h2 style={{ fontSize: 32, fontWeight: 900, marginBottom: 8, color: passed ? '#22c55e' : '#ef4444' }}>
            {score}%
          </h2>
          <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>
            {passed ? (isRu ? "Поздравляем, вы прошли тест!" : "Tabriklaymiz, testdan o'tdingiz!") : (isRu ? "К сожалению, вы не прошли тест." : "Afsuski, testdan o'ta olmadingiz.")}
          </h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 30 }}>
            {isRu ? `Вы правильно ответили на ${correctCount} из ${quizData.questions.length} вопросов. Минимальный проходной балл ${quizData.passingScore}%.` : `Siz ${quizData.questions.length} ta savoldan ${correctCount} tasiga to'g'ri javob berdingiz. Minimum o'tish balli ${quizData.passingScore}%.`}
          </p>
          {!passed && (
            <button className="btn btn-primary" onClick={() => {
              setFinished(false);
              setStarted(false);
              setAnswers({});
              setTimeLeft(quizData.timeLimit * 60);
              setCurrentIndex(0);
            }} style={{ width: '100%' }}>
              {isRu ? 'Попробовать снова' : 'Qayta urinib ko\'rish'}
            </button>
          )}
        </div>
      </div>
    );
  }

  const q = quizData.questions[currentIndex];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-1)' }}>
      {/* Quiz Header */}
      <div style={{ padding: '20px 30px', background: 'var(--surface-1)', borderBottom: '1px solid var(--border-1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>
            Savol {currentIndex + 1} / {quizData.questions.length}
          </div>
          <div className="progress-bar" style={{ width: 200, height: 6 }}>
            <div className="progress-fill" style={{ width: `${((currentIndex + 1) / quizData.questions.length) * 100}%`, background: '#3b82f6' }} />
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: timeLeft < 60 ? 'rgba(239,68,68,0.1)' : 'rgba(59,130,246,0.1)', padding: '8px 16px', borderRadius: 20, color: timeLeft < 60 ? '#ef4444' : '#3b82f6', fontWeight: 700 }}>
          <Clock size={16} /> {formatTime(timeLeft)}
        </div>
      </div>

      {/* Quiz Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '40px 20px', display: 'flex', justifyContent: 'center' }}>
        <div style={{ maxWidth: 800, width: '100%' }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 30, lineHeight: 1.5 }}>
            {q.text}
          </h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {q.options.map((opt, i) => {
              const isSelected = answers[currentIndex] === i;
              return (
                <button
                  key={i}
                  className={clsx('quiz-option-btn', isSelected && 'selected')}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px',
                    background: isSelected ? 'rgba(59,130,246,0.1)' : 'var(--surface-1)',
                    border: `2px solid ${isSelected ? '#3b82f6' : 'var(--border-1)'}`,
                    borderRadius: 12, cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s',
                    color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)'
                  }}
                  onClick={() => handleSelect(i)}
                >
                  <div style={{
                    width: 24, height: 24, borderRadius: '50%', border: `2px solid ${isSelected ? '#3b82f6' : 'var(--text-muted)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    {isSelected && <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#3b82f6' }} />}
                  </div>
                  <span style={{ fontSize: 16 }}>{opt}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Quiz Footer */}
      <div style={{ padding: '20px 30px', background: 'var(--surface-1)', borderTop: '1px solid var(--border-1)', display: 'flex', justifyContent: 'space-between' }}>
        <button 
          className="btn btn-secondary" 
          disabled={currentIndex === 0}
          onClick={() => setCurrentIndex(i => i - 1)}
        >
          Oldingi savol
        </button>
        {currentIndex === quizData.questions.length - 1 ? (
          <button 
            className="btn btn-primary" 
            style={{ background: '#22c55e', borderColor: '#22c55e' }}
            onClick={() => finishQuiz()}
            disabled={answers[currentIndex] === undefined}
          >
            Testni yakunlash
          </button>
        ) : (
          <button 
            className="btn btn-primary" 
            onClick={() => setCurrentIndex(i => i + 1)}
            disabled={answers[currentIndex] === undefined}
          >
            Keyingi savol
          </button>
        )}
      </div>
    </div>
  );
}
