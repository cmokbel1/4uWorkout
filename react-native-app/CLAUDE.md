# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This App Is

**4UWorkout Trainer** is a two-screen React Native app (Expo 52, React Native 0.76, TypeScript strict) for discovering and saving exercises. The entire product surface area lives in `TrainingScreen` — exercise search by body part, GIF display, similar exercise browsing, and a local saved-workouts log.

## Commands

**Local development:**
```bash
expo start
expo run:ios
expo run:android
npx tsc --noEmit        # Only quality gate — no linter, no tests
```

**Cloud builds (EAS — slow, billed):**
```bash
eas build --platform android --profile production
eas build --platform ios --profile production
```

## Environment

`EXPO_PUBLIC_API_BASE_URL` is required at runtime and set per build profile in `eas.json`. Without it every API call throws immediately. The `EXPO_PUBLIC_` prefix is what makes it accessible in JS — do not rename it.

## Architecture

### Screens & Navigation
Navigation is a single `started: boolean` in `App.tsx`. No routing library. `StartScreen` is entry-only; `TrainingScreen` is the full app. Introduce React Navigation only if a third screen is needed.

### State
All state lives in `TrainingScreen` via `useState` — no global state, no context, no external store. `isBootstrapping` gates the initial loading screen. `isSearching` gates both the body-part search and the subsequent image fetch, so both operations share one loading indicator.

### Search & Display Flow
On mount, `TrainingScreen` fetches available body parts from the API and reads saved workouts from AsyncStorage. On search, the full result set is Fisher-Yates shuffled into `allResults`; one item becomes `currentWorkout`, the rest populate `searchResults` (the "Similar Workouts" list). Selecting a similar workout calls `getExerciseById` (server-cached endpoint) and falls back to `getExerciseImageById` + local metadata if that fails. Selecting a saved workout sets it as `currentWorkout` directly — no fetch, the `gifUrl` is already stored.

### Core Data Model 
`Workout` (`src/types/workout.ts`) is the single type shared across API responses, AsyncStorage, and all UI. Any new field from the API must be added here first.

### API Layer
`src/services/workoutApi.ts` — all requests go through `requestBuilder<T>()` which throws on non-2xx. Exercise images are fetched as blobs and converted to base64 data URLs via `FileReader` — this is intentional for offline display. `getExerciseById` calls the server-side caching endpoint (`GET /exercises/exercise/:id`) which returns full workout metadata with `gifUrl` already base64-encoded. When the body part list call fails on bootstrap, the app falls back to `FALLBACK_TARGET_AREAS` (`src/constants/targetAreas.ts`) and continues normally (DRAFT NOT YET IMPLEMENTED, CURRENTLY TARGET AREAS DOES NOTHING).

### Persistence
`src/storage/savedWorkouts.ts` — plain JSON in AsyncStorage under the key `saved_workouts_v1`. The 50-item cap and deduplication are enforced in `TrainingScreen`, not in the storage module. Do not change the storage key without a migration path — existing users will lose their saved workouts.

### Non-Obvious Constraints

**Safe area** — both screens use `SafeAreaView` from `react-native-safe-area-context`, not `react-native`. The built-in version does not account for the Android system nav bar. `SafeAreaProvider` is mounted in `App.tsx`.

**Android SDK** — `expo-build-properties` in `app.json` explicitly pins `targetSdkVersion: 35`. Removing this plugin causes EAS to build against SDK 34, which Google Play rejects.

## What Not To Do

- Do not introduce a routing library (React Navigation, Expo Router) unless a third screen is genuinely required.
- Do not add global state management (Redux, Zustand, Context) — `useState` in `TrainingScreen` is intentional for this scope.
- Do not import `SafeAreaView` from `react-native` — always use `react-native-safe-area-context`.
- Do not change the AsyncStorage key `saved_workouts_v1` without handling existing user data.
