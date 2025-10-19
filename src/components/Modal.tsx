import { createEffect, createSignal, ParentComponent, ParentProps } from 'solid-js';
import styles from './Modal.module.scss';

export declare type ModalProps = {
    showClass?: string;
    hideClass?: string;
    onHidden?: () => void;
    show: boolean;
    hide: boolean;
}

const Modal: ParentComponent<ParentProps & ModalProps> = (props) => {
    const [isInitialized, setIsInitialized] = createSignal(false);
    createEffect(() => {
        if (props.show) {
             setIsInitialized(true);
        }
    });

    return (
        <div class={styles.modal}>
            <div class={styles.modalBody} classList={{
                [props.showClass ?? styles['animate-in']]: props.show && isInitialized(),
                [props.hideClass ?? styles['animate-out']]: props.hide && isInitialized()
            }}>
                <span>{props.children ?? `default modal content...`}</span>
            </div>
        </div>
    );
}

export default Modal;