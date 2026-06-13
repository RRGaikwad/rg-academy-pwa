import { useState, useEffect } from 'react';
import { AppLayout } from '../../layouts/AppLayout';
import { StatCard, Card } from '../../components/shared/Card';
import { Badge } from '../../components/shared/Badge';
import {
  Users,
  GraduationCap,
  BookOpen,
  CreditCard,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
  Database,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { format } from 'date-fns';
import { useFirestoreCollection } from '../../hooks/useFirestore';
import { seedFirestore } from '../../utils/seedData';
import { Button } from '../../components/shared/Button';
import type { Student, Teacher, Batch, FeeRecord, Exam, Announcement } from '../../types';

const feeChartData = [
  { month: 'Oct', paid: 28, pending: 4, overdue: 2 },
  { month: 'Nov', paid: 30, pending: 3, overdue: 1 },
  { month: 'Dec', paid: 25, pending: 6, overdue: 3 },
  { month: 'Jan', paid: 32, pending: 2, overdue: 1 },
  { month: 'Feb', paid: 29, pending: 5, overdue: 2 },
  { month: 'Mar', paid: 18, pending: 8, overdue: 4 },
];

const COLORS = ['#10b981', '#f59e0b', '#ef4444'];

export function AdminDashboard() {
  const { data: students, loading: sLoading } = useFirestoreCollection<Student>('students');
  const { data: teachers, loading: tLoading } = useFirestoreCollection<Teacher>('teachers');
  const { data: batches, loading: bLoading } = useFirestoreCollection<Batch>('batches');
  const { data: fees, loading: fLoading } = useFirestoreCollection<FeeRecord>('fees');
  const { data: exams, loading: eLoading } = useFirestoreCollection<Exam>('exams');
  const { data: announcements, loading: aLoading } =
    useFirestoreCollection<Announcement>('announcements');

  const [stats, setStats] = useState({
    totalStudents: 0,
    activeStudents: 0,
    totalTeachers: 0,
    totalBatches: 0,
    paidFees: 0,
    pendingFees: 0,
    overdueFees: 0,
    totalFeeAmount: 0,
  });

  useEffect(() => {
    if (sLoading || tLoading || bLoading || fLoading) return;

    const activeStudents = students.filter((s) => s.isActive).length;
    const paid = fees.filter((f) => f.status === 'paid').length;
    const pending = fees.filter((f) => f.status === 'pending').length;
    const overdue = fees.filter((f) => f.status === 'overdue').length;
    const totalAmount = fees.filter((f) => f.status !== 'paid').reduce((s, f) => s + f.amount, 0);

    // eslint-disable-next-line
    setStats({
      totalStudents: students.length,
      activeStudents,
      totalTeachers: teachers.length,
      totalBatches: batches.length,
      paidFees: paid,
      pendingFees: pending,
      overdueFees: overdue,
      totalFeeAmount: totalAmount,
    });
  }, [students, teachers, batches, fees, sLoading, tLoading, bLoading, fLoading]);

  const pieData = [
    { name: 'Paid', value: stats.paidFees },
    { name: 'Pending', value: stats.pendingFees },
    { name: 'Overdue', value: stats.overdueFees },
  ];

  const recentExams = exams.slice(0, 4);
  const recentAnnouncements = announcements.slice(0, 3);

  const isLoading = sLoading || tLoading || bLoading || fLoading || eLoading || aLoading;

  if (isLoading) {
    return (
      <AppLayout role="admin" title="Admin Dashboard">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1A3C5E]"></div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout role="admin" title="Admin Dashboard">
      {students.length === 0 && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Database className="text-amber-500" />
            <div>
              <h3 className="text-sm font-semibold text-amber-800">Database is empty</h3>
              <p className="text-xs text-amber-700">
                Click to seed your Firestore database with mock data.
              </p>
            </div>
          </div>
          <Button size="sm" onClick={seedFirestore}>
            Seed Database
          </Button>
        </div>
      )}
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Students"
          value={stats.totalStudents}
          icon={<GraduationCap size={20} />}
          color="blue"
          subtitle={`${stats.activeStudents} active`}
        />
        <StatCard
          title="Teachers"
          value={stats.totalTeachers}
          icon={<Users size={20} />}
          color="emerald"
          subtitle="Active faculty"
        />
        <StatCard
          title="Active Batches"
          value={stats.totalBatches}
          icon={<BookOpen size={20} />}
          color="purple"
          subtitle="Running classes"
        />
        <StatCard
          title="Fees Overdue"
          value={stats.overdueFees}
          icon={<CreditCard size={20} />}
          color="red"
          subtitle={`₹${(stats.totalFeeAmount / 1000).toFixed(1)}K pending`}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Fee Collection Chart */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-slate-900">Fee Collection Overview</h3>
              <p className="text-xs text-slate-500">Monthly breakdown — last 6 months</p>
            </div>
            <TrendingUp size={16} className="text-slate-400" />
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={feeChartData} barSize={14}>
              <XAxis dataKey="month" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  fontSize: '12px',
                }}
              />
              <Bar dataKey="paid" fill="#10b981" radius={[4, 4, 0, 0]} name="Paid" />
              <Bar dataKey="pending" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Pending" />
              <Bar dataKey="overdue" fill="#ef4444" radius={[4, 4, 0, 0]} name="Overdue" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Fee Status Pie */}
        <Card>
          <h3 className="font-semibold text-slate-900 mb-1">Fee Status</h3>
          <p className="text-xs text-slate-500 mb-4">Current distribution</p>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={70}
                paddingAngle={3}
                dataKey="value"
              >
                {pieData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {pieData.map((item, i) => (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: COLORS[i] }}
                  />
                  <span className="text-slate-600">{item.name}</span>
                </div>
                <span className="font-semibold text-slate-900">{item.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Exams */}
        <Card>
          <h3 className="font-semibold text-slate-900 mb-4">Recent Exams</h3>
          <div className="space-y-3">
            {recentExams.map((exam) => {
              const batch = batches.find((b) => b.id === exam.batchId);
              return (
                <div
                  key={exam.id}
                  className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{exam.title}</p>
                    <p className="text-xs text-slate-500">
                      {batch?.name} • {exam.durationMins} mins
                    </p>
                  </div>
                  <Badge
                    variant={
                      exam.status === 'published'
                        ? 'success'
                        : exam.status === 'closed'
                          ? 'neutral'
                          : 'warning'
                    }
                    size="sm"
                  >
                    {exam.status}
                  </Badge>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Recent Announcements */}
        <Card>
          <h3 className="font-semibold text-slate-900 mb-4">Recent Announcements</h3>
          <div className="space-y-3">
            {recentAnnouncements.map((ann) => (
              <div key={ann.id} className="p-3 bg-slate-50 rounded-lg">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="text-sm font-medium text-slate-900 line-clamp-1">{ann.title}</p>
                  <Badge variant={ann.scope === 'institute' ? 'info' : 'default'} size="sm">
                    {ann.scope}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 line-clamp-2">{ann.content}</p>
                <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1">
                  <Clock size={11} />
                  {format(new Date(ann.createdAt), 'MMM d, yyyy')}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Quick Batch Overview */}
      <Card className="mt-4">
        <h3 className="font-semibold text-slate-900 mb-4">Batch Overview</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Batch
                </th>
                <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Subject
                </th>
                <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Teacher
                </th>
                <th className="text-center py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Students
                </th>
                <th className="text-center py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {batches.map((batch) => {
                const teacher = teachers.find((t) => t.uid === batch.teacherId);
                return (
                  <tr key={batch.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-medium text-slate-900">{batch.name}</td>
                    <td className="py-2.5 px-3 text-slate-600">{batch.subject}</td>
                    <td className="py-2.5 px-3 text-slate-600">{teacher?.name || '—'}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 text-blue-800 text-xs font-semibold">
                        {batch.studentIds.length}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {batch.isActive ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 text-xs font-medium">
                          <CheckCircle size={12} /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-slate-500 text-xs">
                          <AlertTriangle size={12} /> Inactive
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </AppLayout>
  );
}
