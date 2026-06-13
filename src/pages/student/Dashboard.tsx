import { AppLayout } from '../../layouts/AppLayout';
import { StatCard, Card } from '../../components/shared/Card';
import { Badge } from '../../components/shared/Badge';
import { useAuthStore } from '../../store/authStore';
import {
  mockBatches,
  mockExams,
  mockSubmissions,
  mockMaterials,
  mockAnnouncements,
  mockLeaderboards,
} from '../../data/mockData';
import { FileText, BookMarked, Trophy, Bell, TrendingUp, Clock } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { format } from 'date-fns';

export function StudentDashboard() {
  const { user } = useAuthStore();
  const myBatches = mockBatches.filter((b) => user?.batchIds?.includes(b.id));
  const mySubmissions = mockSubmissions.filter((s) => s.studentId === user?.uid && !s.draft);
  const availableExams = mockExams.filter(
    (e) => e.status === 'published' && user?.batchIds?.includes(e.batchId),
  );
  const myMaterials = mockMaterials.filter(
    (m) => m.scope === 'institute' || (m.batchId && user?.batchIds?.includes(m.batchId)),
  );
  const myAnnouncements = mockAnnouncements
    .filter((a) => a.scope === 'institute' || (a.batchId && user?.batchIds?.includes(a.batchId)))
    .filter((a) => a.targetRole === 'all' || a.targetRole === 'students');

  const scoreHistory = mySubmissions
    .filter((s) => s.score !== null)
    .sort((a, b) => new Date(a.submittedAt || 0).getTime() - new Date(b.submittedAt || 0).getTime())
    .map((s) => {
      const exam = mockExams.find((e) => e.id === s.examId);
      return {
        name: exam?.title.split('—')[0].trim().substring(0, 12) || 'Exam',
        score: s.score || 0,
        total: s.totalMarks,
        pct: Math.round(((s.score || 0) / s.totalMarks) * 100),
      };
    });

  // Get rank from leaderboards
  let myRank: number | null = null;
  for (const batchId of user?.batchIds || []) {
    const lb = mockLeaderboards[batchId];
    const entry = lb?.rankings.find((r) => r.studentId === user?.uid);
    if (entry && (myRank === null || entry.rank < myRank)) {
      myRank = entry.rank;
    }
  }

  return (
    <AppLayout role="student" title="Dashboard">
      {/* Welcome Banner */}
      <div className="mb-5 p-4 bg-gradient-to-r from-[#4a1a5e] to-[#6b2a8c] rounded-xl text-white">
        <h2 className="text-lg font-semibold">Hello, {user?.name?.split(' ')[0]}! 📚</h2>
        <p className="text-white/70 text-sm mt-0.5">
          {availableExams.length > 0
            ? `${availableExams.length} exam(s) available. Don't forget to attempt them!`
            : 'Keep studying — no active exams right now.'}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Exams Taken"
          value={mySubmissions.length}
          icon={<FileText size={20} />}
          color="blue"
        />
        <StatCard
          title="My Rank"
          value={myRank ? `#${myRank}` : '—'}
          icon={<Trophy size={20} />}
          color="amber"
          subtitle="Best batch rank"
        />
        <StatCard
          title="Materials"
          value={myMaterials.length}
          icon={<BookMarked size={20} />}
          color="emerald"
          subtitle="Study resources"
        />
        <StatCard
          title="Notifications"
          value={myAnnouncements.filter((a) => !a.readBy.includes(user?.uid || '')).length}
          icon={<Bell size={20} />}
          color="purple"
          subtitle="Unread"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Score History */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-slate-900">My Performance</h3>
              <p className="text-xs text-slate-500">Score trend across exams</p>
            </div>
            <TrendingUp size={16} className="text-slate-400" />
          </div>
          {scoreHistory.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-slate-400 text-sm">
              No exam results yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={scoreHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  domain={[0, 100]}
                />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
                  formatter={(val) => [`${val}%`, 'Score %']}
                />
                <Line
                  type="monotone"
                  dataKey="pct"
                  stroke="#4a1a5e"
                  strokeWidth={2}
                  dot={{ fill: '#4a1a5e', r: 4 }}
                  name="Score %"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* My Batches */}
        <Card>
          <h3 className="font-semibold text-slate-900 mb-4">My Batches</h3>
          <div className="space-y-3">
            {myBatches.map((batch) => (
              <div key={batch.id} className="p-3 bg-slate-50 rounded-xl">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-semibold text-slate-900">{batch.name}</p>
                  <Badge variant="success" size="sm">
                    Active
                  </Badge>
                </div>
                <p className="text-xs text-slate-500">
                  {batch.subject} • {batch.schedule}
                </p>
              </div>
            ))}
            {myBatches.length === 0 && (
              <p className="text-sm text-slate-400">Not enrolled in any batch.</p>
            )}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Available Exams */}
        <Card>
          <h3 className="font-semibold text-slate-900 mb-4">Available Exams</h3>
          {availableExams.length === 0 ? (
            <p className="text-sm text-slate-400">No active exams right now.</p>
          ) : (
            <div className="space-y-3">
              {availableExams.map((exam) => {
                const batch = mockBatches.find((b) => b.id === exam.batchId);
                const alreadyAttempted = mySubmissions.some((s) => s.examId === exam.id);
                return (
                  <div
                    key={exam.id}
                    className={`p-3 rounded-xl border ${alreadyAttempted ? 'bg-slate-50 border-slate-200' : 'bg-purple-50 border-purple-200'}`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{exam.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {batch?.name} • {exam.durationMins} mins • {exam.totalMarks} marks
                        </p>
                      </div>
                      {alreadyAttempted ? (
                        <Badge variant="success" size="sm">
                          Attempted
                        </Badge>
                      ) : (
                        <Badge variant="warning" size="sm">
                          Pending
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Recent Announcements */}
        <Card>
          <h3 className="font-semibold text-slate-900 mb-4">Recent Announcements</h3>
          {myAnnouncements.length === 0 ? (
            <p className="text-sm text-slate-400">No announcements.</p>
          ) : (
            <div className="space-y-3">
              {myAnnouncements.slice(0, 4).map((ann) => {
                const isUnread = !ann.readBy.includes(user?.uid || '');
                return (
                  <div
                    key={ann.id}
                    className={`p-3 rounded-lg border ${isUnread ? 'bg-purple-50 border-purple-200' : 'bg-slate-50 border-slate-100'}`}
                  >
                    <div className="flex items-start gap-2">
                      {isUnread && (
                        <div className="w-2 h-2 rounded-full bg-purple-500 mt-1.5 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 line-clamp-1">
                          {ann.title}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                          <Clock size={11} />
                          {format(new Date(ann.createdAt), 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </AppLayout>
  );
}
