# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Server Is

A thin Express/TypeScript API between the React Native client and a Postgres exercise catalogue on DigitalOcean. The catalogue is the licensed **ExerciseDB Pro** package (1,394 exercises plus GIFs), imported once and served from the database — there are no upstream API calls. There is no auth and no session, and **no user data is ever stored** — the database holds exercise data only. All product logic lives in the client.

## Commands

**Local development:**
```bash
npm run dev       # ts-node-dev with hot reload
```

**Production:**
```bash
npm run build     # tsc → dist/
npm start         # node dist/index.js
```

**Import the Pro package** (one-off per database; safe to re-run, upserts by id):
```bash
npx tsc && node --env-file=.env dist/scripts/importPro.js <exerciseData_pro.json> <gif dir, e.g. .../pro/360>
```
Takes ~13 minutes from a laptop (one round trip per row). `npm run import:pro -- <json> <dir>` does the same, but see the stray-Node gotcha below.

No linter, no tests. TypeScript strict mode is the only quality gate.

## Environment

| Variable | Required | Purpose |
|----------|----------|---------|
| `DATABASE_URL` | Yes | Postgres connection string. `sslmode` in it is ignored — SSL is configured from `DATABASE_CA_CERT` |
| `DATABASE_CA_CERT` | Yes | DigitalOcean CA certificate (PEM). On App Platform, bind `${<db-component>.CA_CERT}` |
| `PORT` | No (default `3000`) | Listening port |

Both database variables are validated on the first query, not at startup — a misconfigured deploy will appear healthy (`/health` does not touch the database) until the first real request fails.

Locally, `server/.env` holds both (git-ignored). `node --env-file` needs Node ≥ 20.12 to read the multi-line certificate.

## Database

DigitalOcean managed Postgres cluster `app-4a3a3b15-…` (ID `96f5d06b-39cb-4566-8e04-6ea842b609c7`) holds two databases:

| Database | User | Used by |
|----------|------|---------|
| `trainer_dev_db` | `trainer_dev_db_admin` | Local development |
| `trainer-prod-db` | `trainer_prod_db_admin` | The deployed server |

Both users are normal (non-admin) roles that were granted `CREATE ON SCHEMA public` by `doadmin` — Postgres 15+ only lets the database owner create tables in `public` otherwise. Trusted sources limit who can connect; add your IP with `doctl databases firewalls append <cluster-id> --rule ip_addr:<ip>` (use `append`, never `replace` — that drops the app's own rule).

Schema: `src/db/schema.sql`, applied by the import script.
- `exercises` — `id`, `source` (`exercisedb_pro` or `4u` for our own additions), the filterable columns (`body_part`, `target`, `equipment`, `difficulty`, `category`, `required_equipment`), and `data jsonb` holding the full record exactly as delivered.
- `exercise_images` — one 360px GIF per exercise as `bytea`.

## Architecture

### Structure
- `src/index.ts` — Express app setup, `/health` endpoint, mounts `/exercises` router
- `src/routes/exercises.ts` — all route handlers
- `src/lib/db.ts` — shared `pg` pool
- `src/lib/exerciseStore.ts` — every query the routes use
- `src/scripts/importPro.ts` — Pro package import

### Routes

All routes are prefixed `/exercises`. Errors return `{ error }` with 400/404/429/500.

**Rate limit** — `/exercises/*` allows 100 requests per 15 minutes per client (`src/index.ts`), so the predictable ids can't be walked to scrape the catalogue (licence §13). Clients are keyed by App Platform's `do-connecting-ip` header, since `req.ip` is the load balancer; locally it falls back to `req.ip`. Counters are in memory per instance and reset on restart, so with N instances the effective limit is N × 100. The limiter is mounted on `/exercises` only — a new route prefix does not inherit it. `/health` is not limited.

| Route | Notes |
|-------|-------|
| `GET /exercises/bodyPartList` | Distinct body parts from the data |
| `GET /exercises/targetList` | Distinct targets from the data (Pro vocabulary — e.g. `quadriceps`, not `quads`). **Not yet wired into the client UI** |
| `GET /exercises/bodyPart/:bodyPart` | **A random 11** exercises (one to show + 10 "similar"), list fields only — see Licence |
| `GET /exercises/exercise/:id` | Full Pro record (taxonomy, equipment lists, relationships) with `gifUrl` as a base64 data URL |
| `GET /exercises/image?exerciseId=` | Binary GIF. `resolution` is accepted for compatibility and ignored — only 360 is stored |
| `GET /health` | |

List items carry exactly the fields the old RapidAPI list returned (`bodyPart, equipment, id, name, target, secondaryMuscles, instructions, description, difficulty, category`), so app builds released before the Pro switch keep working.

### Licence (ExerciseDB EULA 2026.2)

These terms shape the API — check them before changing a route:
- **§12** — the raw JSON and GIFs must never be published. This repo is **public**: the package stays outside it (`.gitignore` also blocks `exerciseData_pro*.json` and `server/data/`).
- **§13** — no endpoint may allow bulk download. That is why `/bodyPart` returns a random sample rather than the full list, why Pro fields are only served per exercise, and why `/exercises/*` is rate limited.
- **§29–30** — safety disclaimers in the app are our responsibility.

### Non-Obvious Details

**Image handling** — images are read from Postgres as a `Buffer` and sent with their stored `Content-Type`.

**No in-memory caches** — the RapidAPI-era caches were removed. The instance has 0.5 GB of RAM, and caching base64 GIFs for every exercise would exhaust it; database reads take tens of milliseconds.

**Stray Node gotcha (local only)** — on the original dev machine a `node` package sits in `~/src/personal/node_modules`, and `npm run` puts it (v21.2) first on the PATH. It cannot read the multi-line certificate from `.env`, so `npm run import:pro` fails with "Missing DATABASE_CA_CERT". Run the script with `node` directly, or remove that package.

## What Not To Do

- Do not store user data in the database or add a session layer — the privacy model is explicit: no user data touches the server.
- Do not add authentication middleware — the server is intended as a trusted internal proxy for the mobile client only.
- Do not return whole body parts, the full catalogue, or Pro fields in list responses (licence §13).
- Do not commit the Pro package, GIFs, `.env` or the CA certificate.
