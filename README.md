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
| Icons      | lucide-react                                       |
| Routing    | react-router-dom                                   |
| Fonts      | Space Grotesk + IBM Plex Mono (bundled, offline)   |
| API        | FastAPI (Python 3) + Uvicorn, REST (polled)         |
| Database   | MongoDB via Motor (async PyMongo)                   |

> **On shadcn/ui:** not installed. Every shadcn primitive (button, card, badge, popover…) would have
> had to be fully rewritten to carry 4px borders and hard offset shadows, so the primitives in
> `src/components/brutal/` are purpose-built on the same tokens instead. The accessibility patterns
> shadcn would bring (Escape/click-outside dismissal, `role="switch"`, `aria-pressed`) are
> implemented directly.

## Run it

### Frontend

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # typecheck + production bundle
npm run preview  # serve the production build
```

### Backend (FastAPI + MongoDB)

The backend lives in `retail-intelligence-backend/`. MongoDB must be running first.

```bash
cd retail-intelligence-backend

python -m venv .venv                       # first time only
.venv/Scripts/python -m pip install -r requirements.txt   # Windows
# source .venv/bin/activate && pip install -r requirements.txt   # macOS / Linux

cp .env.example .env                       # adjust MONGODB_URI if needed

# Windows
.venv/Scripts/python -m uvicorn app.main:app --reload --port 8000
# macOS / Linux
python -m uvicorn app.main:app --reload --port 8000
```

The API is then on <http://127.0.0.1:8000> and interactive docs on `/docs`.

> **Start MongoDB first.** With `mongod` down the API still boots (deliberately — an edge
deployment must not die because the database blinked) but every data route answers **503** and
`/api/health` reports `mongodb.connected: false`.

The Vite dev server proxies `/api` (including WebSockets) to `127.0.0.1:8000`, so the frontend can
always call same-origin paths and never needs CORS in development. If you point the browser at the
API directly instead, add your origin to `CORS_ORIGINS` in `.env`.

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

Five screens, each backed by a real endpoint. Verified against the running API.

| Path                | Screen            | Reads                                                |
| ------------------- | ----------------- | ---------------------------------------------------- |
| `/sign-in`          | Sign in           | `POST /api/auth/sign-in`                             |
| `/`                 | Overview          | `/stores/{id}/overview`, `/cameras`, `/alerts`       |
| `/inventory`        | Inventory         | `/stores/{id}/overview` (shelf summary)              |
| `/queue`            | Queue Analytics   | `/stores/{id}/queues?window=`, prediction from overview |
| `/alerts`           | Alerts            | `/alerts`, plus acknowledge / resolve writes         |
| `/recommendations`  | Recommendations   | recommendations inside the overview payload          |

The top bar is the only navigation surface: five tabs, a backend-driven store selector, a
LIVE/PAUSED polling toggle and a manual refresh.

## Architecture

```
src/
├── lib/
│   ├── api.ts           REST client + backend response types (no WebSockets)
│   ├── data.tsx         polling provider + backend → view-model adapters
│   ├── auth.tsx         sign-in / session, talks to /api/auth/*
│   ├── app-state.tsx    date-window filter, drawer and motion preference
│   ├── types.ts         the view models components render
│   ├── tone.ts          semantic accent mappings
│   ├── utils.ts         cn / formatting helpers
│   └── mock-data.ts     legacy sample data, kept only for the unused StoreMap
├── components/
│   ├── brutal/          the design system
│   └── layout/          navbar, sidebar, page shell + Disclosure
└── pages/               the five routed screens
```

### Where the data comes from

`api.ts` is the only module that performs HTTP. `data.tsx` owns a `DataProvider` that polls three
endpoints every **5s** for the active store — `/stores/{id}/overview`, `/alerts?store_id=`, and
`/cameras?store_id=` — then adapts the backend documents into the view models the components
already expect. Pages never call `fetch` directly; they read `useData()`.

The provider starts only after sign-in, exposes `polling`/`setPolling` and `refresh()`, and surfaces
transport failures through `error` so the shell can show a real "backend unreachable" panel rather
than blank screens.

**Honest data only.** Fields the backend does not send (shelf fill %, camera fps/latency, dwell
time) are not invented to fill a card. The pages show what the API actually returns, and secondary
detail sits behind a `Disclosure` so the default view stays readable.

## Backend

FastAPI + MongoDB (Motor, async). The backend is the **only** writer to Mongo and the only thing
the frontend should ever fetch. It accepts anonymous structured events from the edge device, runs
deterministic (non-ML) rules over them, and serves both the dashboard's REST calls and a live
WebSocket feed.

```
retail-intelligence-backend/
├── app/
│   ├── main.py                  FastAPI app, CORS, router mounting, /api/health
│   ├── core/
│   │   ├── config.py            env-driven Settings (single cached instance)
│   │   ├── database.py          Motor client, indexes, shared queries, utcnow()
│   │   └── seed.py              idempotent demo stores / cameras / shelves
│   ├── api/
│   │   ├── routes/              one module per resource (see endpoint table)
│   │   └── websocket.py         per-store ConnectionManager + snapshot builder
│   ├── models/                  Pydantic request/response + document contracts
│   ├── services/                Mongo reads/writes + alert & metric derivation
│   └── intelligence/
│       ├── prediction.py        queue projection arithmetic
│       └── recommendations.py   deterministic rule engine
└── requirements.txt
```

### Layer responsibilities

| Layer          | Knows about                 | Never does                              |
| -------------- | --------------------------- | --------------------------------------- |
| `api/routes`   | HTTP shape, status codes    | Mongo queries, business rules           |
| `services`     | Mongo collections           | HTTP concerns                           |
| `intelligence` | Pure math and rules         | I/O of any kind (fully unit-testable)   |
| `models`       | Validation and serialisation| Storage or transport                    |

### MongoDB collections

Eight collections, all created and indexed automatically at startup. Video and frames are never
stored — only structured, anonymous events.

| Collection     | Holds                                                        |
| -------------- | ------------------------------------------------------------ |
| `stores`       | Store registry (`BLR-014`, `BLR-021`, `HYD-007`, `MUM-032`)   |
| `cameras`      | Enrolled cameras and health (`online`/`warning`/`offline`)    |
| `events`       | Every ingested detection, append-only, deduped on `event_id`  |
| `metrics`      | Pre-aggregated footfall buckets (hourly + daily)              |
| `alerts`       | Raised alerts with lifecycle (`active`→`acknowledged`→`resolved`) |
| `queue_states` | Checkout queue snapshots (latest drives the UI)               |
| `shelf_states` | Latest state per shelf bay                                    |
| `system_logs`  | Operational log lines                                         |

### REST endpoints

Every route is under `/api`. Interactive docs: `/docs`.

| Method | Path                                    | Purpose                                        |
| ------ | --------------------------------------- | ---------------------------------------------- |
| GET    | `/api/health`                           | Liveness + MongoDB status                      |
| POST   | `/api/auth/sign-in`                     | Email + password → bearer token                |
| GET    | `/api/auth/me`                          | Current user (needs `Authorization: Bearer`)   |
| POST   | `/api/auth/sign-out`                    | Sign out                                       |
| GET    | `/api/stores`                           | Registered stores                              |
| GET    | `/api/stores/{id}/overview`             | **Composite payload — one call for the dashboard** |
| GET    | `/api/stores/{id}/footfall`             | Entries, exits, occupancy, hourly/daily series |
| GET    | `/api/stores/{id}/metrics`              | Aggregates + the series behind them            |
| GET    | `/api/stores/{id}/queues`               | Queue state, peak, average, series             |
| GET    | `/api/stores/{id}/queues/prediction`    | Projected queue with the formula shown         |
| GET    | `/api/stores/{id}/shelves`              | Per-bay availability, with live alert attached |
| GET    | `/api/cameras`                          | Camera fleet + health (`?store_id=`, `?status=`) |
| GET    | `/api/alerts`                           | Alert list (`?store_id=&status=&severity=&type=`) |
| POST   | `/api/alerts/{id}/acknowledge`          | Mark seen (optional `{"note": "..."}`)         |
| POST   | `/api/alerts/{id}/resolve`              | Mark resolved                                  |
| GET    | `/api/events`                           | Search the event log (paged)                   |
| POST   | `/api/events`                           | **Ingest one edge detection** (the write path)  |

List endpoints take `limit` / `offset` and return `{ total, count, limit, offset, items }`.
Time-series endpoints take `window=today|last_7_days|last_30_days|custom` (with `start`/`end` for
`custom`). Errors come back as `{ "detail": "..." }` — `404` unknown store/camera, `422` validation
or privacy violation, `503` MongoDB unreachable.

### Event ingestion (the edge contract)

`POST /api/events` is the single write path. The store and camera must already be registered.

```jsonc
{
  "store_id": "BLR-014",
  "camera_id": "CAM-08",
  "event_type": "queue_update",   // see the list below
  "timestamp": "2026-09-24T05:35:31Z",  // optional, defaults to now (naive = UTC)
  "confidence": 0.93,             // optional, 0..1
  "data": {                       // shape depends on event_type
    "queue_length": 7,
    "arrival_rate": 3.0,
    "service_rate": 1.5,
    "open_counters": 2
  }
}
```

`event_type` is one of: `person_entered`, `person_exited`, `zone_entered`, `zone_exited`,
`queue_update`, `shelf_empty`, `shelf_low`, `shelf_normal`, `counter_opened`, `counter_closed`,
`congestion_predicted`.

The response is an `EventIngestResult`:

```jsonc
{
  "stored": true,
  "duplicate": false,             // re-posting the same event_id is a no-op
  "event": { "event_id": "evt_...", "...": "..." },
  "alerts_created": [ /* full alert objects raised by this event */ ],
  "recommendations": [ /* suggested staff actions */ ]
}
```

Re-posting the same `event_id` returns `stored: false, duplicate: true` instead of erroring, so the
edge can retry safely.

**Privacy is enforced at the model.** Any `data` key whose name contains a private token (face,
image, video, embedding, biometric, name, email, phone, identity…) is rejected with **422** before
it can be stored. `SAFE_KEYS` in `app/models/events.py` lists the deliberate exceptions.

### WebSocket

One socket per store: `ws://127.0.0.1:8000/api/ws/{store_id}` (through Vite: `/api/ws/{store_id}`).

On connect the client receives a `connected` frame listing the channels, then server-pushed frames
of type `alert`, `queue_update`, `shelf_update`, `footfall_update`, `recommendation` and `event`.
Clients may send the plain-text command `ping` (answered with `pong`) or `snapshot` (answered with
the full current state — footfall, queues, shelves and recent alerts).

### Demo credentials

`manager@retail.ai` / `password123` — overridable via `AUTH_ADMIN_*` in `.env`. Sign-in is
intentionally DB-independent so the dashboard still works while MongoDB is down.

### Components in use

`BrutalCard`, `BrutalButton`, `StatusBadge`, `MetricCard`, `MetricRow`, `Sparkline`, `AlertCard`,
`AlertLine`, `RecommendationCard`, `SegmentBar`, `AIBadge`, `SectionHeading`, plus the layout
primitives `Page`, `BlockHeading`, `Stack`, `Grid`, `DateFilterBar` and `Disclosure`.

The heavier prototype primitives (`CameraFeed`, `StoreMap`, `Heatmap`, `ChartCard`, `BrutalChart`)
are no longer wired to a route — there is no imagery or heatmap data in the API to feed them. They
are left in `src/components/` but are tree-shaken out of the bundle.

## Live data

The dashboard is **REST-only**. There is no WebSocket and no simulated edge engine — `live-store.tsx`
is gone. `DataProvider` polls the endpoints above every 5 seconds and re-renders from the response.

- **LIVE / PAUSED** in the top bar stops and starts the polling interval.
- The refresh button forces an immediate re-read.
- The store selector in the top bar drives which store every request targets.
- Acknowledge and resolve on the Alerts screen `POST` to the backend, then refresh.

Because everything is a normal HTTP request, the whole app can be exercised with `curl` and the
FastAPI docs at `/docs` — see the endpoint table above.

## Privacy model (in the UI as well as the data)

Frames are processed on the edge and discarded. People become numeric track IDs that recycle after
20 minutes. There is no face recognition in the model graph, no cross-store linking, and the
retention controls that would weaken this are shown as architecturally locked rather than as
settings a user could misconfigure.
