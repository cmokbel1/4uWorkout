# CLAUDE.md

## What This App Is

**4UWorkout Trainer** — React Native app (Expo 52, RN 0.76, TypeScript strict) for discovering and saving exercises. `TrainingScreen` is the primary surface (search by body part, GIF display, similar-exercise browsing). Saved workouts live on `SavedWorkoutsScreen` (per-day log with inline set editing + calendar) and `WorkoutDetailScreen` (read-only single workout).

## Commands

```bash
expo start
expo run:ios
expo run:android
npx tsc --noEmit        # Only quality gate — no linter, no tests
```

EAS cloud builds (slow, billed):
```bash
eas build --platform android --profile production
eas build --platform ios --profile production
```

## Environment

`EXPO_PUBLIC_API_BASE_URL` is required at runtime (set per build profile in `eas.json`); without it every API call throws. Don't rename the `EXPO_PUBLIC_` prefix — it's what exposes the var to JS.

## Architecture

### Screens & Navigation
React Navigation native stack in `App.tsx`; `RootStackParamList` is the source of truth for screen names/params. Flow: `Start` → `Training` → `SavedWorkouts` (`{ isDark }`) → `WorkoutDetail` (`{ workout, isDark }`). `WorkoutDetail` gets the full `Workout` param and renders it directly — no fetch, since a saved workout already carries a base64 `gifUrl`. Dark mode is passed via the `isDark` param, not context.

### State
No global state/context/store — each screen owns its `useState`. `TrainingScreen` holds most of it (`isBootstrapping` gates initial load; `isSearching` gates both the search and the image fetch, sharing one indicator). Cross-screen sync uses a module-level dirty flag in `src/storage/savedWorkouts.ts` (`isSavedWorkoutsDirty` / `markSavedWorkoutsClean`): mutations set it; `TrainingScreen` re-reads storage on focus only when set.

### Shared Components
`src/components/`. `WorkoutPanel` — shared workout-detail block (labels, difficulty, image, description, self-contained Instructions modal) used by `TrainingScreen` and `WorkoutDetailScreen`; the `showNameLabel` prop is the only difference between callers. `ActionButton` (variant/size). `BackToTrainingButton`. `CalendarView` wraps `react-native-calendars`.

### Search & Display Flow
On mount, `TrainingScreen` fetches body parts and reads saved workouts. On search, results are Fisher-Yates shuffled into `allResults`; one becomes `currentWorkout`, the next 10 populate `searchResults` (the "Similar Workouts" list). `allResults` keeps the full set — selecting a similar workout re-shuffles and re-slices 10. Selecting a similar workout calls `getExerciseById` (server-cached), falling back to `getExerciseImageById` + local metadata. Selecting a saved workout sets `currentWorkout` directly — no fetch, `gifUrl` already stored.

### Core Data Model
`Workout` (`src/types/workout.ts`) is the single type across API responses, AsyncStorage, and UI. New API fields go here first.

### API Layer
`src/services/workoutApi.ts` — all requests go through `requestBuilder<T>()` (throws on non-2xx). Exercise images are fetched as blobs and converted to base64 data URLs via `FileReader` for offline display. `getExerciseById` hits the server cache endpoint (`GET /exercises/exercise/:id`), returning full metadata with `gifUrl` already base64. On bootstrap body-part fetch failure, falls back to `FALLBACK_TARGET_AREAS` (`src/constants/targetAreas.ts`). Target areas are not yet wired up — currently a no-op.

### Persistence
`src/storage/savedWorkouts.ts` — JSON in AsyncStorage under `saved_workouts_v3`, a `SavedWorkoutsByDate` map keyed by local date (`YYYY-MM-DD`); each `Workout` carries per-set `setDetails` (weight/reps). Earlier keys (`v1`, `v2`) are no longer read. Helpers: `readSavedWorkouts`, `writeSavedWorkouts`, `addWorkoutForToday`, `removeSavedWorkout`, `clearSavedWorkouts`. Per-day dedup (blocking a workout already saved today) lives in `TrainingScreen`, not the storage module. Dark-mode preference persists separately in `src/storage/theme.ts` (`readDarkMode` / `writeDarkMode`).

### Non-Obvious Constraints
**Safe area** — use `SafeAreaView` from `react-native-safe-area-context`, not the `react-native` built-in (which ignores the Android system nav bar); `SafeAreaProvider` is in `App.tsx`. `SavedWorkouts`/`WorkoutDetail` follow this; `Start`/`Training` still use the built-in (legacy).

**Android SDK** — `expo-build-properties` in `app.json` pins `targetSdkVersion: 35`. Removing it builds against SDK 34, which Google Play rejects.

## What Not To Do
- React Navigation is the router — don't add a second (e.g. Expo Router). New screens go in the `App.tsx` stack + `RootStackParamList`.
- No global state (Redux, Zustand, Context) — per-screen `useState` is intentional.
- Don't import `SafeAreaView` from `react-native` in new screens.
- Don't change the `saved_workouts_v3` key without a migration path (existing users lose saved workouts).
