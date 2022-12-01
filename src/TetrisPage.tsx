import { Component, createEffect, createSignal, For, onCleanup, onMount, Show } from "solid-js";
import Settings, { KeyBinding } from "./Settings";
import createTetrisBoard, { Pixel, PixelType, Row } from "./TetrisBoard";
import styles from './TetrisPage.module.scss';

declare const __APP_VERSION__: string;
declare const __COMMIT_HASH__: string;
declare const __BUILD_DATE__: string;

const TetrisPage: Component = () => {
  const getHiScore = () => sessionStorage.getItem('hiScore') || '0';

  const {
    screen,
    onKeyDown,
    pause,
    reset,
    gameState,
    bindControlKey,
    nextTile,
    boardConfig,
    setBoardConfig
  } = createTetrisBoard();

  const [hiScore, setHiScore] = createSignal<string>(getHiScore());
  const [keyBinding, setKeyBinding] = createSignal<KeyBinding>(Settings.getKeyBinding(), { equals: false });

  const renderPixel = (pixel: Pixel) => (<div classList={{
    [styles.pixel]: true,
    [styles.p1]: pixel.type === PixelType.TAKEN,
    [styles.p2]: pixel.type === PixelType.REMOVING
  }}
    style={pixel.type !== PixelType.EMPTY ? pixel.style : {}}>
  </div>)

  const renderRow = (row: Row) => row.pixels.map((pixel) => renderPixel(pixel));

  onMount(() => {
    document.addEventListener('keydown', onKeyDown);
  });

  onCleanup(() => {
    document.removeEventListener('keydown', onKeyDown);
    pause();
  });

  const newGame = () => {
    reset();
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

  return (
    <div class={styles.App}>
      <header class={styles.header}>
        Board size:
        <select value={boardConfig().name} onInput={e => changeBoardSize(e)}>
          <For each={Settings.getBoardConfigs()}>{
            config => <option value={config.name}>{config.name}</option>
          }</For>
        </select>
        <span class={styles.smallText}>Warning!<br />will reset the board!</span>
      </header>

      <div class={styles.content}>
        <Show when={gameState().isGameOver}>
          <div classList={{
            [styles.gameOver]: true,
            [styles['animate-in']]: true
          }}><span>Game Over</span></div>
        </Show>
        <Show when={gameState().isPaused && !gameState().bindKey}>
          <div classList={{
            [styles.paused]: true,
            [styles['animate-in']]: true
          }}><span>Paused</span></div>
        </Show>
        <Show when={gameState().bindKey}>
          <div classList={{
            [styles.paused]: true,
            [styles['animate-in']]: true
          }}><span>Press key for '{gameState().bindKey}'</span></div>
        </Show>

        <div class={styles.info}>
          <p><b>Score: {gameState().score}</b></p>
          <p>Hi Score: {hiScore()}</p>
          <div class={styles.nextTile}>Next Tile: </div>
          <div class={styles.nextTile} style={{
            "grid-template-columns": `repeat(${nextTile().width - 1}, 1fr) minmax(0, 1fr)`
          }}>
            {nextTile().block.map((row) => renderRow({ pixels: row }))}
          </div>
          <Show when={gameState().isGameOver}>
            <button onclick={newGame}>New Game</button>
          </Show>
        </div>

        <div class={styles.tetris} style={{
          "grid-template-columns": `repeat(${screen()[0].pixels.length - 1}, 1fr) minmax(0, 1fr)`
        }}>
          {screen().map((row) => renderRow(row))}
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