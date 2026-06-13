import { useState, useEffect } from 'react';
import { AppLayout } from '../../layouts/AppLayout';
import { Card } from '../../components/shared/Card';
import { Badge } from '../../components/shared/Badge';
import { useAuthStore } from '../../store/authStore';
import { useFirestoreCollection } from '../../hooks/useFirestore';
import { db } from '../../firebase/config';
import { doc, updateDoc } from 'firebase/firestore';
import type { Announcement, Batch } from '../../types';
import { format } from 'date-fns';
import { Bell, CheckCheck, Globe, BookOpen, Megaphone, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export function StudentNotifications() {
  const { user } = useAuthStore();
  const { data: batches, loading: batchesLoading } = useFirestoreCollection<Batch>('batches');
  const { data: annData, loading: annLoading } =
    useFirestoreCollection<Announcement>('announcements');

  const loading = batchesLoading || annLoading;

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    if (annData) {
      const filtered = annData
        .filter((a) => {
          const accessible =
            a.scope === 'institute' || (a.batchId && user?.batchIds?.includes(a.batchId));
          const targeted = a.targetRole === 'all' || a.targetRole === 'students';
          return accessible && targeted;
        })
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAnnouncements(filtered);
    }
  }, [annData, user]);

  if (loading) {
    return (
      <AppLayout role="student" title="Notifications">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        </div>
      </AppLayout>
    );
  }

  const unread = announcements.filter((a) => !a.readBy.includes(user?.uid || '')).length;

  const markRead = async (id: string) => {
    const ann = announcements.find((a) => a.id === id);
    if (!ann || ann.readBy.includes(user?.uid || '')) return;

    try {
      const annRef = doc(db, 'announcements', id);
      await updateDoc(annRef, {
        readBy: [...ann.readBy, user?.uid],
      });
    } catch {
      toast.error('Failed to mark as read');
    }
  };

  const markAllRead = async () => {
    try {
      toast.loading('Marking all as read...', { id: 'markAll' });
      const unreadAnns = announcements.filter((a) => !a.readBy.includes(user?.uid || ''));

      for (const ann of unreadAnns) {
        const annRef = doc(db, 'announcements', ann.id);
        await updateDoc(annRef, {
          readBy: [...ann.readBy, user?.uid],
        });
      }
      toast.success('All notifications marked as read', { id: 'markAll' });
    } catch {
      toast.error('Failed to mark all as read', { id: 'markAll' });
    }
  };

  return (
    <AppLayout role="student" title="Notifications">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <p className="text-sm text-slate-500">{announcements.length} notifications</p>
          {unread > 0 && <Badge variant="danger">{unread} unread</Badge>}
        </div>
        {unread > 0 && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            <CheckCheck size={15} />
            Mark all read
          </button>
        )}
      </div>

      {announcements.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Bell size={48} className="text-slate-300 mb-4" />
          <h3 className="font-semibold text-slate-700">No notifications</h3>
          <p className="text-sm text-slate-500 mt-1">
            You'll see announcements from your teachers and admin here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map((ann) => {
            const batch = ann.batchId ? batches.find((b) => b.id === ann.batchId) : null;
            const isUnread = !ann.readBy.includes(user?.uid || '');
            return (
              <Card
                key={ann.id}
                className={`cursor-pointer transition-all ${isUnread ? 'border-purple-200 bg-purple-50/50' : ''}`}
                onClick={() => markRead(ann.id)}
              >
                <div className="flex gap-3">
                  {/* Icon */}
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${ann.scope === 'institute' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}
                  >
                    {ann.scope === 'institute' ? <Globe size={18} /> : <Megaphone size={18} />}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          {isUnread && (
                            <div className="w-2 h-2 rounded-full bg-purple-500 flex-shrink-0" />
                          )}
                          <h3
                            className={`text-sm font-semibold text-slate-900 line-clamp-1 ${isUnread ? 'text-purple-900' : ''}`}
                          >
                            {ann.title}
                          </h3>
                        </div>
                        <p className="text-sm text-slate-600 line-clamp-3 mt-0.5">{ann.content}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      {ann.scope === 'institute' ? (
                        <Badge variant="info" size="sm">
                          <Globe size={10} /> Institute-wide
                        </Badge>
                      ) : (
                        <Badge variant="default" size="sm">
                          <BookOpen size={10} /> {batch?.name.split('—')[0].trim()}
                        </Badge>
                      )}
                      {ann.createdByRole === 'admin' ? (
                        <Badge variant="warning" size="sm">
                          Admin
                        </Badge>
                      ) : (
                        <Badge variant="neutral" size="sm">
                          Teacher
                        </Badge>
                      )}
                      <span className="text-xs text-slate-400 ml-auto">
                        {format(new Date(ann.createdAt), 'MMM d, h:mm a')}
                      </span>
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
