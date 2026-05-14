#!/usr/bin/env bash
set -euo pipefail

create() {
  local title="$1"
  local label="$2"
  local body="$3"
  gh issue create --title "$title" --label "$label" --body "$body" >/dev/null
  echo "✓ $title"
}

# Phase 0 — Planning
create "Write PRD"              "docs"    "Draft \`docs/PRD.md\` covering problem, users, requirements, non-goals, success metrics."
create "Wireframe core screens" "docs"    "Figma wireframes for landing, scan, results, history, auth. Export PNGs to docs/wireframes/."
create "Define brand identity"  "docs"    "Pick name, two-color palette, typeface, generate logo. Document in docs/BRAND.md."

# Phase 1 — Foundation
create "Configure strict TypeScript"      "chore"   "Enable \`strict\`, \`noUncheckedIndexedAccess\`, \`noImplicitOverride\`."
create "Set up Husky + lint-staged"       "chore"   "Pre-commit: prettier, eslint, typecheck on staged files."
create "Configure CI workflow"            "chore"   "GitHub Action: lint, typecheck, unit tests on every PR to develop/main."
create "Install and configure shadcn/ui"  "feature" "Init shadcn, add core primitives (button, card, input, dialog, etc.)."

# Phase 2 — AI Engine
create "Define ScanResultSchema (Zod)" "feature" "Scene-level schema with components array + bounding boxes. See roadmap §2.2."
create "Author master prompt v1"       "feature" "System prompt handling single/PCB/breadboard scenes with few-shot examples."
create "Build identifyComponent client" "feature" "Anthropic SDK vision call, Zod parse, retry on malformed JSON."
create "Create /api/identify route"     "feature" "Validate image, rate-limit, call client, return typed JSON."
create "Headless test script"           "chore"   "scripts/test-identify.ts runs against 3 sample images (single, breadboard, PCB)."

# Phase 3 — Database & Auth
create "Set up Supabase project"     "feature" "Project, env vars, enable Google OAuth + email/password."
create "Author scans table migration" "feature" "SQL migration in supabase/migrations/ with RLS policies."
create "Build auth flow + middleware" "feature" "Sign-in page, route protection middleware, sign-out."

# Phase 4 — Frontend
create "Build landing page"            "feature" "Hero, how-it-works, embedded live demo, feature grid, FAQ."
create "Build scan interface"          "feature" "Drag-drop + camera capture + multi-stage loading animation."
create "Build annotated scene view"    "feature" "SVG markers from bounding boxes, sidebar list, hover sync, click-to-detail."
create "Build component detail view"   "feature" "Tabs, auto-generated SVG pinout, save-to-library, PDF export."
create "Build history page"            "feature" "Search, filter, sort, bulk delete, empty state."

# Phase 5+ — Quality & polish
create "Lighthouse 95+ audit pass" "enhancement" "All four metrics ≥95 on main flows. Document scores in docs/."
create "Playwright E2E suite"      "chore"       "Sign up → scan → save → delete. Runs in CI."
create "Deploy to Vercel + custom domain" "chore" "Connect repo, configure env vars, wire custom domain."
create "Record demo video"          "docs"       "2–3 min Loom: problem, single scan, PCB scan, architecture."

echo ""
echo "✅ Seeded $(gh issue list --limit 100 --json number | jq length) issues."