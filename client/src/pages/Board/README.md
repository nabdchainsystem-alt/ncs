# Collaboration Board

This Lab page mounts the new collaboration board experience used for cross-functional planning.

## Getting started
- `pnpm install` — ensure dependencies (Playwright + board UI) are present.
- `pnpm dev` — run the app locally; navigate to **Lab** from the sidebar to open the board.
- `pnpm test` — run unit tests (includes `useBoard` coverage).
- `pnpm test:e2e` — execute the Playwright smoke that verifies drag/link/export flows.

### Feature flag

- Set `VITE_ENABLE_BOARD=true` in your `.env.local` to render the board (see `.env.example`).
- When `false`, the Lab page will show a placeholder explaining how to enable the board.

## Board data
- Seed lives in `src/components/board/BoardSeed.ts` (`BOARD_SEED`).
- State persists to `localStorage` under the key `ncs_board_v1`.
- Export/import uses JSON snapshots compatible with the same shape.
- Reset via the toolbar button or clear the storage key manually.

## Extension points
- Saving currently writes to `localStorage`; replace the TODO in `useBoard.ts` (`actions.save`) with `/api/boards/:id` when backend is ready.
- Realtime collaboration/websocket sync stubs marked as TODOs in `BoardCanvas.tsx`.
- Inspector form is designed for server wiring (submit via API, debounce updates, broadcast to peers).

## Notes
- No heavy graph library added — pan/zoom uses existing `react-zoom-pan-pinch`.
- Added `@playwright/test` for the smoke scenario (`playwright.config.ts`).
- Keyboard shortcuts & help modal list supported interactions for accessibility QA.
