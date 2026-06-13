import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase/config';
import { Button } from '../components/shared/Button';
import { Input } from '../components/shared/Input';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const idTokenResult = await userCredential.user.getIdTokenResult();
      const role = idTokenResult.claims.role || 'student';

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
          navigate('/student/dashboard');
          break;
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Invalid email or password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const quickLogin = (email: string, password: string) => {
    setEmail(email);
    setPassword(password);
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
          <p className="text-sm text-slate-500 mb-6">Sign in with your assigned credentials</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              autoComplete="email"
            />

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1A3C5E]/30 focus:border-[#1A3C5E] pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                <AlertCircle size={16} className="flex-shrink-0" />
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
              Sign In
            </Button>
          </form>
        </div>

        {/* Demo Credentials */}
        <div className="mt-6 bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/20">
          <p className="text-white/80 text-sm font-medium mb-3">🔑 Demo Credentials</p>
          <div className="space-y-2">
            {[
              {
                role: 'Admin',
                email: 'admin@rgacademy.in',
                password: 'admin123',
                color: 'bg-blue-500/20 text-blue-200 border-blue-400/30',
              },
              {
                role: 'Teacher',
                email: 'priya@rgacademy.in',
                password: 'teacher123',
                color: 'bg-emerald-500/20 text-emerald-200 border-emerald-400/30',
              },
              {
                role: 'Student',
                email: 'aryan@student.rgacademy.in',
                password: 'student123',
                color: 'bg-purple-500/20 text-purple-200 border-purple-400/30',
              },
            ].map((demo) => (
              <button
                key={demo.role}
                type="button"
                onClick={() => quickLogin(demo.email, demo.password)}
                className={`w-full text-left px-3 py-2 rounded-lg border text-xs font-mono transition-all hover:opacity-90 ${demo.color}`}
              >
                <span className="font-semibold font-sans">{demo.role}:</span> {demo.email} /{' '}
                {demo.password}
              </button>
            ))}
          </div>
          <p className="text-white/40 text-xs mt-3">Click any credential to auto-fill</p>
        </div>
      </div>
    </div>
  );
}
