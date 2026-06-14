import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, AlertCircle, Loader2 } from 'lucide-react';
import { GoogleAuthProvider } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

export function LoginPage() {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingRedirect, setIsCheckingRedirect] = useState(true);
  const signingInRef = useRef(false); // synchronous guard — prevents double-click
  const navigate = useNavigate();

  // Helper: look up role in Firestore and navigate to the right dashboard
  const handleUserRole = async (userEmail: string) => {
    let role = 'none';
    try {
      const userDocRef = doc(db, 'users', userEmail);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        role = userDocSnap.data().role || 'none';
      }
    } catch (firestoreErr: unknown) {
      console.warn('Firestore lookup failed:', firestoreErr);
      role = 'none';
    }

    if (role === 'none') {
      await auth.signOut();
      throw new Error(
        'Access Denied: Your Google account is not registered with RG Academy. ' +
          'Please contact the administrator.',
      );
    }

    switch (role) {
      case 'admin':
        navigate('/admin/dashboard');
        break;
      case 'teacher':
        navigate('/teacher/dashboard');
        break;
      case 'student':
        navigate('/student/dashboard');
        break;
      default:
        await auth.signOut();
        throw new Error('Unknown role. Please contact the administrator.');
    }
  };

  // On mount: check if the auth listener already has a signed-in user
  // (handles post-redirect state from Firebase)
  useEffect(() => {
    const checkExistingAuth = async () => {
      setIsCheckingRedirect(true);
      try {
        // Wait briefly for Firebase to restore auth state from local storage
        await new Promise((resolve) => setTimeout(resolve, 800));
        const user = auth.currentUser;
        if (user && user.email) {
          await handleUserRole(user.email);
          return;
        }
        // Also check redirect result (for browsers that support it)
        const { getRedirectResult } = await import('firebase/auth');
        const result = await getRedirectResult(auth);
        if (result?.user?.email) {
          await handleUserRole(result.user.email);
        }
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : 'Sign-in failed. Please try again.');
      } finally {
        setIsCheckingRedirect(false);
      }
    };

    checkExistingAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Primary sign-in: signInWithPopup with a strict single-execution guard
  const handleLogin = async () => {
    // Synchronous guard — prevents any second call regardless of React state timing
    if (signingInRef.current) return;
    signingInRef.current = true;

    setError('');
    setIsLoading(true);

    try {
      const { signInWithPopup } = await import('firebase/auth');
      const provider = new GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');
      provider.setCustomParameters({ prompt: 'select_account' });

      const result = await signInWithPopup(auth, provider);
      const userEmail = result.user.email;
      if (!userEmail) throw new Error('No email returned from Google.');
      await handleUserRole(userEmail);
    } catch (err: unknown) {
      const firebaseErr = err as { code?: string; message?: string };
      if (
        firebaseErr.code === 'auth/popup-closed-by-user' ||
        firebaseErr.code === 'auth/cancelled-popup-request'
      ) {
        // User closed the popup — not an error, just reset
        setError('');
      } else if (firebaseErr.code === 'auth/popup-blocked') {
        // Browser blocked the popup — fall back to redirect
        setError('');
        try {
          const { signInWithRedirect } = await import('firebase/auth');
          const provider = new GoogleAuthProvider();
          provider.setCustomParameters({ prompt: 'select_account' });
          await signInWithRedirect(auth, provider);
          return; // page will navigate away
        } catch (redirectErr) {
          setError('Sign-in failed. Please allow popups for this site and try again.');
        }
      } else {
        setError(firebaseErr.message || 'Sign-in failed. Please try again.');
      }
    } finally {
      signingInRef.current = false;
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1A3C5E] via-[#15314e] to-[#0f2237] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-2xl mb-4 backdrop-blur-sm border border-white/20">
            <GraduationCap className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-bold text-white">RG Academy</h1>
          <p className="text-white/60 text-sm mt-1">NEET / JEE Coaching Management</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-semibold text-slate-900 mb-1">Welcome back</h2>
          <p className="text-sm text-slate-500 mb-6">Sign in with your Google Account</p>

          {isCheckingRedirect ? (
            <div className="flex flex-col items-center gap-3 py-4">
              <Loader2 className="animate-spin text-[#1A3C5E]" size={32} />
              <p className="text-sm text-slate-500">Completing sign-in…</p>
            </div>
          ) : (
            <div className="space-y-4">
              {error && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <button
                id="google-signin-btn"
                onClick={handleLogin}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-slate-700 font-medium text-sm hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                )}
                {isLoading ? 'Signing in…' : 'Continue with Google'}
              </button>

              <p className="text-center text-xs text-slate-400 mt-2">
                A Google sign-in window will appear. Please allow popups for this site if prompted.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
