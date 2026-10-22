---
name: pr-description
description: Write a plain-language pull request description and release notes for this repo. Use when the user asks for a PR description, PR body, or release notes, or when opening or updating a PR.
---

# PR description

Write for a reviewer or product owner, not a developer. The diff already shows the code, so describe what changes for users, on which screens and on which devices, not how it is built. No file names, component names or library names unless a deploy step needs one.

## Steps

1. Find the change set: `git log master..HEAD --oneline` and `git diff master...HEAD --stat`. Read the route files (`app/**/page.tsx`, `layout.tsx`, `route.ts`), `proxy.ts`, `.env.example`, `next.config.ts`, `docker-compose.yml` and `package.json` to catch new screens, config, and every nest-ims endpoint the app now calls.
2. Write the title as a conventional commit that names the outcome, for example `feat: login, email verification screen and responsive user list`.
3. Fill the template below. Delete a section only if it is truly empty, and say "None" for Backend dependency, Breaking changes and Before release so the reader knows it was checked.

## Template

```markdown
## Summary

One or two sentences: what this PR delivers and why.

## What changes for users

- Behaviour changes in plain words (who can do what, what they now see, what is now blocked).
- One bullet per feature or rule change. Say when something differs on phones.

## Screens

| Route | Change | What users see (UI/UX) | Logic changed |
| --- | --- | --- | --- |
| /users | New | Admins list and search users; cards on phones, a table from tablets up | Admin only; search and paging run on the API |

One short phrase per cell, 2 to 3 lines per row at most: name the main change and leave the details to the code review. "No change" in a cell that does not apply; "None" if no screen changed.

## Backend dependency

- Each nest-ims endpoint this PR starts calling, or calls differently (method and path, plus any field it now relies on), and whether the backend already has it in production.
- "None" if the app calls the API exactly as before.

## Breaking changes

- URLs that moved or disappeared (bookmarks, links in emails such as the invitation link the backend builds from its `APP_URL`), or behaviour users must adapt to. "None" if there are none.

## Release notes

Short, user-facing bullets, as they would appear in a changelog.

## Before release (deploy checklist)

Ordered steps someone must do for this to work, for example:

- [ ] New or changed environment variables, with the value to set. `NEXT_PUBLIC_*` values are baked in at build time, so they must be set before the build.
- [ ] Backend first: the nest-ims version with the endpoints above deployed, and its `CORS_ORIGINS` / `APP_URL` pointing at this app.
- [ ] New third-party services or keys to provision.
- [ ] Anything to rebuild or restart.
      "Nothing extra" if the PR merges and works on its own.

## How to verify

2 to 4 steps a reviewer can follow to see it working, including one on a phone-width screen when layout changed.
```

## Rules

- Lead with user impact. Mention a technical detail only when someone must act on it (a variable, a backend release, a rebuild).
- Be specific about numbers that matter to users (limits, timeouts, page sizes).
- Never invent a step. If unsure whether something is needed before release, check `.env.example`, `next.config.ts` and `CLAUDE.md`.
- Link issues with `Fixes #N` when they exist.
- If the PR mixes unrelated features, say so in the Summary and list them separately.
- To update an open PR: `gh pr edit <n> --title "..." --body-file <file>`.

## Output format

Never create an artifact, file or web page for the result. Print it in the chat as two separate code fences so the user can copy each with the block's copy button:

1. The title in a plain ``` fence.
2. The description in a ````markdown fence (four backticks), because the description contains its own code spans. Start with `## Summary` and put nothing else inside the fence.

Keep any remarks outside the fences, after them, in one or two lines (for example, items you could not verify). Do not add headings or commentary inside the fences.
