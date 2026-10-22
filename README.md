# next-ims

Responsive web UI for the IMS (inventory management system). It is a Next.js 16 app that talks to the [nest-ims](../nest-ims) API over HTTP; it has no database of its own.

Status: project scaffold. Docker development setup, code-quality tooling and PR automation are in place; screens come next.

## 1. Running it (development)

Everything runs in Docker. You need Docker with Compose v2.

1. Start the API: in `../nest-ims`, run `docker compose up -d`. It serves `http://localhost:3001/api`. In its `.env`, set:
   - `CORS_ORIGINS=http://localhost:3000`, so the browser may call the API from this app.
   - `APP_URL=http://localhost:3000`, so invitation emails link to this app.
2. Here: `cp .env.example .env`, then `docker compose up -d app`.
3. Open http://localhost:3000. Edits on the host reload the page (Fast Refresh).

| Command | What it does |
| --- | --- |
| `docker compose up -d app` | Installs dependencies and runs `next dev` on port 3000 |
| `docker compose logs -f app` | Follow the dev server output |
| `docker compose exec app npm run lint` | ESLint, fails on warnings |
| `docker compose exec app npm run format` | Prettier, also sorts Tailwind classes |
| `docker compose exec app npm run typecheck` | `tsc --noEmit` |
| `docker compose exec app npm install <pkg>` | Add a dependency (then `npm install` on the host for the editor) |
| `docker compose down -v` | Stop and drop the container's `node_modules` and `.next` |

### How the container is set up

- Image `node:24-alpine`, the repo bind-mounted at `/app`.
- `node_modules` and `.next` are Docker volumes, not the host folders. The container needs Alpine builds of native packages (SWC, Tailwind, lightningcss), and keeping them in volumes means the container never writes root-owned files into the repo. The host's `node_modules` is only for the editor.
- On Docker Desktop (macOS, Windows) file events cross a VM and Fast Refresh can be slow; native Linux has no such delay.

## 2. Talking to the API

| Variable | Used by | Value in development |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | Code that runs in the browser | `http://localhost:3001/api` |
| `API_URL` | Server-side code (Server Components, Server Functions, Route Handlers) | `http://host.docker.internal:3001/api`, set by `docker-compose.yml` |

Two URLs are needed because server-side code runs inside the container, where `localhost` is the container itself; `host.docker.internal` reaches the API published on the host. `NEXT_PUBLIC_*` values are baked into the browser bundle at build time, so they must never hold secrets and a change needs a rebuild.

The API contract the UI relies on (auth, error shape, status codes, language) is summarised in `CLAUDE.md`. Invitation emails from the API link to `/set-password?token=...` on this app, so that route must keep its path.

## 3. Code quality and automation

- **Prettier + ESLint** (`eslint-config-next` core web vitals and TypeScript rules, `eslint-config-prettier` so they do not fight).
- **Claude Code hooks** (`.claude/settings.json`):
  - after every edit of a code or CSS file: format and lint inside the container, and hand errors back to Claude;
  - at the end of each prompt: list comments in changed files so needless ones get trimmed;
  - at the end of each prompt: ask for a README update when routes, config, Docker, CI, env or dependencies changed.
- **`pr-description` skill** (`.claude/skills/pr-description`): the single source for PR description rules and template (summary, business changes, screens, backend dependency, release notes). Use it on request locally; the CI *PR description* job loads it too.
- **GitHub Actions** (`.github/workflows/claude-code-review.yml`), on every non-draft PR:
  1. *PR description*: rewrites a bot-owned block in the PR body (summary, business changes, screens, backend dependency, release notes). Text outside the block is kept.
  2. *Claude review*: posts a review comment with a verdict; the check fails (as a warning, not a merge block) unless it is ✅.

  Both need the repository secret `CLAUDE_CODE_OAUTH_TOKEN`. Docs-only, `.github/`, `.claude/` and lockfile-only changes do not trigger them.

## 4. Production

Not set up yet: no production image, no image publishing and no deployment pipeline.
