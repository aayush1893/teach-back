import { useState, useRef, useCallback } from 'react';

const formatTime = (totalSeconds: number): string => {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};


export const useTimer = () => {
  const [elapsedTime, setElapsedTimeState] = useState(0);
  const intervalRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  const setElapsedTime = useCallback((time: number) => {
    setElapsedTimeState(time);
    if(startTimeRef.current) {
        startTimeRef.current = Date.now() - (time * 1000);
    }
  }, []);

  const stop = useCallback(() => {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    // Ensure we capture the final time accurately
    if (startTimeRef.current) {
      const finalSeconds = Math.floor((Date.now() - startTimeRef.current) / 1000);
      setElapsedTimeState(finalSeconds);
      return finalSeconds;
    }
    return elapsedTime;
  }, [elapsedTime]);

  const start = useCallback((resumeFrom: number = 0) => {
    if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
    }
    startTimeRef.current = Date.now() - (resumeFrom * 1000);
    setElapsedTimeState(resumeFrom); // Update state immediately
    intervalRef.current = window.setInterval(() => {
      if (startTimeRef.current) {
        setElapsedTimeState(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }
    }, 1000);
  }, []);

  const reset = useCallback(() => {
    stop();
    startTimeRef.current = null;
    setElapsedTimeState(0);
  }, [stop]);

  return {
    elapsedTime,
    start,
    stop,
    reset,
    setElapsedTime, // Expose the setter
    formattedTime: formatTime(elapsedTime),
  };
};
