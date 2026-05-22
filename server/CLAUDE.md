# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Server Is

A thin Express/TypeScript proxy that sits between the React Native client and the **ExerciseDB API** (via RapidAPI). It exists to keep the RapidAPI key off the client. There is no database, no auth, no session — every request is stateless and proxied straight through. All product logic lives in the client.

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

No linter, no tests. TypeScript strict mode is the only quality gate.

## Environment

| Variable | Required | Purpose |
|----------|----------|---------|
| `EXERCISE_API_KEY` | Yes | RapidAPI key for ExerciseDB — server throws if missing |
| `PORT` | No (default `3000`) | Listening port |

The API key is validated at fetch time, not at startup — a misconfigured deploy will appear healthy until the first real request fails.

## Architecture

### Structure
- `src/index.ts` — Express app setup, `/health` endpoint, mounts `/exercises` router
- `src/routes/exercises.ts` — all route handlers
- `src/lib/exerciseApi.ts` — single `exerciseApiFetch()` function that attaches RapidAPI auth headers

### Request Flow
Client → `routes/exercises.ts` → `exerciseApiFetch()` → ExerciseDB (`exercisedb.p.rapidapi.com`) → response proxied back. JSON responses pass through untransformed.

### Routes

All routes are prefixed `/exercises`. Error handling is uniform: upstream non-2xx returns the same status with `{ error: 'Upstream request failed' }`; thrown exceptions return 500.

| Route | Notes |
|-------|-------|
| `GET /exercises/bodyPartList` | |
| `GET /exercises/bodyPart/:bodyPart` | Body part is URI-encoded before forwarding |
| `GET /exercises/image?exerciseId=&resolution=` | Binary proxy — `exerciseId` required, `resolution` defaults to `720` |
| `GET /exercises/targetList` | **Not yet wired into the client UI** |
| `GET /health` | |

### Non-Obvious Details

**Image handling** — the image route reads the upstream response as an `ArrayBuffer`, converts to a Node.js `Buffer`, and writes it with the upstream `Content-Type`. Do not refactor to stream the `fetch` `ReadableStream` directly — Express requires the `Buffer` conversion.

**`targetList` is dormant on the client** — implemented and working server-side, but `TrainingScreen` does not yet call it. See the client's `CLAUDE.md` for context.

## What Not To Do

- Do not add a database or session layer — the privacy model is explicit: no user data touches the server.
- Do not add authentication middleware — the server is intended as a trusted internal proxy for the mobile client only.
- Do not transform or filter ExerciseDB responses — the client consumes them directly; any reshaping belongs in the client's `workoutApi.ts`.
