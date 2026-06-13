import { AppLayout } from '../../layouts/AppLayout';
import { StatCard, Card } from '../../components/shared/Card';
import { Badge } from '../../components/shared/Badge';
import { useAuthStore } from '../../store/authStore';
import {
  mockBatches,
  mockExams,
  mockSubmissions,
  mockStudents,
  mockAnnouncements,
  mockAttendance,
} from '../../data/mockData';
import { Users, FileText, ClipboardList, Clock, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

export function TeacherDashboard() {
  const { user } = useAuthStore();
  const myBatches = mockBatches.filter((b) => b.teacherId === user?.uid);
  const myExams = mockExams.filter((e) => e.teacherId === user?.uid);
  const mySubmissions = mockSubmissions.filter((s) => myExams.some((e) => e.id === s.examId));
  const totalStudents = new Set(myBatches.flatMap((b) => b.studentIds)).size;
  const publishedExams = myExams.filter((e) => e.status === 'published').length;
  const myAnnouncements = mockAnnouncements.filter(
    (a) => a.createdBy === user?.uid || a.scope === 'institute',
  );

  const examScoreData = myExams
    .filter((e) => e.status === 'closed')
    .map((exam) => {
      const subs = mockSubmissions.filter((s) => s.examId === exam.id && s.score !== null);
      const avg =
        subs.length > 0 ? subs.reduce((sum, s) => sum + (s.score || 0), 0) / subs.length : 0;
      return {
        name: exam.title.split('—')[0].trim().substring(0, 15),
        avg: Math.round(avg),
        total: exam.totalMarks,
      };
    });

  const latestAttendance = mockAttendance
    .filter((a) => myBatches.some((b) => b.id === a.batchId))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3);

  return (
    <AppLayout role="teacher" title="Teacher Dashboard">
      {/* Welcome */}
      <div className="mb-5 p-4 bg-gradient-to-r from-[#1a4d3c] to-[#15412f] rounded-xl text-white">
        <h2 className="text-lg font-semibold">Welcome back, {user?.name?.split(' ')[0]}! 👋</h2>
        <p className="text-white/70 text-sm mt-0.5">
          Here's what's happening across your batches today.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="My Batches"
          value={myBatches.length}
          icon={<Users size={20} />}
          color="emerald"
        />
        <StatCard
          title="Total Students"
          value={totalStudents}
          icon={<Users size={20} />}
          color="blue"
          subtitle="Across all batches"
        />
        <StatCard
          title="Exams Created"
          value={myExams.length}
          icon={<FileText size={20} />}
          color="purple"
          subtitle={`${publishedExams} active`}
        />
        <StatCard
          title="Total Submissions"
          value={mySubmissions.length}
          icon={<ClipboardList size={20} />}
          color="amber"
        />
      </div>

      {/* Charts & Batches */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Exam Scores */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-slate-900">Average Exam Scores</h3>
              <p className="text-xs text-slate-500">Past closed exams</p>
            </div>
            <TrendingUp size={16} className="text-slate-400" />
          </div>
          {examScoreData.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-slate-400 text-sm">
              No closed exams yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={examScoreData} barSize={20}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                <Bar dataKey="avg" fill="#1a4d3c" radius={[4, 4, 0, 0]} name="Avg Score" />
                <Bar dataKey="total" fill="#e2e8f0" radius={[4, 4, 0, 0]} name="Total Marks" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* My Batches */}
        <Card>
          <h3 className="font-semibold text-slate-900 mb-4">My Batches</h3>
          <div className="space-y-3">
            {myBatches.map((batch) => {
              const enrolledStudents = mockStudents.filter((s) => batch.studentIds.includes(s.uid));
              return (
                <div key={batch.id} className="p-3 bg-slate-50 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{batch.name}</p>
                      <p className="text-xs text-slate-500">
                        {batch.subject} • {batch.schedule}
                      </p>
                    </div>
                    <Badge variant="info" size="sm">
                      {enrolledStudents.length} students
                    </Badge>
                  </div>
                </div>
              );
            })}
            {myBatches.length === 0 && (
              <p className="text-sm text-slate-400">No batches assigned yet.</p>
            )}
          </div>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Attendance */}
        <Card>
          <h3 className="font-semibold text-slate-900 mb-4">Recent Attendance</h3>
          {latestAttendance.length === 0 ? (
            <p className="text-sm text-slate-400">No attendance records yet.</p>
          ) : (
            <div className="space-y-3">
              {latestAttendance.map((att) => {
                const batch = mockBatches.find((b) => b.id === att.batchId);
                const total = Object.keys(att.records).length;
                const present = Object.values(att.records).filter((v) => v === 'present').length;
                return (
                  <div
                    key={`${att.batchId}-${att.date}`}
                    className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-900">{batch?.name}</p>
                      <p className="text-xs text-slate-500">
                        {format(new Date(att.date), 'EEEE, MMM d')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-emerald-700">
                        {present}/{total} present
                      </p>
                      <p className="text-xs text-slate-400">
                        {Math.round((present / total) * 100)}%
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Recent Announcements */}
        <Card>
          <h3 className="font-semibold text-slate-900 mb-4">Announcements</h3>
          <div className="space-y-3">
            {myAnnouncements.slice(0, 4).map((ann) => (
              <div key={ann.id} className="p-3 bg-slate-50 rounded-lg">
                <p className="text-sm font-medium text-slate-900 line-clamp-1">{ann.title}</p>
                <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                  <Clock size={11} />
                  {format(new Date(ann.createdAt), 'MMM d, yyyy')}
                  <span className="ml-2 text-slate-400">By {ann.createdByRole}</span>
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
