import { Component, createEffect, createRenderEffect, createSignal, For, onCleanup, onMount, Show } from 'solid-js';
import AnimableElement from './components/AnimableElement';
import GameStateOverlay from './components/GameState';
import LoadGameModal from './components/LoadGameModal';
import PixelComponent from './components/Pixel';
import createTetrisBoard from './game/TetrisBoard';
import { SaveGame, useCreateSave, useHasSavedGame } from './hooks/saveGame';
import { Pixel } from './model/Pixel';
import { KeyBinding } from './model/Settings';
import styles from './TetrisPage.module.scss';
import Settings from './utils/Settings';
import TilesUtils from './utils/TilesUtils';
import ArcadeLegend from './components/ArcadeLegend';
import { EGameMode } from './model/GameState';

declare const __APP_VERSION__: string;
declare const __COMMIT_HASH__: string;
declare const __BUILD_DATE__: string;

declare type ScoreDiff = {
  score: number;
  message?: string;
}

const TetrisPage: Component = () => {
  const getHiScore = () => sessionStorage.getItem('hiScore') || '0';

  const {
    screen,
    onKeyDown,
    pause,
    reset,
    doGameOver,
    gameState,
    bindControlKey,
    nextTile,
    boardConfig,
    setBoardConfig,
    gameMode,
    setGameMode,
    difficulty,
    getSaveGame,
    useSavedGame
  } = createTetrisBoard();

  const [scoreDiff, setScoreDiff] = createSignal<Array<ScoreDiff>>(new Array());
  const [hiScore, setHiScore] = createSignal<string>(getHiScore());
  const [keyBinding, setKeyBinding] = createSignal<KeyBinding>(Settings.getKeyBinding(), { equals: false });

  onMount(() => {
    document.addEventListener('keydown', onKeyDown);
    window.addEventListener('blur', () => doPause());
    window.addEventListener('beforeunload', onBeforeUnload);  // maybe save on every step instead? wouldn't be too costly IMO
  });

  onCleanup(() => {
    document.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('beforeunload', onBeforeUnload);
    pause();
  });

  const doPause = () => {
    pause();
  }

  const onBeforeUnload = () => {
    const shouldSave = !useHasSavedGame() && !gameState().isGameOver;
    if(shouldSave) {
      useCreateSave(getSaveGame());
    }
  }

  const newGame = () => {
    reset();
  }

  const giveUp = () => {
    doGameOver();
  }

  const bindKey = (binding: string) => {
    bindControlKey(binding);
  }

  const changeBoardSize = (e: InputEvent & { currentTarget: HTMLSelectElement; target: Element; }) => {
    const configName = e.currentTarget.value;
    const config = Settings.getBoardConfigByName(configName);
    setBoardConfig(config);
    Settings.saveBoardConfig(config);
    e.currentTarget.blur();
  }

  const changeGameMode = (e: InputEvent & { currentTarget: HTMLSelectElement; target: Element; }) => {
    const modeName = e.currentTarget.value;
    const gameMode = Settings.getGameModeByName(modeName);
    setGameMode(gameMode);
    Settings.saveGameMode(gameMode);
    e.currentTarget.blur();
  }

  createEffect(() => {
    if (gameState()) {
      setKeyBinding(Settings.getKeyBinding());
    }
  });

  createEffect(() => {
    const hiscore = Number.parseInt(sessionStorage.getItem('hiScore') || '0');
    if (gameState().score > hiscore) {
      sessionStorage.setItem('hiScore', `${gameState().score}`);
      sessionStorage.setItem('hiScoreDate', `${new Date().getTime()}`);
      setHiScore(getHiScore());
    }
  });

  createRenderEffect<number>((prevScore) => {
    const current = gameState();
    const diff = TilesUtils.roundPoints(current.score - prevScore);
    const diffArray = scoreDiff();
    if (diff > 0) {
      diffArray.push({ score: diff });
      setScoreDiff([...diffArray]);
    }
    return current.score;
  }, gameState().score);

  const removeScoreDiff = (index: number) => {
    const diffArray = scoreDiff();
    diffArray.splice(index, 1);
    setScoreDiff([...diffArray]);
  }

  const onGameLoaded = (save: SaveGame) => {
    useSavedGame(save);
  }
  
  // speed up rendering a little?
  const renderScreen = () => <For each={screen().reduce((pixels, currentRow) => pixels.concat(currentRow.pixels), new Array<Pixel>())}>
    {(pixel, pindex) => <PixelComponent pixel={pixel} difficulty={difficulty()} />}
  </For>
  
  return (
    <div class={styles.App}>
      <header class={styles.header}>
        Game mode:
        <select value={gameMode().name} onInput={e => changeGameMode(e)} disabled={!gameState().isGameOver}>
          <For each={Settings.getGameModes()}>{
            config => <option value={config.name}>{config.name}</option>
          }</For>
        </select>

        Board size:
        <select value={boardConfig().name} onInput={e => changeBoardSize(e)} disabled={!gameState().isGameOver}>
          <For each={Settings.getBoardConfigs()}>{
            config => <option value={config.name}>{config.name}</option>
          }</For>
        </select>
        <Show when={gameMode().mode === EGameMode.CLASSIC}>
          Level:
          <span><b>{difficulty().name}</b></span>
          <span class={styles.smallText}>(speed: {difficulty().gameTick}ms/drop)</span>
          <span class={styles.smallText}>Advance every 5000 pts</span>
        </Show>
      </header>

      <div class={styles.content}>
        <GameStateOverlay gameState={gameState} />
        <LoadGameModal onGameLoaded={onGameLoaded} />
        <div class={styles.info}>
          <p><b>Score: {gameState().score}</b></p>
          <p>Hi Score: {hiScore()}</p>
          <div class={styles.nextTile}>Next Tile: </div>
          <div class={styles.nextTile} style={{
            "grid-template-columns": `repeat(${nextTile().width - 1}, 1fr) minmax(0, 1fr)`
          }}>
            {nextTile().block.map((row) => row.map((pixel) => (<PixelComponent pixel={pixel} difficulty={difficulty()} />)))}
          </div>
          <Show when={gameState().isGameOver}>
            <button onclick={newGame}>New Game</button>
          </Show>
          <Show when={!gameState().isGameOver}>
            <button onclick={giveUp}>Give Up</button>
          </Show>
          <Show when={gameMode().mode === EGameMode.ARCADE}>
            <ArcadeLegend></ArcadeLegend>
          </Show>
        </div>

        <For each={scoreDiff()}>
          {(item, index) =>
            <AnimableElement onAnimEnd={() => removeScoreDiff(index())} animInClass={styles.score}>{item.score}<Show when={item.message}><br/>{item.message}</Show></AnimableElement>}
        </For>

        <div class={styles.tetris} style={{
          "grid-template-columns": `repeat(${screen()[0].pixels.length - 1}, 1fr) minmax(0, 1fr)`
        }}>
          {renderScreen()}
        </div>

        <div class={styles.help}>
          <p>Controls:<br /><small>(click selected row to reassign)</small></p>
          <div class={styles.controlKey} onclick={() => bindKey('left')}>Left: {keyBinding().left}</div>
          <div class={styles.controlKey} onclick={() => bindKey('right')}>Right: {keyBinding().right}</div>
          <div class={styles.controlKey} onclick={() => bindKey('down')}>Down: {keyBinding().down}</div>
          <div class={styles.controlKey} onclick={() => bindKey('rotate')}>Rotate: {keyBinding().rotate}</div>
          <div class={styles.controlKey} onclick={() => bindKey('pause')}>Pause: {keyBinding().pause}</div>
        </div>
      </div>

      <footer class={styles.footer}>
        <a href="https://github.com/pawel-mika/solid-tetris">Solid Tetris</a>, Work in progress, version: {__APP_VERSION__}, build: {__COMMIT_HASH__}, on: {__BUILD_DATE__}
      </footer>
    </div>
  );
};

export default TetrisPage;
