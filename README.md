# next-ims

Responsive web UI for the IMS (inventory management system). It is a Next.js 16 app that talks to the [nest-ims](../nest-ims) API over HTTP; it has no database of its own.

Status: Docker development setup, code-quality tooling, PR automation, the theme, the app shell, the account flows (sign-in with MFA, set password from an invitation or reset link, forgot password, email verification, MFA on/off on the profile) and screens for every nest-ims module are in place: the dashboard, inventory (items, products, categories), sites, people (users, invitations, roles), the audit log and the profile. Settings is still a placeholder.

## 1. Running it (development)

Everything runs in Docker. You need Docker with Compose v2.

1. Start the API: in `../nest-ims`, run `docker compose up -d`. It serves `http://localhost:3001/api`. In its `.env`, set:
   - `CORS_ORIGINS=http://localhost:3002`, so the browser may call the API from this app.
   - `APP_URL=http://localhost:3002`, so invitation emails link to this app.
2. Here: `cp .env.example .env`, then `docker compose up -d app`.
3. Open http://localhost:3002. Edits on the host reload the page (Fast Refresh).

| Command | What it does |
| --- | --- |
| `docker compose up -d app` | Installs dependencies and runs `next dev` on http://localhost:3002 (port 3000 inside the container) |
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
| `APP_LOGO_URL` | Company logo on the sign-in page and in the sidebar (optional) | `/logo.svg`, a placeholder in `public/` |

Two URLs are needed because server-side code runs inside the container, where `localhost` is the container itself; `host.docker.internal` reaches the API published on the host. `NEXT_PUBLIC_*` values are baked into the browser bundle at build time, so they must never hold secrets and a change needs a rebuild.

The API contract the UI relies on (auth, error shape, status codes, language) is summarised in `CLAUDE.md`. Invitation and password reset emails from the API link to `/set-password?token=...` on this app, so that route must keep its path.

All calls to nest-ims go through `lib/api.ts`, from server code only. The browser never calls nest-ims itself: forms send JSON to this app's Route Handlers in `app/api` (see "Auth endpoints" below), which call nest-ims from the server. Each call passes on the user's `Accept-Language` (the API translates its messages) and the client IP as `X-Forwarded-For`. The API rate-limits by client IP (login 5 and refresh 10 per minute), and every call reaches it from this server, so without the client IP all users share one IP and lock each other out.

The client IP must be one the client cannot forge. Next.js passes on an incoming `X-Forwarded-For` unchanged and only fills it with the socket address when it is missing, so the raw header is not trusted:

- **`TRUST_PROXY` here** is the number of reverse proxies in front of this app that append to `X-Forwarded-For`. `lib/api.ts` (`clientIp`) takes the entry that many places from the right, the one the outermost proxy appended, and sends only that. Unset or `0` (development) sends nothing, so the API sees this server's IP. In production, put a reverse proxy in front of the app and set this to match.
- **`TRUST_PROXY` in nest-ims** counts the hops in front of the API: `1` for this app, plus any load balancer between this app and the API. Do not turn it on before this app's `TRUST_PROXY` is set, or the API rate-limits by whatever header reaches it.

**The logo** (`APP_LOGO_URL`) is a path under `public/` or a full URL. The browser loads it directly, not through the Next.js image optimizer, so a URL that only serves this app's domain (such as a restricted Azure Blob URL) still works. Static pages read it at build time, so a new value needs a rebuild. The API will later supply the logo per company.

### Sign-in and session

There is no sign-up: admins add users from user management (or an Excel import), and users set their first password from the invitation email.

```mermaid
sequenceDiagram
    actor User
    participant App as next-ims (server)
    participant API as nest-ims
    User->>App: POST /api/auth/login { email, password } (JSON, Route Handler)
    App->>API: POST /api/auth/login
    alt MFA on
        API-->>App: { mfaRequired, challengeToken }
        App-->>User: { mfaRequired, message } (challenge token in an httpOnly cookie)
        User->>App: POST /api/auth/login/mfa { otp }
        App->>API: POST /api/auth/login/mfa { challengeToken, otp }
    end
    API-->>App: { user, accessToken, refreshToken }
    App-->>User: { user }, tokens as httpOnly cookies; the page goes to ?next= or /
    Note over User,App: later, the access cookie has expired
    User->>App: any page
    App->>API: POST /api/auth/refresh (in proxy.ts)
    API-->>App: new token pair (the old refresh token is now dead)
    App-->>User: page, plus both new cookies
```

- **Tokens never reach browser JavaScript.** They live in `httpOnly`, `SameSite=Lax` cookies (`Secure` in production): `ims_access` expires 30 seconds before its token, `ims_refresh` with its token, and `ims_mfa` holds the code-step challenge.
- **`proxy.ts`** sends visitors without a session to `/login?next=<path>` (only `/login`, `/forgot-password` and `/set-password` are public). When the access cookie has expired, it refreshes before the page renders and passes the new token to that same render. It only checks cookies; the API still authorizes every call.
- **Refresh tokens rotate on every use**, so parallel requests (a page plus its prefetches) must not each refresh. Requests carrying the same refresh token share one call, and its result is kept for a minute. This works within one Node process; with several app instances, route each session to one instance.
- **The shell loads the user** from `GET /api/auth/me` behind a `Suspense` boundary, so the rest of the page is still prerendered. A 401 (the API rejected a token still in its cookie) sends the user to `/login?next=<path>`, like the proxy; `proxy.ts` passes the path in an `x-ims-path` request header, since Server Components cannot read the URL. Any other error shows in the account drawer, which still offers sign-out: a 4xx with the API's own message (such as rate limiting), otherwise a prompt to reload.
- **Auth endpoints** (`app/api`, built with `lib/route-handler.ts`) mirror the nest-ims routes one to one: same path, JSON body, status codes and error shape `{ statusCode, error, message, errors? }`, translated for the request's language. They exist only to keep tokens in httpOnly cookies: login and the MFA step answer `{ user }` and set `ims_access` and `ims_refresh`; the MFA challenge token stays in `ims_mfa`; no token is ever in a body. The rest pass the call through with the session: `POST /api/auth/login/mfa { otp }`, `/api/auth/logout`, `/api/auth/forgot-password`, `/api/auth/email-otp/send`, `/api/auth/email-otp/verify`, `PATCH /api/auth/me`, `PUT /api/auth/me/mfa` and `POST /api/invitations/accept`. `PUT /api/auth/me/password` is the other exception: nest-ims answers a new token pair (and ends every other session), which the handler stores like a refresh and drops from the body. Client Components call them through `callApi` (`lib/client-api.ts`) and `useFormSubmit` (`lib/use-form-submit.ts`). Server Actions would add the same-origin check on their own, so these handlers do it themselves: a request whose `Origin` is not this host gets 403, and a body that is not JSON 415. `proxy.ts` refreshes an expired session for them too, but never redirects `/api/*`: without a session they answer 401 JSON. Forms need JavaScript.
- **Sign-out** calls `POST /api/auth/logout` (revokes the refresh token) and deletes the cookies.
- **Email verification.** The API answers 403 to almost every call while `emailVerifiedAt` is null (after an admin changed the email, for instance). So sign-in sends such a user to `/verify-email?next=<path>` instead of `next`, and the shell's user loader (`getCurrentUser` in `lib/auth.ts`) does the same on any page. There the user asks for a code (`POST /api/auth/email-otp/send`, never on page load) and enters it (`/email-otp/verify`), then continues to `next`. A 429 on send is the resend cooldown, so the form moves to the code step anyway. `/verify-email` itself uses `getSignedInUser`, which skips that redirect.
- **Set password** (`/set-password?token=`) serves both the invitation and the password reset link: `POST /api/invitations/accept { token, password }`. The password rules show as a checklist while typing (a guide; the API decides, and also refuses the user's own name). The page sets `referrer: no-referrer` so the token is not sent to other hosts, such as a logo on Azure Blob. The API then signs out every session of that account, so this browser's cookies are cleared too, and the page links to sign-in.
- **Forgot password** (`/forgot-password`, linked from sign-in): `POST /api/auth/forgot-password { email }`. The API gives the same answer whether or not the account exists, and emails a 60-minute link to `/set-password` (or the invitation again, to a user who never set a password).
- **The profile** (`/profile`) is self-service: name `PATCH /api/auth/me`, password `PUT /api/auth/me/password { currentPassword, password }`, photo `PUT`/`DELETE /api/users/:id/avatar` with your own id, and MFA on/off `PUT /api/auth/me/mfa { enabled, password }`. Email, role and site stay with the admins.
- **Errors** from the API are shown as sent (already translated): the first error of each field under its input, others above the form (`formError` in `lib/api-result.ts`). A refresh the API rejects deletes the cookie and goes to sign-in; if the API cannot be reached, the cookie is kept for the next try.

### Screens and how they call the API

Every module screen works the same way. Pages load data on the server through one file per module in `lib/` (`users.ts`, `sites.ts`, `catalog.ts`, `items.ts`, `audit.ts`), each built on `userFetch` in `lib/auth.ts` (the session's token, and sign-in on a 401). Lists read their filters and page from the URL (`lib/query.ts` drops values the API would refuse with a 400) and set them with a GET form (`components/filter-form.tsx`), so filters survive a reload and can be shared. Forms send JSON through `useApiForm` (`lib/use-api-form.ts`), which puts `errors[]` next to the fields, sends a lost session to sign-in and reloads the page's data with `router.refresh()` on success. Each write has a Route Handler under `app/api` with the nest-ims path and method, built with `passThrough("/<module>/:id")`; the `:id` comes from the route's `[id]` segment and must be digits (404 otherwise), so a crafted segment cannot reach another API route.

Each screen has its loading, empty and error states (`components/states.tsx`). **Loading** works like most CRMs: the first load shows a skeleton shaped like the screen (filter bar and table rows, or a detail page), with a shimmer built from the theme tokens (the `skeleton` utility in `app/globals.css`). Changing a filter or page keeps the current rows on screen, dimmed, under a thin progress bar in the primary colour, and the Filter button shows a spinner (`components/list-transition.tsx`: the filter form and pagination navigate inside one React transition, so the list does not jump back to its skeleton). Both stop moving for users who ask for reduced motion, and screen readers hear "Loading…" instead of the shapes. A 403 shows "Not available to your role" with the API's message rather than an error, a 404 on a detail page shows "not found" (the API also answers 404 for records outside your scope), and the API's 409s (a category with products, a site with users, a stocked product) show where the action was tried.

### User management

| Screen | Route | nest-ims calls |
| --- | --- | --- |
| Users | `/people` | `GET /users` with `search`, `status`, `roleId`, `siteId`, `page` from the URL; `GET /roles` and `GET /sites` fill the role and site filters |
| Invitations | `/people/invitations` | The same list with `status=invited`, when each link expires (72 hours, `INVITE_TTL_HOURS` in nest-ims) and a resend button |
| Add user | `/people/new` | `POST /users`; the API emails the invitation, then the page opens the new user |
| User | `/people/[id]` | `GET /users/:id`; details and site `PATCH /users/:id`, photo `PUT`/`DELETE /users/:id/avatar`, role `PUT /users/:id/role`, feature roles `PUT /users/:id/feature-roles` (with `GET /roles/features`), set a password `PATCH /users/:id { password }`, resend invitation `POST /users/:id/invitation`, deactivate and reactivate `POST /users/:id/deactivate` / `reactivate`, delete `DELETE /users/:id` (only a user who never set a password) |
| Roles | `/people/roles` | `GET /roles` (the roles you may give, each linking to its users) and `GET /roles/features`. The API does not describe what a role allows, so the page summarises `role-permissions.ts` from nest-ims; update both together |

- **The avatar handler** takes multipart (`passThrough(..., { form: true })`), checks the origin like the others and forwards the form; the API checks type and size, the form checks them first (PNG or JPEG, 500 KB).
- **What a screen offers follows the user's permissions** from `GET /auth/me` (`role.permissions` and the feature roles', `can()` in `lib/auth.ts`), only to hide what would fail: the API decides. The list holds only users the API lets you read (lower roles, plus yourself), so `canManage` in `lib/users.ts` treats everyone in it but yourself as editable, unless you manage everything. On your own page you only change your photo (and, as super admin, your details): your role, password and account are left out so nobody locks themselves out.
- **Site in-charges may not list sites**, so their forms offer the user's current site and their own (`siteOptions`); `GET /sites` is read with `limit=100`, the API's maximum.
- **Deactivate and delete ask first** (`components/confirm-dialog.tsx`, a native modal `<dialog>`); the API's 409s (in-charge of a site, already set a password) show in the dialog.
- **Avatars** show the photo when `avatarUrl` is set (`components/avatar.tsx`, `next/image` unoptimized like the logo), initials otherwise, in the lists, on the user page and in the account menu.

### Inventory, sites and the audit log

| Screen | Route | nest-ims calls |
| --- | --- | --- |
| Dashboard | `/` | One `limit=1` list call per tile for its total (items, active products, sites, active users, pending invitations; only those the role may read), and `GET /items/stock` for stock by product, site and status |
| Items | `/inventory` | `GET /items` with `search` (code or serial), `productId`, `categoryId`, `siteId`, `status`; products, categories and sites fill the filters |
| Add stock | `/inventory/new` | Several units: `POST /items/bulk { productId, quantity }` (next automatic codes, at most 10 000). One unit: `POST /items` with an optional code suffix, serial number, condition and calibration date. `?productId=` preselects the product |
| Item | `/inventory/[id]` | `GET /items/:id` and `GET /items/:id/movements` (history, paged with `?page=`); edit `PATCH /items/:id` (serial, condition, calibration date, note; a condition change adds a history entry); delete `DELETE /items/:id`, offered only while it is available at headquarters |
| Products | `/inventory/products` | `GET /products` with `search`, `categoryId`, `type`, `measureType`, `isActive`; `GET /products/options` fills the type filters |
| Add product, Product | `/inventory/products/new`, `/inventory/products/[id]` | `POST`/`PATCH`/`DELETE /products/:id`, `GET /products/options`, active categories; the product page shows its stock per site (`GET /items/stock?productId=`) with links to its items and to add stock |
| Categories | `/inventory/categories`, `/new`, `/[id]` | `GET /categories` with `search`, `isActive`; `POST`/`PATCH`/`DELETE /categories/:id` |
| Sites | `/sites`, `/sites/new`, `/sites/[id]` | `GET /sites` (paged); `POST`/`PATCH`/`DELETE /sites/:id`; the in-charge picker lists active site in-charges from `GET /users?roleId=&status=active` |
| Audit log | `/audit` | `GET /audit-logs` with `entityType`, `entityId`, `actorId`, `action`; each entry opens its before and after values, and links to the record and to all its changes |

- **The product form follows nest-ims's field rules** (`product-rules.ts`): only consumables may be counted in packs, a pack needs a size and unit, a calibrated product needs an interval. Fields that do not apply are hidden and sent as `null`, which a PATCH needs when a product stops being bulk or calibrated. While the product has stock, its prefix, type and pack are locked in the API (409), so the form disables them.
- **Item forms follow the product type**: condition only for non-consumables, calibration date only for calibrated products (a PATCH cannot set either to `null`). Stock is always added at headquarters.
- **The site in-charge picker** needs `GET /roles` (create User) to find the `site_incharge` role id; without it the field is left out and the API keeps the current in-charge. The API checks that the user is an active in-charge within your scope.
- **Labels** for product types, units, item statuses and history entries are in `lib/catalog-labels.ts`; a value nest-ims adds later still shows, humanised.
- **Detail pages link to their history** in the audit log (`/audit?entityType=&entityId=`) for roles that may read it.

## 3. Theme and layout

Site staff use the app on phones (including scanning barcodes with the camera), so screens are built for phones first and widened for tablets and desktops.

- **Palette**: slate neutrals with an indigo primary. Status colours (success, warning, danger, info) are kept apart from the primary, so a stock state never looks like a button. All text pairs meet WCAG AA (4.5:1), and input borders meet 3:1, in both modes.
- **Tokens** live in `app/globals.css` and become Tailwind colours: `background`, `surface`, `surface-muted`, `foreground`, `muted`, `border`, `input`, `primary`, `primary-foreground`, `ring`, `success`, `warning`, `danger`, `danger-foreground`, `info`. Use `bg-surface`, `text-muted`, `bg-success/10` and so on rather than raw palette colours, so a screen works in both modes without `dark:` classes.
- **Light, dark and system**: the header toggle (`components/theme-toggle.tsx`) stores an explicit choice in `localStorage` (`ims-theme`; nothing stored means follow the OS). An inline script in the root layout applies it as `data-theme` on `<html>` before the first paint, so there is no flash and the page stays statically rendered. The `dark:` variant follows the same rule. The theme is not secret, so `localStorage` is fine here (auth tokens never go there).
- **Responsive rules**: unprefixed classes are the phone layout; tap targets are at least 44px; inputs are at least 16px so iOS does not zoom on focus; wide tables become cards below `md`; the mobile browser bar takes the background colour (`viewport.themeColor` follows the OS; the theme toggle overrides it when the user picks Light or Dark).
- **Shared pieces**: `components/status-badge.tsx` (stock and record states, `ActiveBadge`), `components/avatar.tsx` (the photo, or initials when the API sends `avatarUrl: null`) and `avatar-form.tsx`, `components/drawer.tsx` (side panel), `components/confirm-dialog.tsx` (asks before a destructive call) and `delete-button.tsx`, `components/data-list.tsx` (cards on phones, a table from `md`), `list-transition.tsx` (the wait while a list reloads), `components/page-header.tsx`, `section.tsx` (titled panel and `DetailList`), `pagination.tsx`, `filter-form.tsx`, `states.tsx` (empty, not found, no access, skeletons), `back-link.tsx`, `components/logo.tsx` (company logo), icons from `lucide-react`.

### App shell

Every signed-in screen sits in the `app/(app)` route group, whose layout draws the shell; the sign-in page lives outside it. The modules and their section tabs are one list in `lib/navigation.ts`; add a module there and both the sidebar and the top bar pick it up.

| Module | Route | Section tabs |
| --- | --- | --- |
| Dashboard | `/` | none |
| Inventory | `/inventory` | Items (also `/inventory/new`, `/inventory/[id]`), Products (`/inventory/products`), Categories (`/inventory/categories`) |
| Sites | `/sites` | none (also `/sites/new`, `/sites/[id]`) |
| People | `/people` | Users (also `/people/new`, `/people/[id]`), Invitations (`/people/invitations`), Roles (`/people/roles`) |
| Audit log | `/audit` | none |

The account pages are outside the group, in route group `app/(auth)`, with only the logo, the form and the theme toggle: `/login`, `/forgot-password`, `/set-password` and `/verify-email` (`components/auth-card.tsx`). Their form parts are shared in `components/form.tsx` (input and button classes, `TextField`, `SelectField`, `TextAreaField` and `CheckboxField` with label, hint and error, messages, the 6-digit code input), `components/password-input.tsx` (show/hide toggle) and `components/password-rules.tsx` (the password checklist).

`/profile` and `/settings` hang off the account panel.

- **Large screens (`lg`, 1024px and up)**: a fixed left sidebar lists the modules. The top bar shows the current module's name and section tabs on the left, and the theme toggle and avatar on the right.
- **Phones and tablets**: the top bar holds a menu button (left drawer with the modules), the module name, and the avatar (right drawer with the user's details, profile, settings, theme and sign out). The section tabs move to a strip under the top bar that scrolls sideways when they do not fit.
- **The avatar opens the same account drawer at every size**, so user actions live in one place.
- **Drawers are native modal `<dialog>`s**: focus stays inside, Esc closes them and focus returns to the button that opened them. Tapping the backdrop or a link closes them too, and the page behind does not scroll.
- **The active module and tab are found from the URL** (longest matching path, so `/inventory/products` selects Products, not Items). These parts call `usePathname`, so the layout wraps them in `Suspense`: under Cache Components, a page with an unknown dynamic segment (such as `/inventory/[id]`) would otherwise fail to prerender.
- **Modules and tabs the role cannot use are hidden.** Each link in `lib/navigation.ts` may name the permission it needs (`requires`, as in nest-ims); `components/app-shell/user-nav.tsx` checks it against `GET /auth/me` on the server and passes the links to hide. A module whose tabs are all hidden disappears, and one with some hidden opens on its first visible tab (a site technician's Inventory opens on Products). Hiding only spares dead ends: the pages and the API still check.

## 4. Code quality and automation

- **Prettier + ESLint** (`eslint-config-next` core web vitals and TypeScript rules, `eslint-config-prettier` so they do not fight).
- **Claude Code hooks** (`.claude/settings.json`):
  - after every edit of a code or CSS file: format and lint inside the container, and hand errors back to Claude;
  - at the end of each prompt: list comments in changed files so needless ones get trimmed;
  - at the end of each prompt: ask for a README update when routes, config, Docker, CI, env or dependencies changed.
- **`pr-description` skill** (`.claude/skills/pr-description`): the single source for PR description rules and template (summary, business changes, screens, cross-repo check, release notes). Use it on request locally; the CI *PR description* job loads it too. CI uses the base branch's copy of `.claude/` and `CLAUDE.md`, so changes to them apply from the PR after they merge.
- **GitHub Actions** (`.github/workflows/claude-code-review.yml`), on every non-draft PR:
  1. *PR description*: rewrites a bot-owned block in the PR body (summary, business changes, screens, cross-repo check, release notes). Text outside the block is kept.
  2. *Claude review*: posts a review comment with a verdict; the check fails (as a warning, not a merge block) unless it is ✅.
  3. *Cross-repo check*, part of the review: clones nest-ims (public, so no token) and compares every API call the PR adds or changes with the API, both ways: routes, request fields and validation the API expects, response fields and status codes the UI reads, and guards. It reads that branch's code, never nest-ims pull requests, since one feature can span several backend PRs. Which nest-ims branch is set by a line the author writes in the PR description, outside the bot block:

     ```text
     cross-repo check: feature/login-mfa
     ```

     Without the line it checks `master` and reminds the author to add one; a branch that does not exist falls back to `master` with a note. It is its own section of the review comment, lists only mismatches (or one "No mismatches found" line), and never changes the verdict. Editing the description does not re-run the review; push a commit (or re-run the job) after adding the line.

  Both need the repository secret `CLAUDE_CODE_OAUTH_TOKEN`. Docs-only, `.github/`, `.claude/` and lockfile-only changes do not trigger them.

## 5. Production

Not set up yet: no production image, no image publishing and no deployment pipeline.
