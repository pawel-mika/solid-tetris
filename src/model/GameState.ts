import { Difficulty } from './Settings';

export interface GameState {
  isPaused: boolean;
  isGameOver: boolean;
  score: number;
  difficulty?: Difficulty;
  gameInterval?: number;
  timeTillAdvance?: number;
  bindKey?: string;
}

export interface GameMode {
  name: string;
  mode: EGameMode;
}

export enum EGameMode {
  CLASSIC,
  ENDLESS,
  ARCADE
}
