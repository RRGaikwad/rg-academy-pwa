import { useState } from 'react';
import { AppLayout } from '../../layouts/AppLayout';
import { Card } from '../../components/shared/Card';
import { Button } from '../../components/shared/Button';
import { Badge } from '../../components/shared/Badge';
import { Input, Textarea, Select } from '../../components/shared/Input';
import { Modal } from '../../components/shared/Modal';
import { EmptyState } from '../../components/shared/EmptyState';
import { useAuthStore } from '../../store/authStore';
import { mockBatches, mockAnnouncements as initAnn } from '../../data/mockData';
import type { Announcement } from '../../types';
import { format } from 'date-fns';
import { Plus, Megaphone, Clock, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export function TeacherAnnouncements() {
  const { user } = useAuthStore();
  const myBatches = mockBatches.filter((b) => b.teacherId === user?.uid);
  const [announcements, setAnnouncements] = useState<Announcement[]>(
    initAnn.filter(
      (a) => a.scope === 'institute' || (a.batchId && myBatches.some((b) => b.id === a.batchId)),
    ),
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', batchId: myBatches[0]?.id || '' });

  const handleSubmit = () => {
    if (!form.title || !form.content || !form.batchId) {
      toast.error('Please fill all fields');
      return;
    }
    const ann: Announcement = {
      id: `ann_${Date.now()}`,
      title: form.title,
      content: form.content,
      scope: 'batch',
      batchId: form.batchId,
      targetRole: 'students',
      createdBy: user?.uid || '',
      createdByRole: 'teacher',
      createdAt: new Date().toISOString(),
      readBy: [],
    };
    setAnnouncements((prev) => [ann, ...prev]);
    setModalOpen(false);
    setForm({ title: '', content: '', batchId: myBatches[0]?.id || '' });
    toast.success('Announcement posted');
  };

  const deleteAnn = (id: string) => {
    const ann = announcements.find((a) => a.id === id);
    if (ann?.createdBy !== user?.uid) return;
    setAnnouncements((prev) => prev.filter((a) => a.id !== id));
    toast.success('Announcement deleted');
  };

  return (
    <AppLayout role="teacher" title="Announcements">
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-slate-500">{announcements.length} announcements</p>
        <Button onClick={() => setModalOpen(true)} leftIcon={<Plus size={16} />}>
          Post Announcement
        </Button>
      </div>

      {announcements.length === 0 ? (
        <EmptyState
          icon={<Megaphone size={48} />}
          title="No announcements"
          action={
            <Button onClick={() => setModalOpen(true)} leftIcon={<Plus size={16} />}>
              Post Announcement
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          {announcements.map((ann) => {
            const batch = ann.batchId ? mockBatches.find((b) => b.id === ann.batchId) : null;
            const isOwn = ann.createdBy === user?.uid;
            return (
              <Card key={ann.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h3 className="font-semibold text-slate-900">{ann.title}</h3>
                      {ann.scope === 'institute' ? (
                        <Badge variant="info" size="sm">
                          Institute-wide
                        </Badge>
                      ) : (
                        <Badge variant="default" size="sm">
                          Batch: {batch?.name.split('—')[0].trim()}
                        </Badge>
                      )}
                      {ann.createdByRole === 'admin' && (
                        <Badge variant="warning" size="sm">
                          Admin
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-slate-600 whitespace-pre-wrap mb-3">{ann.content}</p>
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Clock size={11} />
                        {format(new Date(ann.createdAt), 'MMM d, yyyy h:mm a')}
                      </span>
                      <span>{ann.readBy.length} read</span>
                      {!isOwn && <span>By {ann.createdByRole}</span>}
                    </div>
                  </div>
                  {isOwn && (
                    <button
                      onClick={() => deleteAnn(ann.id)}
                      className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Post Batch Announcement"
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>Post</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Select
            label="Batch"
            options={myBatches.map((b) => ({ value: b.id, label: b.name }))}
            value={form.batchId}
            onChange={(e) => setForm({ ...form, batchId: e.target.value })}
            required
          />
          <Input
            label="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Announcement title..."
            required
          />
          <Textarea
            label="Content"
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            placeholder="Write your announcement..."
            rows={4}
            required
          />
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800">
            This announcement will be visible to all students in the selected batch only.
          </div>
        </div>
      </Modal>
    </AppLayout>
  );
}
