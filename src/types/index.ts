// ─── Core Types ───────────────────────────────────────────────────────────────

export type Role = 'admin' | 'teacher' | 'student';
export type FeeStatus = 'paid' | 'pending' | 'overdue';
export type FeeType = 'monthly' | 'annual' | 'custom';
export type ExamStatus = 'draft' | 'published' | 'closed';
export type AttendanceStatus = 'present' | 'absent' | 'late';
export type MaterialScope = 'batch' | 'institute';
export type MaterialFileType = 'pdf' | 'link' | 'image';
export type AnnouncementScope = 'institute' | 'batch';

export interface User {
  uid: string;
  name: string;
  email: string;
  role: Role;
  instituteId: string;
  batchIds?: string[];
  isActive?: boolean;
}

export interface Student {
  uid: string;
  name: string;
  email: string;
  phone: string;
  batchIds: string[];
  feeConfig: FeeConfig;
  isActive: boolean;
  enrolledAt: string;
  createdBy: string;
  rollNumber?: string;
}

export interface FeeConfig {
  cycleType: FeeType;
  amount: number;
  installments?: FeeInstallment[];
}

export interface FeeInstallment {
  dueDate: string;
  amount: number;
  label: string;
}

export interface Teacher {
  uid: string;
  name: string;
  email: string;
  batchIds: string[];
  subject: string;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  phone?: string;
}

export interface Batch {
  id: string;
  name: string;
  subject: string;
  teacherId: string;
  studentIds: string[];
  schedule: string;
  isActive: boolean;
  createdAt: string;
  createdBy: string;
}

export interface FeeRecord {
  id: string;
  studentId: string;
  batchId: string;
  cycleType: FeeType;
  amount: number;
  dueDate: string;
  label: string;
  status: FeeStatus;
  history: FeeHistoryEntry[];
  createdAt: string;
  studentName?: string;
}

export interface FeeHistoryEntry {
  changedAt: string;
  changedBy: string;
  fromStatus: FeeStatus;
  toStatus: FeeStatus;
  note: string | null;
}

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctIdx?: number;
  imageUrl?: string | null;
}

export interface Exam {
  id: string;
  title: string;
  batchId: string;
  teacherId: string;
  durationMins: number;
  marksPerQ: number;
  negativeMarks: number;
  totalMarks: number;
  questions: Question[];
  status: ExamStatus;
  publishedAt: string | null;
  closedAt: string | null;
  createdAt: string;
  batchName?: string;
}

export interface Submission {
  id: string;
  examId: string;
  studentId: string;
  batchId: string;
  answers: Record<string, number | null>;
  draft: boolean;
  draftSavedAt: string;
  submittedAt: string | null;
  gradedAt: string | null;
  score: number | null;
  totalMarks: number;
  timeTakenSecs: number | null;
  anticheatFlags: AnticheatFlag[];
  createdAt: string;
  examTitle?: string;
}

export interface AnticheatFlag {
  type: 'tab_switch' | 'focus_loss' | 'copy_attempt';
  occurredAt: string;
}

export interface Material {
  id: string;
  title: string;
  description: string | null;
  fileUrl: string;
  fileType: MaterialFileType;
  scope: MaterialScope;
  batchId: string | null;
  uploadedBy: string;
  uploadedByRole: 'admin' | 'teacher';
  subject: string | null;
  tags: string[];
  createdAt: string;
  uploaderName?: string;
  batchName?: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  scope: AnnouncementScope;
  batchId: string | null;
  targetRole: 'all' | 'students' | 'teachers';
  createdBy: string;
  createdByRole: 'admin' | 'teacher';
  createdAt: string;
  readBy: string[];
  createdByName?: string;
  batchName?: string;
}

export interface LeaderboardEntry {
  rank: number;
  studentId: string;
  studentName: string;
  totalScore: number;
  examsTaken: number;
  avgScore: number;
}

export interface Leaderboard {
  batchId: string;
  updatedAt: string;
  rankings: LeaderboardEntry[];
}

export interface AttendanceRecord {
  batchId: string;
  date: string;
  markedBy: string;
  markedAt: string;
  records: Record<string, AttendanceStatus>;
}

export interface DashboardStats {
  totalStudents: number;
  activeStudents: number;
  totalTeachers: number;
  totalBatches: number;
  pendingFees: number;
  overdueFeesCount: number;
  totalFeesPending: number;
  recentExams: number;
}
