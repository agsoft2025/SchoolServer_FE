# Status Update — 2026-09-04

## Project
School Management Portal (React 19 + Vite + MUI + Tailwind + React Query)

## Recent Work (last 5 commits)

- **SMS Center** (`7eddd95`) — new end-to-end feature for sending SMS to students:
  - `src/pages/SmsCenter.jsx` — tabbed UI (Individual / Bulk / Classwise / History)
  - `src/components/sms/` — `RecipientPicker`, `MessageComposer`, `SendConfirmModal`, `SmsHistoryTable`, `BatchDetailModal`
  - `src/service/smsService.js` + `src/hooks/useSmsQuery.js` — API layer and React Query hooks (preview, send, batch history/logs, retry-failed)
  - Wired into routing (`App.jsx`) and sidebar nav (`Sidebar.jsx`), admin-only
- **Location management simplified** (`798a529`) — `LocationDialog.jsx` was rewritten from a full create/edit/select form into a **read-only** "assigned location" view. Locations are now created/edited only by the Super Admin on the Global panel; local admins can view but not modify. Caller (`LayoutContainer.jsx`) updated to match the simplified props (`open`/`onClose` only).
- **Student inmate workflow fixes** (`798a529`) — related adjustments bundled in the same commit.
- Two small button-color fixes (`f13d94a`, `e2a8cad`).
- `vercel.json` added — SPA rewrite rule (`/(.*) → /index.html`) so client-side routes work on Vercel.

## Code Review Findings

- **New SMS + LocationDialog code is lint-clean** (`npx eslint` scoped to those files: 0 errors/warnings). Reasonably structured — service layer, React Query hooks, and presentational components are cleanly separated.
- **`.env` is committed to git** (tracked, not in `.gitignore`). Currently only contains a public API base URL and version string — no secrets today — but this is a footgun if a real key ever lands there. Recommend adding `.env` to `.gitignore` and using `.env.example` for onboarding.
- **Pre-existing lint debt** (unrelated to recent commits — not introduced by this work): 38 errors / 18 warnings across the wider codebase, notably:
  - `src/context/LocationContext.jsx` — several `setState` calls directly inside `useEffect` (React Compiler flags these as cascading-render risks); also a fast-refresh violation from exporting a non-component alongside the provider.
  - Unused variables in `AuditTrails.jsx`, `BulkOperation.jsx`, `CanteenPosSystem.jsx`, `Dashboard.jsx`, `FinanicalManagement.jsx`, `Reports.jsx`, `SchoolManagement.jsx`, `usePostCartQuery.js`.
  - `CanteenPosSystem.jsx` has an unsafe `return` inside a `finally` block (`no-unsafe-finally`), which can silently swallow errors/results — worth a closer look.
  - Several `react-hooks/exhaustive-deps` warnings (missing deps in `useEffect`/`useMemo`) across `Login.jsx`, `TransactionHistory.jsx`, `SchoolManagement.jsx`, `CanteenPosSystem.jsx`.
  - None of this blocks the current work, but it's accumulating — worth a cleanup pass.

## Suggested Next Steps

1. Untrack `.env` from git and add it to `.gitignore`; commit a `.env.example` instead.
2. Fix the `no-unsafe-finally` return in `CanteenPosSystem.jsx` (possible correctness bug).
3. Schedule a lint-debt cleanup pass for the pre-existing errors/warnings above.
