@AGENTS.md

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Stack

Next.js 16 (App Router, Turbopack, `cacheComponents` and `partialPrefetching` on in `next.config.ts`), React 19, Tailwind CSS 4, TypeScript 5, ESLint 9 (`eslint-config-next` + `eslint-config-prettier`), Prettier with `prettier-plugin-tailwindcss`. This is the responsive web UI for the IMS API, a separate NestJS repo (`../nest-ims`, see its `CLAUDE.md` for the API side). This app has no database of its own.

Next.js 16 differs from older versions (`next lint` is gone, `middleware.ts` is `proxy.ts`, caching is opt-in with `use cache`). Check `node_modules/next/dist/docs/` before using any Next.js API, file convention or config option.

## Setup

Copy `.env.example` to `.env`. Start nest-ims first (`docker compose up` in `../nest-ims`, API on host port 3001), and set its `CORS_ORIGINS=http://localhost:3002` and `APP_URL=http://localhost:3002` so the browser may call it and invitation emails link here.

## Commands

```bash
docker compose up -d app          # next dev on http://localhost:3002 (installs dependencies first)
docker compose logs -f app
docker compose exec app sh        # shell in the container

npm run dev                       # next dev (Turbopack)
npm run build                     # next build (also type-checks)
npm run lint                      # eslint, fails on warnings too
npm run format                    # prettier --write . (sorts Tailwind classes)
npm run typecheck                 # tsc --noEmit
```

Run these inside the container (`docker compose exec app npm run lint`). Install packages there too (`docker compose exec app npm install <pkg>`), then run `npm install` on the host as well so the editor sees them. Files npm writes from the container (such as `package-lock.json`) are owned by root; `chown` them back to your user.

## Architecture notes

- **Docker** is development only. `docker-compose.yml` runs `next dev` in `node:24-alpine` with the repo bind-mounted. `node_modules` and `.next` are named volumes, not the host folders: Alpine needs its own native binaries (SWC, Tailwind, lightningcss), and nothing root-owned lands on the host. So the host's `node_modules` is only for the editor. After a `package.json` change, `docker compose restart app` installs the new dependencies. To start clean: `docker compose down -v`. There is no production image yet.
- **Env vars.** `NEXT_PUBLIC_API_URL` is the API as the browser sees it; it is inlined into the bundle at build time, so it is never secret and a change needs a rebuild in production. `API_URL` is the API for server-side code; docker-compose sets it to `http://host.docker.internal:3001/api` because `localhost` inside the container is not the host. `TRUST_PROXY` is the number of reverse proxies in front of this app; only then is the client IP passed to the API (`clientIp` in `lib/api.ts`), never the raw incoming `X-Forwarded-For`. Any other variable is server-only: never read it from a Client Component. Add each new variable to `.env.example`.
- **Folder layout.** `app/` holds routes only (`page.tsx`, `layout.tsx`, `route.ts`, `loading.tsx`, `error.tsx`, plus route-private files in `_components/` folders). Shared UI goes in `components/`, the API client, types and helpers in `lib/`. Import with the `@/` alias (`@/components/...`), never long `../../` chains.
- **API contract (nest-ims).** Every route is under `/api` (`/api/auth/login`, `/api/auth/refresh`, `/api/auth/me`, ...). Auth is a bearer access token plus a refresh token that rotates on every use, so a refresh response must replace both tokens and two concurrent refreshes must not race. Errors are `{ statusCode, error, message, errors?: [{ path, message }] }`: show `errors[].message` next to the matching form field. 401 means the session is gone (refresh once, then log out). 403 with `Email is not verified` means send the user to email verification, not a generic error: `getCurrentUser` (`lib/auth.ts`) already redirects such a user to `/verify-email`, so pages that load the user through it never see that 403. Login can answer `{ mfaRequired, challengeToken }` instead of tokens; the code step then calls `POST /api/auth/login/mfa`. 404 also means "not in your scope" (the API hides records you may not see). 429 is rate limiting. Messages are already translated: send the user's language as `Accept-Language` (`en`, `hi`, `gu`). `avatarUrl: null` means the UI shows its own placeholder. Keep all API calls in `lib/`, typed, never `fetch` scattered in components.
- **Browser to server: JSON Route Handlers, not Server Actions.** Forms send JSON to `app/api/...` Route Handlers that mirror the nest-ims route of the same path (same body, status codes and error shape) and add the session from the httpOnly cookies; no token is ever in a request or response body. Build them with `lib/route-handler.ts` (`passThrough`, or `readRequest`/`forward`/`toResponse`), which also refuses cross-site requests (`Origin` must match the host) and non-JSON bodies, since Route Handlers lack Server Actions' built-in check. Client Components call them with `callApi` (`lib/client-api.ts`) inside `useFormSubmit` (`lib/use-form-submit.ts`). `proxy.ts` never redirects `/api/*`; a handler without a session answers 401 JSON.
- **Routes other systems link to.** Invitation and password reset emails link to `<APP_URL>/set-password?token=...` (`INVITE_PATH` in nest-ims). Renaming that route breaks every invitation already sent; change both repos together.

## Coding standards

These differ from nest-ims on purpose: this is a UI, so the rules are about rendering, the browser and devices.

- **Server Components by default.** Add `'use client'` only to the smallest component that needs state, effects, event handlers or browser APIs, never to a page or layout. Fetch data on the server and pass plain serializable props down.
- **Secrets and tokens.** Nothing secret in a Client Component or a `NEXT_PUBLIC_` variable. Keep access and refresh tokens out of `localStorage` and other JS-readable storage; hold them in `httpOnly` cookies set from server code (Route Handlers). Every Route Handler checks the session itself: hiding a button is not authorization, the API is.
- **Caching.** With `cacheComponents` on, data is not cached unless marked `use cache`. Never cache per-user or permission-scoped API data in a shared cache.
- **Mobile first.** Unprefixed Tailwind classes are the phone layout (from 360px wide); add `sm:`, `md:`, `lg:` for larger screens. No fixed pixel widths on containers and no horizontal page scroll; wide tables become cards or scroll inside their own box on phones. Tap targets at least 44px. Nothing that works only on hover.
- **Accessible.** Real `<button>` and `<Link>` elements, a `<label>` for every input, `alt` on every image, visible focus, and keyboard reachable dialogs and menus.
- **Every API-backed screen** has loading, empty and error states.
- **Styling** with Tailwind classes only: no inline `style`, no CSS modules unless Tailwind cannot express it. Theme tokens live in `app/globals.css`.
- **Format and lint.** A Claude Code `PostToolUse` hook (`.claude/settings.json` → `.claude/hooks/format-lint.sh`) runs `npm run format` then `npm run lint` inside the app container after every Write or Edit of a `.ts`, `.tsx`, `.js`, `.mjs` or `.css` file. Lint errors and warnings, or the app container not running, come back as blocking feedback, so fix them before moving on. Run `npm run typecheck` before finishing a change.
- **README.md** is the app's design write-up (screens, how it talks to the API, auth flow, structure, decisions). Keep it in sync; a Stop hook (`.claude/hooks/readme.sh`) asks for this when routes, `proxy.ts`, `next.config.ts`, Docker/CI files, env or dependencies changed after the README did.
- **Pull requests.** `.github/workflows/claude-code-review.yml` runs on every non-draft PR: one job rewrites the bot block of the description (screens, cross-repo check, release notes), then another posts a review and fails unless the verdict is ✅. The review also checks the PR's API calls against nest-ims, both ways (what the UI sends vs what the API accepts, what the API returns vs what the UI reads): on the branch named by a `cross-repo check: <branch>` line the author writes in the description, else `master`. That part is a reminder only and never changes the verdict. Both need the `CLAUDE_CODE_OAUTH_TOKEN` repo secret. The `pr-description` skill writes the same kind of description locally.
- **Comments**: write them sparingly. Do not comment code that reads clearly on its own, and do not restate what the code does. Add a comment only when the code is tricky or non-obvious, or when it affects other modules or the API repo (e.g. a route nest-ims links to). Keep it short and explain why, not what. When touching a file, remove comments that no longer earn their place. A Stop hook (`.claude/hooks/comments.sh`) lists the comments in changed files for review.
