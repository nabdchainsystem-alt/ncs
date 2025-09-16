import React, { useMemo, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate, type Location } from 'react-router-dom';
import Button from '../components/ui/Button';
import Card, { CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/Card';
import WelcomePulse from '../components/auth/WelcomePulse';
import { useAuth } from '../context/AuthContext';
import { resolveWelcomeMessage, welcomeStorageKey } from '../lib/welcome';

function InputField({
  id,
  label,
  type = 'text',
  value,
  onChange,
  error,
  autoComplete,
}: {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  autoComplete?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm text-gray-700 dark:text-gray-200">
      <span className="font-medium text-gray-800 dark:text-gray-100">{label}</span>
      <input
        id={id}
        name={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        className={`h-11 rounded-md border bg-white px-3 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 ${
          error ? 'border-red-300 focus:ring-red-400' : 'border-gray-200'
        }`}
      />
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </label>
  );
}

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, status } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState('');
  const [pendingRedirect, setPendingRedirect] = useState<string | null>(null);
  const [welcomeState, setWelcomeState] = useState<{ message: string } | null>(null);

  const redirectTo = useMemo(() => {
    const state = location.state as { from?: Location } | undefined;
    return state?.from?.pathname && state.from.pathname !== '/login' && state.from.pathname !== '/register'
      ? state.from.pathname
      : '/overview';
  }, [location.state]);

  if (status === 'authenticated') {
    return <Navigate to={redirectTo} replace />;
  }

  const validate = () => {
    const next: Record<string, string> = {};
    if (!email.trim()) next.email = 'Email is required';
    if (!password) next.password = 'Password is required';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setServerError('');
    if (!validate()) return;
    setSubmitting(true);
    try {
      const user = await login({ email, password });
      const redirectTarget = redirectTo;
      const storageKey = welcomeStorageKey(user.id);
      let hasSeen = false;
      try {
        hasSeen = localStorage.getItem(storageKey) === '1';
      } catch {
        hasSeen = false;
      }
      if (!hasSeen) {
        try { localStorage.setItem(storageKey, '1'); } catch {}
        const message = resolveWelcomeMessage(user);
        setPendingRedirect(redirectTarget);
        setWelcomeState({ message });
        return;
      }
      navigate(redirectTarget, { replace: true });
    } catch (err) {
      console.error('[login] stub error', err);
      setServerError('Unable to sign in. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleWelcomeDone = () => {
    const target = pendingRedirect ?? redirectTo;
    setWelcomeState(null);
    setPendingRedirect(null);
    navigate(target, { replace: true });
  };

  return (
    <main className="min-h-screen bg-slate-50 py-12 px-4 flex items-center justify-center dark:bg-slate-950">
      <div className="w-full max-w-md">
        <div className="relative mb-6 h-14 flex items-center justify-center">
          {welcomeState ? <WelcomePulse message={welcomeState.message} onComplete={handleWelcomeDone} /> : null}
        </div>
        <Card className="w-full shadow-xl border-gray-200/70 dark:border-gray-800">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Welcome back</CardTitle>
            <CardDescription className="text-sm text-gray-500 dark:text-gray-400">
              Sign in with your company email to reach the operations hub.
            </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          <CardContent className="space-y-4">
            <InputField
              id="email"
              label="Work Email"
              type="email"
              value={email}
              onChange={(v) => {
                setEmail(v);
                setErrors((prev) => ({ ...prev, email: '' }));
              }}
              error={errors.email}
              autoComplete="email"
            />
            <InputField
              id="password"
              label="Password"
              type="password"
              value={password}
              onChange={(v) => {
                setPassword(v);
                setErrors((prev) => ({ ...prev, password: '' }));
              }}
              error={errors.password}
              autoComplete="current-password"
            />
            {serverError ? (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {serverError}
              </div>
            ) : null}
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? 'Signing in…' : 'Sign in'}
            </Button>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
              Need an account?{' '}
              <Link to="/register" className="font-medium text-primary-600 hover:text-primary-500">
                Create one
              </Link>
            </p>
          </CardFooter>
        </form>
        </Card>
      </div>
    </main>
  );
}
