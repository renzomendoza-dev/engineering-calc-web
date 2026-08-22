# Engineering Calculators

A Next.js frontend for a suite of electrical, mechanical, and acoustics engineering
calculators, backed by a separate Spring Boot API
([`engineering-calc`](https://github.com/renzomendoza-dev/engineering-calc)).

## Tech Stack

- [Next.js](https://nextjs.org) (App Router) + TypeScript
- [Tailwind CSS](https://tailwindcss.com)
- [React Hook Form](https://react-hook-form.com) + [Zod](https://zod.dev) for form state and validation
- [KaTeX](https://katex.org) for rendering formula references

## Prerequisites

- Node.js 24+
- The [`engineering-calc`](https://github.com/renzomendoza-dev/engineering-calc) API running
  and reachable — this app has no calculation logic of its own; every calculator submits to
  that backend.

## Getting Started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env.local` and point it at your running API:

   ```bash
   cp .env.example .env.local
   ```

3. Run the dev server:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

| Variable                     | Required | Description                                                                                                                                                       |
| ----------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_API_BASE_URL`   | Yes      | Base URL of the `engineering-calc` API (e.g. `http://localhost:8080`). Prefixed `NEXT_PUBLIC_`, so it's inlined into the browser bundle at **build time** — see [Docker](#docker) below. |

## Scripts

| Script          | Description                        |
| ---------------- | ----------------------------------- |
| `npm run dev`   | Start the dev server (Turbopack)    |
| `npm run build` | Production build                    |
| `npm run start` | Serve a production build            |
| `npm run lint`  | Run ESLint                          |

## Calculators

**Electrical** — Voltage Drop, Wire Sizing, Conduit Fill, Locked Rotor Current, Motor FLC

**Mechanical** — Pipe Velocity/Sizing, Pipe Pressure Loss, Duct Sizing, Expansion Tank Sizing,
Pressure Tank Sizing, Fire Pump Sizing, Pump TDH, Pump Power, Smoke Production (Plume),
t-Squared Fire Growth Smoke Production, Natural Smoke Vent Area, Domestic Water Storage, Fire
Water Storage

**Acoustics** — Distance Attenuation, Fire Alarm Audibility

The authoritative list lives in [`src/lib/calculators.ts`](src/lib/calculators.ts).

## Project Structure

```
src/
├── app/            # Routes (App Router) — thin pages that render a feature's Calculator
├── features/        # One folder per calculator: form, results, formula, schema, types
├── components/ui/   # Shared primitives (NumberField, SelectField, ResultCard, FormulaBlock, ...)
├── hooks/           # Shared hooks (reference-data fetching, form error handling)
└── lib/             # API client, calculators registry, shared validation/formatting helpers
```

## Docker

```bash
docker build --build-arg NEXT_PUBLIC_API_BASE_URL=https://your-api-host -t engineering-calc-web .
docker run -p 3000:3000 engineering-calc-web
```

`NEXT_PUBLIC_API_BASE_URL` must be passed as a `--build-arg`, not a `docker run -e` — it's
compiled into the client-side JS bundle during `next build`, so setting it only at container
start has no effect. If you're running this alongside the API with Docker Compose, set it
under this service's `build.args`, not `environment`, for the same reason.
