import { useState } from 'react';
import { AppLayout } from '../../layouts/AppLayout';
import { Card } from '../../components/shared/Card';
import { Button } from '../../components/shared/Button';
import { Badge } from '../../components/shared/Badge';
import { Input, Select } from '../../components/shared/Input';
import { Modal } from '../../components/shared/Modal';
import { EmptyState } from '../../components/shared/EmptyState';
import { Plus, Search, UserCheck, UserX, GraduationCap, Phone, Mail, Edit } from 'lucide-react';
import { useFirestoreCollection } from '../../hooks/useFirestore';
import { db } from '../../firebase/config';
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';
import type { Student, FeeType, Batch } from '../../types';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export function AdminStudents() {
  const { data: students, loading: loadingStudents } = useFirestoreCollection<Student>('students');
  const { data: batches } = useFirestoreCollection<Batch>('batches');
  
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editStudent, setEditStudent] = useState<Student | null>(null);
  const [viewStudent, setViewStudent] = useState<Student | null>(null);

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    batchIds: [] as string[],
    cycleType: 'monthly' as FeeType,
    amount: '',
  });

  const filtered = students.filter((s) => {
    const q = search.toLowerCase();
    const matchSearch =
      s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q) || (s.phone && s.phone.includes(q));
    const matchStatus =
      filterStatus === 'all' ||
      (filterStatus === 'active' && s.isActive) ||
      (filterStatus === 'inactive' && !s.isActive);
    return matchSearch && matchStatus;
  });

  const openAdd = () => {
    setEditStudent(null);
    setForm({
      name: '',
      email: '',
      phone: '',
      password: '',
      batchIds: [],
      cycleType: 'monthly',
      amount: '',
    });
    setModalOpen(true);
  };

  const openEdit = (s: Student) => {
    setEditStudent(s);
    setForm({
      name: s.name,
      email: s.email,
      phone: s.phone || '',
      password: '',
      batchIds: s.batchIds || [],
      cycleType: s.feeConfig?.cycleType || 'monthly',
      amount: s.feeConfig?.amount?.toString() || '0',
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.phone) {
      toast.error('Please fill all required fields');
      return;
    }
    const tId = toast.loading(editStudent ? 'Updating...' : 'Creating...');
    try {
      if (editStudent && (editStudent.uid || editStudent.uid)) {
        await updateDoc(doc(db, 'students', editStudent.uid || editStudent.uid!), {
          name: form.name,
          email: form.email,
          phone: form.phone,
          batchIds: form.batchIds,
          feeConfig: { cycleType: form.cycleType, amount: Number(form.amount) },
        });
        toast.success('Student updated successfully', { id: tId });
      } else {
        const newStudent = {
          name: form.name,
          email: form.email,
          phone: form.phone,
          batchIds: form.batchIds,
          feeConfig: { cycleType: form.cycleType, amount: Number(form.amount) },
          isActive: true,
          enrolledAt: new Date().toISOString(),
          createdBy: 'admin_001',
        };
        await addDoc(collection(db, 'students'), newStudent);
        toast.success('Student created successfully', { id: tId });
      }
      setModalOpen(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save', { id: tId });
    }
  };

  const toggleActive = async (student: Student) => {
    if (!student.uid && !student.uid) return;
    const tId = toast.loading('Updating status...');
    try {
      await updateDoc(doc(db, 'students', student.uid || student.uid!), { isActive: !student.isActive });
      toast.success('Student status updated', { id: tId });
    } catch (err: any) {
      toast.error(err.message || 'Failed to update', { id: tId });
    }
  };

  const toggleBatch = (batchId: string) => {
    setForm((f) => ({
      ...f,
      batchIds: f.batchIds.includes(batchId)
        ? f.batchIds.filter((b) => b !== batchId)
        : [...f.batchIds, batchId],
    }));
  };

  return (
    <AppLayout role="admin" title="Students">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <p className="text-sm text-slate-500">
            {students.filter((s) => s.isActive).length} active of {students.length} total
          </p>
        </div>
        <Button onClick={openAdd} leftIcon={<Plus size={16} />}>
          Add Student
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Input
              placeholder="Search by name, email, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search size={15} />}
            />
          </div>
          <Select
            options={[
              { value: 'all', label: 'All Students' },
              { value: 'active', label: 'Active Only' },
              { value: 'inactive', label: 'Inactive Only' },
            ]}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="sm:w-44"
          />
        </div>
      </Card>

      {/* Students Table */}
      <Card padding="none">
        {loadingStudents ? (
          <div className="flex justify-center p-8"><p className="text-slate-500">Loading...</p></div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<GraduationCap size={48} />}
            title="No students found"
            description="Try adjusting your search or filters."
            action={
              <Button onClick={openAdd} leftIcon={<Plus size={16} />}>
                Add Student
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Student
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">
                    Batches
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">
                    Fee Plan
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">
                    Enrolled
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
                {filtered.map((student) => {
                  const studentBatches = batches.filter((b) => (student.batchIds || []).includes(b.id || ''));
                  return (
                    <tr key={student.uid || student.uid} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4">
                        <div
                          className="flex items-center gap-3 cursor-pointer"
                          onClick={() => setViewStudent(student)}
                        >
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                            {student.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{student.name}</p>
                            <p className="text-xs text-slate-500">{student.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 hidden md:table-cell">
                        <div className="flex flex-wrap gap-1">
                          {studentBatches.length === 0 ? (
                            <span className="text-slate-400 text-xs">Not enrolled</span>
                          ) : (
                            studentBatches.map((b) => (
                              <Badge key={b.id} variant="info" size="sm">
                                {b.name.split('—')[0].trim()}
                              </Badge>
                            ))
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 hidden lg:table-cell">
                        <div>
                          <Badge
                            variant={
                              student.feeConfig?.cycleType === 'monthly'
                                ? 'default'
                                : student.feeConfig?.cycleType === 'annual'
                                  ? 'success'
                                  : 'warning'
                            }
                            size="sm"
                          >
                            {student.feeConfig?.cycleType || 'None'}
                          </Badge>
                          <p className="text-xs text-slate-500 mt-0.5">
                            ₹{student.feeConfig?.amount?.toLocaleString() || 0}
                          </p>
                        </div>
                      </td>
                      <td className="py-3 px-4 hidden lg:table-cell text-xs text-slate-500">
                        {student.enrolledAt ? format(new Date(student.enrolledAt), 'MMM d, yyyy') : 'Unknown'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge variant={student.isActive ? 'success' : 'neutral'} size="sm">
                          {student.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEdit(student)}
                            className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors"
                          >
                            <Edit size={15} />
                          </button>
                          <button
                            onClick={() => toggleActive(student)}
                            className="p-1.5 rounded-lg hover:bg-amber-50 text-slate-400 hover:text-amber-600 transition-colors"
                          >
                            {student.isActive ? <UserX size={15} /> : <UserCheck size={15} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editStudent ? 'Edit Student' : 'Add New Student'}
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              {editStudent ? 'Update Student' : 'Create Student'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Full Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Student Name"
              required
            />
            <Input
              label="Phone Number"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="9876543210"
              required
            />
          </div>
          <Input
            label="Email Address"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="student@email.com"
            required
          />
          {!editStudent && (
            <Input
              label="Initial Password"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Set a temporary password"
              required
            />
          )}

          {/* Batch Assignment */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Assign to Batches
            </label>
            <div className="grid grid-cols-2 gap-2">
              {batches
                .filter((b) => b.isActive)
                .map((batch) => (
                  <label
                    key={batch.id}
                    className="flex items-center gap-2 p-2.5 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50"
                  >
                    <input
                      type="checkbox"
                      checked={form.batchIds.includes(batch.id || '')}
                      onChange={() => toggleBatch(batch.id || '')}
                      className="rounded"
                    />
                    <div className="text-xs">
                      <p className="font-medium text-slate-900 truncate">{batch.name}</p>
                      <p className="text-slate-500">{batch.subject}</p>
                    </div>
                  </label>
                ))}
            </div>
          </div>

          {/* Fee Config */}
          <div className="border-t pt-4">
            <p className="text-sm font-semibold text-slate-700 mb-3">Fee Configuration</p>
            <div className="grid grid-cols-2 gap-3">
              <Select
                label="Fee Cycle"
                options={[
                  { value: 'monthly', label: 'Monthly Installments' },
                  { value: 'annual', label: 'One-Time Annual' },
                  { value: 'custom', label: 'Custom Schedule' },
                ]}
                value={form.cycleType}
                onChange={(e) => setForm({ ...form, cycleType: e.target.value as FeeType })}
              />
              <Input
                label="Base Amount (₹)"
                type="number"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                placeholder="3500"
              />
            </div>
          </div>
        </div>
      </Modal>

      {/* View Student Modal */}
      <Modal
        isOpen={!!viewStudent}
        onClose={() => setViewStudent(null)}
        title="Student Profile"
        size="md"
      >
        {viewStudent && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-2xl">
                {viewStudent.name.charAt(0)}
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">{viewStudent.name}</h3>
                <Badge variant={viewStudent.isActive ? 'success' : 'neutral'}>
                  {viewStudent.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2 text-slate-600">
                <Mail size={14} />
                {viewStudent.email}
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <Phone size={14} />
                {viewStudent.phone || 'N/A'}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase mb-2">
                Enrolled Batches
              </p>
              <div className="flex flex-wrap gap-2">
                {batches
                  .filter((b) => (viewStudent.batchIds || []).includes(b.id || ''))
                  .map((b) => (
                    <Badge key={b.id} variant="info">
                      {b.name}
                    </Badge>
                  ))}
                {(!viewStudent.batchIds || viewStudent.batchIds.length === 0) && (
                  <span className="text-slate-400 text-sm">Not enrolled in any batch</span>
                )}
              </div>
            </div>
            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-slate-500 uppercase mb-2">
                Fee Configuration
              </p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-slate-500">Cycle:</span>{' '}
                  <span className="font-medium capitalize">{viewStudent.feeConfig?.cycleType || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-500">Amount:</span>{' '}
                  <span className="font-medium">
                    ₹{viewStudent.feeConfig?.amount?.toLocaleString() || 0}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">Enrolled:</span>{' '}
                  <span className="font-medium">
                    {viewStudent.enrolledAt ? format(new Date(viewStudent.enrolledAt), 'MMM d, yyyy') : 'Unknown'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </AppLayout>
  );
}
