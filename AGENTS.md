<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Project: Personal Finances

## Architecture & Tech Stack

- **Framework:** Next.js (App Router, React Server Components preferred).
- **Storage:** Browser `localStorage`. No database, no login, no server-side user data.
- **Styling:** Tailwind CSS, shadcn/ui.
- **State:** Client-side finance store. Persist on change.

## Next.js Context & AI Documentation

- DO NOT fetch external Next.js documentation.
- **Crucial:** Always reference local, version-matched documentation located at: `node_modules/next/dist/docs/` before implementing core framework features.

## Finance Rules & Integrity

- **Pricing:** Store amounts as integers (cents). Never do floating-point math for currencies.
- **Persistence:** Read and write finances through the localStorage store. Do not add a database or auth.
- **Privacy:** Keep data on the device. Do not send balances, cards, or ledger rows to a backend.
