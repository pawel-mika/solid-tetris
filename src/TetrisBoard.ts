import { Accessor, createSignal } from "solid-js";
import { JSX } from "solid-js/jsx-runtime";
import BlockFactory from "./BlockFactory";
import Settings from "./Settings";
import TilesUtils from "./TilesUtils";

export enum PixelType {
    EMPTY,
    TAKEN,
    REMOVING,
}

export type TBlock = Array<Array<Pixel>>;
export type TScreen = Array<Row>;

export interface Pixel {
    type: PixelType;
    style?: JSX.CSSProperties;
}

export interface Tile {
    block: TBlock;
    top: number;
    left: number;
    width: number;
    height: number;
    possibleTop?: number;
    possibleLeft?: number;
}

export interface Row {
    pixels: Array<Pixel>;
}

export interface TetrisBoard {
    width: number;
    height: number;
    screen: Accessor<Array<Row>>;
    onKeyDown: (e: KeyboardEvent) => void;
    reset: () => void;
    pause: () => void;
    start: () => void;
    gameState: Accessor<GameState>;
}

export interface GameState {
    isPaused: boolean;
    isGameOver: boolean;
    score: number;
    gameInterval?: number;
    timeTillAdvance?: number;
}

const createTetrisBoard = (): TetrisBoard => {
    const GAME_TICK = 1000; // / 25;
    const BOARD_WIDTH = 10;
    const BOARD_HEIGHT = 20;
    const TILE_SPEED = 1000;    // drop 1 pixel every 1000ms

    const keyBinding = Settings.getKeyBinding();

    const gameState = {
        gameInterval: 0,
        isPaused: false,
        isGameOver: false,
        score: 0,
        timeTillAdvance: TILE_SPEED
    } as GameState;

    const createTile = () => TilesUtils.randomColorTile(
        TilesUtils.centerTile(
            TilesUtils.createNewTile(
                TilesUtils.convertBlock(BlockFactory.getRandomBlock())), BOARD_WIDTH));

    let tile = createTile();

    const createRow = (width = BOARD_WIDTH, type = PixelType.EMPTY): Row => ({ pixels: Array<Pixel>(width).fill({ type }) });
    const createNewScreen = (height = BOARD_HEIGHT) => Array<Row>(height).fill(createRow());

    let screen: TScreen;

    const [actualScreen, setActualScreen] = createSignal<TScreen>(createNewScreen());
    const [getGameState, setGameState] = createSignal<GameState>(gameState, {equals: false});

    const onKeyDown = (e: KeyboardEvent) => {
        if(gameState.isGameOver || (gameState.isPaused && e.key.toLowerCase() !== 'p')) {
            return;
        }
        switch (e.key.toLowerCase()) {
            case keyBinding.down.toLowerCase():
                tile.possibleTop = tile.top + 1;
                break;
            case keyBinding.right.toLowerCase():
                tile.possibleLeft = tile.left + tile.width < BOARD_WIDTH
                    ? tile.left + 1 : BOARD_WIDTH - tile.width;
                break;
            case keyBinding.left.toLowerCase():
                tile.possibleLeft = tile.left > 0 ? tile.left - 1 : 0;
                break;
            case keyBinding.rotate.toLowerCase():
                tile = rotateIfPossible(tile);
                break
            case keyBinding.pause.toLowerCase():
                gameState.isPaused = !gameState.isPaused;
                setGameState(gameState);
            default:
                break;
        }
        calculateDeltaTilePosition();
        setActualScreen(getActualScreen());
    }

    const mainLoop = () => {
        if (gameState.isPaused) {
            return;
        }

        // check for game over
        let deltaTile = { ...tile };
        deltaTile.top += 1;
        if (tile.top === 0 && detectCollision(deltaTile, screen)) {
            doGameOver();
            setActualScreen(getActualScreen());
            return;
        }

        screen = clearFullLines(screen);

        // calc full tick
        // gameState.timeTillAdvance -= GAME_TICK;
        // if (gameState.timeTillAdvance <= 0) {
        //     screen = clearFullLines(screen);
        //     tile.possibleTop = tile.top + 1;
        //     gameState.timeTillAdvance = TILE_SPEED;
        // }
        tile.possibleTop = tile.top + 1;

        // detect down movement collision
        deltaTile = { ...tile };
        deltaTile.top += 1;
        if (detectCollision(deltaTile, screen)) {
            screen = mixinTileToScreen(tile, screen);
            tile = createTile();
        }

        screen = markFullLines(screen);
        calculateDeltaTilePosition();
        setActualScreen(getActualScreen());
    }

    const calculateDeltaTilePosition = () => {
        // check left <-> right movement collision 
        let deltaTile = { ...tile };
        deltaTile.left = deltaTile.possibleLeft !== undefined ? deltaTile.possibleLeft : deltaTile.left;
        if (!detectCollision(deltaTile, screen)) {
            tile.left = deltaTile.left;
        }
        // check down movement collision
        deltaTile.top = deltaTile.possibleTop !== undefined ? deltaTile.possibleTop : deltaTile.top;
        if (!detectCollision(deltaTile, screen)) {
            tile.top = deltaTile.top;
        }
        delete tile.possibleLeft;
        delete tile.possibleTop;
    }

    const rotateIfPossible = (tile: Tile): Tile => {
        const nTile = {...tile};
        nTile.block = BlockFactory.rotateBlockCW(nTile.block) as TBlock;
        nTile.width = BlockFactory.getBlockWidth(nTile.block);
        nTile.height = nTile.block.length;
        nTile.left = nTile.left + nTile.width > BOARD_WIDTH
            ? BOARD_WIDTH - nTile.width : nTile.left;
        const collision = detectCollision(nTile, screen);
        return collision ? tile: nTile;
    }

    const doGameOver = () => {
        gameState.isGameOver = true;
        // pause();
        setGameState(gameState);
    }

    const markFullLines = (screen: TScreen): TScreen => {
        return screen.map((row, index) => {
            const taken = row.pixels.filter(({ type }) => type !== PixelType.EMPTY).length;
            if (taken === BOARD_WIDTH) {
                const nrow = createRow(BOARD_WIDTH, PixelType.REMOVING);
                return nrow;
            }
            return row;
        });
    }

    const clearFullLines = (screen: TScreen): TScreen => {
        const clearedScreen = screen.filter((row, index) => {
            const taken = row.pixels.filter(({ type }) => type !== PixelType.EMPTY).length;
            return taken !== BOARD_WIDTH;
        });
        const diff = screen.length - clearedScreen.length;
        if (diff > 0) {
            gameState.score += 100 * diff * diff * 0.5;
            setGameState(gameState);
            return [...Array<Row>(diff).fill(createRow()), ...clearedScreen];
        }
        return screen;
    };

    const detectCollision = (tile: Tile, screen: TScreen): boolean => {
        const block = tile.block;
        let collision = false;
        for (let row = 0; row < block.length; row++) {
            for (let col = 0; col < block[row].length; col++) {
                if (block[row][col].type != PixelType.EMPTY) {
                    if (row + tile.top >= screen.length) {
                        collision = true;   // out of screen bottom
                    } else if (screen[row + tile.top].pixels[col + tile.left].type !== PixelType.EMPTY) {
                        collision = true;
                    }
                }
            }
        }
        return collision;
    }

    const mixinTileToScreen = (theTile: Tile, screen: TScreen): TScreen => {
        return screen.map(
            (row, rowIndex) => {
                const pixels = row.pixels.map(
                    (pixel, pindex) => {
                        const ty = rowIndex - theTile.top;
                        const tx = pindex - theTile.left;
                        const tpixel = theTile.block[ty]?.[tx];
                        const npixel = tpixel && tpixel.type !== PixelType.EMPTY ? tpixel : row.pixels[pindex];
                        return npixel;
                    });
                return { ...row, pixels };
            });
    }

    const reset = () => {
        pause();
        clearInterval(gameState.gameInterval);
        gameState.score = 0;
        screen = createNewScreen();
        tile = createTile();
        setActualScreen(getActualScreen());
        start();
        setGameState(gameState);
    };

    const pause = () => {
        gameState.isPaused = true;
        setGameState(gameState);
    };

    const start = () => {
        gameState.isGameOver = false;
        gameState.gameInterval = setInterval(mainLoop, GAME_TICK);
        gameState.isPaused = false;
        setGameState(gameState);
    };

    const getActualScreen = (): Array<Row> => {
        return mixinTileToScreen(tile, screen);
    }

    reset();

    return {
        width: BOARD_WIDTH,
        height: BOARD_HEIGHT,
        screen: actualScreen,
        onKeyDown,
        reset,
        pause,
        start,
        gameState: getGameState
    }
}

export default createTetrisBoard;