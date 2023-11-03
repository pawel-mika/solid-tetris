import { Accessor, createSignal, onCleanup, onMount } from 'solid-js';

export enum Direction {
  NONE,
  UP,
  RIGHT,
  DOWN,
  LEFT,
  UP_RIGHT,
  DOWN_RIGHT,
  DOWN_LEFT,
  UP_LEFT,
}

export interface SwipeEvent {
  touchStart: TouchEvent;
  touchEnd: TouchEvent;
  direction: Direction;
}

export interface Swipe {
  onSwipe: Accessor<SwipeEvent | null>;
}

// const DirectionMap = {}

export const createSwipe = (startContainer: HTMLElement): Swipe => {
  const [event, setEvent] = createSignal<SwipeEvent | null>(null);
  const [touchStart, setTouchStart] = createSignal<TouchEvent | null>(null);
  const [touchEnd, setTouchEnd] = createSignal<TouchEvent | null>(null);

  onMount(() => {
    init();
  });

  onCleanup(() => {
    destroy();
  });

  const init = () => {
    console.log(`## init`);
    console.log(`## `, startContainer);
    startContainer.addEventListener('touchstart', handleTouchStart);
    startContainer.addEventListener('touchend', handleTouchEnd);
  };

  const destroy = () => {
    console.log(`## destroy`);
    startContainer.removeEventListener('touchstart', handleTouchStart);
    startContainer.removeEventListener('touchend', handleTouchEnd);
  };

  const handleTouchStart = (evt: TouchEvent) => {
    setTouchStart(evt);
  };

  const handleTouchEnd = (evt: TouchEvent) => {
    setTouchEnd(evt);
    fireEvent();
  };

  const fireEvent = (): void => {
    const ts = touchStart();
    const te = touchEnd();
    const sx = ts?.changedTouches?.[0].screenX;
    const sy = ts?.changedTouches?.[0].screenY;
    const ex = te?.changedTouches?.[0].screenX;
    const ey = te?.changedTouches?.[0].screenY;
    const dx = sx && ex ? sx - ex : 0;
    const dy = sy && ey ? sy - ey : 0;
    if (dx != 0 && dy != 0) {
      setEvent(<SwipeEvent>{
        touchStart: touchStart(),
        touchEnd: touchEnd(),
        direction: getDirection(dx, dy),
      });
    }
  };

  // 0 deg - swipe right
  // 90deg - swipe down
  // 180deg - swipe left
  // 270deg - swipe up
  const getDirection = (dx: number, dy: number): Direction => {
    const rad = Math.atan2(dy, dx)
    const deg = 180 + Math.atan2(dy, dx) * (180 / Math.PI);
    if(deg <= 22.5 || deg >= 337.5) {
        return Direction.RIGHT;
    } else if (deg <= 112.5 && deg >= 77.5) {
        return Direction.DOWN;
    } else if (deg <= 202.5 && deg >= 157.5) {
        return Direction.LEFT
    } else if (deg >= 247.5 && deg <= 292.5) {
        return Direction.UP;
    }
    return Direction.NONE;
  }



  return {
    onSwipe: event,
  };
};
