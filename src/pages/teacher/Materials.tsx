import { useState, useEffect } from 'react';
import { AppLayout } from '../../layouts/AppLayout';
import { Card } from '../../components/shared/Card';
import { Button } from '../../components/shared/Button';
import { Badge } from '../../components/shared/Badge';
import { Input, Textarea, Select } from '../../components/shared/Input';
import { Modal } from '../../components/shared/Modal';
import { EmptyState } from '../../components/shared/EmptyState';
import { useAuthStore } from '../../store/authStore';
import { useFirestoreCollection } from '../../hooks/useFirestore';
import { db } from '../../firebase/config';
import { collection, addDoc, doc, deleteDoc } from 'firebase/firestore';
import type { Material, MaterialFileType, Batch } from '../../types';
import { format } from 'date-fns';
import { Plus, FileText, Link, Image, Download, Trash2, BookMarked, Loader2 } from 'lucide-react';
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
  const { data: batches, loading: batchesLoading } = useFirestoreCollection<Batch>('batches');
  const { data: allMaterials, loading: materialsLoading } = useFirestoreCollection<Material>('materials');

  const myBatches = batches.filter((b) => b.teacherId === user?.uid);
  const materials = allMaterials.filter((m) => m.uploadedBy === user?.uid)
    .sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    fileUrl: '',
    fileType: 'pdf' as MaterialFileType,
    batchId: '',
    subject: '',
    tags: '',
  });

  useEffect(() => {
    if (myBatches.length > 0 && !form.batchId) {
      setForm((prev) => ({ ...prev, batchId: myBatches[0].id }));
    }
  }, [myBatches, form.batchId]);

  const handleSubmit = async () => {
    if (!form.title || !form.fileUrl || !form.batchId) {
      toast.error('Please fill all required fields');
      return;
    }
    const toastId = toast.loading('Uploading material...');
    try {
      const matData: Omit<Material, 'id'> = {
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
      await addDoc(collection(db, 'materials'), matData);
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
      toast.success('Material uploaded successfully', { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error('Failed to upload material', { id: toastId });
    }
  };

  const deleteMaterial = async (id: string) => {
    const toastId = toast.loading('Deleting material...');
    try {
      await deleteDoc(doc(db, 'materials', id));
      toast.success('Material deleted', { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error('Failed to delete material', { id: toastId });
    }
  };

  const isLoading = batchesLoading || materialsLoading;

  if (isLoading) {
    return (
      <AppLayout role="teacher" title="Study Materials">
        <div className="flex justify-center items-center h-64">
          <Loader2 className="animate-spin text-blue-600" size={32} />
        </div>
      </AppLayout>
    );
  }

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
            const batch = batches.find((b) => b.id === mat.batchId);
            const ftc = fileTypeConfig[mat.fileType];
            return (
              <Card key={mat.uid}>
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
                        onClick={() => deleteMaterial(mat.uid)}
                        className="p-1 text-slate-400 hover:text-red-500 flex-shrink-0 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-1.5 mt-2">
                      <Badge variant="info" size="sm">
                        {batch?.name.split('—')[0].trim() || 'Unknown'}
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
