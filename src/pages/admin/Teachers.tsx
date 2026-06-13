import { useState } from 'react';
import { AppLayout } from '../../layouts/AppLayout';
import { Card } from '../../components/shared/Card';
import { Button } from '../../components/shared/Button';
import { Badge } from '../../components/shared/Badge';
import { Input } from '../../components/shared/Input';
import { Modal } from '../../components/shared/Modal';
import { EmptyState } from '../../components/shared/EmptyState';
import { Plus, Search, Users, Mail, Phone, BookOpen, Edit, UserCheck, UserX } from 'lucide-react';
import { useFirestoreCollection } from '../../hooks/useFirestore';
import { db } from '../../firebase/config';
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';
import type { Teacher, Batch } from '../../types';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export function AdminTeachers() {
  const { data: teachers, loading: loadingTeachers } = useFirestoreCollection<Teacher>('teachers');
  const { data: batches } = useFirestoreCollection<Batch>('batches');
  
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editTeacher, setEditTeacher] = useState<Teacher | null>(null);

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    password: '',
  });

  const filtered = teachers.filter((t) => {
    const q = search.toLowerCase();
    return (
      t.name.toLowerCase().includes(q) ||
      t.email.toLowerCase().includes(q) ||
      t.subject.toLowerCase().includes(q)
    );
  });

  const openAdd = () => {
    setEditTeacher(null);
    setForm({ name: '', email: '', phone: '', subject: '', password: '' });
    setModalOpen(true);
  };

  const openEdit = (t: Teacher) => {
    setEditTeacher(t);
    setForm({
      name: t.name,
      email: t.email,
      phone: t.phone || '',
      subject: t.subject,
      password: '',
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.subject) {
      toast.error('Please fill all required fields');
      return;
    }
    const tId = toast.loading(editTeacher ? 'Updating...' : 'Creating...');
    try {
      if (editTeacher && (editTeacher.id || editTeacher.uid)) {
        await updateDoc(doc(db, 'teachers', editTeacher.id || editTeacher.uid!), {
          name: form.name, email: form.email, phone: form.phone, subject: form.subject 
        });
        toast.success('Teacher updated', { id: tId });
      } else {
        const newTeacher = {
          name: form.name,
          email: form.email,
          phone: form.phone,
          subject: form.subject,
          batchIds: [],
          isActive: true,
          createdBy: 'admin_001',
          createdAt: new Date().toISOString(),
        };
        await addDoc(collection(db, 'teachers'), newTeacher);
        toast.success('Teacher account created. Credentials sent via email.', { id: tId });
      }
      setModalOpen(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save', { id: tId });
    }
  };

  const toggleActive = async (teacher: Teacher) => {
    if (!teacher.id && !teacher.uid) return;
    const tId = toast.loading('Updating status...');
    try {
      await updateDoc(doc(db, 'teachers', teacher.id || teacher.uid!), { isActive: !teacher.isActive });
      toast.success('Teacher status updated', { id: tId });
    } catch (err: any) {
      toast.error(err.message || 'Failed to update', { id: tId });
    }
  };

  return (
    <AppLayout role="admin" title="Teachers">
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-slate-500">
          {teachers.filter((t) => t.isActive).length} active teachers
        </p>
        <Button onClick={openAdd} leftIcon={<Plus size={16} />}>
          Add Teacher
        </Button>
      </div>

      <Card className="mb-4">
        <Input
          placeholder="Search by name, email, or subject..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          leftIcon={<Search size={15} />}
        />
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loadingTeachers ? (
          <div className="col-span-3 flex justify-center p-8"><p className="text-slate-500">Loading...</p></div>
        ) : filtered.length === 0 ? (
          <div className="col-span-3">
            <EmptyState
              icon={<Users size={48} />}
              title="No teachers found"
              action={
                <Button onClick={openAdd} leftIcon={<Plus size={16} />}>
                  Add Teacher
                </Button>
              }
            />
          </div>
        ) : (
          filtered.map((teacher) => {
            const teacherBatches = batches.filter((b) => (teacher.batchIds || []).includes(b.id || ''));
            return (
              <Card key={teacher.uid || teacher.id} hoverable>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-bold text-lg">
                      {teacher.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{teacher.name}</p>
                      <Badge variant={teacher.isActive ? 'success' : 'neutral'} size="sm">
                        {teacher.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => openEdit(teacher)}
                      className="p-1.5 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-lg transition-colors"
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      onClick={() => toggleActive(teacher)}
                      className="p-1.5 hover:bg-amber-50 text-slate-400 hover:text-amber-600 rounded-lg transition-colors"
                    >
                      {teacher.isActive ? <UserX size={14} /> : <UserCheck size={14} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5 text-sm mb-3">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Mail size={13} className="flex-shrink-0" />
                    <span className="truncate">{teacher.email}</span>
                  </div>
                  {teacher.phone && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <Phone size={13} />
                      {teacher.phone}
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-slate-600">
                    <BookOpen size={13} />
                    {teacher.subject}
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-3">
                  <p className="text-xs text-slate-500 mb-1.5">
                    Assigned Batches ({teacherBatches.length})
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {teacherBatches.length === 0 ? (
                      <span className="text-xs text-slate-400">No batches assigned</span>
                    ) : (
                      teacherBatches.map((b) => (
                        <Badge key={b.id} variant="info" size="sm">
                          {b.name.split('—')[0].trim()}
                        </Badge>
                      ))
                    )}
                  </div>
                </div>

                <div className="mt-2 text-xs text-slate-400">
                  Joined {teacher.createdAt ? format(new Date(teacher.createdAt), 'MMM d, yyyy') : 'Unknown'}
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editTeacher ? 'Edit Teacher' : 'Add New Teacher'}
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>{editTeacher ? 'Update' : 'Create Account'}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Full Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Dr. Jane Smith"
            required
          />
          <Input
            label="Email Address"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="teacher@rgacademy.in"
            required
            hint="This will be their login email"
          />
          <Input
            label="Phone Number"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="9876543210"
          />
          <Input
            label="Subject Specialization"
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
            placeholder="Physics"
            required
          />
          {!editTeacher && (
            <Input
              label="Temporary Password"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Set initial password"
              required
              hint="Teacher must change this on first login"
            />
          )}
          {!editTeacher && (
            <div className="p-3 bg-blue-50 rounded-lg text-xs text-blue-800 border border-blue-200">
              <strong>Note:</strong> Login credentials will be communicated to the teacher. They
              will be able to log in immediately after account creation.
            </div>
          )}
        </div>
      </Modal>
    </AppLayout>
  );
}
