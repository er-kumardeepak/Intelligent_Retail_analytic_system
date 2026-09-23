import { BrutalCard, BrutalLink, StatusBadge } from '@/components/brutal';

export default function NotFound() {
  return (
    <div className="grid-paper flex min-h-screen items-center justify-center bg-paper p-6">
      <BrutalCard tone="coral" padding="lg" className="max-w-xl" shadow="lg">
        <StatusBadge tone="coral" size="lg" dot>
          CAMERA 404 · NO SIGNAL
        </StatusBadge>
        <h1 className="mt-4 text-6xl font-bold uppercase leading-none tracking-tightest md:text-8xl">
          LOST
          <br />
          IN AISLE
        </h1>
        <p className="mt-4 max-w-md text-sm leading-relaxed text-muted">
          The event engine never reported this route. Nothing is being tracked here — return to the
          live floor and pick up the trail.
        </p>
        <div className="mt-6">
          <BrutalLink to="/" size="lg">
            BACK TO OVERVIEW
          </BrutalLink>
        </div>
      </BrutalCard>
    </div>
  );
}
