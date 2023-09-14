import { Accessor, Setter, Signal, createEffect, createSignal, onCleanup } from 'solid-js';

// export const createTimer = (callback: () => void, time: number, shouldPause: Accessor<boolean>): void => {
//   let isPaused = false;
//   let remainingTime = time;
//   let timer: ReturnType<typeof setTimeout>;
//   let startedAt = new Date().getTime();

//   onCleanup(() => {
//     cancel();
//   });

//   createEffect(() => {
//     if (shouldPause()) {
//       pause();
//     } else {
//       resume();
//     }
//   });

//   const pause = () => {
//     cancel();
//     remainingTime = remainingTime - (new Date().getTime() - startedAt);
//     isPaused = true;
//   };

//   const resume = () => {
//     timer = setTimeout(callback, remainingTime);
//     startedAt = new Date().getTime();
//     isPaused = false;
//   };

//   const cancel = () => {
//     clearTimeout(timer);
//     (timer as any) = null;
//   };
// };

export interface ITimer {
  isPaused: Accessor<boolean>,
  pause: () => void,
  resume: () => void,
  reset: () => void,
  dispose: () => void
};

export const createTimer = (callback: () => void, delay: number): ITimer => {
  const [paused, setPaused] = createSignal(false);
  const [remainingTime, setRemainingTime] = createSignal(delay);
  let startedAt = new Date().getTime();

  let timerId: ReturnType<typeof setTimeout>;

  const startTimeout = () => {
    timerId = setTimeout(() => {
      console.log(`## timed out at`, remainingTime());
      callback();
      dispose();
    }, remainingTime());
    console.log(`## started/resumed at`, remainingTime(), timerId);
  };

  const pauseTimeout = () => {
    console.log(`## paused at`, remainingTime(), timerId);
    clearTimeout(timerId);
    setRemainingTime(remainingTime() - (new Date().getTime() - startedAt));
  };

  const dispose = () => {
    console.log(`## disposing timer`, timerId);
    clearTimeout(timerId);
  }

  createEffect(() => {
    if (paused()) {
      pauseTimeout();
    } else {
      startTimeout();
    }
  });

  onCleanup(() => {
    console.log(`## cleanup`, timerId);
    clearTimeout(timerId);
  });

  return {
    isPaused: paused,
    pause: () => setPaused(true),
    resume: () => setPaused(false),
    reset: () => setRemainingTime(delay),
    dispose: () => dispose()
  };
};
