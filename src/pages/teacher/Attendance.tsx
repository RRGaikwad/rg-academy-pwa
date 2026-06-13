import React from 'react';
import { useState, useEffect } from 'react';
import { AppLayout } from '../../layouts/AppLayout';
import { Card } from '../../components/shared/Card';
import { Button } from '../../components/shared/Button';
import { Select } from '../../components/shared/Input';
import { useAuthStore } from '../../store/authStore';
import { useFirestoreCollection } from '../../hooks/useFirestore';
import { db } from '../../firebase/config';
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';
import type { AttendanceRecord, AttendanceStatus, Batch, User } from '../../types';
import { format } from 'date-fns';
import { CheckCircle, XCircle, Clock, Calendar, Save, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const statusConfig: Record<
  AttendanceStatus,
  { label: string; color: string; icon: React.ReactNode }
> = {
  present: {
    label: 'Present',
    color: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
    icon: <CheckCircle size={14} />,
  },
  absent: {
    label: 'Absent',
    color: 'bg-red-100 text-red-800 border border-red-200',
    icon: <XCircle size={14} />,
  },
  late: {
    label: 'Late',
    color: 'bg-amber-100 text-amber-800 border border-amber-200',
    icon: <Clock size={14} />,
  },
};

export function TeacherAttendance() {
  const { user } = useAuthStore();
  const { data: batches, loading: batchesLoading } = useFirestoreCollection<Batch>('batches');
  const { data: users, loading: usersLoading } = useFirestoreCollection<User>('users');
  const { data: attendanceData, loading: attLoading } =
    useFirestoreCollection<AttendanceRecord>('attendance');

  const myBatches = batches.filter((b) => b.teacherId === user?.uid);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [currentRecords, setCurrentRecords] = useState<Record<string, AttendanceStatus>>({});
  const [viewMode, setViewMode] = useState<'mark' | 'history'>('mark');

  useEffect(() => {
    if (myBatches.length > 0 && !selectedBatch) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedBatch(myBatches[0].id);
    }
  }, [myBatches, selectedBatch]);

  const batch = batches.find((b) => b.id === selectedBatch);
  const batchStudents = users.filter(
    (s) => s.role === 'student' && batch?.studentIds.includes(s.uid),
  );

  const existingRecord = attendanceData.find(
    (a) => a.batchId === selectedBatch && a.date === selectedDate,
  );

  useEffect(() => {
    if (existingRecord) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCurrentRecords(existingRecord.records);
    } else {
      const init: Record<string, AttendanceStatus> = {};
      batchStudents.forEach((s) => {
        init[s.uid] = 'present';
      });
      setCurrentRecords(init);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingRecord, selectedBatch, selectedDate, batchStudents.length]);

  const setStatus = (studentId: string, status: AttendanceStatus) => {
    setCurrentRecords((prev) => ({ ...prev, [studentId]: status }));
  };

  const markAll = (status: AttendanceStatus) => {
    const all: Record<string, AttendanceStatus> = {};
    batchStudents.forEach((s) => {
      all[s.uid] = status;
    });
    setCurrentRecords(all);
  };

  const saveAttendance = async () => {
    const toastId = toast.loading('Saving attendance...');
    try {
      const recordData = {
        batchId: selectedBatch,
        date: selectedDate,
        markedBy: user?.uid || '',
        markedAt: new Date().toISOString(),
        records: currentRecords,
      };

      if (existingRecord) {
        await updateDoc(doc(db, 'attendance', existingRecord.id), recordData);
      } else {
        await addDoc(collection(db, 'attendance'), recordData);
      }
      toast.success('Attendance saved successfully!', { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error('Failed to save attendance', { id: toastId });
    }
  };

  const batchHistory = attendanceData
    .filter((a) => a.batchId === selectedBatch)
    .sort((a, b) => b.date.localeCompare(a.date));

  const presentCount = Object.values(currentRecords).filter((v) => v === 'present').length;
  const absentCount = Object.values(currentRecords).filter((v) => v === 'absent').length;
  const lateCount = Object.values(currentRecords).filter((v) => v === 'late').length;

  const isLoading = batchesLoading || usersLoading || attLoading;

  if (isLoading) {
    return (
      <AppLayout role="teacher" title="Attendance">
        <div className="flex justify-center items-center h-64">
          <Loader2 className="animate-spin text-blue-600" size={32} />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout role="teacher" title="Attendance">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <Select
          options={myBatches.map((b) => ({ value: b.id, label: b.name }))}
          value={selectedBatch}
          onChange={(e) => {
            setSelectedBatch(e.target.value);
            setCurrentRecords({});
          }}
          className="sm:w-60"
        />
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => {
            setSelectedDate(e.target.value);
            setCurrentRecords({});
          }}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1A3C5E]/30 focus:border-[#1A3C5E]"
        />
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'mark' ? 'primary' : 'outline'}
            onClick={() => setViewMode('mark')}
            size="sm"
          >
            Mark Attendance
          </Button>
          <Button
            variant={viewMode === 'history' ? 'primary' : 'outline'}
            onClick={() => setViewMode('history')}
            size="sm"
          >
            History
          </Button>
        </div>
      </div>

      {viewMode === 'mark' ? (
        <>
          {/* Summary */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <Card className="bg-emerald-50 border-0 text-center">
              <p className="text-2xl font-bold text-emerald-700">{presentCount}</p>
              <p className="text-xs text-slate-500">Present</p>
            </Card>
            <Card className="bg-red-50 border-0 text-center">
              <p className="text-2xl font-bold text-red-700">{absentCount}</p>
              <p className="text-xs text-slate-500">Absent</p>
            </Card>
            <Card className="bg-amber-50 border-0 text-center">
              <p className="text-2xl font-bold text-amber-700">{lateCount}</p>
              <p className="text-xs text-slate-500">Late</p>
            </Card>
          </div>

          {/* Quick Mark */}
          <Card className="mb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {batch?.name} —{' '}
                  {format(new Date(selectedDate + 'T00:00:00'), 'EEEE, MMM d, yyyy')}
                </p>
                {existingRecord && (
                  <p className="text-xs text-amber-600 mt-0.5">
                    ⚠️ Attendance already marked for this date. You can update it.
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="success" onClick={() => markAll('present')}>
                  All Present
                </Button>
                <Button size="sm" variant="danger" onClick={() => markAll('absent')}>
                  All Absent
                </Button>
              </div>
            </div>
          </Card>

          {/* Student List */}
          <Card padding="none">
            <div className="divide-y divide-slate-100">
              {batchStudents.map((student) => {
                const status = currentRecords[student.uid] || 'present';
                return (
                  <div key={student.uid} className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold text-sm">
                        {student.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">{student.name}</p>
                        <p className="text-xs text-slate-500">{student.email}</p>
                      </div>
                    </div>
                    <div className="flex gap-1.5">
                      {(['present', 'late', 'absent'] as AttendanceStatus[]).map((s) => (
                        <button
                          key={s}
                          onClick={() => setStatus(student.uid, s)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                            status === s
                              ? statusConfig[s].color
                              : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {s.charAt(0).toUpperCase() + s.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
              {batchStudents.length === 0 && (
                <div className="px-4 py-8 text-center text-slate-400 text-sm">
                  No students enrolled in this batch.
                </div>
              )}
            </div>
          </Card>

          {batchStudents.length > 0 && (
            <div className="mt-4 flex justify-end">
              <Button onClick={saveAttendance} leftIcon={<Save size={16} />}>
                Save Attendance
              </Button>
            </div>
          )}
        </>
      ) : (
        /* History View */
        <div className="space-y-4">
          {batchHistory.length === 0 ? (
            <Card>
              <p className="text-center text-slate-400 py-8 text-sm">
                No attendance history for this batch.
              </p>
            </Card>
          ) : (
            batchHistory.map((record) => {
              const present = Object.values(record.records).filter((v) => v === 'present').length;
              const total = Object.keys(record.records).length;
              return (
                <Card key={`${record.batchId}-${record.date}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-semibold text-slate-900 flex items-center gap-2">
                        <Calendar size={15} className="text-slate-400" />
                        {format(new Date(record.date + 'T00:00:00'), 'EEEE, MMMM d, yyyy')}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Marked at {format(new Date(record.markedAt), 'h:mm a')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-emerald-700">
                        {present}/{total}
                      </p>
                      <p className="text-xs text-slate-500">
                        {total > 0 ? Math.round((present / total) * 100) : 0}% present
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(record.records).map(([sid, status]) => {
                      const student = users.find((s) => s.uid === sid);
                      const sc = statusConfig[status];
                      return (
                        <span
                          key={sid}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${sc.color}`}
                        >
                          {sc.icon}
                          {student?.name.split(' ')[0] || 'Unknown'}
                        </span>
                      );
                    })}
                  </div>
                </Card>
              );
            })
          )}
        </div>
      )}
    </AppLayout>
  );
}
