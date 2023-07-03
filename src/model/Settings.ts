export interface KeyBinding {
  [rotate: string]: string;
  left: string;
  right: string;
  down: string;
  pause: string;
  newGame: string;
  drop: string;
}

export interface BoardConfig {
  name: string;
  width: number;
  height: number;
}

export interface Difficulty {
  name: string;
  gameTick: number;
}
