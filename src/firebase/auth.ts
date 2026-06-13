import { onIdTokenChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from './config';
import { useAuthStore } from '../store/authStore';
import { Role, User } from '../types';

export function setupAuthListener() {
  return onIdTokenChanged(auth, async (firebaseUser: FirebaseUser | null) => {
    const store = useAuthStore.getState();
    store.setLoading(true);

    if (firebaseUser) {
      try {
        const idTokenResult = await firebaseUser.getIdTokenResult();
        // Extract role and instituteId from custom claims
        // In a real app, the Cloud Function sets these. For now, we fallback to defaults.
        const role = (idTokenResult.claims.role as Role) || 'student';
        const instituteId = (idTokenResult.claims.instituteId as string) || 'rg_academy_id';

        const user: User = {
          uid: firebaseUser.uid,
          name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
          email: firebaseUser.email || '',
          role: role,
          instituteId: instituteId,
        };

        store.login(user);
      } catch (error) {
        console.error('Error decoding token:', error);
        store.logout();
      }
    } else {
      store.logout();
    }

    store.setLoading(false);
  });
}
