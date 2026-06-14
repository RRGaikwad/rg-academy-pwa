import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, AlertCircle, Loader2 } from 'lucide-react';
import { signInWithRedirect, GoogleAuthProvider, getRedirectResult } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { Button } from '../components/shared/Button';

export function LoginPage() {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingRedirect, setIsCheckingRedirect] = useState(true);
  const navigate = useNavigate();

  // Helper: look up role in Firestore and redirect to the right dashboard
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

  // On mount, check if the page just came back from a Google redirect
  useEffect(() => {
    const checkRedirect = async () => {
      setIsCheckingRedirect(true);
      try {
        const result = await getRedirectResult(auth);
        if (!result) {
          // No redirect in progress — just show the login button
          return;
        }
        const userEmail = result.user.email;
        if (!userEmail) throw new Error('No email returned from Google.');
        await handleUserRole(userEmail);
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : 'Sign-in failed. Please try again.');
      } finally {
        setIsCheckingRedirect(false);
      }
    };

    checkRedirect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Clicking the button kicks off the redirect flow
  const handleLogin = async () => {
    setError('');
    setIsLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      // signInWithRedirect navigates away — no popup, no nested windows
      await signInWithRedirect(auth, provider);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Sign-in failed. Please try again.');
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

          {/* Show spinner while checking if a redirect just happened */}
          {isCheckingRedirect ? (
            <div className="flex flex-col items-center gap-3 py-4">
              <Loader2 className="animate-spin text-[#1A3C5E]" size={32} />
              <p className="text-sm text-slate-500">Completing sign-in…</p>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleLogin();
              }}
              className="space-y-4"
            >
              {error && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full flex items-center justify-center gap-2"
                size="lg"
                isLoading={isLoading}
              >
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
                Continue with Google
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
