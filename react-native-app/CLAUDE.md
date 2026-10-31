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

**iOS simulator gotcha** — `expo start` then `i` targets the *most recently opened* simulator, not the device it prints. A stray booted sim from a past session hijacks the target and the app never loads. Fix: `xcrun simctl shutdown all && killall Simulator`, then `i` — or press `Shift+I` in the CLI to pick the device explicitly.

## Environment

`EXPO_PUBLIC_API_BASE_URL` is required at runtime (set per build profile in `eas.json`); without it every API call throws. Don't rename the `EXPO_PUBLIC_` prefix — it's what exposes the var to JS.

## Architecture

### Screens & Navigation
React Navigation native stack in `App.tsx`; `RootStackParamList` is the source of truth for screen names/params. Flow: `Start` → `Training` → `SavedWorkouts` (`{ isDark }`) → `WorkoutDetail` (`{ workout, isDark }`). `WorkoutDetail` gets the full `Workout` param and renders it directly — no fetch, since a saved workout already carries a base64 `gifUrl`. Dark mode is passed via the `isDark` param, not context. `SavedWorkoutsScreen` keeps it in state (the Calendar's menu can change it and writes it to storage), and `TrainingScreen` re-reads the stored setting whenever it regains focus.

### State
No global state/context/store — each screen owns its `useState`. `TrainingScreen` holds most of it (`isBootstrapping` gates initial load; `isSearching` covers the search and the image/details request). A workout only counts as loaded when `isLoading` is false — `isSearching` **and** its GIF drawn (`WorkoutPanel`'s `onImageLoad` sets `loadedImageId`), since the base64 image takes a moment to render after the request returns. Until then the result card shows a spinner and Find shows "Loading…" with a spinner. **One trigger ends loading:** `onResultImageLoad` (the image drew, or failed) fades the card in and scrolls it to just below the top bar. The similar list is laid out as soon as the requests finish (invisible and untappable, fading in with the card), so the page is already full length when that scroll runs; the target is clamped to the content, since `scrollTo` doesn't stop at the end on iOS. New workouts go through `showWorkout`, which hides them until their image has drawn — except when the image is the one already on screen (a search re-picking the shown workout): React Native's `Image` only reloads when its source changes, so no load event would come, and loading finishes immediately instead. A search with no matches clears the old result and shows an inline "No workouts match" card (with **Clear filters** when filters are active) instead of an alert; a successful save shows as the Save button switching to "Saved" instead of an alert. Cross-screen sync uses a module-level dirty flag in `src/storage/savedWorkouts.ts` (`isSavedWorkoutsDirty` / `markSavedWorkoutsClean`): mutations set it; `TrainingScreen` re-reads storage on focus only when set.

### Design System (redesign in progress)
`src/theme.ts` holds the redesign's tokens: `getPalette(isDark)` (light/dark colors sampled from the mockups), `fonts` (Manrope weights) and `radius`. **Manrope** is loaded in `App.tsx` with `useFonts`; custom fonts choose their weight by family name, so set `fontFamily: fonts.bold` etc., never `fontWeight`. Icons are `Feather` from `@expo/vector-icons`.

`TrainingScreen` layout: a **collapsing** top bar (app name, settings cog, Today's workouts / Calendar cards) and a fixed bottom bar (Find / Save workout).
- The top bar floats over the scroll view (`topBarOverlay`), and the content is padded to start below it (`paddingTop: topBarHeight + CONTENT_TOP_GAP`), so resizing the bar never changes the scroll view's layout.
- Collapse is driven by `scrollY` on the native thread (`Animated.event`, `useNativeDriver`): over `collapseDistance` (nav row + gap + `titleShrink`, all measured with `onLayout`) the nav cards slide behind the title row and fade, and "Trainer" scales to `COLLAPSED_TITLE_SCALE`. The **app name stays visible at full size** — it slides down by the space the shrinking title frees (`titleShrink`) so it stays right above it — and the bar slims by that much plus the nav row. Collapsed, the bar still reads "4UWORKOUT / Trainer". Only transforms and opacity are animated — never height, which the native driver can't do and which would make the content jitter.
- The cog stays visible when collapsed and opens a **menu** sheet (Today's workouts, Calendar, Dark mode), so navigation is always one tap away; the nav cards come back when scrolled to the top.
- `resultScrollTarget` puts the result card just below the **collapsed** bar.

`TrainingScreen`, `WorkoutPanel` and the Calendar (`CalendarView`) use the new design so far. The Saved Workouts day view, `StartScreen` and `WorkoutDetailScreen` keep their old styles (and `AppHeader` / `ActionButton`) until they get designs — `WorkoutDetailScreen.styles.ts` is the old Training stylesheet's subset that screen uses, split out unchanged.

### Shared Components
`src/components/`.
- `WorkoutPanel` — shared workout-detail block (name, detail chips, image, description, self-contained Instructions sheet), new design, used by `TrainingScreen` and `WorkoutDetailScreen`; the `showNameLabel` prop is the only difference between callers. Like the other new-design components it takes a `palette`, not `isDark` (`WorkoutDetailScreen` passes `getPalette(isDark)`).
- New design: `AppMenu` (the cog's menu: navigation rows passed in by each screen, then the Dark mode switch; used by Training and the Calendar), `BottomSheet` (slides up over a fading scrim and back down before unmounting; used by `SelectField` and `AppMenu`), `SelectField` (dropdown-style field that opens a `BottomSheet` of options; `large` or `compact` with a caps label; options can carry a `detail`, e.g. the counts from `/filters`), `RangeSlider` (two-handle slider snapping to a few levels — drag, or tap a level label for just that level, tap again for all; handles are `adjustable` for screen readers), `ThemedButton` (`primary` / `secondary`, optional icon), `NavCard`.
- `CalendarView` — the Saved Workouts screen's month view, new design: Training's header (brand, title, cog menu), a Training button, and a "Select a date" card (note that saved days are dotted) wrapping `react-native-calendars`. **Tapping a day opens the day view for it** — the same screen Training's "Today's workouts" opens — so both routes lead to one place for a day's workouts. The calendar's theme is read once by the library, so it's remounted (`key`) when dark mode changes.
- Old design: `ActionButton` (variant/size), `AppHeader`, `BackToTrainingButton`.

### Search & Display Flow
On mount, `TrainingScreen` fetches body parts and reads saved workouts. On search, results are Fisher-Yates shuffled into `allResults`; one becomes `currentWorkout`, the next 10 populate `searchResults` (the "Similar Workouts" list). `allResults` keeps the full set — selecting a similar workout re-shuffles and re-slices 10. Selecting a similar workout calls `getExerciseById` (server-cached), falling back to `getExerciseImageById` + local metadata. Selecting a saved workout sets `currentWorkout` directly — no fetch, `gifUrl` already stored.

### Core Data Model
`Workout` (`src/types/workout.ts`) is the single type across API responses, AsyncStorage, and UI. New API fields go here first.

### API Layer
`src/services/workoutApi.ts` — all requests go through `requestBuilder<T>()` (throws on non-2xx). Exercise images are fetched as blobs and converted to base64 data URLs via `FileReader` for offline display. `getExerciseById` hits `GET /exercises/exercise/:id`, returning full metadata with `gifUrl` already base64. `searchExercisesByBodyPart(bodyPart, filters)` returns **up to 11** random matches — filters can make it fewer, or none. `getFilterOptions` loads every body part's filter choices (`GET /exercises/filters`). The query string is built by hand because React Native's `URLSearchParams` doesn't implement `set()`.

### Filters
Types in `src/types/filters.ts`. `TrainingScreen` holds `filterOptions` (all body parts' choices) and `filters` (the user's choices), and sends `filters` with every search. Controls on the Training card:
- **Difficulty** — `RangeSlider`; `filters.difficulties` is the contiguous range of exact levels (sent as `difficulty=intermediate,advanced`). The full range means "any" and is stored as `undefined`.
- **Target** and **Equipment** — `SelectField`s fed from `filterOptions[selectedBodyPart]`, each with an "Any" choice (`""` → `undefined`). Equipment is single-select in the UI, though `equipmentTypes` (and the server) accept several.
- **Option counts follow the difficulty range** — each option shows how many exercises it matches *within the selected difficulty range* (`countInDifficultyRange`, summing the server's `byDifficulty`); exercises outside the range aren't counted. An option with 0 in range is shown greyed out and can't be picked. Without a difficulty filter, or from a server that doesn't send `byDifficulty`, the plain total is shown. Counts are still per option, not for Target × Equipment combinations, so a search can still come back empty (handled by the inline "No workouts match" card).
- Filter options are fetched once per session, without blocking bootstrap, and cached in `trainingSession`; if the request fails, filtering is just unavailable and the next mount retries.
- Changing body part (`onChangeBodyPart`) drops a target or equipment type the new body part doesn't offer; difficulty is kept.
- `filters` and `selectedBodyPart` are both kept in `trainingSession`, because filter choices only make sense for the body part they were picked under.
- Narrow combinations return few or no results; the empty-result alert says so when filters are active.

### Persistence
`src/storage/savedWorkouts.ts` — JSON in AsyncStorage under `saved_workouts_v3`, a `SavedWorkoutsByDate` map keyed by local date (`YYYY-MM-DD`); each `Workout` carries per-set `setDetails` (weight/reps). Earlier keys (`v1`, `v2`) are no longer read. Helpers: `readSavedWorkouts`, `writeSavedWorkouts`, `addWorkoutForToday`, `removeSavedWorkout`, `clearSavedWorkouts`. Per-day dedup (blocking a workout already saved today) lives in `TrainingScreen`, not the storage module. Dark-mode preference persists separately in `src/storage/theme.ts` (`readDarkMode` / `writeDarkMode`).

### Non-Obvious Constraints
**Safe area** — always use `SafeAreaView` from `react-native-safe-area-context`, never the `react-native` built-in (a no-op on Android, so content runs under the system nav bar — especially with `targetSdkVersion: 35` edge-to-edge). `SafeAreaProvider` is in `App.tsx`.

**Android SDK** — `expo-build-properties` in `app.json` pins `targetSdkVersion: 35`. Removing it builds against SDK 34, which Google Play rejects.

## What Not To Do
- React Navigation is the router — don't add a second (e.g. Expo Router). New screens go in the `App.tsx` stack + `RootStackParamList`.
- No global state (Redux, Zustand, Context) — per-screen `useState` is intentional.
- Don't import `SafeAreaView` from `react-native` in new screens.
- Don't change the `saved_workouts_v3` key without a migration path (existing users lose saved workouts).
