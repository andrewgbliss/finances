# Project: Personal Finances

## Architecture & Tech Stack

- **Framework:** Next.js (App Router, React Server Components preferred).
- **Storage:** Postgres, Drizzle, localStorage, For localhost use docker and docker-compose.
- **Styling:** Tailwind CSS, shadcn/ui.
- **State:** Client-side finance store. Persist on change.

## Next.js Context & AI Documentation

- DO NOT fetch external Next.js documentation.
- **Crucial:** Always reference local, version-matched documentation located at: `node_modules/next/dist/docs/` before implementing core framework features.

## Environment & Preferences

- **Runtime:** Node.js v20+, pnpm.
- **Code Style:** TypeScript, explicit types, named exports, 2-space indentation.
- **Pattern:** Don't have finance mutations. Have it read only pulling from a google sheet. Keep page components thin.

## Verbatim Commands

Use these exact strings when executing terminal tasks:

- **Development:** `npm dev`
- **Linting & Fixing:** `npm lint:fix`
- **Type Checking:** `npm tsc --noEmit`
- **Testing:** `npm test:e2e` / `pnpm test:unit`

## UI & Design Guidelines

- When generating new e-commerce blocks (e.g., product cards, cart drawers), always use existing components from `@/components/ui/` (shadcn) where applicable.
- Ensure all images utilize the Next.js `<Image>` component with explicit `width`, `height`, and `alt` properties for SEO and Core Web Vitals.


<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
