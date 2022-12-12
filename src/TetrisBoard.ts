import { Accessor, createEffect, createSignal, Setter } from 'solid-js';
import { JSX } from 'solid-js/jsx-runtime';
import BlockFactory from './BlockFactory';
import Settings, { BoardConfig, Difficulty } from './Settings';
import TilesUtils from './TilesUtils';

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
    points?: number;
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
    nextTile: Accessor<Tile>;
    screen: Accessor<TScreen>;
    onKeyDown: (e: KeyboardEvent) => void;
    reset: () => void;
    pause: (isPaused?: boolean) => void;
    start: () => void;
    gameState: Accessor<GameState>;
    bindControlKey: (key: string) => void;
    setBoardConfig: Setter<BoardConfig>;
    boardConfig: Accessor<BoardConfig>;
    difficulty: Accessor<Difficulty>;
}

export interface GameState {
    isPaused: boolean;
    isGameOver: boolean;
    score: number;
    gameInterval?: number;
    timeTillAdvance?: number;
    bindKey?: string;
}

/**
 * 
 * @returns base tetris board implementation
 */
const createTetrisBoard = (): TetrisBoard => {
    const [difficulty, setDifficulty] = createSignal<Difficulty>(Settings.getDifficulties()[0]);
    const [boardConfig, setBoardConfig] = createSignal<BoardConfig>(Settings.loadBoardConfig());

    let GAME_TICK = difficulty().gameTick;
    let BOARD_WIDTH = boardConfig().width;
    let BOARD_HEIGHT = boardConfig().height;

    createEffect(() => {
        BOARD_WIDTH = boardConfig().width;
        BOARD_HEIGHT = boardConfig().height;
        reset();
    });

    createEffect(() => {
        GAME_TICK = difficulty().gameTick;
    });

    let keyBinding = Settings.getKeyBinding();

    const gameState = {
        gameInterval: 0,
        isPaused: false,
        isGameOver: false,
        score: 0,
    } as GameState;

    const createTile = () => TilesUtils.randomColorTile(
        TilesUtils.centerTile(
            TilesUtils.createNewTile(
                TilesUtils.convertBlock(BlockFactory.getRandomBlock())), BOARD_WIDTH));

    let tile = createTile();

    const createRow = (width = BOARD_WIDTH, type = PixelType.EMPTY): Row => ({ pixels: Array<Pixel>(width).fill({ type }) });
    const createNewScreen = (height = BOARD_HEIGHT) => Array<Row>(height).fill(createRow());

    let screen: TScreen;

    const [nextTile, setNextTile] = createSignal<Tile>(createTile());
    const [actualScreen, setActualScreen] = createSignal<TScreen>(createNewScreen());
    const [getGameState, setGameState] = createSignal<GameState>(gameState, { equals: false });

    const bindControlKey = (key: string) => {
        gameState.isPaused = true;
        gameState.bindKey = key;
        setGameState(gameState);
    }

    const onKeyDown = (e: KeyboardEvent) => {
        if (gameState.bindKey) {
            Settings.setKeyBinding(gameState.bindKey, e.key);
            Settings.saveKeyBindings();
            keyBinding = Settings.getKeyBinding();
            gameState.bindKey = undefined;
            pause(false);
            return;
        }
        if (gameState.isGameOver || (gameState.isPaused && e.key.toLowerCase() !== keyBinding.pause.toLowerCase())) {
            return;
        }
        if (TilesUtils.hasFullLines(screen)) {
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
        if (gameState.isPaused || gameState.isGameOver) {
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
        // screen = clearPixelPoints(screen);

        tile.possibleTop = tile.top + 1;

        // detect down movement collision
        deltaTile = { ...tile };
        deltaTile.top += 1;
        if (detectCollision(deltaTile, screen)) {
            calculateScorePerTile(tile);
            addScore(getPointsForTile(tile));
            screen = mixinTileToScreen(tile, screen);
            tile = nextTile();
            setNextTile(createTile());
        }

        screen = markFullLines(screen);
        calculateScorePerPixel();
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
        const nTile = { ...tile };
        nTile.block = BlockFactory.rotateBlockCW(nTile.block) as TBlock;
        nTile.width = BlockFactory.getBlockWidth(nTile.block);
        nTile.height = nTile.block.length;
        nTile.left = nTile.left + nTile.width > BOARD_WIDTH
            ? BOARD_WIDTH - nTile.width : nTile.left;
        const collision = detectCollision(nTile, screen);
        return collision ? tile : nTile;
    }

    const doGameOver = () => {
        gameState.isGameOver = true;
        setGameState(gameState);
    }

    const markFullLines = (screen: TScreen): TScreen => {
        return screen.map((row, index) => {
            const taken = row.pixels.filter(({ type }) => type !== PixelType.EMPTY).length;
            if (taken === BOARD_WIDTH) {
                row.pixels.forEach((pixel) => pixel.type = PixelType.REMOVING);
                return row;
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
            addScore(getPointsForRows(diff));
            return [...Array<Row>(diff).fill(createRow()), ...clearedScreen];
        }
        return screen;
    }
    
    const clearPixelPoints = (screen: TScreen): TScreen => {
        screen.forEach((row: Row) => row.pixels.forEach((pixel: Pixel) => pixel.points = 0));
        return screen;
    }

    const calculateScorePerTile = (tile: Tile) => {
        const tilePoints = getPointsForTile(tile);
        const pixelsCount = TilesUtils.getNonEmptyPixelsLenght(tile);
        TilesUtils.getNonEmptyPixels(tile).forEach((pixel: Pixel) => pixel.points = tilePoints / pixelsCount);
    }

    const calculateScorePerPixel = () => {
        const fullLines = TilesUtils.getFullLines(screen);
        if(fullLines) {
            const totalPoints = getPointsForRows(fullLines.length);
            fullLines.forEach((row: Row) => row.pixels.forEach((pixel: Pixel) => pixel.points = roundPoints(totalPoints / (fullLines.length * fullLines[0].pixels.length))));
        }
    }

    const getPointsForRows = (count: number) => roundPoints(100 * count * count * (1 / GAME_TICK * 1000));

    const getPointsForTile = (tile: Tile) => roundPoints(TilesUtils.getNonEmptyPixelsLenght(tile) * (1 / GAME_TICK * 1000));

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
        setDifficulty(Settings.getDifficulties()[0]);
        clearInterval(gameState.gameInterval);
        gameState.score = 0;
        screen = createNewScreen();
        tile = createTile();
        setNextTile(createTile());
        setActualScreen(getActualScreen());
        start();
        setGameState(gameState);
    };

    const pause = (isPaused: boolean = true) => {
        gameState.isPaused = isPaused;
        setGameState(gameState);
    };

    const start = () => {
        gameState.isGameOver = false;
        gameState.gameInterval = window.setInterval(mainLoop, GAME_TICK);
        gameState.isPaused = false;
        setGameState(gameState);
    };

    const getActualScreen = (): Array<Row> => {
        return mixinTileToScreen(tile, screen);
    }

    const addScore = (value: number): void => {
        gameState.score += value;
        gameState.score = roundPoints(gameState.score);
        maybeIncreaseLevel();
        setGameState(gameState);
    }

    const maybeIncreaseLevel = (): void => {
        const diffIndex = Settings.getDifficulties().findIndex((diff) => diff === difficulty());
        const nextDiff = Settings.getDifficulties().length > diffIndex + 1 ? diffIndex + 1 : diffIndex;
        const advanceAt = 5000 * nextDiff;
        if(gameState.score >= advanceAt) {
            setDifficulty(Settings.getDifficulties()[nextDiff]);
            clearInterval(gameState.gameInterval);
            gameState.gameInterval = window.setInterval(mainLoop, GAME_TICK);
        }
    }

    const roundPoints = (value: number) => Math.round(value * 100) / 100;

    // reset();

    return {
        nextTile,
        screen: actualScreen,
        onKeyDown,
        reset,
        pause,
        start,
        gameState: getGameState,
        bindControlKey,
        setBoardConfig,
        boardConfig,
        difficulty
    }
}

export default createTetrisBoard;
