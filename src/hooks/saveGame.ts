import { GameState, TScreen, Tile } from '../TetrisBoard';

const sessionSaveKey = 'save';

export interface SaveGame {
    screen: TScreen;
    gameState: GameState
    currentTile: Tile;
}

export const useCreateSave = (save: SaveGame) => {
    sessionStorage.setItem(sessionSaveKey, JSON.stringify(save));
}

export const useLoadSavedGame = (): SaveGame => {
    return JSON.parse(sessionStorage.getItem(sessionSaveKey) || 'null');
}

export const useRemoveSavedGame = (): void => {
    sessionStorage.removeItem(sessionSaveKey);
}
