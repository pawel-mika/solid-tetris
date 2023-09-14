
import { createSignal } from 'solid-js';
import { GameState } from '../model/GameState';
import { TScreen } from '../model/Screen';
import { Tile } from '../model/Tile';

const sessionSaveKey = 'save';

export interface SaveGame {
    screen: TScreen;
    gameState: GameState;
    currentTile: Tile;
}

export const useHasSavedGame = (): boolean => useLoadSavedGame() !== null;

export const useCreateSave = (save: SaveGame): void => {
    localStorage.setItem(sessionSaveKey, JSON.stringify(save));
}

export const useLoadSavedGame = (): SaveGame => {
    return validateSave(JSON.parse(localStorage.getItem(sessionSaveKey) || 'null'));
}

export const useRemoveSavedGame = (): void => {
    localStorage.removeItem(sessionSaveKey);
}

const validateSave = (save: SaveGame): SaveGame => {
    if(!save) {
        return save;
    }
    save.screen.forEach(row => row.pixels.forEach(pixel => {
        if(pixel.perk) {
            const [isPaused, setPaused] = createSignal<boolean>(false);
            pixel.perk.isPaused = isPaused;
            pixel.perk.setPaused = setPaused;
        }
    }));
    return save;
}
