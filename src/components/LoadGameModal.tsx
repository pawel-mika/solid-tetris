import { Component, createSignal, onCleanup, onMount } from 'solid-js';
import { SaveGame } from '../hooks/saveGame';

import styles from './LoadGameModal.module.scss';
import { useLoadSavedGame, useRemoveSavedGame } from '../hooks/saveGame';
import Modal from './Modal';

const LoadGameModal: Component<{ onGameLoaded: (save: SaveGame) => void }> = (props) => {

    const [hasSaveGame, setHasSaveGame] = createSignal<SaveGame | null>();

    onMount(() => {
        setHasSaveGame(useLoadSavedGame());
        document.addEventListener('keydown', onKeyDown);
    });

    onCleanup(() => {
        document.removeEventListener('keydown', onKeyDown);
    });

    const onKeyDown = (e: KeyboardEvent) => {
        switch (e.key.toLowerCase()) {
            case 'y':
                props.onGameLoaded(useLoadSavedGame());
                removeSave();
                break;
            case 'n':
                removeSave();
                break;
        }
    }

    const removeSave = (): void => {
        useRemoveSavedGame();
        setHasSaveGame(null);
        document.removeEventListener('keydown', onKeyDown);
    }

    return (
        <Modal show={!!hasSaveGame()} hide={!hasSaveGame()}>
            <div class={styles.small}>
                <div>Looks like there's a saved game waiting for you.</div>
                <div>Do you want to load it?</div>
                <div>[y/n]</div>
            </div>
        </Modal>
    )
}

export default LoadGameModal;
