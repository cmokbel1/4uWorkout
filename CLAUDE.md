# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Behavioral guidelines to reduce common LLM coding mistakes.

Tradeoff: These guidelines bias toward caution over speed. For trivial tasks, use judgment.

1. Think Before Coding
Don't assume. Don't hide confusion. Surface tradeoffs.

Before implementing:

State your assumptions explicitly. If uncertain, ask.
If multiple interpretations exist, present them - don't pick silently.
If a simpler approach exists, say so. Push back when warranted.
If something is unclear, stop. Name what's confusing. Ask.
2. Simplicity First
Minimum code that solves the problem. Nothing speculative.

No features beyond what was asked.
No abstractions for single-use code.
No "flexibility" or "configurability" that wasn't requested.
No error handling for impossible scenarios.
If you write 200 lines and it could be 50, rewrite it.
Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

3. Surgical Changes
Touch only what you must. Clean up only your own mess.

When editing existing code:

Don't "improve" adjacent code, comments, or formatting.
Don't refactor things that aren't broken.
Match existing style, even if you'd do it differently.
If you notice unrelated dead code, mention it - don't delete it.
When your changes create orphans:

Remove imports/variables/functions that YOUR changes made unused.
Don't remove pre-existing dead code unless asked.
The test: Every changed line should trace directly to the user's request.

4. Goal-Driven Execution
Define success criteria. Loop until verified.

Transform tasks into verifiable goals:

"Add validation" → "Write tests for invalid inputs, then make them pass"
"Fix the bug" → "Write a test that reproduces it, then make it pass"
"Refactor X" → "Ensure tests pass before and after"
For multi-step tasks, state a brief plan:

1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

These guidelines are working if: fewer unnecessary changes in diffs, fewer rewrites due to over complication, and clarifying questions come before implementation rather than after mistakes.

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
