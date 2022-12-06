import { mergeProps, ParentComponent, ParentProps } from 'solid-js';
// import styles from './AnimableElement.module.scss';

export declare type AnimableProps = {
    animInClass?: string;
    animOutClass?: string;
    onAnimStart?: (e: AnimableEvent) => void;
    onAnimEnd?: (e: AnimableEvent) => void;
    // show: boolean;
    // hide: boolean;
}

export declare type AnimableEvent = AnimationEvent & {
    currentTarget: HTMLElement;
    target: Element;
}

enum SignalType {
    ANIM_START,
    ANIM_END,
    TRANSITION_START,
    TRANSITION_END
}

const AnimableElement: ParentComponent<ParentProps & AnimableProps> = (props) => {
    const merged = mergeProps({onAnimStart: () => {}, onAnimEnd: () => {}}, props);

    const fireSignal = (type: SignalType, e: AnimableEvent) => {
        // console.log(type, e);
        const animName = e.animationName;

        // TODO - BAD - fix it
        switch(type) {
            case SignalType.ANIM_START:
                merged.onAnimStart(e);
                break;
            case SignalType.ANIM_END:
                merged.onAnimEnd(e);
                break;
        }
    };

    return (<div classList={{
        [props.animInClass ?? '']: true,
        [props.animOutClass ?? '']: true
    }} 
    onanimationstart={(e) => fireSignal(SignalType.ANIM_START, e)}
    onanimationend={(e) => fireSignal(SignalType.ANIM_END, e)}
    >{props.children ?? `Animable`}</div>);
}

export default AnimableElement;
