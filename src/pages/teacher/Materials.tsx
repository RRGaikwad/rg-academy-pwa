import { useState } from 'react';
import { AppLayout } from '../../layouts/AppLayout';
import { Card } from '../../components/shared/Card';
import { Button } from '../../components/shared/Button';
import { Badge } from '../../components/shared/Badge';
import { Input, Textarea, Select } from '../../components/shared/Input';
import { Modal } from '../../components/shared/Modal';
import { EmptyState } from '../../components/shared/EmptyState';
import { useAuthStore } from '../../store/authStore';
import { mockBatches, mockMaterials as initMaterials } from '../../data/mockData';
import type { Material, MaterialFileType } from '../../types';
import { format } from 'date-fns';
import { Plus, FileText, Link, Image, Download, Trash2, BookMarked } from 'lucide-react';
import toast from 'react-hot-toast';

const fileTypeConfig = {
  pdf: { icon: <FileText size={18} />, color: 'text-red-600', bg: 'bg-red-50', label: 'PDF' },
  link: { icon: <Link size={18} />, color: 'text-blue-600', bg: 'bg-blue-50', label: 'Link' },
  image: {
    icon: <Image size={18} />,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    label: 'Image',
  },
};

export function TeacherMaterials() {
  const { user } = useAuthStore();
  const myBatches = mockBatches.filter((b) => b.teacherId === user?.uid);
  const [materials, setMaterials] = useState<Material[]>(
    initMaterials.filter((m) => m.uploadedBy === user?.uid),
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    fileUrl: '',
    fileType: 'pdf' as MaterialFileType,
    batchId: myBatches[0]?.id || '',
    subject: '',
    tags: '',
  });

  const handleSubmit = () => {
    if (!form.title || !form.fileUrl || !form.batchId) {
      toast.error('Please fill all required fields');
      return;
    }
    const mat: Material = {
      id: `mat_${Date.now()}`,
      title: form.title,
      description: form.description || null,
      fileUrl: form.fileUrl,
      fileType: form.fileType,
      scope: 'batch',
      batchId: form.batchId,
      uploadedBy: user?.uid || '',
      uploadedByRole: 'teacher',
      subject: form.subject || null,
      tags: form.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      createdAt: new Date().toISOString(),
    };
    setMaterials((prev) => [mat, ...prev]);
    setModalOpen(false);
    setForm({
      title: '',
      description: '',
      fileUrl: '',
      fileType: 'pdf',
      batchId: myBatches[0]?.id || '',
      subject: '',
      tags: '',
    });
    toast.success('Material uploaded successfully');
  };

  const deleteMaterial = (id: string) => {
    setMaterials((prev) => prev.filter((m) => m.id !== id));
    toast.success('Material deleted');
  };

  return (
    <AppLayout role="teacher" title="Study Materials">
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-slate-500">{materials.length} materials uploaded</p>
        <Button onClick={() => setModalOpen(true)} leftIcon={<Plus size={16} />}>
          Upload Material
        </Button>
      </div>

      {materials.length === 0 ? (
        <EmptyState
          icon={<BookMarked size={48} />}
          title="No materials uploaded yet"
          description="Upload PDFs, notes, or video links for your students."
          action={
            <Button onClick={() => setModalOpen(true)} leftIcon={<Plus size={16} />}>
              Upload Material
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {materials.map((mat) => {
            const batch = mockBatches.find((b) => b.id === mat.batchId);
            const ftc = fileTypeConfig[mat.fileType];
            return (
              <Card key={mat.id}>
                <div className="flex items-start gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${ftc.bg} ${ftc.color}`}
                  >
                    {ftc.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-slate-900 truncate">{mat.title}</p>
                        {mat.description && (
                          <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                            {mat.description}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => deleteMaterial(mat.id)}
                        className="p-1 text-slate-400 hover:text-red-500 flex-shrink-0 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-1.5 mt-2">
                      <Badge variant="info" size="sm">
                        {batch?.name.split('—')[0].trim()}
                      </Badge>
                      <Badge
                        variant={
                          mat.fileType === 'pdf'
                            ? 'danger'
                            : mat.fileType === 'link'
                              ? 'default'
                              : 'success'
                        }
                        size="sm"
                      >
                        {ftc.label}
                      </Badge>
                      {mat.subject && (
                        <Badge variant="neutral" size="sm">
                          {mat.subject}
                        </Badge>
                      )}
                    </div>

                    {mat.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {mat.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-xs text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-3">
                      <p className="text-xs text-slate-400">
                        {format(new Date(mat.createdAt), 'MMM d, yyyy')}
                      </p>
                      <a
                        href={mat.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
                      >
                        {mat.fileType === 'link' ? <Link size={12} /> : <Download size={12} />}
                        {mat.fileType === 'link' ? 'Open Link' : 'Download'}
                      </a>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Upload Study Material"
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>Upload</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="e.g., Newton's Laws — Complete Notes"
            required
          />
          <Textarea
            label="Description (optional)"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Brief description of the material..."
            rows={2}
          />
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Material Type"
              options={[
                { value: 'pdf', label: 'PDF Document' },
                { value: 'link', label: 'Video / Link' },
                { value: 'image', label: 'Image' },
              ]}
              value={form.fileType}
              onChange={(e) => setForm({ ...form, fileType: e.target.value as MaterialFileType })}
            />
            <Select
              label="Batch"
              options={myBatches.map((b) => ({ value: b.id, label: b.name }))}
              value={form.batchId}
              onChange={(e) => setForm({ ...form, batchId: e.target.value })}
              required
            />
          </div>
          <Input
            label={form.fileType === 'link' ? 'URL' : 'File URL / Path'}
            value={form.fileUrl}
            onChange={(e) => setForm({ ...form, fileUrl: e.target.value })}
            placeholder={
              form.fileType === 'link'
                ? 'https://youtube.com/...'
                : 'https://storage.example.com/file.pdf'
            }
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Subject (optional)"
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              placeholder="Physics"
            />
            <Input
              label="Tags (optional)"
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
              placeholder="newton, mechanics (comma-separated)"
            />
          </div>
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
            <strong>Note:</strong> Materials are scoped to the selected batch only. Students in
            other batches won't have access.
          </div>
        </div>
      </Modal>
    </AppLayout>
  );
}
