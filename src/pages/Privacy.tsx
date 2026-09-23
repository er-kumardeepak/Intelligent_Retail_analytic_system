import { useState } from 'react';
import { ArrowDown, Ban, Check, Eye, HardDrive, Lock, Server, ShieldCheck, UserX } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TONE_SOLID, TONE_TEXT } from '@/lib/tone';
import { PRIVACY_FACTS, PRIVACY_PIPELINE } from '@/lib/mock-data';
import {
  BrutalButton,
  BrutalCard,
  BrutalLink,
  SectionHeading,
  SegmentBar,
  StatusBadge,
  Sticker,
} from '@/components/brutal';
import { Slider, Toggle } from '@/components/brutal/Form';
import { Grid, Page, Stack } from '@/components/layout/Page';

const NEVER = [
  'Store or transmit raw video frames',
  'Perform face recognition or face matching',
  'Build long-term identity profiles of shoppers',
  'Track individuals across different stores',
  'Use customer imagery to train any model',
  'Sell or share behavioural data with third parties',
];

const ALWAYS = [
  'Infer on the in-store edge device',
  'Reduce people to temporary numeric track IDs',
  'Discard frames immediately after inference',
  'Store only aggregate counts and structured events',
  'Encrypt every event batch in transit',
  'Let you delete all store data on demand',
];

export default function Privacy() {
  const [eventRetention, setEventRetention] = useState(30);
  const [trackLifetime, setTrackLifetime] = useState(20);
  const [shareAggregates, setShareAggregates] = useState(true);
  const [anomalyUpload, setAnomalyUpload] = useState(false);

  return (
    <Page
      index="PRIVACY"
      eyebrow="PRIVACY-FIRST ARCHITECTURE"
      title={
        <>
          AI THAT WATCHES THE STORE.
          <br />
          NOT THE PERSON.
        </>
      }
      description="Retail intelligence does not require identifying anyone. This platform is built so that the camera can see a shelf, a queue and a crowd — while a shopper remains an anonymous number that disappears when they walk out."
      tone="purple"
      actions={
        <>
          <StatusBadge tone="purple" size="lg" dot>
            ON-DEVICE INFERENCE
          </StatusBadge>
          <Sticker tone="lime">NO FACE RECOGNITION</Sticker>
        </>
      }
    >
      <Stack gap="lg">
        {/* Pipeline */}
        <BrutalCard tone="purple" padding="lg" shadow="lg">
          <SectionHeading
            index="PIPE"
            eyebrow="THE PROCESSING CHAIN"
            title="VIDEO IN, INSIGHT OUT, IDENTITY NOWHERE"
            description="Follow a single frame through the system. By the time data leaves the store, there is nothing personal left in it."
            size="md"
          />

          <ol className="mt-7 flex flex-col gap-2">
            {PRIVACY_PIPELINE.map((stage, i) => (
              <li key={stage.step}>
                <div className="grid gap-3 lg:grid-cols-[88px_1fr_260px]">
                  <div
                    className={cn(
                      'flex h-[88px] items-center justify-center border-3 border-ink font-bold tracking-tightest tnum',
                      TONE_SOLID[stage.tone],
                      stage.tone === 'lime' || stage.tone === 'yellow' ? 'text-ink' : 'text-white',
                    )}
                  >
                    <span className="text-3xl">{stage.step}</span>
                  </div>

                  <div className="flex flex-col justify-center rounded-brutal border-3 border-ink bg-surface p-4 shadow-brutal-xs">
                    <h3 className="text-xl font-bold uppercase leading-none tracking-tightest md:text-2xl">
                      {stage.title}
                    </h3>
                    <p className="mt-2 text-[13px] leading-snug text-muted">{stage.detail}</p>
                  </div>

                  <div className="flex flex-col justify-center rounded-brutal border-3 border-dashed border-ink/40 bg-ink/[0.03] p-3">
                    <p className="font-mono text-[9px] font-bold uppercase tracking-mega text-muted">
                      DATA AT THIS STAGE
                    </p>
                    <p className="mt-1.5 font-mono text-[10px] uppercase leading-relaxed tracking-wider">
                      {
                        [
                          'RAW PIXELS · LOCAL ONLY',
                          'TENSORS · NEVER WRITTEN TO DISK',
                          'BOUNDING BOXES + NUMERIC IDS',
                          'COUNTS, DWELL, FILL %, DEPTH',
                          'AGGREGATES · ENCRYPTED',
                        ][i]
                      }
                    </p>
                  </div>
                </div>

                {i < PRIVACY_PIPELINE.length - 1 && (
                  <div className="flex justify-center py-1.5">
                    <ArrowDown className="h-5 w-5 text-muted" strokeWidth={3} />
                  </div>
                )}
              </li>
            ))}
          </ol>
        </BrutalCard>

        {/* Facts */}
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {PRIVACY_FACTS.map((f) => (
            <div
              key={f.label}
              className="rounded-brutal border-3 border-ink bg-surface p-4 shadow-brutal-xs"
            >
              <ShieldCheck className="h-5 w-5 text-purple" strokeWidth={2.8} />
              <p className="mt-2.5 font-mono text-[9px] font-bold uppercase tracking-mega text-muted">
                {f.label}
              </p>
              <p className="mt-1.5 text-xl font-bold uppercase leading-none tracking-tightest">
                {f.value}
              </p>
              <p className="mt-2 font-mono text-[10px] leading-relaxed text-muted">{f.detail}</p>
            </div>
          ))}
        </section>

        {/* Always / never */}
        <Grid cols={2}>
          <BrutalCard
            title="WHAT WE NEVER DO"
            subtitle="HARD PRODUCT CONSTRAINTS"
            tone="coral"
            right={<Ban className="h-5 w-5 text-coral" strokeWidth={3} />}
            padding="md"
          >
            <ul className="flex flex-col gap-2.5">
              {NEVER.map((item) => (
                <li key={item} className="flex items-start gap-3 border-b-3 border-ink/15 pb-2.5 last:border-b-0 last:pb-0">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center border-3 border-ink bg-coral">
                    <Ban className="h-3 w-3 text-ink" strokeWidth={3.5} />
                  </span>
                  <span className="text-[12px] leading-snug">{item}</span>
                </li>
              ))}
            </ul>
          </BrutalCard>

          <BrutalCard
            title="WHAT WE ALWAYS DO"
            subtitle="ENGINEERING GUARANTEES"
            tone="lime"
            right={<Check className="h-5 w-5 text-lime" strokeWidth={3} />}
            padding="md"
          >
            <ul className="flex flex-col gap-2.5">
              {ALWAYS.map((item) => (
                <li key={item} className="flex items-start gap-3 border-b-3 border-ink/15 pb-2.5 last:border-b-0 last:pb-0">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center border-3 border-ink bg-lime">
                    <Check className="h-3 w-3 text-ink" strokeWidth={3.5} />
                  </span>
                  <span className="text-[12px] leading-snug">{item}</span>
                </li>
              ))}
            </ul>
          </BrutalCard>
        </Grid>

        {/* Architecture + controls */}
        <Grid cols={2}>
          <BrutalCard title="WHERE THE COMPUTE RUNS" subtitle="DEPLOYMENT TOPOLOGY">
            <ul className="flex flex-col gap-3">
              {[
                {
                  icon: Eye,
                  label: 'STORE EDGE DEVICE',
                  value: 'ALL INFERENCE',
                  tone: 'lime' as const,
                  note: 'YOLO v8n, tracking, event engine and forecasting run here.',
                },
                {
                  icon: HardDrive,
                  label: 'LOCAL STORAGE',
                  value: 'EVENTS ONLY',
                  tone: 'yellow' as const,
                  note: 'Frames are dropped after inference. Only structured events persist.',
                },
                {
                  icon: Server,
                  label: 'CLOUD',
                  value: 'AGGREGATES',
                  tone: 'blue' as const,
                  note: 'Encrypted counts and fill rates for multi-store reporting.',
                },
                {
                  icon: UserX,
                  label: 'IDENTITY DATA',
                  value: 'NONE',
                  tone: 'coral' as const,
                  note: 'No faces, no names, no loyalty IDs linked to tracks.',
                },
              ].map((row) => (
                <li
                  key={row.label}
                  className="flex items-start gap-3 rounded-brutal border-3 border-ink p-3"
                >
                  <row.icon className={cn('mt-0.5 h-5 w-5 shrink-0', TONE_TEXT[row.tone])} strokeWidth={2.8} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[10px] font-bold uppercase tracking-mega">
                        {row.label}
                      </span>
                      <StatusBadge tone={row.tone} size="sm">
                        {row.value}
                      </StatusBadge>
                    </div>
                    <p className="mt-1.5 text-[12px] leading-snug text-muted">{row.note}</p>
                  </div>
                </li>
              ))}
            </ul>
          </BrutalCard>

          <Stack gap="sm">
            <BrutalCard title="RETENTION CONTROLS" subtitle="YOUR CONFIGURATION" padding="md">
              <Slider
                label="EVENT RETENTION"
                value={eventRetention}
                min={7}
                max={90}
                step={1}
                unit=" DAYS"
                onChange={setEventRetention}
              />
              <Slider
                label="TRACK ID LIFETIME"
                value={trackLifetime}
                min={5}
                max={60}
                step={5}
                unit=" MIN"
                onChange={setTrackLifetime}
              />
              <Toggle
                label="SHARE AGGREGATED COUNTS WITH CLOUD"
                detail="Store-level totals only. No per-track data ever leaves the building."
                checked={shareAggregates}
                onChange={setShareAggregates}
                tone="blue"
              />
              <Toggle
                label="UPLOAD ANOMALY CLIPS"
                detail="Off by default and disabled in most regions. Enabling it stores short clips locally for 24 hours."
                checked={anomalyUpload}
                onChange={setAnomalyUpload}
                tone="coral"
              />

              <div className="mt-4 rounded-brutal border-3 border-ink bg-ink/[0.04] p-3">
                <p className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-mega">
                  <Lock className="h-3.5 w-3.5" strokeWidth={3} />
                  LOCKED ON
                </p>
                <p className="mt-1.5 font-mono text-[10px] uppercase leading-relaxed tracking-wider text-muted">
                  FRAME RETENTION 0 SECONDS · FACE RECOGNITION DISABLED · TRACK IDS RECYCLE ON EXIT
                </p>
              </div>

              <div className="mt-4 border-t-3 border-dashed border-ink/25 pt-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-mono text-[9px] uppercase tracking-mega text-muted">
                    DATA THAT CURRENTLY LEAVES THE STORE
                  </span>
                  <span className="font-mono text-[10px] font-bold tnum">8%</span>
                </div>
                <SegmentBar value={8} segments={20} height="sm" tone="blue" />
                <p className="mt-2 font-mono text-[10px] uppercase leading-relaxed tracking-wider text-muted">
                  REPRESENTS AGGREGATE COUNTS AND FILL RATES — NOTHING RECONSTRUCTABLE TO A PERSON.
                </p>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <BrutalButton variant="primary" size="sm">
                  APPLY
                </BrutalButton>
                <BrutalButton variant="danger" size="sm">
                  PURGE ALL STORE DATA
                </BrutalButton>
              </div>
            </BrutalCard>

            <BrutalLink to="/reports" variant="secondary">
              DOWNLOAD PRIVACY &amp; COMPLIANCE REPORT
            </BrutalLink>
          </Stack>
        </Grid>
      </Stack>
    </Page>
  );
}
