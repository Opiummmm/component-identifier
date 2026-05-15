<div align="center">

# Componently

**AI vision for electronics. Identify any component in a single photo.**

[Live Demo](#) · [Demo Video](#) · [Report Issue](../../issues)

</div>

---

<!-- Replace with a real screenshot or animated GIF once deployed -->
<p align="center">
  <img src="docs/screenshots/hero.png" alt="Componently — annotated PCB scan" width="900" />
</p>

## What it does

Point your camera at a single resistor, a populated breadboard, or an entire PCB. Within seconds, Componently identifies every distinguishable part — reads the markings, decodes the package, generates a pinout where possible, and lets you ask follow-up questions about any component. Export the result as a CSV BOM or a print-ready PDF lab report.

Built as a Software Engineering Continuous Assessment for the **Electronic & Computer Engineering** department.

## Features

- **Multi-component scene detection** — a single photo of a populated PCB returns every distinguishable part with its bounding box, not just the most prominent one
- **Annotated scene view** — numbered SVG markers overlaid on the image, colour-coded by category, synced to a sidebar list
- **Auto-generated pinouts** — SVG pin diagrams built from the identified IC package
- **Streaming Q&A** — ask follow-up questions about any identified component; responses stream token-by-token
- **PDF lab reports** — downloadable with an annotated cover page plus one detail page per component
- **BOM export** — turn any PCB scan into a Bill of Materials CSV ready for ordering
- **Confidence-aware** — every detection is calibrated, every uncertainty surfaced as a warning
- **History** — saved scans with thumbnails, scene notes, and confidence badges
- **Mobile camera capture** — native `getUserMedia` flow for field use
- **Print-friendly** — drop directly into a lab report
- **Dark mode** by default, with a one-click toggle

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript (strict, `noUncheckedIndexedAccess`) |
| Styling | Tailwind CSS v4 |
| Components | shadcn/ui on Base UI primitives |
| Animation | Framer Motion |
| Vision AI | Google Gemini 2.5 with model fallback chain |
| Validation | Zod 4 with defensive defaults |
| Database | Supabase (Postgres + Storage + Auth) |
| Auth | Google OAuth · email/password |
| PDF | `@react-pdf/renderer` (dynamically imported) |
| Testing | Vitest · Playwright |
| Deployment | Vercel |

## Architecture in one paragraph

The user's image is resized client-side to 1600px max edge before upload, halving payload size with no measurable loss of identification accuracy. The `/api/identify` route enforces auth, rate-limits per IP, and validates the image before forwarding to a Gemini Vision call. The model response is parsed through a Zod schema that applies **defensive defaults** for non-essential fields and uses `.catch()` on the category enum, so partial responses degrade gracefully rather than failing entire scans. The result is rendered as an SVG overlay using bounding-box coordinates expressed as fractions of image dimensions, so markers scale perfectly to any viewport. See [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) for diagrams and the full set of design decisions.

## Getting started

### Prerequisites

- **Node.js 20** or newer
- A **Google Gemini API key** (free tier — get one at [aistudio.google.com](https://aistudio.google.com))
- A **Supabase project** (free tier — sign up at [supabase.com](https://supabase.com))

### Install

```bash
git clone https://github.com/your-username/component-identifier.git
cd component-identifier
npm install
```

### Configure environment

```bash
cp .env.example .env.local
```

Fill in:

| Variable | Where to find it |
|---|---|
| `GOOGLE_API_KEY` | aistudio.google.com → Get API key |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Same |
| `SUPABASE_SERVICE_ROLE_KEY` | Same — keep secret, server-side only |
| `GEMINI_MODEL` *(optional)* | Comma-separated fallback chain, default: `gemini-2.5-flash,gemini-2.5-flash-lite,gemini-2.0-flash` |

### Initialise the database

Open `supabase/migrations/20260514120000_initial_schema.sql`, paste into the Supabase SQL Editor, and run. This creates the `scans` table, the `component-images` storage bucket, and all the RLS policies. Then enable Google OAuth in Supabase → Authentication → Providers.

### Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Production server (after build) |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript check |
| `npm run format` | Prettier write |
| `npm run format:check` | Prettier verify |
| `npm test` | Vitest unit + integration |
| `npm run test:watch` | Vitest watch mode |
| `npm run test:coverage` | Coverage report |
| `npm run test:e2e` | Playwright E2E |
| `npm run test:identify` | Standalone AI pipeline smoke test |
| `npm run audit:a11y` | Lighthouse audit (dev server must be running) |

## Project structure

```
src/
├── app/                          # Next.js App Router
│   ├── (app)/                    # Auth-protected routes
│   │   ├── scan/                 # Hero scan interface
│   │   ├── history/              # Saved scans grid
│   │   ├── components/[id]/      # Saved scan detail
│   │   └── library/              # (Coming soon — public gallery)
│   ├── (marketing)/              # Public marketing pages
│   ├── api/
│   │   ├── identify/             # Vision call · auth · rate limit
│   │   └── qa/                   # Streaming follow-up Q&A
│   ├── auth/
│   │   ├── sign-in/
│   │   ├── callback/
│   │   └── sign-out/
│   ├── proxy.ts                  # Next 16 proxy (session + route guard)
│   ├── not-found.tsx
│   └── layout.tsx
├── components/
│   ├── features/
│   │   ├── scanner/              # Upload zone · camera · progress
│   │   └── results/              # Annotated scene · detail · Q&A · exports
│   ├── layout/
│   └── ui/                       # shadcn primitives (Base UI)
├── lib/
│   ├── ai/                       # Gemini client · prompts · schemas
│   ├── db/                       # Supabase client/server/proxy
│   ├── actions/                  # Server actions
│   ├── categories.ts             # Category metadata + colour mapping
│   └── format.ts
supabase/
└── migrations/                   # SQL migrations (version-controlled schema)
tests/
├── unit/
├── integration/
├── e2e/
└── fixtures/
docs/
├── PRD.md
├── ARCHITECTURE.md
├── DECISIONS.md                  # Architecture Decision Records
└── API.md
```

## Testing

Three layers of testing, scoped intentionally:

- **Unit** — schema parsing, prompt builders, utility helpers, category metadata. Fast, isolated, runs on every commit.
- **Integration** — pins the AI parsing pipeline against a fixed JSON fixture, including three response shapes (clean, markdown-fenced, prose-wrapped). Proves the pipeline is robust to model output variation without spending API credits.
- **E2E** — Playwright smoke tests for the public surface (landing, sign-in, 404), run headless in CI on Desktop Chrome and Mobile Pixel 7.

The full authenticated scan flow is validated manually before each release rather than auto-tested, since a faithful E2E would require duplicating production Supabase + Gemini infrastructure on every CI run.

## Deployment

The app is designed to deploy to Vercel with zero configuration beyond environment variables and a Supabase redirect URL update. See [`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md) for the full walkthrough.

## Acknowledgements

- **Google Gemini** for vision identification
- **Supabase** for database, storage, and auth
- **shadcn/ui** for the component primitives
- **Vercel** for the deployment platform

Built with guidance from Anthropic's Claude as a pair-programming companion.

## License

MIT
