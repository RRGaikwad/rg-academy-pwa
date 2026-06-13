import { useState } from 'react';
import { AppLayout } from '../../layouts/AppLayout';
import { Card } from '../../components/shared/Card';
import { Button } from '../../components/shared/Button';
import { Badge } from '../../components/shared/Badge';
import { Input, Select } from '../../components/shared/Input';
import { Modal } from '../../components/shared/Modal';
import { EmptyState } from '../../components/shared/EmptyState';
import {
  Plus,
  BookOpen,
  Users,
  Calendar,
  Edit,
  Trash2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { mockBatches as initBatches, mockTeachers, mockStudents } from '../../data/mockData';
import type { Batch } from '../../types';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export function AdminBatches() {
  const [batches, setBatches] = useState<Batch[]>(initBatches);
  const [modalOpen, setModalOpen] = useState(false);
  const [editBatch, setEditBatch] = useState<Batch | null>(null);
  const [expandedBatch, setExpandedBatch] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    subject: '',
    teacherId: '',
    schedule: '',
    studentIds: [] as string[],
  });

  const openAdd = () => {
    setEditBatch(null);
    setForm({ name: '', subject: '', teacherId: '', schedule: '', studentIds: [] });
    setModalOpen(true);
  };

  const openEdit = (b: Batch) => {
    setEditBatch(b);
    setForm({
      name: b.name,
      subject: b.subject,
      teacherId: b.teacherId,
      schedule: b.schedule,
      studentIds: b.studentIds,
    });
    setModalOpen(true);
  };

  const handleSubmit = () => {
    if (!form.name || !form.subject || !form.teacherId) {
      toast.error('Please fill all required fields');
      return;
    }
    if (editBatch) {
      setBatches((prev) => prev.map((b) => (b.id === editBatch.id ? { ...b, ...form } : b)));
      toast.success('Batch updated');
    } else {
      const nb: Batch = {
        id: `batch_${Date.now()}`,
        name: form.name,
        subject: form.subject,
        teacherId: form.teacherId,
        studentIds: form.studentIds,
        schedule: form.schedule,
        isActive: true,
        createdAt: new Date().toISOString(),
        createdBy: 'admin_001',
      };
      setBatches((prev) => [...prev, nb]);
      toast.success('Batch created');
    }
    setModalOpen(false);
  };

  const deleteBatch = (id: string) => {
    setBatches((prev) => prev.filter((b) => b.id !== id));
    toast.success('Batch deleted');
  };

  const toggleStudent = (sid: string) => {
    setForm((f) => ({
      ...f,
      studentIds: f.studentIds.includes(sid)
        ? f.studentIds.filter((s) => s !== sid)
        : [...f.studentIds, sid],
    }));
  };

  return (
    <AppLayout role="admin" title="Batches">
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-slate-500">
          {batches.filter((b) => b.isActive).length} active batches
        </p>
        <Button onClick={openAdd} leftIcon={<Plus size={16} />}>
          Create Batch
        </Button>
      </div>

      <div className="space-y-4">
        {batches.length === 0 ? (
          <EmptyState
            icon={<BookOpen size={48} />}
            title="No batches yet"
            action={
              <Button onClick={openAdd} leftIcon={<Plus size={16} />}>
                Create Batch
              </Button>
            }
          />
        ) : (
          batches.map((batch) => {
            const teacher = mockTeachers.find((t) => t.uid === batch.teacherId);
            const students = mockStudents.filter((s) => batch.studentIds.includes(s.uid));
            const isExpanded = expandedBatch === batch.id;

            return (
              <Card key={batch.id} padding="none">
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-slate-900">{batch.name}</h3>
                        <Badge variant={batch.isActive ? 'success' : 'neutral'} size="sm">
                          {batch.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                        <span className="flex items-center gap-1">
                          <BookOpen size={13} />
                          {batch.subject}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users size={13} />
                          {teacher?.name || 'Unassigned'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar size={13} />
                          {batch.schedule || 'TBD'}
                        </span>
                        <span className="flex items-center gap-1 text-blue-600 font-medium">
                          <Users size={13} />
                          {batch.studentIds.length} students
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 ml-3">
                      <button
                        onClick={() => openEdit(batch)}
                        className="p-1.5 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-lg transition-colors"
                      >
                        <Edit size={15} />
                      </button>
                      <button
                        onClick={() => deleteBatch(batch.id)}
                        className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>
                      <button
                        onClick={() => setExpandedBatch(isExpanded ? null : batch.id)}
                        className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg transition-colors ml-1"
                      >
                        {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                      </button>
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-slate-100 px-4 pb-4 pt-3">
                    <p className="text-xs font-semibold text-slate-500 uppercase mb-2">
                      Enrolled Students
                    </p>
                    {students.length === 0 ? (
                      <p className="text-sm text-slate-400">No students enrolled</p>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                        {students.map((s) => (
                          <div
                            key={s.uid}
                            className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg text-xs"
                          >
                            <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold text-xs flex-shrink-0">
                              {s.name.charAt(0)}
                            </div>
                            <span className="truncate text-slate-700">{s.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-slate-400 mt-2">
                      Created {format(new Date(batch.createdAt), 'MMM d, yyyy')}
                    </p>
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>

      {/* Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editBatch ? 'Edit Batch' : 'Create New Batch'}
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>{editBatch ? 'Update' : 'Create Batch'}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Batch Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="NEET 2026 — Batch A"
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Subject"
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              placeholder="Physics"
              required
            />
            <Input
              label="Schedule"
              value={form.schedule}
              onChange={(e) => setForm({ ...form, schedule: e.target.value })}
              placeholder="Mon/Wed/Fri 8–10 AM"
            />
          </div>
          <Select
            label="Assign Teacher"
            options={mockTeachers
              .filter((t) => t.isActive)
              .map((t) => ({ value: t.uid, label: `${t.name} — ${t.subject}` }))}
            value={form.teacherId}
            onChange={(e) => setForm({ ...form, teacherId: e.target.value })}
            placeholder="Select a teacher"
            required
          />

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Enroll Students{' '}
              <span className="text-slate-400 font-normal text-xs">
                ({form.studentIds.length} selected)
              </span>
            </label>
            <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100">
              {mockStudents
                .filter((s) => s.isActive)
                .map((s) => (
                  <label
                    key={s.uid}
                    className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={form.studentIds.includes(s.uid)}
                      onChange={() => toggleStudent(s.uid)}
                      className="rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900">{s.name}</p>
                      <p className="text-xs text-slate-500 truncate">{s.email}</p>
                    </div>
                  </label>
                ))}
            </div>
          </div>
        </div>
      </Modal>
    </AppLayout>
  );
}
