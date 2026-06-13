import { useState } from 'react';
import { AppLayout } from '../../layouts/AppLayout';
import { Card } from '../../components/shared/Card';
import { Button } from '../../components/shared/Button';
import { Badge } from '../../components/shared/Badge';
import { Input, Select, Textarea } from '../../components/shared/Input';
import { Modal } from '../../components/shared/Modal';
import { EmptyState } from '../../components/shared/EmptyState';
import { useAuthStore } from '../../store/authStore';
import {
  mockBatches,
  mockExams as initExams,
  mockSubmissions,
  mockStudents,
} from '../../data/mockData';
import type { Exam, Question, ExamStatus } from '../../types';
import { format } from 'date-fns';
import {
  Plus,
  FileText,
  Clock,
  Users,
  BarChart2,
  Eye,
  Play,
  X,
  Trash2,
  PlusCircle,
  CheckCircle,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';

export function TeacherExams() {
  const { user } = useAuthStore();
  const myBatches = mockBatches.filter((b) => b.teacherId === user?.uid);
  const [exams, setExams] = useState<Exam[]>(initExams.filter((e) => e.teacherId === user?.uid));
  const [activeTab, setActiveTab] = useState<'list' | 'create' | 'results'>('list');
  const [viewExam, setViewExam] = useState<Exam | null>(null);
  const [resultsExam, setResultsExam] = useState<Exam | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | ExamStatus>('all');

  const [newExam, setNewExam] = useState({
    title: '',
    batchId: myBatches[0]?.id || '',
    durationMins: 60,
    marksPerQ: 4,
    negativeMarks: 1,
    questions: [] as Question[],
  });

  const [newQuestion, setNewQuestion] = useState({
    text: '',
    options: ['', '', '', ''],
    correctIdx: 0,
  });

  const filtered = exams.filter((e) => filterStatus === 'all' || e.status === filterStatus);

  const addQuestion = () => {
    if (!newQuestion.text || newQuestion.options.some((o) => !o.trim())) {
      toast.error('Please fill all question fields');
      return;
    }
    const q: Question = {
      id: `q${Date.now()}`,
      text: newQuestion.text,
      options: newQuestion.options,
      correctIdx: newQuestion.correctIdx,
    };
    setNewExam((e) => ({ ...e, questions: [...e.questions, q] }));
    setNewQuestion({ text: '', options: ['', '', '', ''], correctIdx: 0 });
    toast.success('Question added');
  };

  const removeQuestion = (id: string) => {
    setNewExam((e) => ({ ...e, questions: e.questions.filter((q) => q.id !== id) }));
  };

  const createExam = (status: 'draft' | 'published') => {
    if (!newExam.title || !newExam.batchId) {
      toast.error('Please fill all fields');
      return;
    }
    if (newExam.questions.length === 0) {
      toast.error('Add at least one question');
      return;
    }
    const exam: Exam = {
      id: `exam_${Date.now()}`,
      title: newExam.title,
      batchId: newExam.batchId,
      teacherId: user?.uid || '',
      durationMins: newExam.durationMins,
      marksPerQ: newExam.marksPerQ,
      negativeMarks: newExam.negativeMarks,
      totalMarks: newExam.questions.length * newExam.marksPerQ,
      questions: newExam.questions,
      status,
      publishedAt: status === 'published' ? new Date().toISOString() : null,
      closedAt: null,
      createdAt: new Date().toISOString(),
    };
    setExams((prev) => [exam, ...prev]);
    setNewExam({
      title: '',
      batchId: myBatches[0]?.id || '',
      durationMins: 60,
      marksPerQ: 4,
      negativeMarks: 1,
      questions: [],
    });
    setActiveTab('list');
    toast.success(`Exam ${status === 'published' ? 'published' : 'saved as draft'} successfully!`);
  };

  const updateExamStatus = (examId: string, newStatus: ExamStatus) => {
    setExams((prev) =>
      prev.map((e) =>
        e.id === examId
          ? {
              ...e,
              status: newStatus,
              publishedAt:
                newStatus === 'published'
                  ? e.publishedAt || new Date().toISOString()
                  : e.publishedAt,
              closedAt: newStatus === 'closed' ? new Date().toISOString() : e.closedAt,
            }
          : e,
      ),
    );
    toast.success(`Exam ${newStatus}`);
  };

  const getExamSubmissions = (examId: string) =>
    mockSubmissions.filter((s) => s.examId === examId && !s.draft);

  const statusBadge = (status: ExamStatus) => {
    const map = { draft: 'warning', published: 'success', closed: 'neutral' } as const;
    return (
      <Badge variant={map[status]} size="sm">
        {status}
      </Badge>
    );
  };

  return (
    <AppLayout role="teacher" title="MCQ Exams">
      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        {(['list', 'create'] as const).map((tab) => (
          <Button
            key={tab}
            variant={activeTab === tab ? 'primary' : 'outline'}
            onClick={() => setActiveTab(tab)}
            size="sm"
          >
            {tab === 'list' ? 'All Exams' : '+ Create Exam'}
          </Button>
        ))}
      </div>

      {activeTab === 'list' && (
        <>
          <div className="mb-4">
            <div className="flex gap-2">
              {(['all', 'draft', 'published', 'closed'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filterStatus === s ? 'bg-[#1A3C5E] text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              icon={<FileText size={48} />}
              title="No exams found"
              action={
                <Button onClick={() => setActiveTab('create')} leftIcon={<Plus size={16} />}>
                  Create Exam
                </Button>
              }
            />
          ) : (
            <div className="space-y-4">
              {filtered.map((exam) => {
                const subs = getExamSubmissions(exam.id);
                const batch = mockBatches.find((b) => b.id === exam.batchId);
                return (
                  <Card key={exam.id}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-slate-900">{exam.title}</h3>
                          {statusBadge(exam.status)}
                        </div>
                        <div className="flex flex-wrap gap-3 text-xs text-slate-500 mb-3">
                          <span className="flex items-center gap-1">
                            <FileText size={12} />
                            {exam.questions.length} questions • {exam.totalMarks} marks
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock size={12} />
                            {exam.durationMins} minutes
                          </span>
                          <span className="flex items-center gap-1">
                            <Users size={12} />
                            {batch?.name}
                          </span>
                          {exam.publishedAt && (
                            <span>
                              Published {format(new Date(exam.publishedAt), 'MMM d, h:mm a')}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs">
                          <span className="text-blue-600 font-medium">
                            {subs.length} submissions
                          </span>
                          {exam.negativeMarks > 0 && (
                            <span className="text-red-600">-{exam.negativeMarks} negative</span>
                          )}
                          <span>{exam.marksPerQ} marks/question</span>
                        </div>
                      </div>
                      <div className="flex gap-1 flex-shrink-0 flex-col sm:flex-row">
                        {exam.status === 'draft' && (
                          <Button
                            size="xs"
                            variant="success"
                            onClick={() => updateExamStatus(exam.id, 'published')}
                            leftIcon={<Play size={13} />}
                          >
                            Publish
                          </Button>
                        )}
                        {exam.status === 'published' && (
                          <Button
                            size="xs"
                            variant="outline"
                            onClick={() => updateExamStatus(exam.id, 'closed')}
                            leftIcon={<X size={13} />}
                          >
                            Close
                          </Button>
                        )}
                        {exam.status === 'closed' && subs.length > 0 && (
                          <Button
                            size="xs"
                            variant="secondary"
                            onClick={() => setResultsExam(exam)}
                            leftIcon={<BarChart2 size={13} />}
                          >
                            Results
                          </Button>
                        )}
                        <Button
                          size="xs"
                          variant="ghost"
                          onClick={() => setViewExam(exam)}
                          leftIcon={<Eye size={13} />}
                        >
                          View
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}

      {activeTab === 'create' && (
        <div className="space-y-4">
          <Card>
            <h3 className="font-semibold text-slate-900 mb-4">Exam Details</h3>
            <div className="space-y-3">
              <Input
                label="Exam Title"
                value={newExam.title}
                onChange={(e) => setNewExam({ ...newExam, title: e.target.value })}
                placeholder="e.g., Physics Unit Test — Laws of Motion"
                required
              />
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <Select
                  label="Batch"
                  options={myBatches.map((b) => ({ value: b.id, label: b.name }))}
                  value={newExam.batchId}
                  onChange={(e) => setNewExam({ ...newExam, batchId: e.target.value })}
                />
                <Input
                  label="Duration (mins)"
                  type="number"
                  value={newExam.durationMins}
                  onChange={(e) => setNewExam({ ...newExam, durationMins: Number(e.target.value) })}
                />
                <Input
                  label="Marks/Question"
                  type="number"
                  value={newExam.marksPerQ}
                  onChange={(e) => setNewExam({ ...newExam, marksPerQ: Number(e.target.value) })}
                />
                <Input
                  label="Negative Marks"
                  type="number"
                  value={newExam.negativeMarks}
                  onChange={(e) =>
                    setNewExam({ ...newExam, negativeMarks: Number(e.target.value) })
                  }
                  hint="0 = no negative"
                />
              </div>
            </div>
          </Card>

          {/* Questions */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900">
                Questions ({newExam.questions.length})
              </h3>
              <span className="text-sm text-slate-500">
                Total: {newExam.questions.length * newExam.marksPerQ} marks
              </span>
            </div>

            {/* Existing Questions */}
            {newExam.questions.map((q, idx) => (
              <div key={q.id} className="mb-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900">
                      Q{idx + 1}. {q.text}
                    </p>
                    <div className="mt-2 grid grid-cols-2 gap-1">
                      {q.options.map((opt, oi) => (
                        <div
                          key={oi}
                          className={`flex items-center gap-1.5 text-xs p-1.5 rounded-lg ${oi === q.correctIdx ? 'bg-emerald-50 text-emerald-800 font-medium' : 'text-slate-600'}`}
                        >
                          {oi === q.correctIdx && (
                            <CheckCircle size={12} className="text-emerald-600" />
                          )}
                          <span className="font-semibold">{String.fromCharCode(65 + oi)}.</span>{' '}
                          {opt}
                        </div>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => removeQuestion(q.id)}
                    className="p-1 text-slate-400 hover:text-red-500 flex-shrink-0"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}

            {/* Add Question Form */}
            <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 mt-3">
              <p className="text-sm font-semibold text-slate-700 mb-3">Add New Question</p>
              <Textarea
                label="Question Text"
                value={newQuestion.text}
                onChange={(e) => setNewQuestion({ ...newQuestion, text: e.target.value })}
                placeholder="Type your question here..."
                rows={2}
              />
              <div className="grid grid-cols-2 gap-2 mt-3">
                {newQuestion.options.map((opt, i) => (
                  <div key={i} className="relative">
                    <Input
                      value={opt}
                      onChange={(e) => {
                        const opts = [...newQuestion.options];
                        opts[i] = e.target.value;
                        setNewQuestion({ ...newQuestion, options: opts });
                      }}
                      placeholder={`Option ${String.fromCharCode(65 + i)}`}
                      className={
                        newQuestion.correctIdx === i ? 'border-emerald-400 bg-emerald-50' : ''
                      }
                    />
                    <button
                      onClick={() => setNewQuestion({ ...newQuestion, correctIdx: i })}
                      className={`absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 transition-colors ${newQuestion.correctIdx === i ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300 hover:border-emerald-400'}`}
                    />
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-400 mt-2">
                Click the circle button to mark the correct answer
              </p>
              <Button
                onClick={addQuestion}
                variant="secondary"
                size="sm"
                className="mt-3"
                leftIcon={<PlusCircle size={15} />}
              >
                Add Question
              </Button>
            </div>
          </Card>

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setActiveTab('list')}>
              Cancel
            </Button>
            <Button variant="secondary" onClick={() => createExam('draft')}>
              Save as Draft
            </Button>
            <Button onClick={() => createExam('published')} leftIcon={<Play size={16} />}>
              Publish Exam
            </Button>
          </div>
        </div>
      )}

      {/* View Exam Modal */}
      <Modal
        isOpen={!!viewExam}
        onClose={() => setViewExam(null)}
        title={viewExam?.title || ''}
        size="xl"
      >
        {viewExam && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {statusBadge(viewExam.status)}
              <Badge variant="info">{viewExam.durationMins} mins</Badge>
              <Badge variant="neutral">{viewExam.totalMarks} marks</Badge>
              <Badge variant="warning">-{viewExam.negativeMarks} negative</Badge>
            </div>
            <div className="space-y-3">
              {viewExam.questions.map((q, idx) => (
                <div key={q.id} className="p-3 bg-slate-50 rounded-xl">
                  <p className="text-sm font-medium text-slate-900 mb-2">
                    Q{idx + 1}. {q.text}
                  </p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {q.options.map((opt, oi) => (
                      <div
                        key={oi}
                        className={`text-xs p-2 rounded-lg flex items-center gap-1.5 ${oi === q.correctIdx ? 'bg-emerald-100 text-emerald-800 font-medium' : 'bg-white text-slate-600 border border-slate-200'}`}
                      >
                        {oi === q.correctIdx && <CheckCircle size={11} />}
                        <span className="font-semibold">{String.fromCharCode(65 + oi)}.</span> {opt}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>

      {/* Results Modal */}
      <Modal
        isOpen={!!resultsExam}
        onClose={() => setResultsExam(null)}
        title={`Results — ${resultsExam?.title}`}
        size="xl"
      >
        {resultsExam &&
          (() => {
            const subs = getExamSubmissions(resultsExam.id);
            const chartData = subs.map((s) => ({
              name:
                mockStudents.find((st) => st.uid === s.studentId)?.name.split(' ')[0] || 'Unknown',
              score: s.score || 0,
            }));
            return (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <Card className="bg-blue-50 border-0 text-center" padding="sm">
                    <p className="text-xl font-bold text-blue-700">{subs.length}</p>
                    <p className="text-xs text-slate-500">Submissions</p>
                  </Card>
                  <Card className="bg-emerald-50 border-0 text-center" padding="sm">
                    <p className="text-xl font-bold text-emerald-700">
                      {subs.length > 0
                        ? Math.round(subs.reduce((s, sb) => s + (sb.score || 0), 0) / subs.length)
                        : 0}
                    </p>
                    <p className="text-xs text-slate-500">Avg Score</p>
                  </Card>
                  <Card className="bg-purple-50 border-0 text-center" padding="sm">
                    <p className="text-xl font-bold text-purple-700">{resultsExam.totalMarks}</p>
                    <p className="text-xs text-slate-500">Max Score</p>
                  </Card>
                </div>

                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={chartData} barSize={20}>
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      domain={[0, resultsExam.totalMarks]}
                    />
                    <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                    <Bar dataKey="score" fill="#1A3C5E" radius={[4, 4, 0, 0]} name="Score" />
                  </BarChart>
                </ResponsiveContainer>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500">
                          Student
                        </th>
                        <th className="text-center py-2 px-3 text-xs font-semibold text-slate-500">
                          Score
                        </th>
                        <th className="text-center py-2 px-3 text-xs font-semibold text-slate-500">
                          %
                        </th>
                        <th className="text-center py-2 px-3 text-xs font-semibold text-slate-500">
                          Time
                        </th>
                        <th className="text-center py-2 px-3 text-xs font-semibold text-slate-500">
                          Flags
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {subs
                        .sort((a, b) => (b.score || 0) - (a.score || 0))
                        .map((sub) => {
                          const student = mockStudents.find((s) => s.uid === sub.studentId);
                          return (
                            <tr key={sub.id} className="border-b border-slate-100">
                              <td className="py-2 px-3 font-medium text-slate-900">
                                {student?.name}
                              </td>
                              <td className="py-2 px-3 text-center font-semibold text-blue-700">
                                {sub.score}/{sub.totalMarks}
                              </td>
                              <td className="py-2 px-3 text-center">
                                {Math.round(((sub.score || 0) / sub.totalMarks) * 100)}%
                              </td>
                              <td className="py-2 px-3 text-center text-slate-500">
                                {sub.timeTakenSecs ? `${Math.floor(sub.timeTakenSecs / 60)}m` : '—'}
                              </td>
                              <td className="py-2 px-3 text-center">
                                {sub.anticheatFlags.length > 0 ? (
                                  <Badge variant="danger" size="sm">
                                    {sub.anticheatFlags.length} flags
                                  </Badge>
                                ) : (
                                  <Badge variant="success" size="sm">
                                    Clean
                                  </Badge>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}
      </Modal>
    </AppLayout>
  );
}
