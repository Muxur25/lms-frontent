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
  const [data, setData] = useState<QuizData>(() => {
    const base: Partial<QuizData> = initialData || {};
    return {
      timeLimit: base.timeLimit ?? 15,
      passingScore: base.passingScore ?? 70,
      questions: base.questions ?? []
    };
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
          <button className="btn btn-primary" onClick={() => {
            let finalData = data;
            if (currentQuestion && currentQuestion.text.trim()) {
              const hasEmptyOption = currentQuestion.options.some(o => !o.trim());
              if (!hasEmptyOption) {
                const newQuestions = [...data.questions];
                if (editingIndex !== null && editingIndex < newQuestions.length) {
                  newQuestions[editingIndex] = currentQuestion;
                } else {
                  newQuestions.push(currentQuestion);
                }
                finalData = { ...data, questions: newQuestions };
              }
            }
            onSave(finalData);
          }}>Testni tizimga saqlash</button>
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
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [finished, setFinished] = useState(false);
  const [timeLeft, setTimeLeft] = useState(quizData.timeLimit * 60);

  React.useEffect(() => {
    setStarted(false);
    setAnswers({});
    setFinished(false);
    setTimeLeft(quizData.timeLimit * 60);
  }, [quizData]);

  const finishQuiz = React.useCallback((finalAnswers = answers) => {
    setFinished(true);
    let correctCount = 0;
    quizData.questions.forEach((q, i) => {
      if (finalAnswers[i] === q.correctAnswer) correctCount++;
    });
    const score = Math.round((correctCount / quizData.questions.length) * 100) || 0;
    const passed = score >= quizData.passingScore;
    onComplete(score, passed);
  }, [answers, onComplete, quizData]);

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
  }, [started, finished, timeLeft, finishQuiz, answers]);

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (!quizData?.questions?.length) {
    return (
      <div className="quiz-player-container quiz-empty-state">
        <h2>{isRu ? 'Ошибка' : 'Xatolik'}</h2>
        <p>{isRu ? 'В этом тесте нет вопросов!' : 'Bu testda savollar mavjud emas!'}</p>
      </div>
    );
  }

  if (!started) {
    return (
      <div className="quiz-player-container quiz-start-screen">
        <div className="quiz-start-card glass-panel-2">
          <div className="quiz-card-icon"><Award size={40} /></div>
          <h2>{isRu ? 'Проверка знаний' : 'Bilimni sinash testi'}</h2>
          <p>
            {isRu
              ? `Этот тест состоит из ${quizData.questions.length} вопросов. Для успешной сдачи нужно набрать минимум ${quizData.passingScore}%.`
              : `Ushbu test ${quizData.questions.length} ta savoldan iborat. Muvaffaqiyatli o'tish uchun kamida ${quizData.passingScore}% ball to'plashingiz kerak.`}
          </p>
          <div className="quiz-stat-grid">
            <div className="quiz-stat-item"><Clock size={24} /><span>{quizData.timeLimit} {isRu ? 'мин' : 'daqiqa'}</span></div>
            <div className="quiz-stat-item"><CheckCircle size={24} /><span>{quizData.passingScore}%</span></div>
          </div>
          <button className="btn btn-primary btn-lg" onClick={() => setStarted(true)}>
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
      <div className="quiz-player-container quiz-start-screen">
        <div className={clsx('quiz-start-card glass-panel-2', passed ? 'passed' : 'failed')}>
          <div className="quiz-card-icon">{passed ? <Award size={40} /> : <X size={40} />}</div>
          <h2>{score}%</h2>
          <p>
            {isRu
              ? `Правильных ответов: ${correctCount} из ${quizData.questions.length}. Проходной балл: ${quizData.passingScore}%.`
              : `To'g'ri javoblar: ${correctCount}/${quizData.questions.length}. Minimal o'tish balli: ${quizData.passingScore}%.`}
          </p>
          {!passed ? (
            <button className="btn btn-primary btn-lg" onClick={() => { setFinished(false); setStarted(false); setAnswers({}); setTimeLeft(quizData.timeLimit * 60); }}>
              {isRu ? 'Попробовать снова' : 'Qayta urinib ko‘rish'}
            </button>
          ) : (
            <div className="quiz-saved-pill">{isRu ? 'Результат сохранен' : 'Natija tizimga saqlandi'}</div>
          )}
        </div>
      </div>
    );
  }

  const answeredCount = Object.keys(answers).length;

  return (
    <div className="quiz-player-container quiz-scroll-player">
      <div className="quiz-active-header quiz-scroll-header glass-panel-2">
        <div>
          <div className="quiz-scroll-kicker">
            {isRu ? 'Отвечено' : 'Javob berildi'} {answeredCount} / {quizData.questions.length}
          </div>
          <div className="progress-bar quiz-scroll-progress">
            <div className="progress-fill" style={{ width: `${(answeredCount / quizData.questions.length) * 100}%` }} />
          </div>
        </div>
        <div className={clsx('quiz-timer-pill', timeLeft < 60 && 'warning')}>
          <Clock size={16} />
          <span>{formatTime(timeLeft)}</span>
        </div>
      </div>

      <div className="quiz-active-body quiz-scroll-body">
        <div className="quiz-scroll-list fade-in">
          {quizData.questions.map((q, questionIndex) => (
            <section key={q.id || questionIndex} className="quiz-scroll-card">
              <div className="quiz-scroll-question-meta">{isRu ? 'Вопрос' : 'Savol'} {questionIndex + 1}</div>
              <h2 className="quiz-question-text quiz-scroll-question-text">{q.text}</h2>
              <div className="quiz-options-list quiz-scroll-options">
                {q.options.map((opt, optionIndex) => {
                  const isSelected = answers[questionIndex] === optionIndex;
                  return (
                    <button
                      key={optionIndex}
                      className={clsx('quiz-option-button', isSelected && 'selected')}
                      onClick={() => setAnswers(prev => ({ ...prev, [questionIndex]: optionIndex }))}
                    >
                      <div className="quiz-radio-circle"><div className="quiz-radio-inner" /></div>
                      <span className="quiz-option-text">{opt}</span>
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </div>

      <div className="quiz-active-footer quiz-scroll-footer glass-panel-2">
        <span>{isRu ? 'Прокручивайте вопросы вверх и вниз' : 'Savollarni yuqoriga-pastga scroll qilib ishlang'}</span>
        <button className="btn btn-primary" onClick={() => finishQuiz()} disabled={answeredCount < quizData.questions.length}>
          {isRu ? 'Завершить тест' : 'Testni yakunlash'}
        </button>
      </div>
    </div>
  );
}
