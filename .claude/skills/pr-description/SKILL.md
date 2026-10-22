---
name: pr-description
description: Write a plain-language pull request description and release notes for this repo. Use when the user asks for a PR description, PR body, or release notes, or when opening or updating a PR. The "PR description" job in CI loads it too.
---

# PR description

Write the release-facing part of a pull request description, for a product owner and for whoever releases it. Reviewers read the code; do not explain how it works.

Two places use this skill: a local session on request, and the "PR description" job in `.github/workflows/claude-code-review.yml`, which follows the steps, rules and template here and writes the result into a bot-owned block of the PR body. Keep the template's headings stable: the review job checks Screens, Backend dependency and Release notes against the diff.

## Gather

The base is `origin/<BASE BRANCH>` from the job's prompt in CI, and `origin/master` locally (run `git fetch origin` first, so it matches what the PR is compared with).

1. Read CLAUDE.md (env files, how the app talks to the API, services).
2. List the changes: `git log <base>..HEAD --oneline` and `git diff <base>...HEAD --name-only`, then read what you need with `git diff <base>...HEAD -- <path>`. Skip `package-lock.json`. Always read the route files (`app/**/page.tsx`, `layout.tsx`, `route.ts`), `proxy.ts`, `.env.example`, `next.config.ts`, `docker-compose.yml` and `package.json` when they changed.

## Rules for what to declare (check every one against the diff)

- Screens: every route added, changed or removed under `app/` (`page.tsx`, `layout.tsx`, `route.ts`, and redirects in `proxy.ts` or `next.config.ts`). One table row per route, with its URL path (route groups in parentheses are not part of the URL; `[id]` is a parameter); routes with the same change share one row. "Change" is New, Changed or Removed.
  - "What users see (UI/UX)": who reaches it and what looks or behaves differently for them (layout, flow, feedback such as loading, empty and error states, phone vs desktop when the PR makes them differ).
  - "Logic changed": what the screen now does differently behind the UI (rules, validation, data it loads or sends, redirects, permissions), in plain words.
  - Keep it a pointer, not a walkthrough: each cell is one short phrase and a row reads in 2 to 3 lines at most. Name only the main change; the reviewer reads the code for the details. Write "No change" in a cell that does not apply.
- Backend dependency: every nest-ims endpoint this PR starts calling, stops calling, or calls with a different method, body, query or expected response field. Name the method and path (e.g. `POST /api/auth/email-otp/send`).

## Release notes: only what THIS PR needs beyond the standard deploy

Every deploy already installs dependencies, builds the app and starts it. Never list those, or generic checks such as "open the app" or "try the new feature". List a step only when this PR causes it:

- Configuration: a variable added or changed in `.env.example`, `next.config.ts` or `docker-compose.yml`: name it and the value to set; say when it is optional. A `NEXT_PUBLIC_*` variable is inlined at build time, so say it must be set before the build (a restart is not enough).
- Backend first: when the Backend dependency above needs a nest-ims change, say the backend release must go out first. When the app's own URL or a new origin is involved, the backend's `CORS_ORIGINS` and `APP_URL` must match.
- Third parties: a new external service, account, key, script or provider (`package.json`, `next.config.ts`, `.env.example`): what must be created or activated, and where its credentials go.
- Moved URLs: a removed or renamed route that bookmarks, emails (the invitation link the backend builds from `APP_URL`) or other apps link to.

Never invent a step. If unsure, check the files above; leave it out if the diff does not show it.

## Template

No file, component, hook or library names except where a release step needs one (a variable, a command). No code. Short bullets. Write "None." for an empty section; never drop a section.

```markdown
## Summary

One or two sentences: what this PR delivers and why.

## Business changes

- **New:** / **Changed:** / **Removed:** what changed, for whom: features added, changed or removed and rules that changed (who may do what, limits, what users now see or are blocked from). Group small related changes into one bullet.

## Screens

| Route | Change | What users see (UI/UX) | Logic changed |
| --- | --- | --- | --- |
| /users | New | Admins list and search users; cards on phones, a table from tablets up | Admin only; search and paging run on the API |
| /login | Changed | "Verify your email" message with a resend link instead of a generic error | Unverified accounts are told apart from wrong passwords |

(These rows only show the format. Write "None." instead of the table when no route changed.)

## Backend dependency

- `METHOD /api/path`: what the screen uses it for; whether it is new for this app.

## Release notes

- [ ] **Before deploy** / **After deploy**: one PR-specific step per line, with the exact variable name or action.
```

In "Release notes", write "Nothing beyond the standard deploy." when this PR needs no extra step.

## Local output

In CI the job's prompt sets the output instead; skip this section there.

- Title: a conventional commit that names the outcome, for example `feat: login, email verification screen and responsive user list`.
- Link issues with `Fixes #N` when they exist. If the PR mixes unrelated features, say so in the Summary.
- Never create an artifact, file or web page for the result. Print it in the chat as two code fences so the user can copy each: the title in a plain ``` fence, then the description in a ````markdown fence (four backticks, because it contains its own code spans), starting with `## Summary`. Keep remarks (for example, items you could not verify) outside the fences, after them, in one or two lines.
- To update an open PR: `gh pr edit <n> --title "..." --body-file <file>`. On the next push CI adds its own block on top and keeps this text below it under "Author notes".
