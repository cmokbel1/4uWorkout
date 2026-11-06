import { useCallback, useEffect, useRef, useState } from "react"
import * as Speech from "expo-speech"

// Silence between one step finishing and the next starting.
const STEP_PAUSE_MS = 600

// Reads a list of steps aloud one at a time ("Step 1. …"), pausing between
// them, and reports which step is being read so the caller can highlight it.
// `active` is whether the steps are on screen: reading stops when it turns
// false.
//
// Each run gets an id; stopping (or starting again) bumps it, so callbacks
// and timers from a cancelled run see a stale id and do nothing. That covers
// the native callbacks that still arrive after Speech.stop().
export function useSpokenSteps(steps: string[], active: boolean) {
  const [currentStep, setCurrentStep] = useState<number | null>(null)
  const runId = useRef(0)
  const pauseTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const stop = useCallback(() => {
    runId.current += 1
    clearTimeout(pauseTimer.current)
    Speech.stop().catch(() => {
      // Nothing to recover: the run is already cancelled on our side.
    })
    setCurrentStep(null)
  }, [])

  const start = useCallback(() => {
    stop()
    const id = runId.current

    const speakStep = (index: number) => {
      if (id !== runId.current) return
      if (index >= steps.length) {
        setCurrentStep(null)
        return
      }
      setCurrentStep(index)
      Speech.speak(`Step ${index + 1}. ${steps[index]}`, {
        onDone: () => {
          if (id !== runId.current) return
          pauseTimer.current = setTimeout(() => speakStep(index + 1), STEP_PAUSE_MS)
        },
        onError: () => {
          if (id === runId.current) stop()
        },
      })
    }

    speakStep(0)
  }, [steps, stop])

  // Android starts its speech engine on first use, and a step asked for before
  // it's ready waits in a native queue that Speech.stop() doesn't clear, so a
  // quick play-then-close would still read it. Any call wakes the engine, so
  // do that as soon as the steps are shown.
  useEffect(() => {
    if (active) {
      Speech.isSpeakingAsync().catch(() => {
        // Only a warm-up; speak() reports real failures.
      })
    } else {
      stop()
    }
  }, [active, stop])

  // Leaving the screen mid-read must not leave the phone talking.
  useEffect(() => stop, [stop])

  return { currentStep, isSpeaking: currentStep !== null, start, stop }
}
