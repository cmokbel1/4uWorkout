# 4UWorkout React Native (TypeScript)

This folder is a React Native (Expo) TypeScript conversion of the original 4UWorkout web app, now focused only on fitness workflows.

## Features migrated

- Allowed body-part dropdown to prevent invalid API values
- Workout search by selected body-part target
- Matching workout list for entered body part
- Workout detail preview by selecting a result
- Save workouts to device storage

## Setup

1. Install dependencies:
   npm install
2. Copy environment template:
   cp .env.example .env
3. Add your RapidAPI keys in .env:
   EXPO_PUBLIC_EXERCISE_API_KEY=your_key
4. Start Expo:
   npm run start

Then scan the QR code with Expo Go or run on simulator:

- iOS: npm run ios
- Android: npm run android

## Project structure

- App.tsx: main mobile screen and typed state logic
- src/services/workoutApi.ts: typed exercise API logic
- src/storage/savedWorkouts.ts: typed AsyncStorage persistence
- src/types/workout.ts: workout model types

## Notes

- This conversion keeps workout behavior while adapting UI and state to React Native patterns.
- Original hardcoded API keys were removed. Use environment variables instead.
