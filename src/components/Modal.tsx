import { createEffect, createSignal, ParentComponent, ParentProps } from 'solid-js';
import styles from './Modal.module.scss';

export declare type ModalProps = {
    showClass?: string;
    hideClass?: string;
    onHidden?: () => void;
    show: boolean;
    hide: boolean;
}

/**
 * TODO Add animation/transition end callback to call `onHidden`
 * @param props 
 * @returns 
 */
const Modal: ParentComponent<ParentProps & ModalProps> = (props) => {

    // prevent first initial unwanted show
    const [initialPrevented, setInitialPrevented] = createSignal<boolean>();
    createEffect(() => {
        if (initialPrevented()) {
            return;
        }
        if (props.show) {
            setInitialPrevented(true)
        }
    });

    return (<div class={styles.modal}>
        <div class={styles.modalBody} classList={{
            [props.showClass ?? styles['animate-in']]: props.show && initialPrevented(),
            [props.hideClass ?? styles['animate-out']]: props.hide && initialPrevented()
        }}>
            <span>{props.children ?? `default modal content...`}</span>
        </div>
    </div>);
}

export default Modal;
