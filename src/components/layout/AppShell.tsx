import { Outlet } from 'react-router-dom';
import { RefreshCw, ServerCrash } from 'lucide-react';
import { Navbar } from './Navbar';
import { BrutalButton, BrutalCard } from '@/components/brutal';
import { useData } from '@/lib/data';

/** Shown until the first REST load lands, or when the backend cannot be reached. */
function DataGate({
  loading,
  error,
  onRetry,
}: {
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}) {
  return (
    <div className="mx-auto max-w-xl py-14">
      <BrutalCard tone={error ? 'coral' : 'blue'} padding="lg" shadow="md">
        <div className="flex flex-col items-center gap-4 text-center">
          <span className="flex h-14 w-14 items-center justify-center border-3 border-ink bg-surface shadow-brutal-xs">
            {error ? (
              <ServerCrash className="h-7 w-7" strokeWidth={2.8} />
            ) : (
              <RefreshCw className="h-7 w-7 animate-spin" strokeWidth={2.8} />
            )}
          </span>

          <h1 className="text-2xl font-bold uppercase tracking-tightest">
            {error ? 'Backend unreachable' : 'Loading store data'}
          </h1>

          <p className="max-w-md font-mono text-[11px] leading-relaxed text-muted">
            {error
              ? error
              : `Fetching the active store from the REST API. Retrying every ${
                  loading ? 'few seconds' : 'moment'
                }.`}
          </p>

          {error && (
            <p className="max-w-md border-3 border-ink bg-yellow/40 p-3 font-mono text-[10px] uppercase leading-relaxed tracking-wider">
              Check that mongod is running and the API is up on :8000, then retry.
            </p>
          )}

          <BrutalButton
            variant="primary"
            icon={<RefreshCw strokeWidth={3} />}
            onClick={onRetry}
          >
            Retry now
          </BrutalButton>
        </div>
      </BrutalCard>
    </div>
  );
}

export function AppShell() {
  const { overview, loading, error, refresh } = useData();

  return (
    <div className="min-h-screen bg-paper">
      <Navbar />
      <main className="mx-auto w-full max-w-[1400px] px-3 py-5 md:px-6 md:py-7">
        {overview ? (
          <Outlet />
        ) : (
          <DataGate loading={loading} error={error} onRetry={refresh} />
        )}
      </main>
    </div>
  );
}
