<div align="center">

# Componently

**AI-powered electronic component identifier**

Point your camera at a single component or an entire PCB and Componently identifies every part it sees — decoding markings, pinouts, datasheets, typical applications, and substitutes. Built for ECE students, hobbyists, and lab technicians.

[Live Demo](#) · [Demo Video](#) · [Report a Bug](../../issues) · [Request a Feature](../../issues)

</div>

---

## Overview

Componently bridges electronics engineering and modern AI vision. A single scan handles a lone resistor on a desk *or* a fully populated breadboard, returning a live annotated map of everything detected. Each identified component comes with a confidence score, package type, key specifications, pinout (where applicable), common uses, typical circuits, alternatives, and a one-click datasheet search.

After identification, the **Ask AI** feature lets users have a grounded conversation with an electronics engineer model about any specific component — "Can I run this off 3.3V?", "What are the failure modes?", "Show me a typical application circuit." Responses stream in real time and are scoped strictly to the part in question.

### Who it's for

- ECE / electronics students working through coursework, labs, and personal projects
- Hobbyists trying to make sense of a parts bin or a salvaged board
- Lab technicians needing a quick second opinion on a marking

---

## Features

- **Scene-aware identification** — works on a single isolated component, a populated PCB, a breadboard build, or a schematic. The AI adapts its strategy automatically.
- **Annotated scene view** — original photo overlaid with numbered SVG markers at each detected component, scaled from normalized bounding-box coordinates so the markers render cleanly at any display size.
- **Tabbed component detail** — Overview, Specs, Pinout, Uses, and Ask AI for every identification.
- **Auto-generated pinout diagrams** — built from structured pin data, not images, so they're always crisp.
- **Streaming chat per component** — ask follow-up questions grounded in the part's actual specs. Off-topic prompts are politely redirected.
- **BOM export** — turn any multi-component scan into a CSV ready for Mouser / Digikey / JLCPCB.
- **Scan history** — every scan saved to your account, searchable, filterable by category, sortable by date or confidence.
- **Sign-in with Google or email** — auth handled by Supabase, with row-level security ensuring users only ever see their own scans.
- **Dark mode + responsive design** — every screen works at 375px and up. All touch targets ≥44px.
- **Accessibility** — semantic HTML, ARIA labels, keyboard navigation, Lighthouse 95+ across all metrics.

---

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js 15 (App Router) + TypeScript** | Industry standard, server actions, modern routing |
| Styling | **Tailwind CSS v4 + shadcn/ui** | Design tokens via OKLCH, accessible primitives |
| Animation | **Framer Motion + tw-animate-css** | Buttery transitions, premium feel |
| AI (Vision) | **Google Gemini 2.5 Flash** | Strong vision reasoning, generous free tier |
| Validation | **Zod** | Strict runtime parsing of AI output |
| Database & Auth | **Supabase (Postgres + Storage + Auth)** | RLS, signed URLs, OAuth out of the box |
| Notifications | **Sonner** | Lightweight toast system |
| Icons | **Lucide React** | Consistent, tree-shakeable icon set |
| Deployment | **Vercel** | Zero-config, preview deployments per PR |

---

## Architecture

```
┌─────────────┐      ┌──────────────┐      ┌─────────────────┐
│  Next.js    │ HTTPS│  /api/identify│      │  Gemini 2.5     │
│  Client     │─────▶│   (Node       │─────▶│  Flash (vision) │
│  (App Router)│     │   runtime)    │      │                 │
└─────────────┘      └──────────────┘      └─────────────────┘
       │                     │
       │                     │ Zod validates
       │                     │ structured output
       │                     ▼
       │             ┌──────────────┐      ┌─────────────────┐
       │             │  Supabase    │      │  Supabase       │
       └────────────▶│  Postgres    │      │  Storage        │
                     │  (RLS)       │      │  (signed URLs)  │
                     └──────────────┘      └─────────────────┘

       │
       │ Per-component follow-up
       ▼
┌─────────────┐      ┌──────────────┐      ┌─────────────────┐
│  Ask AI tab │─────▶│  /api/chat   │─────▶│  Gemini 2.5     │
│  (streaming)│ SSE  │  (streaming) │      │  Flash (text)   │
└─────────────┘      └──────────────┘      └─────────────────┘
```

### Identification flow

1. User uploads or captures an image on `/scan`
2. Client posts `multipart/form-data` to `/api/identify`
3. Route validates size, MIME type, auth, and rate limit
4. Image is base64-encoded and sent to Gemini with a strict system prompt requesting a Zod-conformant JSON response
5. Response is parsed through `ScanResultSchema`; failures trigger retries with exponential backoff
6. Image is uploaded to Supabase Storage; scan record is inserted into `scans` table
7. User is redirected to `/components/[id]` to view the annotated results

### Chat flow (Ask AI)

1. User opens the Ask AI tab for a specific component
2. Client posts the component JSON + message history to `/api/chat`
3. Server builds a grounded system prompt containing the component's full identification data
4. Gemini streams the response token-by-token
5. Client renders tokens as they arrive

---

## Getting Started

### Prerequisites

- **Node.js** 20 LTS or newer
- **npm** 10+ (or **pnpm** / **yarn**)
- A **Supabase** project (free tier is plenty)
- A **Google AI Studio** API key for Gemini ([get one here](https://aistudio.google.com/apikey))

### 1. Clone the repo

```bash
git clone https://github.com/<your-username>/componently.git
cd componently
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Copy the example file and fill in your keys:

```bash
cp .env.example .env.local
```

Required values in `.env.local`:

```env
# Google AI
GOOGLE_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-2.5-flash       # optional override

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 4. Set up the database

In your Supabase project's SQL editor, run the migration in `supabase/migrations/`:

```sql
create table scans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade,
  image_path text not null,
  result jsonb not null,
  confidence numeric,
  created_at timestamptz default now()
);

alter table scans enable row level security;

create policy "Users see own scans" on scans
  for all using (auth.uid() = user_id);
```

Then in **Storage**, create a bucket called `component-images` and add a policy restricting access to the authenticated user's own folder.

### 5. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Sign up, then head to `/scan` and try an image.

---

## Project Structure

```
componently/
├── src/
│   ├── app/
│   │   ├── (marketing)/        # Landing page
│   │   ├── (app)/              # Authenticated routes
│   │   │   ├── scan/
│   │   │   ├── history/
│   │   │   ├── library/
│   │   │   └── components/[id]/
│   │   ├── api/
│   │   │   ├── identify/       # Vision endpoint
│   │   │   ├── chat/           # Streaming chat endpoint
│   │   │   └── scans/
│   │   └── auth/
│   ├── components/
│   │   ├── ui/                 # shadcn primitives
│   │   ├── features/
│   │   │   ├── scanner/
│   │   │   ├── results/        # AnnotatedScene, ComponentDetail, ComponentChat, etc.
│   │   │   └── history/
│   │   └── layout/
│   ├── lib/
│   │   ├── ai/
│   │   │   ├── clients.ts      # Gemini client + retry logic
│   │   │   ├── prompts.ts      # Vision system prompt
│   │   │   ├── chat-prompt.ts  # Chat system prompt
│   │   │   └── schemas.ts      # Zod schemas
│   │   ├── db/
│   │   ├── actions/
│   │   └── utils.ts
│   └── types/
├── docs/
│   ├── PRD.md
│   ├── ARCHITECTURE.md
│   ├── API.md
│   └── DECISIONS.md            # ADRs
├── supabase/migrations/
└── public/
```

---

## API Reference

### `POST /api/identify`

Identifies components in an image.

**Request** — `multipart/form-data` with field `image` (JPEG, PNG, WebP, or GIF, ≤5MB)

**Response 200**
```json
{
  "sceneType": "pcb",
  "components": [ /* IdentifiedComponent[] */ ],
  "overallConfidence": 0.86,
  "sceneNotes": "Arduino Uno R3 layout",
  "requestId": "uuid"
}
```

**Errors** — `400` invalid input, `401` unauthorized, `413` too large, `429` rate limited, `502` AI failure

### `POST /api/chat`

Streams a grounded response about a specific component.

**Request** — `application/json`
```json
{
  "component": { /* IdentifiedComponent */ },
  "messages": [
    { "role": "user", "content": "Can I run this off 3.3V?" }
  ]
}
```

**Response** — `text/plain` stream of UTF-8 text chunks.

---

## Testing

```bash
npm run test          # unit tests (Vitest)
npm run test:e2e      # end-to-end (Playwright)
npm run lint          # ESLint
npm run typecheck     # TypeScript
```

---

## Git: Commit and Push

### First-time setup

If you haven't already initialized the repo:

```bash
cd ~/projects/component-identifier
git init
git branch -M main
```

Then create the repo on GitHub. The fastest way is the GitHub CLI:

```bash
gh repo create componently --public --source=. --remote=origin
```

Or, if you've already created the repo on github.com:

```bash
git remote add origin https://github.com/<your-username>/componently.git
```

### Configure your identity (once, if you haven't)

```bash
git config --global user.name "Your Name"
git config --global user.email "you@example.com"
```

### Make sure secrets aren't committed

Before your first push, double-check `.env.local` is ignored:

```bash
cat .gitignore | grep -E '\.env'
```

You should see `.env*.local` or similar. If not, add it:

```bash
echo ".env*.local" >> .gitignore
```

### Stage, commit, and push

Use **conventional commits** — it reads cleaner in your commit history and lecturers notice.

```bash
git add .
git status                          # always look before committing
git commit -m "feat: add Ask AI chat tab for grounded component Q&A"
git push -u origin main
```

The `-u origin main` only needs to happen once. After that, `git push` alone works.

### Day-to-day workflow

```bash
# Pull anything that might have changed
git pull

# Work on a feature branch (recommended for marks)
git checkout -b feat/bom-export

# ... make changes ...

git add .
git commit -m "feat: BOM CSV export for multi-component scans"
git push -u origin feat/bom-export

# Then open a PR on GitHub
gh pr create --fill
```

### Commit message conventions

| Prefix | When to use |
|---|---|
| `feat:` | New user-facing feature |
| `fix:` | Bug fix |
| `chore:` | Tooling, deps, config |
| `docs:` | README / docs changes only |
| `refactor:` | Code change that doesn't add features or fix bugs |
| `style:` | Formatting, whitespace |
| `test:` | Adding / updating tests |
| `perf:` | Performance improvement |

---

## Vercel Deployment

### 1. Push your code to GitHub

Make sure everything is committed and pushed (see above). Vercel deploys from GitHub.

### 2. Sign in to Vercel

Go to [vercel.com](https://vercel.com) and sign in with your GitHub account. The first time, it'll ask permission to access your repos — grant it for the `componently` repo at minimum.

### 3. Import the project

- Click **Add New → Project**
- Find `componently` in the repo list and click **Import**
- Vercel auto-detects Next.js — leave the build settings as-is:
  - **Framework Preset**: Next.js
  - **Build Command**: `next build` (default)
  - **Output Directory**: `.next` (default)
  - **Install Command**: `npm install` (default)

### 4. Add environment variables

Before the first deploy, expand **Environment Variables** and add each one from `.env.local`:

| Name | Scope |
|---|---|
| `GOOGLE_API_KEY` | Production, Preview, Development |
| `GEMINI_MODEL` | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_URL` | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production, Preview, Development |
| `SUPABASE_SERVICE_ROLE_KEY` | Production, Preview, Development |

> The `NEXT_PUBLIC_` prefix means the variable is exposed to the browser. Only put values you're comfortable being public behind that prefix.

### 5. Deploy

Click **Deploy**. The first build takes 1–2 minutes. When it's done, Vercel gives you a URL like `componently-xyz.vercel.app`.

### 6. Update Supabase OAuth redirect URLs

If you're using Google sign-in, add your Vercel URL to the allowed callback URLs:

- **Supabase Dashboard → Authentication → URL Configuration**
- Add `https://your-vercel-url.vercel.app/auth/callback` to **Redirect URLs**
- Add the same domain to **Site URL**

### 7. (Optional but recommended) Custom domain

A `.app` or `.dev` domain costs around $12/year on Cloudflare Registrar or Namecheap.

- In Vercel → your project → **Settings → Domains** → add your domain
- Follow the DNS instructions Vercel gives you
- Update Supabase's redirect URLs to match

### 8. Automatic preview deploys

From now on, every push to `main` deploys to production. Every push to any other branch gets its own preview URL — perfect for sharing work-in-progress with a lecturer or teammate.

```bash
git checkout -b feat/some-feature
# make changes
git push -u origin feat/some-feature
# Vercel comments on the PR with a preview URL
```

### Common deployment issues

- **Build fails on `Module not found`** — run `npm install` locally, commit `package-lock.json`, push again.
- **`Error: GOOGLE_API_KEY is undefined`** — env var wasn't added to the correct environment (Production vs Preview). Re-add and redeploy.
- **Supabase auth redirects to localhost in production** — you forgot step 6. Add the Vercel URL to Supabase redirect URLs.
- **Image uploads fail with 413** — Vercel's body size limit is 4.5MB on the Hobby plan. The app caps at 15MB; lower the cap in `/api/identify/route.ts` if you hit this.

---

## Acknowledgements

- [Google AI Studio](https://aistudio.google.com) for the Gemini API
- [Supabase](https://supabase.com) for auth, database, and storage
- [shadcn/ui](https://ui.shadcn.com) for the component primitives
- [Vercel](https://vercel.com) for hosting

---

## License

MIT © 2026 — built as a final-year Software Engineering CA project.