# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Server Is

A thin Express/TypeScript API between the React Native client and a Postgres exercise catalogue on DigitalOcean. The catalogue is the licensed **ExerciseDB Pro** package (1,394 exercises plus GIFs), imported once and served from the database — there are no upstream API calls. There are no user accounts and no session, and **no user data is ever stored** — the database holds exercise data only. All product logic lives in the client.

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

**Apply the schema only** (seconds, no Pro package needed, safe against the live database):
```bash
npx tsc && node --env-file=.env dist/scripts/applySchema.js
```
For production, run `bash scripts/apply-prod-schema.sh` instead of pointing `.env` at it. It builds the connection from your `doctl` login as `trainer_prod_db_admin` (`ALTER TABLE` only works for the tables' owner; the `trainer-prod-db` user that comes with the app's database component can't even read them), shows the tables' owner and whether `public_id` exists, and asks before applying. The connection string goes in a temp file outside the repo, removed when the script exits.

The server never applies `src/db/schema.sql` itself; this script and the import do. Apply a schema change to both databases **before** deploying server code that depends on it. The import applies the schema *before* its own transaction: `ALTER TABLE` holds a lock that blocks reads until its transaction ends, so inside the ~13-minute import it would stall the live server.

No linter, no tests. TypeScript strict mode is the only quality gate.

## Environment

| Variable | Required | Purpose |
|----------|----------|---------|
| `DATABASE_URL` | Yes | Postgres connection string. `sslmode` in it is ignored — SSL is configured from `DATABASE_CA_CERT` |
| `DATABASE_CA_CERT` | Yes | DigitalOcean CA certificate (PEM). On App Platform, bind `${<db-component>.CA_CERT}` |
| `PORT` | No (default `3000`) | Listening port |
| `APP_CHECK_MODE` | No (default `monitor`) | `monitor` or `enforce` — see App Check below. Any other value stops the server at startup |
| `FIREBASE_PROJECT_ID` | Yes, once apps send tokens | Firebase project id the App Check tokens must be issued for. Not a secret; no service account is needed |

Both database variables are validated on the first query, not at startup — a misconfigured deploy will appear healthy (`/health` does not touch the database) until the first real request fails. `FIREBASE_PROJECT_ID` is likewise checked on the first request that carries a token.

Locally, `server/.env` holds both (git-ignored). `npm run dev` loads it with `dotenv` (`-r dotenv/config`), which works on any Node version. `node --env-file` needs Node ≥ 20.12 to read the multi-line certificate.

## Database

DigitalOcean managed Postgres cluster `app-4a3a3b15-…` (ID `96f5d06b-39cb-4566-8e04-6ea842b609c7`) holds two databases:

| Database | User | Used by |
|----------|------|---------|
| `trainer_dev_db` | `trainer_dev_db_admin` | Local development |
| `trainer-prod-db` | `trainer_prod_db_admin` | The deployed server |

Both users are normal (non-admin) roles that were granted `CREATE ON SCHEMA public` by `doadmin` — Postgres 15+ only lets the database owner create tables in `public` otherwise. Trusted sources limit who can connect; add your IP with `doctl databases firewalls append <cluster-id> --rule ip_addr:<ip>` (use `append`, never `replace` — that drops the app's own rule).

Schema: `src/db/schema.sql`, applied by the import script.
- `exercises` — `id` (the delivered id), `public_id`, `source` (`exercisedb_pro` or `4u` for our own additions), the filterable columns (`body_part`, `target`, `equipment`, `difficulty`, `category`, `required_equipment`), and `data jsonb` holding the full record exactly as delivered.
- `public_id` — a random UUID per exercise and **the only id the API exposes**. The delivered ids are sequential, so serving them would let a script walk the catalogue. It defaults to `gen_random_uuid()` and the import's upsert never touches it, so it survives re-imports. The delivered `id` stays the primary key and the join key for `exercise_images`.
- `exercise_images` — one 360px GIF per exercise as `bytea`.

## Architecture

### Structure
- `src/index.ts` — Express app setup, `/health` endpoint, mounts `/exercises` router
- `src/routes/exercises.ts` — all route handlers
- `src/lib/db.ts` — shared `pg` pool
- `src/lib/appCheck.ts` — Firebase App Check middleware
- `src/lib/exerciseStore.ts` — every query the routes use
- `src/scripts/importPro.ts` — Pro package import
- `src/scripts/applySchema.ts` — applies `schema.sql` alone

### Routes

All routes are prefixed `/exercises`. Errors return `{ error }` with 400/401/404/429/500.

**Ids** — every id in a response, and every id a route accepts, is a `public_id`. `/exercise/:id` and `/image` answer 404 to anything that isn't a UUID, including delivered ids.

**Rate limit** — `/exercises/*` allows 100 requests per 15 minutes per client (`src/index.ts`), so the catalogue can't be scraped quickly (licence §13). Public ids can't be counted through, but they can still be collected from `/bodyPart` samples and from the relation lists in `/exercise/:id`, so the limit is still what slows a scrape down. Clients are keyed by App Platform's `do-connecting-ip` header, since `req.ip` is the load balancer; locally it falls back to `req.ip`. Counters are in memory per instance and reset on restart, so with N instances the effective limit is N × 100. The limiter is mounted on `/exercises` only — a new route prefix does not inherit it. `/health` is not limited.

**App Check** — the API URL is public (it's in `eas.json` and the app bundle), so `/exercises/*` also checks that requests come from a genuine install of the app, using Firebase App Check (`src/lib/appCheck.ts`, mounted after the limiter). The app sends a token in `X-Firebase-AppCheck`, obtained via Play Integrity (Android) or App Attest with DeviceCheck fallback (iOS). The server checks it with `firebase-admin`'s `verifyToken`, a local JWT check against Firebase's public keys (no replay protection, so a token can be reused until it expires, about an hour). This attests the *app*, not a user: there are still no accounts or sessions.
- `APP_CHECK_MODE=monitor` (default) lets requests with a missing or invalid token through. Each invalid token is logged with the reason (never the token), and every 15 minutes one line, `[appCheck] monitor, last 15 min: valid=… missing=… invalid=…`, shows how much traffic comes from builds without App Check.
- `APP_CHECK_MODE=enforce` answers 401 `{ error }` for a missing or invalid token, and 500 if `FIREBASE_PROJECT_ID` is unset.
- App builds released before App Check send no token. Switch to `enforce` only once `missing` has dropped to what you're willing to cut off.

| Route | Notes |
|-------|-------|
| `GET /exercises/bodyPartList` | Distinct body parts from the data |
| `GET /exercises/targetList` | Distinct targets from the data (Pro vocabulary — e.g. `quadriceps`, not `quads`). **Not yet wired into the client UI** |
| `GET /exercises/bodyPart/:bodyPart` | **A random 11** exercises (one to show + 10 "similar"), list fields only — see Licence. Optional filters, see below |
| `GET /exercises/filters` | Every body part's filter choices, keyed by body part: `{ "<body part>": { difficulties, targets, equipmentTypes: [{ value, count, byDifficulty }] } }`. `byDifficulty` splits `count` by level (levels with none are omitted), so the app can count only options inside the user's difficulty range. About 4 KB — the client loads it **once at startup** (alongside `/bodyPartList`) and keeps it for the session, so switching body parts needs no request. Only changes on a re-import. There is deliberately no per-body-part form |
| `GET /exercises/search?q=` | **Up to 11** exercises matching every word of `q`, closest names first, list fields only — see Search below |
| `GET /exercises/search/suggestions` | The 10 most common values in each of `equipment`, `bodyParts` and `targets`: `{ equipment: [{ value, count }], … }`, for the app's suggestion pills. About 1 KB, loaded once per session. A value can appear in more than one group (`chest` is a body part and a target) |
| `GET /exercises/exercise/:id` | Full Pro record (taxonomy, equipment lists, relationships) with `gifUrl` as a base64 data URL. The ids inside `similarExercises`, `substitutions`, `progressions` and `regressions` are swapped for public ids too; a relation to an exercise not in the table is dropped |
| `GET /exercises/image?exerciseId=` | Binary GIF, by public id. `resolution` is accepted for compatibility and ignored — only 360 is stored |
| `GET /health` | |

**`/bodyPart` filters** — all optional; without them the route behaves as before, so older app builds are unaffected. Unknown `difficulty` / `equipmentType` values return 400. `target` is **not** validated: an unknown target, or a real one that doesn't belong to the body part (`chest` + `biceps`), returns `[]` with 200 — checking it against the database would cost a query and still miss the second case. Clients should only send targets from `/filters`.
- `difficulty` — comma-separated **exact** levels, any of `beginner, intermediate, advanced`. The app's range slider sends a contiguous range (`intermediate,advanced`), or one level for "just that one". (This replaced an earlier "up to and including" meaning before any app shipped with it.)
- `target` — one target muscle, from `/filters` (Pro vocabulary).
- `equipmentType` — comma-separated, any of `free_weight, bodyweight, cable, machine, accessory, band` (Pro's `taxonomy.equipmentCategory`). This is the main kind of resistance, not everything an exercise needs — a bodyweight dip still needs parallel bars. Filtering on the 173 individual `requiredEquipment` items was rejected as too fine-grained for users.

Combinations can match fewer than 11 exercises, or none (e.g. shoulders + beginner + rear deltoids + cable → 0), so the client must handle short and empty lists. `/filters` counts are per choice on its own, not for combinations.

**Search** (`/search?q=`) — a keyword search for the app's Search tab.
- `q` must be letters, digits and spaces only, 3–40 characters after trimming (runs of spaces collapse to one), or it's a 400. Restricting characters is a second layer on top of the parameterised query, and it also means a word can never carry a LIKE wildcard (`%`, `_`). Suggestion values are normalised the same way (`pull-up` → `pull up`), so every pill is a valid query.
- An exercise matches when **every** word appears somewhere in its name, aliases, target, body part or equipment, ignoring case and anywhere inside a longer word, so `pull up` finds `pull-up` and `dumbbell chest` also finds `dumbbell chest-supported … curl`. No index: 1,394 rows is a sequential scan of a few milliseconds.
- **Closest names first.** Matches are ranked: name equals the query, name starts with it, name contains it as whole words, name holds every word, name or aliases hold every word, then the rest (matching only through target, body part or equipment). Names are compared normalised like the query (`T-Bar` → `t bar`), so `pull up` is an exact match for `pull-up`. The app shows the first result, so an exact name lands on the result card. A query that is exactly a target, body part or equipment value (what a single suggestion pill gives, e.g. `chest`) is a category browse and isn't ranked, so `chest-supported row` doesn't outrank chest exercises. There's no synonym matching (`dumbbell chest press` doesn't find `dumbbell bench press` unless an alias says so) and no typo tolerance (that would need `pg_trgm`).
- Results are a sample of up to 11, like `/bodyPart`, random within each rank, and an unknown word returns `[]` with 200. The app's Shuffle button just repeats the request: the best matches usually stay on top and the lower ranks bring a new mix. **Never** add paging, a total count, or a parameter to exclude already-seen ids: any of them would let a script walk every match (licence §13).

List items carry exactly the fields the old RapidAPI list returned (`bodyPart, equipment, id, name, target, secondaryMuscles, instructions, description, difficulty, category`), so app builds released before the Pro switch keep working.

### Licence (ExerciseDB EULA 2026.2)

These terms shape the API — check them before changing a route:
- **§12** — the raw JSON and GIFs must never be published. This repo is **public**: the package stays outside it (`.gitignore` also blocks `exerciseData_pro*.json` and `server/data/`).
- **§13** — no endpoint may allow bulk download. That is why `/bodyPart` returns a random sample rather than the full list, why Pro fields are only served per exercise, why only random `public_id`s are exposed, and why `/exercises/*` is rate limited.
- **§29–30** — safety disclaimers in the app are our responsibility.

### Non-Obvious Details

**Image handling** — images are read from Postgres as a `Buffer` and sent with their stored `Content-Type`.

**No body parsing** — every route is a GET, so there is no `express.json()`. A global parser would run on every request before the rate limiter, which is unthrottled denial-of-service surface (body-parser has had such bugs). A future route that needs a body should mount a parser on that route only. `npm audit` still flags `qs` because Express 4 pins `~6.14`, but every advisory left needs `qs.stringify` or the `comma` parse option, and Express uses neither on requests.

**Connection timeout** — the pool gives up connecting after 5 s (`connectionTimeoutMillis` in `db.ts`). pg's default is no timeout, which made every request hang for minutes when the database was unreachable (e.g. a laptop's IP missing from trusted sources).

**Graceful shutdown** — on SIGTERM (sent by App Platform on every deploy) the server stops accepting connections, lets in-flight requests finish, then ends the pool, and the process exits on its own. A handler that only ended the pool would block Node's default exit and leave the process running until force-killed.

**No in-memory caches** — the RapidAPI-era caches were removed. The instance has 0.5 GB of RAM, and caching base64 GIFs for every exercise would exhaust it; database reads take tens of milliseconds.

**Stray Node gotcha (local only)** — on the original dev machine a `node` package sits in `~/src/personal/node_modules`, and `npm run` puts it (v21.2) first on the PATH. It cannot read the multi-line certificate from `.env`, so `npm run import:pro` fails with "Missing DATABASE_CA_CERT". Run the script with `node` directly, or remove that package.

## What Not To Do

- Do not store user data in the database or add a session layer — the privacy model is explicit: no user data touches the server.
- Do not add user authentication (accounts, logins, per-user tokens). App Check is app attestation, not user auth, and the no-user-data/no-session rules above still stand.
- Do not return whole body parts, the full catalogue, or Pro fields in list responses (licence §13).
- Do not commit the Pro package, GIFs, `.env` or the CA certificate.
