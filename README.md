# RETAIL//AI — Store Intelligence Platform

A neobrutalist frontend prototype for an AI-powered retail intelligence platform. Existing store
cameras feed an edge device that runs computer vision, turns people into anonymous tracks, and
emits structured events — which become dashboards, alerts, predictions and staff instructions.

Built for a Smart India Hackathon demo: bold, technical, and production-shaped.

## Stack

| Concern    | Choice                                             |
| ---------- | -------------------------------------------------- |
| Framework  | React 18 + TypeScript (strict)                     |
| Build      | Vite 6                                             |
| Styling    | Tailwind CSS 3 with a custom design-token theme    |
| Charts     | Recharts (styled to match the brutalist language)  |
| Icons      | lucide-react                                       |
| Routing    | react-router-dom                                   |
| Fonts      | Space Grotesk + IBM Plex Mono (bundled, offline)   |

> **On shadcn/ui:** not installed. Every shadcn primitive (button, card, badge, popover…) would have
> had to be fully rewritten to carry 4px borders and hard offset shadows, so the primitives in
> `src/components/brutal/` are purpose-built on the same tokens instead. The accessibility patterns
> shadcn would bring (Escape/click-outside dismissal, `role="switch"`, `aria-pressed`) are
> implemented directly.

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # typecheck + production bundle
npm run preview  # serve the production build
```

## Design language

Neobrutalism, enforced by tokens rather than by taste:

- **Borders** — 3px structural, 4px on buttons. Nothing thinner.
- **Shadows** — hard offsets only (`5px 5px 0 #111`). No blur anywhere.
- **Radius** — 6px maximum.
- **Motion** — buttons travel toward their own shadow on hover and flatten on click; cards lift 3px.
  Live indicators pulse. Charts animate once on load. Nothing else moves.

### Colour carries meaning

| Token             | Meaning                                   |
| ----------------- | ----------------------------------------- |
| `lime`            | healthy / normal / success                |
| `coral`           | critical alert / empty shelf              |
| `yellow`          | warning / low stock                       |
| `blue`            | analytics / information                   |
| `purple`          | AI, prediction, privacy architecture      |
| `ink` / `paper`   | structure — driven by CSS variables       |

`ink` and `paper` are CSS variables (`rgb(var(--c-ink) / <alpha-value>)`), so every border, shadow
and surface reads from one source. There is a **single fixed theme** — the off-white paper base
(`#F5F1E8`) with black structure — so there is no theme switch and no second palette to keep in
step. Charts receive literal hex values from `CHART_PALETTE` in `src/lib/tone.ts` because SVG
presentation attributes cannot resolve `var()`.

A reduce-motion preference disables button travel, card lift, live pulses and chart animation,
seeded from the OS `prefers-reduced-motion` setting and toggled from **Settings → Appearance**.

## Routes

| Path                 | Screen                                                          |
| -------------------- | --------------------------------------------------------------- |
| `/`                  | Overview — hero, KPIs, live status + floor plan, live vision     |
| `/live`              | Live Analytics — rolling charts, per-camera health, event stream |
| `/analytics`         | Store Analytics — date filters, trends, activity heatmap         |
| `/shelves`           | Shelf Intelligence — bays, fill rates, low stock, stock-out risk |
| `/queue`             | Queue Pressure — lanes, wait percentiles, SLA                    |
| `/flow`              | How People Move — footfall, dwell, funnel, heatmap               |
| `/predictions`       | AI predictions, forecast band, likelihood × impact matrix        |
| `/recommendations`   | Staff action queue with reasons, owners and impact               |
| `/alerts`            | Alert centre — filters, timeline, escalation rules               |
| `/cameras`           | Camera fleet health, per-camera feed, coverage map               |
| `/privacy`           | Privacy-first architecture and retention controls                |
| `/reports`           | Report builder, templates, schedules, export history             |
| `/settings`          | Store, cameras, thresholds, model, POS/ERP, users, privacy       |

## Architecture

```
src/
├── lib/
│   ├── types.ts         domain model (the edge pipeline, typed)
│   ├── mock-data.ts     realistic dataset driving every view
│   ├── live-store.tsx   simulated edge engine — ticks metrics,
│   │                    alerts, events, tracks and lanes
│   ├── app-state.tsx    store selector, date filter, notifications, motion
│   ├── tone.ts          semantic accent mappings + literal chart palette
│   └── utils.ts         cn / formatting helpers
├── components/
│   ├── brutal/          the design system (15 primitives)
│   ├── charts/          Recharts wrapper + brutalist axis/grid/tooltip
│   └── layout/          navbar, sidebar, mobile nav, page shell
└── pages/               one file per route
```

### Required components

`BrutalCard`, `BrutalButton`, `StatusBadge`, `MetricCard`, `AlertCard`, `ChartCard`, `CameraFeed`,
`StoreMap`, `PredictionCard`, `RecommendationCard`, `Sidebar`, `Navbar` — all implemented, plus
`SegmentBar`, `HeatStrip`, `Heatmap`, `Sparkline`, `Sticker`, `PredictionCard` and form primitives.

## Live data

There is no backend. `LiveProvider` simulates the edge pipeline on a 2.6s loop: footfall and dwell
drift, queues build and clear, shelf fill erodes, anonymous tracks walk the floor plan, the event
engine emits detections and occasionally escalates one into an alert. Press **LIVE / PAUSED** in the
navbar to freeze the stream for a stable demo.

## Privacy model (in the UI as well as the data)

Frames are processed on the edge and discarded. People become numeric track IDs that recycle after
20 minutes. There is no face recognition in the model graph, no cross-store linking, and the
retention controls that would weaken this are shown as architecturally locked rather than as
settings a user could misconfigure.
