import { FormEvent, useState } from 'react';
import { LockKeyhole, LogIn, ScanLine } from 'lucide-react';
import { Navigate, useLocation } from 'react-router-dom';
import { BrutalButton } from '@/components/brutal';
import { useAuth } from '@/lib/auth';

export default function SignIn() {
  const { user, signIn } = useAuth();
  const location = useLocation();
  const [email, setEmail] = useState('manager@retail.ai');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (user) {
    return <Navigate to={(location.state as { from?: string } | null)?.from ?? '/'} replace />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await signIn(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-paper px-4 py-10">
      <section className="w-full max-w-[460px] border-4 border-ink bg-surface shadow-brutal">
        <div className="border-b-4 border-ink bg-lime px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center border-3 border-ink bg-ink text-lime shadow-brutal-xs">
              <ScanLine className="h-6 w-6" strokeWidth={3} />
            </span>
            <div>
              <h1 className="text-2xl font-bold uppercase tracking-tight">RETAIL//AI</h1>
              <p className="font-mono text-[10px] font-bold uppercase tracking-mega text-ink/70">
                Secure dashboard access
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          <label className="block">
            <span className="font-mono text-[10px] font-bold uppercase tracking-mega text-muted">
              Email
            </span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              className="mt-1 w-full border-3 border-ink bg-paper px-3 py-2.5 text-sm font-bold outline-none focus:bg-yellow/25"
              required
            />
          </label>

          <label className="block">
            <span className="font-mono text-[10px] font-bold uppercase tracking-mega text-muted">
              Password
            </span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              className="mt-1 w-full border-3 border-ink bg-paper px-3 py-2.5 text-sm font-bold outline-none focus:bg-yellow/25"
              required
            />
          </label>

          {error && (
            <p className="border-3 border-ink bg-coral px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-wider">
              {error}
            </p>
          )}

          <BrutalButton
            type="submit"
            variant="primary"
            size="lg"
            full
            disabled={submitting}
            icon={submitting ? <LockKeyhole strokeWidth={3} /> : <LogIn strokeWidth={3} />}
          >
            {submitting ? 'SIGNING IN' : 'SIGN IN'}
          </BrutalButton>
        </form>
      </section>
    </main>
  );
}
