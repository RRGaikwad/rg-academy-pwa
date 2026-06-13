import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();
const db = admin.firestore();

// 1. gradeExamSubmission (Callable)
export const gradeExamSubmission = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be logged in');
  }

  const { examId, answers, timeTakenSecs, anticheatFlags } = data;
  if (!examId || !answers) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing examId or answers');
  }

  const examRef = db.collection('exams').doc(examId);
  const examSnap = await examRef.get();
  if (!examSnap.exists) {
    throw new functions.https.HttpsError('not-found', 'Exam not found');
  }

  const exam = examSnap.data() as any;
  let score = 0;

  exam.questions.forEach((q: any) => {
    const ans = answers[q.id];
    if (ans === undefined || ans === null) return;
    if (ans === q.correctIdx) {
      score += exam.marksPerQ;
    } else {
      score -= exam.negativeMarks;
    }
  });

  score = Math.max(0, score); // Enforce minimum 0 score

  const submissionRef = db.collection('submissions').doc();
  const submission = {
    id: submissionRef.id,
    examId,
    studentId: context.auth.uid,
    batchId: exam.batchId,
    answers,
    draft: false,
    draftSavedAt: new Date().toISOString(),
    submittedAt: new Date().toISOString(),
    gradedAt: new Date().toISOString(),
    score,
    totalMarks: exam.totalMarks,
    timeTakenSecs,
    anticheatFlags: anticheatFlags || [],
    createdAt: new Date().toISOString(),
  };

  await submissionRef.set(submission);

  return { success: true, score, submissionId: submissionRef.id };
});

// 2. updateLeaderboard (Firestore Trigger)
export const updateLeaderboard = functions.firestore
  .document('submissions/{submissionId}')
  .onWrite(async (change, context) => {
    const afterData = change.after.data();
    if (!afterData || afterData.draft || afterData.score === null) return;

    const batchId = afterData.batchId;

    // Aggregate all submissions for this batch
    const submissionsSnap = await db
      .collection('submissions')
      .where('batchId', '==', batchId)
      .where('draft', '==', false)
      .get();

    const studentScores: Record<string, { totalScore: number; examsTaken: number }> = {};

    submissionsSnap.docs.forEach((doc) => {
      const sub = doc.data();
      if (sub.score === null) return;
      if (!studentScores[sub.studentId]) {
        studentScores[sub.studentId] = { totalScore: 0, examsTaken: 0 };
      }
      studentScores[sub.studentId].totalScore += sub.score;
      studentScores[sub.studentId].examsTaken += 1;
    });

    const rankings = [];
    for (const [studentId, data] of Object.entries(studentScores)) {
      // Need student name
      const studentSnap = await db.collection('users').doc(studentId).get();
      const studentName = studentSnap.data()?.name || 'Unknown Student';

      rankings.push({
        studentId,
        studentName,
        totalScore: data.totalScore,
        examsTaken: data.examsTaken,
        avgScore: data.totalScore / data.examsTaken,
      });
    }

    rankings.sort((a, b) => b.totalScore - a.totalScore);

    // Top 100
    const top100 = rankings.slice(0, 100).map((r, i) => ({ ...r, rank: i + 1 }));

    await db.collection('leaderboards').doc(batchId).set(
      {
        batchId,
        updatedAt: new Date().toISOString(),
        rankings: top100,
      },
      { merge: true },
    );
  });

// 3. checkOverdueFees (Scheduled Cron)
export const checkOverdueFees = functions.pubsub
  .schedule('0 0 * * *')
  .timeZone('Asia/Kolkata')
  .onRun(async (context) => {
    const now = new Date().toISOString();

    const pendingFeesSnap = await db
      .collection('fees')
      .where('status', '==', 'pending')
      .where('dueDate', '<', now)
      .get();

    const batch = db.batch();
    let count = 0;

    pendingFeesSnap.docs.forEach((doc) => {
      batch.update(doc.ref, { status: 'overdue' });
      count++;
    });

    if (count > 0) {
      await batch.commit();
      console.log(`Marked ${count} fees as overdue.`);
    } else {
      console.log('No overdue fees found.');
    }
  });

// 4. sendPushNotification (Firestore Trigger)
export const sendPushNotification = functions.firestore
  .document('announcements/{announcementId}')
  .onCreate(async (snap, context) => {
    const data = snap.data();
    const payload = {
      notification: {
        title: data.title,
        body: data.content,
      },
      topic: data.scope === 'institute' ? 'all' : `batch_${data.batchId}`,
    };

    try {
      await admin.messaging().send(payload);
      console.log('Push notification sent');
    } catch (error) {
      console.error('Error sending push notification:', error);
    }
  });
