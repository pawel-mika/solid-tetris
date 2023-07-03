import { Accessor, Component, createEffect, createSignal } from 'solid-js';
import { GameState } from '../game/TetrisBoard';

import styles from './GameState.module.scss';
import Modal from './Modal';

const GameStateOverlay: Component<{ gameState: Accessor<GameState> }> = (props) => {

  const gameState = props.gameState;

  const [bindKeyValue, setBindKeyValue] =  createSignal<string>();

  createEffect(() => {
    if(gameState().bindKey) {
      setBindKeyValue(gameState().bindKey);
    }
  });

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