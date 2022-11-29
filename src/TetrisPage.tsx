import { Component, createEffect, createSignal, onCleanup, onMount, Show } from "solid-js";
// import appStyles from './App.module.scss';
import createTetrisBoard, { Pixel, PixelType, Row } from "./TetrisBoard";
import styles from './TetrisPage.module.scss';

const TetrisPage: Component = () => {
  const getHiScore = () => sessionStorage.getItem('hiScore') || '0';

  const { width, screen, onKeyDown, pause, reset, gameState } = createTetrisBoard();

  const [hiScore, setHiScore] = createSignal<string>(getHiScore());

  const renderPixel = (pixel: Pixel) => (<div classList={{
    [styles.pixel]: true,
    [styles.p1]: pixel.type === PixelType.TAKEN,
    [styles.p2]: pixel.type === PixelType.REMOVING
  }}
    style={pixel.style}>{pixel?.type}
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

  createEffect(() => {
    const hiscore = Number.parseInt(sessionStorage.getItem('hiScore') || '0');
    if (gameState().score > hiscore) {
      sessionStorage.setItem('hiScore', `${gameState().score}`);
      sessionStorage.setItem('hiScoreDate', `${new Date().getTime}`);
      setHiScore(getHiScore());
    };
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
            [styles['animate-in']]: true}}><span>Game Over</span></div>
        </Show>
        <Show when={gameState().isPaused}>
          <div classList={{
            [styles.paused]: true, 
            [styles['animate-in']]: true}}><span>Paused</span></div>
        </Show>

        <div class={styles.info}>
          <p><b>Score: {gameState().score}</b></p>
          <p>Hi Score: {hiScore()}</p>
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
          <p>
            Movement: arrow keys - left/right/down
          </p>
          <p>
            Rotate: arrow up
          </p>
          <p>
            Pause: p
          </p>
        </div>
      </div>
      <footer class={styles.footer}>
      </footer>
    </div>
  );
};

export default TetrisPage;