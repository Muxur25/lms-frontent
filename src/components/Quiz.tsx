import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Plus, X, Trash2, Edit3, CheckCircle, Clock, Award, ShieldCheck } from 'lucide-react';
import { clsx } from 'clsx';
import type { QuizData, QuizQuestion } from '../pages/CoursePage';

const nextId = () => Math.random().toString(36).slice(2, 11);

interface QuizBuilderProps {
  initialData?: QuizData;
  onSave: (data: QuizData) => void;
  onClose: () => void;
  isRu?: boolean;
}

export function QuizBuilderModal({ initialData, onSave, onClose, isRu = false }: QuizBuilderProps) {
  const [data, setData] = useState<QuizData>(() => {
    const base: Partial<QuizData> = initialData || {};
    return {
      timeLimit: base.timeLimit ?? 15,
      passingScore: Math.max(75, base.passingScore ?? 75),
      questions: base.questions ?? [],
    };
  });
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion | null>(null);

  const t = {
    title: isRu ? 'Настройки теста' : 'Test sozlamalari',
    subtitle: isRu ? 'Настройте время, проходной балл и вопросы' : "Vaqt, o'tish balli va savollarni kiriting",
    time: isRu ? 'Время (минут)' : 'Vaqt (daqiqa)',
    passing: isRu ? 'Проходной балл (%)' : "O'tish balli (%)",
    questions: isRu ? 'Список вопросов' : "Savollar ro'yxati",
    newQuestion: isRu ? 'Новый вопрос' : 'Yangi savol',
    editQuestion: isRu ? 'Редактировать вопрос' : 'Savolni tahrirlash',
    addQuestion: isRu ? 'Добавить вопрос' : "Yangi savol qo'shish",
    questionText: isRu ? 'Текст вопроса' : 'Savol matni',
    questionPlaceholder: isRu ? 'Введите вопрос...' : 'Savol kiriting...',
    options: isRu ? 'Варианты (отметьте правильный)' : "Variantlar (to'g'ri javobni belgilang)",
    markCorrect: isRu ? 'Отметить правильный ответ' : "To'g'ri javobni belgilash",
    addOption: isRu ? '+ Добавить вариант' : "+ Variant qo'shish",
    empty: isRu ? 'Вопросы пока не добавлены.' : "Hali hech qanday savol qo'shilmagan.",
    correct: isRu ? 'Правильный ответ' : "To'g'ri javob",
    cancel: isRu ? 'Отмена' : 'Bekor qilish',
    save: isRu ? 'Сохранить' : 'Saqlash',
    saveTest: isRu ? 'Сохранить тест' : 'Testni tizimga saqlash',
    textRequired: isRu ? 'Введите текст вопроса!' : 'Savol matnini kiriting!',
    optionsRequired: isRu ? 'Заполните все варианты!' : "Barcha variantlarni to'ldiring!",
  };

  React.useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

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
      correctAnswer: 0,
    });
  };

  const saveQuestion = () => {
    if (!currentQuestion) return;
    if (!currentQuestion.text.trim()) return alert(t.textRequired);
    if (currentQuestion.options.some((option) => !option.trim())) return alert(t.optionsRequired);

    const nextQuestions = [...data.questions];
    if (editingIndex !== null && editingIndex < nextQuestions.length) {
      nextQuestions[editingIndex] = currentQuestion;
    } else {
      nextQuestions.push(currentQuestion);
    }
    setData({ ...data, questions: nextQuestions });
    setEditingIndex(null);
    setCurrentQuestion(null);
  };

  const deleteQuestion = (index: number) => {
    const nextQuestions = [...data.questions];
    nextQuestions.splice(index, 1);
    setData({ ...data, questions: nextQuestions });
  };

  const handleSaveTest = () => {
    let finalData = { ...data, passingScore: Math.max(75, data.passingScore) };
    if (currentQuestion && currentQuestion.text.trim() && !currentQuestion.options.some((option) => !option.trim())) {
      const nextQuestions = [...data.questions];
      if (editingIndex !== null && editingIndex < nextQuestions.length) {
        nextQuestions[editingIndex] = currentQuestion;
      } else {
        nextQuestions.push(currentQuestion);
      }
      finalData = { ...finalData, questions: nextQuestions };
    }
    onSave(finalData);
  };

  const modal = (
    <div
      className="quiz-builder-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="quiz-builder-modal modal-animate" role="dialog" aria-modal="true">
        <div className="quiz-builder-head">
          <div>
            <h2>{t.title}</h2>
            <p>{t.subtitle}</p>
          </div>
          <button className="btn btn-ghost btn-sm btn-icon" onClick={onClose} aria-label={t.cancel}>
            <X size={20} />
          </button>
        </div>

        <div className="quiz-builder-body">
          <div className="quiz-builder-settings">
            <div className="input-group">
              <label className="input-label"><Clock size={14} color="#3b82f6" /> {t.time}</label>
              <input
                type="number"
                className="input"
                value={data.timeLimit}
                min={1}
                onChange={(event) => setData({ ...data, timeLimit: parseInt(event.target.value, 10) || 1 })}
              />
            </div>
            <div className="input-group">
              <label className="input-label"><Award size={14} color="#f59e0b" /> {t.passing}</label>
              <input
                type="number"
                className="input"
                value={data.passingScore}
                min={75}
                max={100}
                onChange={(event) => setData({ ...data, passingScore: Math.max(75, parseInt(event.target.value, 10) || 75) })}
              />
            </div>
          </div>

          <div className="quiz-builder-section-head">
            <h3>{t.questions} ({data.questions.length})</h3>
            {!currentQuestion && (
              <button className="btn btn-primary btn-sm" onClick={startAdd}>
                <Plus size={14} /> {t.newQuestion}
              </button>
            )}
          </div>

          {currentQuestion ? (
            <div className="quiz-question-editor">
              <h4>{editingIndex !== null && editingIndex < data.questions.length ? t.editQuestion : t.addQuestion}</h4>
              <div className="input-group">
                <label className="input-label">{t.questionText}</label>
                <textarea
                  className="input"
                  rows={2}
                  value={currentQuestion.text}
                  onChange={(event) => setCurrentQuestion({ ...currentQuestion, text: event.target.value })}
                  placeholder={t.questionPlaceholder}
                />
              </div>

              <label className="input-label quiz-options-label">{t.options}</label>
              <div className="quiz-builder-options">
                {currentQuestion.options.map((option, index) => (
                  <div key={index} className="quiz-builder-option-row">
                    <button
                      className={clsx('quiz-correct-toggle', currentQuestion.correctAnswer === index && 'active')}
                      onClick={() => setCurrentQuestion({ ...currentQuestion, correctAnswer: index })}
                      title={t.markCorrect}
                      type="button"
                    >
                      <CheckCircle size={16} />
                    </button>
                    <input
                      className="input"
                      placeholder={`${index + 1}-variant...`}
                      value={option}
                      onChange={(event) => {
                        const nextOptions = [...currentQuestion.options];
                        nextOptions[index] = event.target.value;
                        setCurrentQuestion({ ...currentQuestion, options: nextOptions });
                      }}
                    />
                    {currentQuestion.options.length > 2 && (
                      <button
                        className="btn btn-ghost btn-sm btn-icon"
                        onClick={() => {
                          const nextOptions = [...currentQuestion.options];
                          nextOptions.splice(index, 1);
                          let nextCorrect = currentQuestion.correctAnswer;
                          if (nextCorrect === index) nextCorrect = 0;
                          else if (nextCorrect > index) nextCorrect -= 1;
                          setCurrentQuestion({ ...currentQuestion, options: nextOptions, correctAnswer: nextCorrect });
                        }}
                      >
                        <Trash2 size={16} color="var(--red-400)" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <button
                className="btn btn-ghost btn-sm quiz-add-option"
                onClick={() => setCurrentQuestion({ ...currentQuestion, options: [...currentQuestion.options, ''] })}
              >
                {t.addOption}
              </button>

              <div className="quiz-editor-actions">
                <button className="btn btn-secondary btn-sm" onClick={() => { setCurrentQuestion(null); setEditingIndex(null); }}>
                  {t.cancel}
                </button>
                <button className="btn btn-primary btn-sm" onClick={saveQuestion}>
                  {t.save}
                </button>
              </div>
            </div>
          ) : (
            <div className="quiz-builder-question-list">
              {data.questions.length === 0 ? (
                <div className="quiz-builder-empty">{t.empty}</div>
              ) : (
                data.questions.map((question, index) => (
                  <div key={question.id || index} className="quiz-builder-question-card">
                    <div>
                      <strong>{index + 1}. {question.text}</strong>
                      <span>{t.correct}: <b>{question.options[question.correctAnswer]}</b></span>
                    </div>
                    <div className="quiz-builder-card-actions">
                      <button className="btn btn-ghost btn-sm btn-icon" onClick={() => startEdit(index)}>
                        <Edit3 size={15} color="var(--blue-400)" />
                      </button>
                      <button className="btn btn-ghost btn-sm btn-icon" onClick={() => deleteQuestion(index)}>
                        <Trash2 size={15} color="var(--red-400)" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <div className="quiz-builder-footer">
          <button className="btn btn-secondary" onClick={onClose}>{t.cancel}</button>
          <button className="btn btn-primary" onClick={handleSaveTest}>{t.saveTest}</button>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}

interface QuizPlayerProps {
  quizData: QuizData;
  onComplete: (score: number, passed: boolean) => void;
  isRu?: boolean;
}

export function QuizPlayer({ quizData, onComplete, isRu = false }: QuizPlayerProps) {
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
    quizData.questions.forEach((question, index) => {
      if (finalAnswers[index] === question.correctAnswer) correctCount += 1;
    });
    const score = Math.round((correctCount / quizData.questions.length) * 100) || 0;
    onComplete(score, score >= quizData.passingScore);
  }, [answers, onComplete, quizData]);

  React.useEffect(() => {
    if (!started || finished || timeLeft <= 0) return;
    const timer = window.setInterval(() => {
      setTimeLeft((current) => {
        if (current <= 1) {
          finishQuiz(answers);
          return 0;
        }
        return current - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [started, finished, timeLeft, finishQuiz, answers]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const rest = seconds % 60;
    return `${minutes}:${String(rest).padStart(2, '0')}`;
  };

  const labels = {
    error: isRu ? 'Ошибка' : 'Xatolik',
    noQuestions: isRu ? 'В этом тесте нет вопросов!' : 'Bu testda savollar mavjud emas!',
    startTitle: isRu ? 'Проверка знаний' : 'Bilimni sinash testi',
    startText: isRu
      ? `Этот тест состоит из ${quizData.questions.length} вопросов. Для успешной сдачи нужно набрать минимум ${quizData.passingScore}%.`
      : `Ushbu test ${quizData.questions.length} ta savoldan iborat. Muvaffaqiyatli o'tish uchun kamida ${quizData.passingScore}% ball to'plashingiz kerak.`,
    minutes: isRu ? 'мин' : 'daqiqa',
    passScore: isRu ? 'Проходной балл' : "O'tish balli",
    start: isRu ? 'Начать тест' : 'Testni boshlash',
    retry: isRu ? 'Попробовать снова' : "Qayta urinib ko'rish",
    saved: isRu ? 'Результат сохранен' : 'Natija tizimga saqlandi',
    answered: isRu ? 'Отвечено' : 'Javob berildi',
    question: isRu ? 'Вопрос' : 'Savol',
    scrollHint: isRu ? 'Ответьте на все вопросы и завершите тест' : 'Barcha savollarga javob berib testni yakunlang',
    finish: isRu ? 'Завершить тест' : 'Testni yakunlash',
  };

  if (!quizData?.questions?.length) {
    return (
      <div className="quiz-player-container quiz-empty-state">
        <div className="quiz-start-card glass-panel-2">
          <h2>{labels.error}</h2>
          <p>{labels.noQuestions}</p>
        </div>
      </div>
    );
  }

  if (!started) {
    return (
      <div className="quiz-player-container quiz-start-screen">
        <div className="quiz-start-card glass-panel-2">
          <div className="quiz-card-icon"><ShieldCheck size={40} /></div>
          <h2>{labels.startTitle}</h2>
          <p>{labels.startText}</p>
          <div className="quiz-stat-grid">
            <div className="quiz-stat-item"><Clock size={24} /><span>{quizData.timeLimit} {labels.minutes}</span></div>
            <div className="quiz-stat-item"><CheckCircle size={24} /><span>{labels.passScore}: {quizData.passingScore}%</span></div>
          </div>
          <button className="btn btn-primary btn-lg" onClick={() => setStarted(true)}>
            {labels.start}
          </button>
        </div>
      </div>
    );
  }

  if (finished) {
    let correctCount = 0;
    quizData.questions.forEach((question, index) => {
      if (answers[index] === question.correctAnswer) correctCount += 1;
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
              {labels.retry}
            </button>
          ) : (
            <div className="quiz-saved-pill">{labels.saved}</div>
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
          <div className="quiz-scroll-kicker">{labels.answered} {answeredCount} / {quizData.questions.length}</div>
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
          {quizData.questions.map((question, questionIndex) => (
            <section key={question.id || questionIndex} className="quiz-scroll-card">
              <div className="quiz-scroll-question-meta">{labels.question} {questionIndex + 1}</div>
              <h2 className="quiz-question-text quiz-scroll-question-text">{question.text}</h2>
              <div className="quiz-options-list quiz-scroll-options">
                {question.options.map((option, optionIndex) => {
                  const isSelected = answers[questionIndex] === optionIndex;
                  return (
                    <button
                      key={optionIndex}
                      className={clsx('quiz-option-button', isSelected && 'selected')}
                      onClick={() => setAnswers((current) => ({ ...current, [questionIndex]: optionIndex }))}
                    >
                      <div className="quiz-radio-circle"><div className="quiz-radio-inner" /></div>
                      <span className="quiz-option-text">{option}</span>
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </div>

      <div className="quiz-active-footer quiz-scroll-footer glass-panel-2">
        <span>{labels.scrollHint}</span>
        <button className="btn btn-primary" onClick={() => finishQuiz()} disabled={answeredCount < quizData.questions.length}>
          {labels.finish}
        </button>
      </div>
    </div>
  );
}
