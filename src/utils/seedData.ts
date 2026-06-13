import { db } from '../firebase/config';
import { collection, writeBatch, doc } from 'firebase/firestore';
import {
  mockStudents,
  mockTeachers,
  mockBatches,
  mockFees,
  mockExams,
  mockAnnouncements,
} from '../data/mockData';

export async function seedFirestore() {
  const batch = writeBatch(db);

  // Helper to add data to a collection
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const seedCollection = (collectionName: string, dataArray: any[]) => {
    dataArray.forEach((item) => {
      // Use the mock ID if it exists, otherwise let Firestore generate one
      const docRef =
        item.id || item.uid
          ? doc(db, collectionName, item.id || item.uid)
          : doc(collection(db, collectionName));

      batch.set(
        docRef,
        { ...item, createdAt: item.createdAt || new Date().toISOString() },
        { merge: true },
      );
    });
  };

  try {
    seedCollection('students', mockStudents);
    seedCollection('teachers', mockTeachers);
    seedCollection('batches', mockBatches);
    seedCollection('fees', mockFees);
    seedCollection('exams', mockExams);
    seedCollection('announcements', mockAnnouncements);

    await batch.commit();
    console.log('Successfully seeded Firestore with mock data!');
    alert('Database seeded successfully! Refresh the page to see live data.');
  } catch (error) {
    console.error('Error seeding database:', error);
    alert('Failed to seed database. Check console for details.');
  }
}
