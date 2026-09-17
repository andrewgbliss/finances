@AGENTS.md

# Claude Memory & Commands Guide

## Environment & Preferences

- **Runtime:** Node.js v20+, pnpm.
- **Code Style:** TypeScript, explicit types, named exports, 2-space indentation.
- **Pattern:** Keep finance mutations in the localStorage store/hook. Keep page components thin.

## Verbatim Commands

Use these exact strings when executing terminal tasks:

- **Development:** `npm dev`
- **Linting & Fixing:** `npm lint:fix`
- **Type Checking:** `npm tsc --noEmit`
- **Testing:** `npm test:e2e` / `pnpm test:unit`

## UI & Design Guidelines

- When generating new e-commerce blocks (e.g., product cards, cart drawers), always use existing components from `@/components/ui/` (shadcn) where applicable.
- Ensure all images utilize the Next.js `<Image>` component with explicit `width`, `height`, and `alt` properties for SEO and Core Web Vitals.
