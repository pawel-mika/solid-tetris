import { Accessor, Setter } from 'solid-js';
import { SaveGame } from '../hooks/saveGame';
import { GameMode, GameState } from './GameState';
import { TScreen } from './Screen';
import { BoardConfig, Difficulty } from './Settings';
import { Tile } from './Tile';

export interface TetrisBoard {
  nextTile: Accessor<Tile>;
  screen: Accessor<TScreen>;
  onKeyDown: (e: KeyboardEvent) => void;
  reset: () => void;
  pause: (isPaused?: boolean) => void;
  start: () => void;
  doGameOver: () => void;
  gameState: Accessor<GameState>;
  bindControlKey: (key: string) => void;
  setBoardConfig: Setter<BoardConfig>;
  boardConfig: Accessor<BoardConfig>;
  setGameMode: Setter<GameMode>;
  gameMode: Accessor<GameMode>;
  difficulty: Accessor<Difficulty>;
  getSaveGame: () => SaveGame;
  useSavedGame: (save: SaveGame) => void;
}
