import { onIdTokenChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './config';
import { useAuthStore } from '../store/authStore';
import { Role, User } from '../types';

export function setupAuthListener() {
  return onIdTokenChanged(auth, async (firebaseUser: FirebaseUser | null) => {
    const store = useAuthStore.getState();
    store.setLoading(true);

    if (firebaseUser) {
      try {
        let role: Role = 'student';
        let instituteId = 'rg_academy_id';
        let name = firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User';

        if (!firebaseUser.email) throw new Error('No email found in token');
        const userDocRef = doc(db, 'users', firebaseUser.email);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          role = (userData.role as Role) || 'student';
          instituteId = userData.instituteId || 'rg_academy_id';
          name = userData.name || name;
        }

        const user: User = {
          uid: firebaseUser.uid,
          name: name,
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
