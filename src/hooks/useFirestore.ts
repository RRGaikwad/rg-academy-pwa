import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, QueryConstraint } from 'firebase/firestore';
import { db } from '../firebase/config';

export function useFirestoreCollection<T>(path: string, queryConstraints: QueryConstraint[] = []) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // eslint-disable-next-line
    setLoading(true);
    const q =
      queryConstraints.length > 0
        ? query(collection(db, path), ...queryConstraints)
        : collection(db, path);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const results = snapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        })) as T[];
        setData(results);
        setLoading(false);
      },
      (err) => {
        console.error('Firestore Error:', err);
        setError(err);
        setLoading(false);
      },
    );

    return () => unsubscribe();
    // eslint-disable-next-line
  }, [path, ...queryConstraints]);

  return { data, loading, error };
}

export function useFirestoreDocument<T>(path: string, id: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!id) return;

    // eslint-disable-next-line
    setLoading(true);
    const docRef = doc(db, path, id);

    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setData({ ...docSnap.data(), id: docSnap.id } as T);
        } else {
          setData(null);
        }
        setLoading(false);
      },
      (err) => {
        console.error('Firestore Error:', err);
        setError(err);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [path, id]);

  return { data, loading, error };
}
