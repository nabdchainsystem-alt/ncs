# Collaboration Board (Lab)

This client app includes a collaboration board experience on the **Lab** page used for planning, linking, and annotating cross-functional cards.

## Environment configuration

Copy `.env.example` to `.env.local` (or export the variable) and set:

```bash
VITE_ENABLE_BOARD=true
```

Set the value to `false` to temporarily hide the board and show the Lab placeholder.

## Useful scripts

- `pnpm dev` – start the Vite dev server
- `pnpm test` – run unit tests (includes `useBoard` hook coverage)
- `pnpm test:e2e` – run the Playwright smoke test for the board

For more implementation notes see `src/pages/Board/README.md`.
