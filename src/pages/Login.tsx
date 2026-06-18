import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, AlertCircle, Loader2 } from 'lucide-react';
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

export function LoginPage() {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const signingInRef = useRef(false);
  const navigate = useNavigate();

  // ─── Role lookup ────────────────────────────────────────────────────────────
  const handleUserRole = async (userEmail: string) => {
    let role = 'none';
    try {
      const snap = await getDoc(doc(db, 'users', userEmail));
      if (snap.exists()) role = snap.data().role || 'none';
    } catch {
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
        navigate('/admin/dashboard', { replace: true });
        break;
      case 'teacher':
        navigate('/teacher/dashboard', { replace: true });
        break;
      case 'student':
        navigate('/student/dashboard', { replace: true });
        break;
      default:
        await auth.signOut();
        throw new Error('Unknown role. Please contact the administrator.');
    }
  };

  // ─── Auth state listener ─────────────────────────────────────────────────────
  // This is the source of truth for navigation.  Even if signInWithPopup's
  // promise never settles (a known Firebase + browser issue), the moment
  // Firebase persists the user to localStorage the listener fires and we navigate.
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user?.email) {
        setIsLoading(true);
        try {
          await handleUserRole(user.email);
        } catch (err) {
          await auth.signOut();
          setError(err instanceof Error ? err.message : 'Sign-in failed. Please try again.');
          setIsLoading(false);
          signingInRef.current = false;
        }
      } else {
        // No user signed in — show the login button
        setIsCheckingAuth(false);
        setIsLoading(false);
        signingInRef.current = false;
      }
    });
    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Button handler ──────────────────────────────────────────────────────────
  const handleLogin = async () => {
    // Synchronous guard: prevent double-click / double popup
    if (signingInRef.current) return;
    signingInRef.current = true;

    setError('');
    setIsLoading(true);

    try {
      // ─── PWA Hanging Popup Watchdog ──────────────────────────────────────────
      const onWindowFocus = () => {
        setTimeout(() => {
          if (signingInRef.current) {
            signingInRef.current = false;
            setIsLoading(false);
            setError('The sign-in process was interrupted or timed out. Please try again.');
          }
        }, 4000); // 4 seconds grace period
      };
      window.addEventListener('focus', onWindowFocus, { once: true });

      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, provider);

      // ✅ Directly handle the login result instead of waiting for the listener
      window.removeEventListener('focus', onWindowFocus);
      if (result?.user?.email) {
        await handleUserRole(result.user.email);
      }
    } catch (err: unknown) {
      // Reset immediately so the user can try again
      signingInRef.current = false;
      setIsLoading(false);

      const code = (err as { code?: string }).code ?? '';
      const message = (err as { message?: string }).message ?? '';

      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        setError('Sign-in popup was closed before completing. Please try again.');
      } else if (code === 'auth/popup-blocked') {
        setError(
          'The sign-in popup was blocked by your browser. ' +
            'Click the blocked-popup icon (🚫) in your address bar → "Always allow popups for this site" → then try again.',
        );
      } else {
        setError(message || 'Sign-in failed. Please try again.');
      }
    }
  };

  // ─── UI ──────────────────────────────────────────────────────────────────────
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

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-semibold text-slate-900 mb-1">Welcome back</h2>
          <p className="text-sm text-slate-500 mb-6">Sign in with your Google Account</p>

          {/* Checking existing auth or completing sign-in */}
          {isCheckingAuth ? (
            <div className="flex flex-col items-center gap-3 py-4">
              <Loader2 className="animate-spin text-[#1A3C5E]" size={32} />
              <p className="text-sm text-slate-500">Checking session…</p>
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
                className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-slate-700 font-semibold text-sm hover:bg-slate-50 hover:border-slate-300 active:scale-[0.98] transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin flex-shrink-0" size={20} />
                    <span>Signing in…</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
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
                    <span>Continue with Google</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
