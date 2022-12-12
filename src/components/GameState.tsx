import { Accessor, Component, createMemo } from 'solid-js';
import { GameState } from '../TetrisBoard';

import styles from './GameState.module.scss';
import Modal from './Modal';

const GameStateOverlay: Component<{ gameState: Accessor<GameState> }> = (props) => {

  const gameState = props.gameState;

  const bindKeyValue = createMemo((prev?: string) => prev !== undefined ? prev : gameState().bindKey);

  return (<span class={styles.gameState}>
    <Modal show={gameState().isGameOver} hide={!gameState().isGameOver}>
      <span>Game Over</span>
    </Modal>
    <Modal show={gameState().isPaused && !gameState().bindKey} hide={!(gameState().isPaused && !gameState().bindKey && !gameState().isGameOver)}>
      <span>Paused</span>
    </Modal>
    <Modal show={!!gameState().bindKey} hide={!gameState().bindKey}>
      <span>Press key for '{bindKeyValue()}'</span>
    </Modal>
  </span>)
}

export default GameStateOverlay;