import { Accessor, createEffect, createSignal, onCleanup } from 'solid-js';

export const createTimer = (callback: () => void, time: number, shouldPause: Accessor<boolean>): void => {
  let isPaused = false;
  let remainingTime = time;
  let timer: ReturnType<typeof setTimeout>;
  let startedAt = new Date().getTime();

  onCleanup(() => {
    cancel();
  });

  createEffect(() => {
    if (shouldPause()) {
      pause();
    } else {
      resume();
    }
  });

  const pause = () => {
    cancel();
    remainingTime = remainingTime - (new Date().getTime() - startedAt);
    // console.log(`paused at`, remainingTime);
    isPaused = true;
  };

  const resume = () => {
    timer = setTimeout(callback, remainingTime);
    startedAt = new Date().getTime();
    // console.log(`resumed at`, remainingTime);
    isPaused = false;
  };

  const cancel = () => {
    clearTimeout(timer);
    (timer as any) = null;
  };
};

// export const createTimer = (callback: () => void, delay: number) => {
//   const [paused, setPaused] = createSignal(false);
//   const [remainingTime, setRemainingTime] = createSignal(delay);
//   let startedAt = new Date().getTime();

//   let timerId: ReturnType<typeof setTimeout>;

//   const startTimeout = () => {
//     console.log(`started/resumed at`, remainingTime());
//     timerId = setTimeout(() => {
//       callback();
//       setPaused(true);
//     }, remainingTime());
//   };

//   const pauseTimeout = () => {
//     console.log(`paused at`, remainingTime());
//     clearTimeout(timerId);
//     setRemainingTime(remainingTime() - (new Date().getTime() - startedAt));
//   };

//   createEffect(() => {
//     if (!paused()) {
//       startTimeout();
//     } else {
//       pauseTimeout();
//     }
//   });

//   // Cleanup
//   onCleanup(() => {
//     clearTimeout(timerId);
//   });

//   return {
//     pause: () => setPaused(true),
//     resume: () => setPaused(false),
//     reset: () => setRemainingTime(delay),
//   };
// };
