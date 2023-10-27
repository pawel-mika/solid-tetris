import { createEffect, createRenderEffect, createSignal } from 'solid-js';
import { SaveGame } from '../hooks/saveGame';
import { TetrisBoard } from '../model/Board';
import { EGameMode, GameMode, GameState } from '../model/GameState';
import { Pixel, PixelType } from '../model/Pixel';
import { Row } from '../model/Row';
import { TScreen } from '../model/Screen';
import { BoardConfig, Difficulty } from '../model/Settings';
import { TBlock, Tile } from '../model/Tile';
import BlockFactory from '../utils/BlockFactory';
import MiscUtils from '../utils/MiscUtils';
import PerkFactory from '../utils/PerkFactory';
import ScreenUtils from '../utils/ScreenUtils';
import Settings from '../utils/Settings';
import TilesUtils from '../utils/TilesUtils';
import { PerkType } from '../model/Perk';

/**
 *
 * @returns base tetris board implementation
 */
const createTetrisBoard = (): TetrisBoard => {
    const [difficulty, setDifficulty] = createSignal<Difficulty>(Settings.getDifficulties()[0]);
    const [boardConfig, setBoardConfig] = createSignal<BoardConfig>(Settings.loadBoardConfig());
    const [gameMode, setGameMode] = createSignal<GameMode>(Settings.loadGameMode());

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

    const createRow = (width = BOARD_WIDTH, type = PixelType.EMPTY): Row => ({ pixels: Array.from({length: width}, () => ScreenUtils.createPixel(type)) });
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
                break;
            case keyBinding.pause.toLowerCase():
                gameState.isPaused = !gameState.isPaused;
                setGameState(gameState);
                pausePerks();
            default:
                break;
        }
        // some dev codes, add 'dev mode' condition to if
        if(import.meta.env.DEV && e.altKey) {
            switch(e.key.toLowerCase()) {
                case '0':
                    const perk = PerkFactory.getRandomPerk();
                    ScreenUtils.getTakenPixels(screen)[0].perk = perk;
                    screen = screen.map((row) => {
                        row.pixels = row.pixels.map((pixel) => pixel.perk === perk ? {...pixel} : pixel);
                        return row;
                    });
                    break;
                case '1':
                    // startGravityCascade();
                    // ScreenUtils.applyGravityCascade(screen);
                    ScreenUtils.startGravityCascade(screen);
                    console.log(ScreenUtils.calculateGravityCascadeMaxDrop(screen));
                default:
                    break;
            }
        }
        calculateDeltaTilePosition();
        setActualScreen(getActualScreen());
    }

    const mainLoop = () => {
        if (gameState.isPaused || gameState.isGameOver) {
            return;
        }

        screen = clearMarkedLines(screen);

        // check for game over
        let deltaTile = { ...tile };
        deltaTile.top += 1;
        if (tile.top === 0 && detectCollision(deltaTile, screen)) {
            doGameOver();
            setActualScreen(getActualScreen());
            return;
        }

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

        screen = ScreenUtils.markLinesToRemove(screen, BOARD_WIDTH);
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

    const clearMarkedLines = (screen: TScreen): TScreen => {
        const clearedScreen = screen.filter((row, index) => {
            const removedPixels = row.pixels.filter(({type}) => type === PixelType.REMOVING).length
            return removedPixels === 0;
        });
        const diff = screen.length - clearedScreen.length;
        // check perks in removed lines and act accordingly

        if (diff > 0) {
            // WIP TMP in this place - remove later drawing a perk from here!!
            addScore(getPointsMultiplier(TilesUtils.getFullLines(screen)) * getPointsForRows(diff));
            switch(gameMode().mode) {
                case EGameMode.ARCADE:
                    return [...Array<Row>(diff).fill(createRow()), ...drawPerkOnScreen(clearedScreen)];
                case EGameMode.CLASSIC:
                case EGameMode.ENDLESS:
                default:
                    return [...Array<Row>(diff).fill(createRow()), ...clearedScreen];
            }
        }
        return screen;
    }

    const calculateScorePerTile = (tile: Tile) => {
        const tilePoints = getPointsForTile(tile);
        const pixelsCount = TilesUtils.getNonEmptyPixelsLenght(tile);
        TilesUtils.getNonEmptyPixels(tile).forEach((pixel: Pixel) => pixel.points = tilePoints / pixelsCount);
    }

    const calculateScorePerPixel = () => {
        const fullLines = TilesUtils.getFullLines(screen);
        // const multiplier = getPointsMultiplier(fullLines);
        if (fullLines) {
            const totalPoints = getPointsForRows(fullLines.length);
            fullLines.forEach((row: Row) => row.pixels.forEach((pixel: Pixel) => pixel.points = TilesUtils.roundPoints(totalPoints / (fullLines.length * fullLines[0].pixels.length))));
        }
    }

    const getPointsMultiplier = (fullLines: Array<Row>): number => {
        const pixelsWithPerks = fullLines.reduce<Array<Pixel>>((acc, row) => [...acc, ...row.pixels.filter(({perk}) => perk)], []);
        const multipliers = pixelsWithPerks.filter(({perk}) => perk?.perkType === PerkType.POINT_MULTIPLIER);
        return multipliers ? multipliers.reduce((acc, pixel) => acc * (pixel.perk?.multiplier || 1), 1) : 1;
    }

    const getPointsForRows = (count: number) => TilesUtils.roundPoints(100 * count * count * (1 / GAME_TICK * 1000));

    const getPointsForTile = (tile: Tile) => TilesUtils.roundPoints(TilesUtils.getNonEmptyPixelsLenght(tile) * (1 / GAME_TICK * 1000));

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

    const pausePerks = () => {
        screen && screen.forEach((row) => row.pixels.forEach((pixel) => {
            if(pixel.perk) {
                pixel.perk.setPaused(gameState.isPaused);
            }
        }));
    }

    // fix perks restart - maybe just clone them in the copy?
    const startGravityCascade = () => {
        const frames = ScreenUtils.calculateGravityCascadeMaxDrop(screen);
        const tick = (GAME_TICK - 50 ) / frames;
        const timer = setInterval(() => {
            const frame = ScreenUtils.getGravityCascadeFrame(screen);
            if(frame) {
                screen = frame;
                setActualScreen(getActualScreen());
            } else {
                clearInterval(timer);
            }
        }, tick);
    }

    const reset = () => {
        pause();
        changeDifficulty(Settings.getDifficulties()[0]);
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
        pausePerks();
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
        gameState.score = TilesUtils.roundPoints(gameState.score);
        gameMode().mode === EGameMode.CLASSIC && maybeIncreaseLevel();
        setGameState(gameState);
    }

    const maybeIncreaseLevel = (): void => {
        const diffIndex = Settings.getDifficulties().findIndex((diff) => diff === difficulty());
        const nextDiff = Settings.getDifficulties().length > diffIndex + 1 ? diffIndex + 1 : diffIndex;
        const advanceAt = 5000 * nextDiff;
        if(gameState.score >= advanceAt) {
            changeDifficulty(Settings.getDifficulties()[nextDiff]);
            clearInterval(gameState.gameInterval);
            gameState.gameInterval = window.setInterval(mainLoop, GAME_TICK);
        }
    }

    const drawPerkOnScreen = (screen: TScreen): TScreen => {
        const takenPixels = ScreenUtils.getTakenPixelsCount(screen);
        const drawnPerkPixelIndex = MiscUtils.getRandom(0, takenPixels - 1, 0);
        if(takenPixels === 0 || drawnPerkPixelIndex < 0) {
            return screen;
        }
        const newRandomPerk = PerkFactory.getRandomPerk();
        ScreenUtils.getTakenPixels(screen)[drawnPerkPixelIndex].perk = newRandomPerk;
        return screen.map((row) => {
            row.pixels = row.pixels.map((pixel) => pixel.perk === newRandomPerk ? {...pixel} : pixel);
            return row;
        });
    }

    const changeDifficulty = (newDifficulty: Difficulty) => {
        setDifficulty(newDifficulty);
        gameState.difficulty = newDifficulty;
    }

    const getSaveGame = (): SaveGame => {
        return { currentTile: tile, gameState, screen };
    }

    const useSavedGame = (save: SaveGame): void => {
        screen = save.screen;
        tile = save.currentTile;
        gameState.score = save.gameState.score;
        setActualScreen(screen);
        setGameState(save.gameState);
        pause(false);
    }

    return {
        nextTile,
        screen: actualScreen,
        onKeyDown,
        reset,
        pause,
        start,
        doGameOver,
        gameState: getGameState,
        bindControlKey,
        setBoardConfig,
        boardConfig,
        setGameMode,
        gameMode,
        difficulty,
        getSaveGame,
        useSavedGame
    }
}

export default createTetrisBoard;
