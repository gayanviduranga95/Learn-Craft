import { useEffect, useState } from "react";
import { X, Trophy, AlertCircle, ChevronRight, ChevronLeft, RotateCcw } from "lucide-react";
import { quizApi } from "../../services/api";
import "./QuizModal.css";

export default function QuizModal({ quizId, courseId, isOpen, onClose, onSuccess }) {
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!isOpen) return;

    let mounted = true;

    async function loadQuiz() {
      try {
        setLoading(true);
        setError("");

        let targetQuizId = quizId;
        // If only courseId was provided, fetch the quizzes for that course and take the first one
        if (!targetQuizId && courseId) {
          const quizzes = await quizApi.getCourseQuizzes(courseId);
          if (quizzes.length > 0) {
            targetQuizId = quizzes[0].id;
          } else {
            throw new Error("No quizzes available for this course yet.");
          }
        }

        if (!targetQuizId) {
          throw new Error("Quiz identifier not specified.");
        }

        const data = await quizApi.getQuizById(targetQuizId);
        if (mounted) setQuiz(data);
      } catch (err) {
        if (mounted) setError(err.message || "Failed to load quiz.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadQuiz();

    return () => {
      mounted = false;
    };
  }, [isOpen, quizId, courseId]);

  if (!isOpen) return null;

  const questions = quiz?.questions || [];
  const currentQuestion = questions[currentIndex];
  const progressPercent = questions.length ? Math.round(((currentIndex + 1) / questions.length) * 100) : 0;

  function handleSelectOption(optIndex) {
    if (result) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentIndex]: optIndex,
    }));
  }

  async function handleSubmit() {
    try {
      setSubmitting(true);
      setError("");

      const formattedAnswers = questions.map((_, idx) => ({
        questionIndex: idx,
        selectedOptionIndex: selectedAnswers[idx] !== undefined ? selectedAnswers[idx] : -1,
      }));

      const res = await quizApi.submitQuiz(quiz.id, formattedAnswers);
      setResult(res.result);
      if (onSuccess) onSuccess(res.result);
    } catch (err) {
      setError(err.message || "Failed to submit quiz.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleRetake() {
    setResult(null);
    setSelectedAnswers({});
    setCurrentIndex(0);
  }

  function handleClose() {
    setResult(null);
    setSelectedAnswers({});
    setCurrentIndex(0);
    setError("");
    onClose();
  }

  const allAnswered = questions.every((_, idx) => selectedAnswers[idx] !== undefined);

  return (
    <div className="lc-quiz-overlay" onClick={handleClose} role="dialog" aria-modal="true">
      <div className="lc-quiz-container" onClick={(e) => e.stopPropagation()}>
        <header className="lc-quiz-header">
          <div className="lc-quiz-header-info">
            <h3>{quiz?.title || "Assessment Quiz"}</h3>
            <p>{quiz?.courseTitle || "Knowledge Check"}</p>
          </div>
          <button className="lc-quiz-close" onClick={handleClose} aria-label="Close Quiz">
            <X size={18} />
          </button>
        </header>

        <div className="lc-quiz-body">
          {loading ? (
            <div style={{ textAlign: "center", padding: "40px" }}>
              <p>Loading quiz questions...</p>
            </div>
          ) : error && !quiz ? (
            <div style={{ textAlign: "center", padding: "40px", color: "#f87171" }}>
              <AlertCircle size={32} style={{ margin: "0 auto 12px" }} />
              <p>{error}</p>
            </div>
          ) : result ? (
            /* Results Screen */
            <div className="lc-quiz-result">
              <div className={`lc-quiz-score-badge ${result.passed ? "passed" : "failed"}`}>
                {result.passed ? <Trophy size={42} /> : <AlertCircle size={42} />}
              </div>

              <h2>{result.passed ? "Quiz Passed!" : "Needs A Little More Practice"}</h2>
              <p>
                {result.passed
                  ? `Outstanding! You achieved ${result.percentage}% (Required: ${result.passingScorePercentage}%).`
                  : `You scored ${result.percentage}%. The passing threshold is ${result.passingScorePercentage}%.`}
              </p>

              <div className="lc-quiz-stats-grid">
                <div className="lc-quiz-stat-box">
                  <strong>{result.score} / {result.totalQuestions}</strong>
                  <span>Correct</span>
                </div>
                <div className="lc-quiz-stat-box">
                  <strong>{result.percentage}%</strong>
                  <span>Your Score</span>
                </div>
                <div className="lc-quiz-stat-box">
                  <strong>{result.passed ? "PASSED" : "RETRY"}</strong>
                  <span>Status</span>
                </div>
              </div>

              <div className="lc-quiz-review">
                <h4 style={{ margin: "0 0 8px", color: "#e2e8f0" }}>Question Review:</h4>
                {result.evaluatedAnswers?.map((ans, idx) => (
                  <div
                    key={idx}
                    className={`lc-quiz-review-item ${ans.isCorrect ? "correct" : "incorrect"}`}
                  >
                    <div className="lc-quiz-review-q">
                      {idx + 1}. {ans.questionText}
                    </div>
                    <div className="lc-quiz-review-detail">
                      <div>
                        Your answer: <strong>{ans.selectedOptionIndex >= 0 ? ans.options[ans.selectedOptionIndex] : "None"}</strong> {ans.isCorrect ? "✓" : "✗"}
                      </div>
                      {!ans.isCorrect && (
                        <div>
                          Correct answer: <strong style={{ color: "#22c55e" }}>{ans.options[ans.correctOptionIndex]}</strong>
                        </div>
                      )}
                      {ans.explanation && (
                        <div style={{ marginTop: "4px", fontStyle: "italic" }}>
                          Explanation: {ans.explanation}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : currentQuestion ? (
            /* Question Screen */
            <div>
              <div className="lc-quiz-progress">
                <span>QUESTION {currentIndex + 1} OF {questions.length}</span>
                <span>{progressPercent}% Complete</span>
              </div>

              <div className="lc-quiz-track">
                <div className="lc-quiz-fill" style={{ width: `${progressPercent}%` }} />
              </div>

              <div className="lc-quiz-question-text">
                {currentQuestion.questionText}
              </div>

              <div className="lc-quiz-options">
                {currentQuestion.options?.map((opt, optIdx) => {
                  const isSelected = selectedAnswers[currentIndex] === optIdx;
                  const letter = String.fromCharCode(65 + optIdx);
                  return (
                    <button
                      key={optIdx}
                      type="button"
                      className={`lc-quiz-option ${isSelected ? "selected" : ""}`}
                      onClick={() => handleSelectOption(optIdx)}
                    >
                      <span className="lc-quiz-opt-letter">{letter}</span>
                      <span>{opt}</span>
                    </button>
                  );
                })}
              </div>

              {error && (
                <p style={{ color: "#ef4444", fontSize: "0.85rem", marginTop: "16px" }}>
                  {error}
                </p>
              )}
            </div>
          ) : null}
        </div>

        <footer className="lc-quiz-footer">
          {result ? (
            <>
              <button
                type="button"
                className="lc-quiz-btn lc-quiz-btn-prev"
                onClick={handleRetake}
              >
                <RotateCcw size={16} /> Retake Quiz
              </button>
              <button
                type="button"
                className="lc-quiz-btn lc-quiz-btn-submit"
                onClick={handleClose}
              >
                Done
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="lc-quiz-btn lc-quiz-btn-prev"
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              >
                <ChevronLeft size={16} /> Previous
              </button>

              {currentIndex < questions.length - 1 ? (
                <button
                  type="button"
                  className="lc-quiz-btn lc-quiz-btn-next"
                  onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                >
                  Next <ChevronRight size={16} />
                </button>
              ) : (
                <button
                  type="button"
                  className="lc-quiz-btn lc-quiz-btn-submit"
                  disabled={submitting || !allAnswered}
                  onClick={handleSubmit}
                >
                  {submitting ? "Evaluating..." : "Submit Quiz"}
                </button>
              )}
            </>
          )}
        </footer>
      </div>
    </div>
  );
}
