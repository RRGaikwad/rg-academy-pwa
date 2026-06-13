import { useState } from 'react';
import { AppLayout } from '../../layouts/AppLayout';
import { Card } from '../../components/shared/Card';
import { Button } from '../../components/shared/Button';
import { Badge } from '../../components/shared/Badge';
import { Input, Textarea, Select } from '../../components/shared/Input';
import { Modal } from '../../components/shared/Modal';
import { EmptyState } from '../../components/shared/EmptyState';
import { Plus, Megaphone, Clock, Trash2, Globe, BookOpen } from 'lucide-react';
import { mockAnnouncements as initAnn, mockBatches } from '../../data/mockData';
import type { Announcement, AnnouncementScope } from '../../types';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export function AdminAnnouncements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>(initAnn);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    title: '',
    content: '',
    scope: 'institute' as AnnouncementScope,
    batchId: '',
    targetRole: 'all' as 'all' | 'students' | 'teachers',
  });

  const handleSubmit = () => {
    if (!form.title || !form.content) {
      toast.error('Title and content are required');
      return;
    }
    const ann: Announcement = {
      id: `ann_${Date.now()}`,
      title: form.title,
      content: form.content,
      scope: form.scope,
      batchId: form.scope === 'batch' ? form.batchId : null,
      targetRole: form.targetRole,
      createdBy: 'admin_001',
      createdByRole: 'admin',
      createdAt: new Date().toISOString(),
      readBy: [],
    };
    setAnnouncements((prev) => [ann, ...prev]);
    setModalOpen(false);
    setForm({ title: '', content: '', scope: 'institute', batchId: '', targetRole: 'all' });
    toast.success('Announcement published');
  };

  const deleteAnn = (id: string) => {
    setAnnouncements((prev) => prev.filter((a) => a.id !== id));
    toast.success('Announcement deleted');
  };

  return (
    <AppLayout role="admin" title="Announcements">
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-slate-500">{announcements.length} announcements</p>
        <Button onClick={() => setModalOpen(true)} leftIcon={<Plus size={16} />}>
          New Announcement
        </Button>
      </div>

      {announcements.length === 0 ? (
        <EmptyState
          icon={<Megaphone size={48} />}
          title="No announcements yet"
          action={
            <Button onClick={() => setModalOpen(true)} leftIcon={<Plus size={16} />}>
              Create Announcement
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          {announcements.map((ann) => {
            const batch = ann.batchId ? mockBatches.find((b) => b.id === ann.batchId) : null;
            return (
              <Card key={ann.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h3 className="font-semibold text-slate-900">{ann.title}</h3>
                      <Badge variant={ann.scope === 'institute' ? 'info' : 'default'} size="sm">
                        {ann.scope === 'institute' ? (
                          <>
                            <Globe size={10} /> Institute-wide
                          </>
                        ) : (
                          <>
                            <BookOpen size={10} /> Batch
                          </>
                        )}
                      </Badge>
                      <Badge
                        variant={
                          ann.targetRole === 'all'
                            ? 'neutral'
                            : ann.targetRole === 'students'
                              ? 'success'
                              : 'warning'
                        }
                        size="sm"
                      >
                        → {ann.targetRole}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-600 mb-3 whitespace-pre-wrap">{ann.content}</p>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Clock size={11} />
                        {format(new Date(ann.createdAt), 'MMM d, yyyy h:mm a')}
                      </span>
                      {batch && (
                        <span className="flex items-center gap-1">
                          <BookOpen size={11} />
                          {batch.name}
                        </span>
                      )}
                      <span>{ann.readBy.length} read</span>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteAnn(ann.id)}
                    className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition-colors flex-shrink-0"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Create Announcement"
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>Publish</Button>
          </>
        }
      >
        <div className="space-y-4">
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
            placeholder="Write your announcement here..."
            rows={4}
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Scope"
              options={[
                { value: 'institute', label: 'Institute-wide' },
                { value: 'batch', label: 'Specific Batch' },
              ]}
              value={form.scope}
              onChange={(e) => setForm({ ...form, scope: e.target.value as AnnouncementScope })}
            />
            <Select
              label="Target Role"
              options={[
                { value: 'all', label: 'Everyone' },
                { value: 'students', label: 'Students Only' },
                { value: 'teachers', label: 'Teachers Only' },
              ]}
              value={form.targetRole}
              onChange={(e) =>
                setForm({ ...form, targetRole: e.target.value as 'all' | 'students' | 'teachers' })
              }
            />
          </div>
          {form.scope === 'batch' && (
            <Select
              label="Select Batch"
              options={mockBatches
                .filter((b) => b.isActive)
                .map((b) => ({ value: b.id, label: b.name }))}
              value={form.batchId}
              onChange={(e) => setForm({ ...form, batchId: e.target.value })}
              placeholder="Choose batch..."
            />
          )}
        </div>
      </Modal>
    </AppLayout>
  );
}
