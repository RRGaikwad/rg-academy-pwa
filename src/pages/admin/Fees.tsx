import { useState } from 'react';
import { AppLayout } from '../../layouts/AppLayout';
import { Card } from '../../components/shared/Card';
import { Button } from '../../components/shared/Button';
import { Badge } from '../../components/shared/Badge';
import { Input, Select } from '../../components/shared/Input';
import { Modal } from '../../components/shared/Modal';
import {
  CreditCard,
  CheckCircle,
  Clock,
  AlertTriangle,
  Search,
  ChevronUp,
  History,
} from 'lucide-react';
import { mockFees as initFees, mockStudents, mockBatches } from '../../data/mockData';
import type { FeeRecord, FeeStatus } from '../../types';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const statusConfig: Record<
  FeeStatus,
  { variant: 'success' | 'warning' | 'danger'; icon: React.ReactNode; label: string }
> = {
  paid: { variant: 'success', icon: <CheckCircle size={13} />, label: 'Paid' },
  pending: { variant: 'warning', icon: <Clock size={13} />, label: 'Pending' },
  overdue: { variant: 'danger', icon: <AlertTriangle size={13} />, label: 'Overdue' },
};

export function AdminFees() {
  const [fees, setFees] = useState<FeeRecord[]>(initFees);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [expandedFee, setExpandedFee] = useState<string | null>(null);
  const [updateModal, setUpdateModal] = useState<FeeRecord | null>(null);
  const [newStatus, setNewStatus] = useState<FeeStatus>('paid');
  const [updateNote, setUpdateNote] = useState('');

  const enriched = fees.map((fee) => ({
    ...fee,
    studentName: mockStudents.find((s) => s.uid === fee.studentId)?.name || 'Unknown',
    batchName: mockBatches.find((b) => b.id === fee.batchId)?.name || 'Unknown',
  }));

  const filtered = enriched.filter((f) => {
    const q = search.toLowerCase();
    const matchSearch =
      f.studentName.toLowerCase().includes(q) || f.label.toLowerCase().includes(q);
    const matchStatus = filterStatus === 'all' || f.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const stats = {
    paid: fees.filter((f) => f.status === 'paid').length,
    pending: fees.filter((f) => f.status === 'pending').length,
    overdue: fees.filter((f) => f.status === 'overdue').length,
    totalPaid: fees.filter((f) => f.status === 'paid').reduce((s, f) => s + f.amount, 0),
    totalDue: fees.filter((f) => f.status !== 'paid').reduce((s, f) => s + f.amount, 0),
  };

  const handleStatusUpdate = () => {
    if (!updateModal) return;
    const updatedFee: FeeRecord = {
      ...updateModal,
      status: newStatus,
      history: [
        ...updateModal.history,
        {
          changedAt: new Date().toISOString(),
          changedBy: 'admin_001',
          fromStatus: updateModal.status,
          toStatus: newStatus,
          note: updateNote || null,
        },
      ],
    };
    setFees((prev) => prev.map((f) => (f.id === updateModal.id ? updatedFee : f)));
    setUpdateModal(null);
    setUpdateNote('');
    toast.success('Fee status updated');
  };

  return (
    <AppLayout role="admin" title="Fee Management">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <Card className="bg-emerald-50 border-0">
          <div className="flex items-center gap-3">
            <CheckCircle className="text-emerald-600" size={24} />
            <div>
              <p className="text-xs text-slate-500">Paid</p>
              <p className="text-xl font-bold text-emerald-700">{stats.paid}</p>
              <p className="text-xs text-emerald-600">₹{stats.totalPaid.toLocaleString()}</p>
            </div>
          </div>
        </Card>
        <Card className="bg-amber-50 border-0">
          <div className="flex items-center gap-3">
            <Clock className="text-amber-600" size={24} />
            <div>
              <p className="text-xs text-slate-500">Pending</p>
              <p className="text-xl font-bold text-amber-700">{stats.pending}</p>
            </div>
          </div>
        </Card>
        <Card className="bg-red-50 border-0">
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-red-600" size={24} />
            <div>
              <p className="text-xs text-slate-500">Overdue</p>
              <p className="text-xl font-bold text-red-700">{stats.overdue}</p>
            </div>
          </div>
        </Card>
        <Card className="bg-blue-50 border-0">
          <div className="flex items-center gap-3">
            <CreditCard className="text-blue-600" size={24} />
            <div>
              <p className="text-xs text-slate-500">Total Due</p>
              <p className="text-xl font-bold text-blue-700">₹{stats.totalDue.toLocaleString()}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Input
              placeholder="Search by student name or label..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search size={15} />}
            />
          </div>
          <Select
            options={[
              { value: 'all', label: 'All Status' },
              { value: 'paid', label: 'Paid' },
              { value: 'pending', label: 'Pending' },
              { value: 'overdue', label: 'Overdue' },
            ]}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="sm:w-40"
          />
        </div>
      </Card>

      {/* Fee Records */}
      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Student
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">
                  Label
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">
                  Due Date
                </th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Amount
                </th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Status
                </th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((fee) => {
                const sc = statusConfig[fee.status];
                const isExpanded = expandedFee === fee.id;
                return (
                  <>
                    <tr key={fee.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold text-xs flex-shrink-0">
                            {fee.studentName.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{fee.studentName}</p>
                            <p className="text-xs text-slate-500 hidden sm:block">
                              {fee.batchName?.split('—')[0].trim()}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600 hidden md:table-cell">{fee.label}</td>
                      <td className="py-3 px-4 text-slate-600 hidden lg:table-cell">
                        {format(new Date(fee.dueDate), 'MMM d, yyyy')}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-slate-900">
                        ₹{fee.amount.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge
                          variant={sc.variant}
                          size="sm"
                          className="inline-flex items-center gap-1"
                        >
                          {sc.icon}
                          {sc.label}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              setUpdateModal(fee);
                              setNewStatus(fee.status === 'paid' ? 'pending' : 'paid');
                            }}
                            className="p-1.5 hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 rounded-lg transition-colors"
                            title="Update Status"
                          >
                            <CheckCircle size={15} />
                          </button>
                          <button
                            onClick={() => setExpandedFee(isExpanded ? null : fee.id)}
                            className="p-1.5 hover:bg-slate-100 text-slate-400 rounded-lg transition-colors"
                            title="History"
                          >
                            {isExpanded ? <ChevronUp size={15} /> : <History size={15} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr key={`${fee.id}-history`} className="bg-slate-50">
                        <td colSpan={6} className="px-4 py-3">
                          <p className="text-xs font-semibold text-slate-500 uppercase mb-2">
                            Audit History
                          </p>
                          {fee.history.length === 0 ? (
                            <p className="text-xs text-slate-400">No history yet.</p>
                          ) : (
                            <div className="space-y-1.5">
                              {fee.history.map((h, i) => (
                                <div
                                  key={i}
                                  className="flex items-center gap-2 text-xs text-slate-600"
                                >
                                  <span className="text-slate-400">
                                    {format(new Date(h.changedAt), 'MMM d, yyyy HH:mm')}
                                  </span>
                                  <span className="text-slate-400">→</span>
                                  <Badge
                                    variant={
                                      h.toStatus === 'paid'
                                        ? 'success'
                                        : h.toStatus === 'overdue'
                                          ? 'danger'
                                          : 'warning'
                                    }
                                    size="sm"
                                  >
                                    {h.toStatus}
                                  </Badge>
                                  {h.note && (
                                    <span className="text-slate-500 italic">"{h.note}"</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Update Status Modal */}
      <Modal
        isOpen={!!updateModal}
        onClose={() => setUpdateModal(null)}
        title="Update Fee Status"
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setUpdateModal(null)}>
              Cancel
            </Button>
            <Button onClick={handleStatusUpdate}>Update Status</Button>
          </>
        }
      >
        {updateModal && (
          <div className="space-y-4">
            <div className="p-3 bg-slate-50 rounded-lg text-sm">
              <p className="font-medium text-slate-900">{updateModal.studentName}</p>
              <p className="text-slate-500">{updateModal.label}</p>
              <p className="font-semibold text-slate-900 mt-1">
                ₹{updateModal.amount.toLocaleString()}
              </p>
            </div>
            <Select
              label="New Status"
              options={[
                { value: 'paid', label: '✅ Paid' },
                { value: 'pending', label: '⏳ Pending' },
                { value: 'overdue', label: '⚠️ Overdue' },
              ]}
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as FeeStatus)}
            />
            <Input
              label="Note (optional)"
              value={updateNote}
              onChange={(e) => setUpdateNote(e.target.value)}
              placeholder="e.g., Cash payment received"
            />
          </div>
        )}
      </Modal>
    </AppLayout>
  );
}
