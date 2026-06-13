import { useState } from 'react';
import { AppLayout } from '../../layouts/AppLayout';
import { Card } from '../../components/shared/Card';
import { Badge } from '../../components/shared/Badge';
import { Input, Select } from '../../components/shared/Input';
import { EmptyState } from '../../components/shared/EmptyState';
import { useAuthStore } from '../../store/authStore';
import { useFirestoreCollection } from '../../hooks/useFirestore';
import type { Batch, Material } from '../../types';
import { BookMarked, Search, FileText, Link as LinkIcon, Image, Download, Globe, BookOpen, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

const fileTypeConfig = {
  pdf: { icon: <FileText size={18} />, color: 'text-red-600', bg: 'bg-red-50', label: 'PDF' },
  link: { icon: <LinkIcon size={18} />, color: 'text-blue-600', bg: 'bg-blue-50', label: 'Link' },
  image: {
    icon: <Image size={18} />,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    label: 'Image',
  },
};

export function StudentMaterials() {
  const { user } = useAuthStore();
  const [search, setSearch] = useState('');
  const [filterScope, setFilterScope] = useState('all');

  const { data: batches, loading: batchesLoading } = useFirestoreCollection<Batch>('batches');
  const { data: materials, loading: materialsLoading } = useFirestoreCollection<Material>('materials');

  const loading = batchesLoading || materialsLoading;

  if (loading) {
    return (
      <AppLayout role="student" title="Study Materials">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        </div>
      </AppLayout>
    );
  }

  const myMaterials = materials.filter((m) => {
    if (m.scope === 'institute') return true;
    if (m.scope === 'batch' && m.batchId && user?.batchIds?.includes(m.batchId)) return true;
    return false;
  });

  const filtered = myMaterials.filter((m) => {
    const q = search.toLowerCase();
    const matchSearch =
      m.title.toLowerCase().includes(q) ||
      m.description?.toLowerCase().includes(q) ||
      m.tags.some((t) => t.includes(q));
    const matchScope = filterScope === 'all' || m.scope === filterScope;
    return matchSearch && matchScope;
  });

  const instituteCount = myMaterials.filter((m) => m.scope === 'institute').length;
  const batchCount = myMaterials.filter((m) => m.scope === 'batch').length;

  return (
    <AppLayout role="student" title="Study Materials">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <Card className="bg-blue-50 border-0 text-center" padding="sm">
          <p className="text-xl font-bold text-blue-700">{myMaterials.length}</p>
          <p className="text-xs text-slate-500">Total</p>
        </Card>
        <Card className="bg-purple-50 border-0 text-center" padding="sm">
          <p className="text-xl font-bold text-purple-700">{instituteCount}</p>
          <p className="text-xs text-slate-500">Institute-wide</p>
        </Card>
        <Card className="bg-emerald-50 border-0 text-center" padding="sm">
          <p className="text-xl font-bold text-emerald-700">{batchCount}</p>
          <p className="text-xs text-slate-500">Batch-specific</p>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Input
              placeholder="Search materials..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search size={15} />}
            />
          </div>
          <Select
            options={[
              { value: 'all', label: 'All Materials' },
              { value: 'institute', label: 'Institute-wide' },
              { value: 'batch', label: 'Batch Materials' },
            ]}
            value={filterScope}
            onChange={(e) => setFilterScope(e.target.value)}
            className="sm:w-48"
          />
        </div>
      </Card>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<BookMarked size={48} />}
          title="No materials found"
          description="Your teachers or admin haven't uploaded any materials yet."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((mat) => {
            const batch = mat.batchId ? batches.find((b) => b.id === mat.batchId) : null;
            const ftc = fileTypeConfig[mat.fileType];
            return (
              <Card key={mat.id} hoverable>
                <div className="flex items-start gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${ftc.bg} ${ftc.color}`}
                  >
                    {ftc.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 truncate">{mat.title}</p>
                    {mat.description && (
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                        {mat.description}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {mat.scope === 'institute' ? (
                        <Badge variant="info" size="sm">
                          <Globe size={10} /> Institute-wide
                        </Badge>
                      ) : (
                        <Badge variant="default" size="sm">
                          <BookOpen size={10} /> {batch?.name.split('—')[0].trim()}
                        </Badge>
                      )}
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
                            className="text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded"
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
                        className="flex items-center gap-1.5 text-xs font-semibold text-purple-700 hover:text-purple-900 bg-purple-50 px-2.5 py-1 rounded-lg transition-colors"
                      >
                        {mat.fileType === 'link' ? (
                          <>
                            <LinkIcon size={12} /> Open
                          </>
                        ) : (
                          <>
                            <Download size={12} /> Download
                          </>
                        )}
                      </a>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </AppLayout>
  );
}
