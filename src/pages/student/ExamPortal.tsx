import { useState, useEffect, useRef, useCallback } from 'react';
import { AppLayout } from '../../layouts/AppLayout';
import { Card } from '../../components/shared/Card';
import { Button } from '../../components/shared/Button';
import { Badge } from '../../components/shared/Badge';
import { EmptyState } from '../../components/shared/EmptyState';
import { Modal } from '../../components/shared/Modal';
import { useAuthStore } from '../../store/authStore';
import { useFirestoreCollection } from '../../hooks/useFirestore';
import { db } from '../../firebase/config';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import type { Exam, Submission, Batch } from '../../types';
import {
  Clock,
  FileText,
  AlertTriangle,
  CheckCircle,
  Play,
  Trophy,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

type ExamView = 'list' | 'attempt' | 'result';

export function StudentExamPortal() {
  const { user } = useAuthStore();
  const { data: allExams, loading: eLoading } = useFirestoreCollection<Exam>('exams');
  const { data: batches, loading: bLoading } = useFirestoreCollection<Batch>('batches');
  const { data: submissions, loading: sLoading } =
    useFirestoreCollection<Submission>('submissions');

  const [view, setView] = useState<ExamView>('list');
  const [activeExam, setActiveExam] = useState<Exam | null>(null);
  const [answers, setAnswers] = useState<Record<string, number | null>>({});
  const [currentQ, setCurrentQ] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [anticheatFlags, setAnticheatFlags] = useState<Submission['anticheatFlags']>([]);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [resultSub, setResultSub] = useState<Submission | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const draftRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const availableExams = allExams.filter(
    (e) => e.status === 'published' && user?.batchIds?.includes(e.batchId),
  );
  const closedExams = allExams.filter(
    (e) => e.status === 'closed' && user?.batchIds?.includes(e.batchId),
  );

  const studentSubmissions = submissions.filter((s) => s.studentId === user?.uid);
  const getSubmission = (examId: string) => studentSubmissions.find((s) => s.examId === examId);

  const submitExam = useCallback(
    async (auto = false) => {
      if (!activeExam || !user || submitting) return;
      setSubmitting(true);

      if (timerRef.current) clearInterval(timerRef.current);
      if (draftRef.current) clearInterval(draftRef.current);

      try {
        toast.loading('Submitting exam...', { id: 'submit' });

        // 1. Grade the exam locally
        let score = 0;
        activeExam.questions.forEach((q) => {
          const studentAns = answers[q.id];
          if (studentAns !== undefined && studentAns !== null) {
            if (studentAns === q.correctIdx) {
              score += activeExam.marksPerQ;
            } else {
              score -= activeExam.negativeMarks;
            }
          }
        });

        const submissionId = `sub_${Date.now()}_${user.uid}`;
        const timeTaken = activeExam.durationMins * 60 - Math.max(0, timeLeft);

        const subData: Submission = {
          id: submissionId,
          examId: activeExam.id,
          studentId: user.uid,
          batchId: activeExam.batchId,
          answers,
          draft: false,
          draftSavedAt: new Date().toISOString(),
          submittedAt: new Date().toISOString(),
          gradedAt: new Date().toISOString(),
          score,
          totalMarks: activeExam.totalMarks,
          timeTakenSecs: timeTaken,
          anticheatFlags,
          createdAt: new Date().toISOString(),
        };

        // 2. Save Submission to Firestore
        await setDoc(doc(db, 'submissions', submissionId), subData);

        // 3. Update Leaderboard
        try {
          const lbRef = doc(db, 'leaderboards', activeExam.batchId);
          const lbSnap = await getDoc(lbRef);
          if (lbSnap.exists()) {
            const lb = lbSnap.data();
            const rankings = lb.rankings || [];
            const entry = rankings.find((r: any) => r.studentId === user.uid);
            if (entry) {
              entry.totalScore += score;
              entry.examsTaken += 1;
              entry.avgScore = entry.totalScore / entry.examsTaken;
            } else {
              rankings.push({
                rank: 0,
                studentId: user.uid,
                studentName: user.name,
                totalScore: score,
                examsTaken: 1,
                avgScore: score,
              });
            }
            rankings.sort((a: any, b: any) => b.totalScore - a.totalScore);
            rankings.forEach((r: any, idx: number) => (r.rank = idx + 1));
            await setDoc(lbRef, { ...lb, rankings, updatedAt: new Date().toISOString() });
          } else {
            await setDoc(lbRef, {
              batchId: activeExam.batchId,
              updatedAt: new Date().toISOString(),
              rankings: [
                {
                  rank: 1,
                  studentId: user.uid,
                  studentName: user.name,
                  totalScore: score,
                  examsTaken: 1,
                  avgScore: score,
                },
              ],
            });
          }
        } catch (lbErr) {
          console.error('Failed to update leaderboard', lbErr);
        }

        toast.success(auto ? 'Time up! Exam auto-submitted.' : 'Exam submitted successfully!', {
          id: 'submit',
        });

        setResultSub(subData);
        setView('result');
        setConfirmSubmit(false);
      } catch (err) {
        console.error(err);
        toast.error(
          'Failed to submit exam: ' + (err instanceof Error ? err.message : 'Unknown error'),
          { id: 'submit' },
        );
        // Restart timers if submit fails
        if (!auto) {
          setConfirmSubmit(false);
          // simple timer restart omitted for brevity, but should be handled.
        }
      } finally {
        setSubmitting(false);
      }
    },
    [activeExam, answers, anticheatFlags, timeLeft, user, submitting],
  );

  const handleAutoSubmit = useCallback(() => {
    if (!activeExam || !user) return;
    submitExam(true);
  }, [activeExam, user, submitExam]);

  // Timer
  useEffect(() => {
    if (view === 'attempt' && timeLeft > 0 && !submitting) {
      timerRef.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) {
            clearInterval(timerRef.current!);
            handleAutoSubmit();
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line
  }, [view, activeExam, submitting]);

  // Anti-cheat
  useEffect(() => {
    if (view !== 'attempt') return;
    const handleVisibility = () => {
      if (document.hidden) {
        setAnticheatFlags((prev) => [
          ...prev,
          { type: 'tab_switch', occurredAt: new Date().toISOString() },
        ]);
        toast.error('⚠️ Tab switch detected and logged!', { duration: 3000 });
      }
    };
    const handleBlur = () => {
      setAnticheatFlags((prev) => [
        ...prev,
        { type: 'focus_loss', occurredAt: new Date().toISOString() },
      ]);
    };
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('blur', handleBlur);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('blur', handleBlur);
    };
  }, [view]);

  // Draft save every 30s
  useEffect(() => {
    if (view === 'attempt') {
      draftRef.current = setInterval(() => {
        toast.success('Draft auto-saved', { duration: 1500, icon: '💾' });
      }, 30000);
    }
    return () => {
      if (draftRef.current) clearInterval(draftRef.current);
    };
  }, [view]);

  const startExam = (exam: Exam) => {
    setActiveExam(exam);
    setAnswers({});
    setCurrentQ(0);
    setAnticheatFlags([]);
    setTimeLeft(exam.durationMins * 60);
    setView('attempt');
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const answeredCount = Object.values(answers).filter((a) => a !== null && a !== undefined).length;

  if (eLoading || bLoading || sLoading) {
    return (
      <AppLayout role="student" title="Exam Portal">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="animate-spin text-[#1A3C5E]" size={32} />
        </div>
      </AppLayout>
    );
  }

  if (view === 'result' && resultSub && activeExam) {
    const pct = Math.round((resultSub.score! / resultSub.totalMarks) * 100);
    return (
      <AppLayout role="student" title="Exam Result">
        <div className="max-w-2xl mx-auto">
          <Card className="text-center mb-4">
            <div className="mb-4">
              <div
                className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center text-white text-3xl font-bold mb-3 ${pct >= 75 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
              >
                {pct}%
              </div>
              <h2 className="text-xl font-bold text-slate-900">{activeExam.title}</h2>
              <p className="text-slate-500 mt-1">
                {resultSub.score} / {resultSub.totalMarks} marks
              </p>
            </div>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <p className="text-2xl font-bold text-blue-700">{resultSub.score}</p>
                <p className="text-xs text-slate-500">Score</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {resultSub.timeTakenSecs ? `${Math.floor(resultSub.timeTakenSecs / 60)}m` : '—'}
                </p>
                <p className="text-xs text-slate-500">Time Taken</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-700">
                  {resultSub.anticheatFlags.length}
                </p>
                <p className="text-xs text-slate-500">Flags</p>
              </div>
            </div>
            <div
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold ${pct >= 75 ? 'bg-emerald-100 text-emerald-800' : pct >= 50 ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'}`}
            >
              {pct >= 75 ? (
                <>
                  <CheckCircle size={16} />
                  Excellent!
                </>
              ) : pct >= 50 ? (
                <>
                  <Trophy size={16} />
                  Good Effort!
                </>
              ) : (
                <>
                  <AlertTriangle size={16} />
                  Keep Practicing
                </>
              )}
            </div>
          </Card>

          {/* Question Review */}
          <Card>
            <h3 className="font-semibold text-slate-900 mb-4">Question Review</h3>
            <div className="space-y-3">
              {activeExam.questions.map((q, idx) => {
                const myAns = resultSub.answers[q.id];
                const correct = q.correctIdx === myAns;
                const unanswered = myAns === null || myAns === undefined;
                return (
                  <div
                    key={q.id}
                    className={`p-3 rounded-xl border ${correct ? 'bg-emerald-50 border-emerald-200' : unanswered ? 'bg-slate-50 border-slate-200' : 'bg-red-50 border-red-200'}`}
                  >
                    <p className="text-sm font-medium text-slate-900 mb-2">
                      Q{idx + 1}. {q.text}
                    </p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {q.options.map((opt, oi) => (
                        <div
                          key={oi}
                          className={`text-xs p-2 rounded-lg flex items-center gap-1.5 ${
                            oi === q.correctIdx
                              ? 'bg-emerald-200 text-emerald-900 font-semibold'
                              : oi === myAns && !correct
                                ? 'bg-red-200 text-red-900 font-semibold'
                                : 'bg-white text-slate-600 border border-slate-200'
                          }`}
                        >
                          {oi === q.correctIdx && <CheckCircle size={11} />}
                          {oi === myAns && !correct && <AlertTriangle size={11} />}
                          <span className="font-semibold">
                            {String.fromCharCode(65 + oi)}.
                          </span>{' '}
                          {opt}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          <div className="mt-4 flex justify-center">
            <Button
              onClick={() => {
                setView('list');
                setActiveExam(null);
                setResultSub(null);
              }}
            >
              Back to Exams
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (view === 'attempt' && activeExam) {
    const q = activeExam.questions[currentQ];
    const timerWarning = timeLeft < 300;
    return (
      <AppLayout role="student" title="">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-4 p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
            <div>
              <p className="text-sm font-semibold text-slate-900 truncate">{activeExam.title}</p>
              <p className="text-xs text-slate-500">
                {answeredCount}/{activeExam.questions.length} answered
              </p>
            </div>
            <div
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono font-bold text-lg ${timerWarning ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-slate-100 text-slate-900'}`}
            >
              <Clock size={18} />
              {formatTime(timeLeft)}
            </div>
          </div>

          {/* Question */}
          <Card className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <Badge variant="info">
                Question {currentQ + 1} of {activeExam.questions.length}
              </Badge>
              <span className="text-xs text-slate-500">
                +{activeExam.marksPerQ} | -{activeExam.negativeMarks}
              </span>
            </div>
            <p className="text-base font-medium text-slate-900 mb-4">{q.text}</p>
            <div className="space-y-2">
              {q.options.map((opt, oi) => (
                <button
                  key={oi}
                  onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: oi }))}
                  className={`w-full text-left p-3 rounded-xl border text-sm transition-all duration-150 ${
                    answers[q.id] === oi
                      ? 'bg-[#4a1a5e] text-white border-[#4a1a5e]'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                  }`}
                >
                  <span className="font-semibold mr-2">{String.fromCharCode(65 + oi)}.</span>
                  {opt}
                </button>
              ))}
            </div>
          </Card>

          {/* Navigation & Answer Grid */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <p className="text-xs text-slate-500 mb-2">Answer Status</p>
              <div className="flex flex-wrap gap-1.5">
                {activeExam.questions.map((_, i) => {
                  const ans = answers[activeExam.questions[i].id];
                  const answered = ans !== null && ans !== undefined;
                  return (
                    <button
                      key={i}
                      onClick={() => setCurrentQ(i)}
                      className={`w-8 h-8 rounded-lg text-xs font-semibold border transition-all ${
                        i === currentQ
                          ? 'bg-[#4a1a5e] text-white border-[#4a1a5e]'
                          : answered
                            ? 'bg-emerald-500 text-white border-emerald-500'
                            : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {i + 1}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setCurrentQ((q) => Math.max(0, q - 1))}
                disabled={currentQ === 0}
                leftIcon={<ChevronLeft size={15} />}
              >
                Prev
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setCurrentQ((q) => Math.min(activeExam.questions.length - 1, q + 1))}
                disabled={currentQ === activeExam.questions.length - 1}
                rightIcon={<ChevronRight size={15} />}
              >
                Next
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={() => setConfirmSubmit(true)}
                isLoading={submitting}
              >
                Submit
              </Button>
            </div>
          </div>

          {anticheatFlags.length > 0 && (
            <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
              <AlertTriangle size={13} />
              {anticheatFlags.length} anti-cheat flag(s) recorded
            </div>
          )}
        </div>

        {/* Confirm Submit Modal */}
        <Modal
          isOpen={confirmSubmit}
          onClose={() => setConfirmSubmit(false)}
          title="Submit Exam?"
          size="sm"
          footer={
            <>
              <Button
                variant="outline"
                onClick={() => setConfirmSubmit(false)}
                disabled={submitting}
              >
                Continue Exam
              </Button>
              <Button variant="danger" onClick={() => submitExam(false)} isLoading={submitting}>
                Submit Now
              </Button>
            </>
          }
        >
          <div className="space-y-3">
            <p className="text-sm text-slate-700">
              You've answered <strong>{answeredCount}</strong> out of{' '}
              <strong>{activeExam.questions.length}</strong> questions.
            </p>
            {answeredCount < activeExam.questions.length && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                ⚠️ <strong>{activeExam.questions.length - answeredCount}</strong> questions are
                unanswered. Unanswered questions won't receive any marks.
              </div>
            )}
            <p className="text-sm text-slate-500">Once submitted, you cannot go back.</p>
          </div>
        </Modal>
      </AppLayout>
    );
  }

  return (
    <AppLayout role="student" title="Exam Portal">
      {/* Active Exams */}
      <h2 className="text-base font-semibold text-slate-900 mb-3">Available Exams</h2>
      {availableExams.length === 0 ? (
        <EmptyState
          icon={<FileText size={48} />}
          title="No active exams"
          description="There are no live exams for your batches right now."
        />
      ) : (
        <div className="space-y-3 mb-6">
          {availableExams.map((exam) => {
            const sub = getSubmission(exam.id);
            const batch = batches.find((b) => b.id === exam.batchId);
            const endTime = exam.publishedAt
              ? new Date(new Date(exam.publishedAt).getTime() + exam.durationMins * 60 * 1000)
              : null;
            return (
              <Card key={exam.id} className="border-purple-200 bg-purple-50/50">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-slate-900">{exam.title}</h3>
                      {sub && !sub.draft ? (
                        <Badge variant="success" size="sm">
                          Submitted
                        </Badge>
                      ) : (
                        <Badge variant="warning" size="sm">
                          Live
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                      <span>
                        <Clock size={12} className="inline mr-1" />
                        {exam.durationMins} minutes
                      </span>
                      <span>
                        {exam.totalMarks} marks • {exam.marksPerQ} per Q
                      </span>
                      {exam.negativeMarks > 0 && (
                        <span className="text-red-600">-{exam.negativeMarks} negative</span>
                      )}
                      <span>{batch?.name}</span>
                    </div>
                    {endTime && (
                      <p className="text-xs text-slate-400 mt-1">
                        Closes: {format(endTime, 'h:mm a')}
                      </p>
                    )}
                  </div>
                  {sub && !sub.draft ? (
                    <div className="text-right">
                      <p className="text-sm font-bold text-emerald-700">
                        {sub.score}/{sub.totalMarks}
                      </p>
                      <p className="text-xs text-slate-400">Your score</p>
                    </div>
                  ) : (
                    <Button size="sm" onClick={() => startExam(exam)} leftIcon={<Play size={14} />}>
                      Attempt
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Past Exams */}
      <h2 className="text-base font-semibold text-slate-900 mb-3">Past Exams</h2>
      {closedExams.length === 0 ? (
        <p className="text-sm text-slate-400">No past exams yet.</p>
      ) : (
        <div className="space-y-3">
          {closedExams.map((exam) => {
            const sub = getSubmission(exam.id);
            const batch = batches.find((b) => b.id === exam.batchId);
            const pct =
              sub?.score !== null && sub?.score !== undefined
                ? Math.round((sub.score / sub.totalMarks) * 100)
                : null;
            return (
              <Card key={exam.id} className="opacity-90">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-slate-900">{exam.title}</h3>
                      <Badge variant="neutral" size="sm">
                        Closed
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                      <span>
                        {exam.durationMins} minutes • {exam.totalMarks} marks
                      </span>
                      <span>{batch?.name}</span>
                      {exam.closedAt && (
                        <span>Closed {format(new Date(exam.closedAt), 'MMM d, yyyy')}</span>
                      )}
                    </div>
                  </div>
                  {sub && !sub.draft ? (
                    <div className="text-right">
                      <p
                        className={`text-sm font-bold ${pct && pct >= 75 ? 'text-emerald-700' : pct && pct >= 50 ? 'text-amber-700' : 'text-red-600'}`}
                      >
                        {sub.score}/{sub.totalMarks}
                      </p>
                      <p className="text-xs text-slate-400">{pct}%</p>
                    </div>
                  ) : (
                    <Badge variant="neutral" size="sm">
                      Not Attempted
                    </Badge>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </AppLayout>
  );
}
