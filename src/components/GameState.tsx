import { Accessor, Component } from 'solid-js';
import { GameState } from '../TetrisBoard';

import styles from './GameState.module.scss';

const GameStateOverlay: Component<{ gameState: Accessor<GameState> }> = (props) => {

    const gameState = props.gameState;

    return (<span class={styles.gameState}>
        <div classList={{
          [styles.gameOver]: true,
          [styles['animate-in']]: gameState().isGameOver,
          [styles['animate-out']]: !gameState().isGameOver
        }}><span>Game Over</span></div>
        <div classList={{
          [styles.paused]: true,
          [styles['animate-in']]: gameState().isPaused && !gameState().bindKey,
          [styles['animate-out']]: !(gameState().isPaused && !gameState().bindKey && !gameState().isGameOver)
        }}><span>Paused</span></div>
        <div classList={{
          [styles.bindKey]: true,
          [styles['animate-in']]: !!gameState().bindKey,
          [styles['animate-out']]: !gameState().bindKey
        }}><span>Press key for '{gameState().bindKey}'</span></div>
    </span>)
}

export default GameStateOverlay;