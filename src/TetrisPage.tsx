import { Component, createEffect, createSignal, onCleanup, onMount, Show } from "solid-js";
import Settings, { KeyBinding } from "./Settings";
import createTetrisBoard, { Pixel, PixelType, Row } from "./TetrisBoard";
import styles from './TetrisPage.module.scss';

declare const __COMMIT_HASH__: string;
declare const __BUILD_DATE__: string;

const TetrisPage: Component = () => {
  const getHiScore = () => sessionStorage.getItem('hiScore') || '0';

  const { width, screen, onKeyDown, pause, reset, gameState, bindControlKey, nextTile } = createTetrisBoard();

  const [hiScore, setHiScore] = createSignal<string>(getHiScore());
  const [keyBinding, setKeyBinding] = createSignal<KeyBinding>(Settings.getKeyBinding(), { equals: false });

  const renderPixel = (pixel: Pixel) => (<div classList={{
    [styles.pixel]: true,
    [styles.p1]: pixel.type === PixelType.TAKEN,
    [styles.p2]: pixel.type === PixelType.REMOVING
  }}
    style={pixel.type === PixelType.TAKEN ? pixel.style : {}}>{pixel?.type}
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
    console.log(binding);
    bindControlKey(binding);
  }

  createEffect(() => {
    if (gameState()) {
      console.log(Settings.getKeyBinding());
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
        WorkInProgress | level (speed): 0
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
          "grid-template-columns": `repeat(${width - 1}, 1fr) minmax(0, 1fr)`
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
        build: {__COMMIT_HASH__} on: {__BUILD_DATE__}
      </footer>
    </div>
  );
};

export default TetrisPage;