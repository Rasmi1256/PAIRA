/**
 * src/hooks/useCallTimer.ts
 *
 * React hook for tracking call duration.
 *
 * RESPONSIBILITIES:
 * - Start timer when call begins
 * - Stop timer when call ends
 * - Provide formatted duration
 *
 * DOES NOT:
 * - Know anything about WebRTC
 * - Know anything about backend
 */

import { useEffect, useRef, useState } from "react";

// --------------------------------------------------
// TYPES
// --------------------------------------------------

type CallTimer = {
  seconds: number;
  formatted: string;
  reset: () => void;
};

// --------------------------------------------------
// HOOK
// --------------------------------------------------

export function useCallTimer(isActive: boolean): CallTimer {
  const [seconds, setSeconds] = useState(0);
  const intervalRef = useRef<number | null>(null);

  // --------------------------------------------------
  // START / STOP TIMER
  // --------------------------------------------------

  useEffect(() => {
    if (isActive) {
      // Start timer
      intervalRef.current = window.setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      // Stop timer
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isActive]);

  // --------------------------------------------------
  // RESET
  // --------------------------------------------------

  const reset = () => {
    setSeconds(0);
  };

  // --------------------------------------------------
  // FORMAT (MM:SS or HH:MM:SS)
  // --------------------------------------------------

  const formatted = formatDuration(seconds);

  return {
    seconds,
    formatted,
    reset,
  };
}

// --------------------------------------------------
// HELPERS
// --------------------------------------------------

function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }

  return `${pad(minutes)}:${pad(seconds)}`;
}

function pad(value: number): string {
  return value.toString().padStart(2, "0");
}
