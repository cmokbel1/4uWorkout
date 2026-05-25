# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repo Structure

```
4uWorkout-1/
├── server/              # Express/TypeScript API proxy (Node.js)
└── react-native-app/    # Expo 52 / React Native 0.76 mobile client
```

Each package has its own `package.json`, `node_modules`, and `CLAUDE.md`. There is no shared code or workspace linking between them — they communicate only over HTTP at runtime.

## Deployment

**Server** is deployed to DigitalOcean App Platform from the `server/` directory. Changes must be deployed before any client feature that depends on a new server endpoint will work in production. Until then, the client must implement a graceful fallback.

**Client** is built and distributed via EAS (`eas build`). `EXPO_PUBLIC_API_BASE_URL` is baked into the JS bundle at Metro build time — changing it requires a rebuild, not just a redeploy.

## Environment Variable Chain

| Var | Where set | Effect |
|-----|-----------|--------|
| `EXPO_PUBLIC_API_BASE_URL` | `react-native-app/.env` or `eas.json` | Base URL all client API calls use — baked at build time |
| `EXERCISE_API_KEY` | DigitalOcean App Platform env | RapidAPI key — never goes to the client |
| `PORT` | DigitalOcean App Platform env | Server listen port (defaults to 3000) |

`.env.local` in `react-native-app/` takes priority over `.env` for local development.

## Cross-Cutting Constraints

**No shared types** — `Workout` is defined in `react-native-app/src/types/workout.ts`. The server does not import it. If the ExerciseDB response shape changes, both sides must be updated independently.
