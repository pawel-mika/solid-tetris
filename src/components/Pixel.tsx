import { Component, Show, createEffect, createMemo, createSignal, mergeProps, onCleanup, onMount } from 'solid-js';
import { createTimer } from '../hooks/timer';
import { Perk, PerkType } from '../model/Perk';
import { Pixel, PixelType } from '../model/Pixel';
import { Difficulty } from '../model/Settings';
import styles from './Pixel.module.scss';

// problem: whenever the pixel element node is reattached in the DOM node tree 
// the perk animation restarts... :( no idea yet how to solve...
const PixelComponent: Component<{ pixel: Pixel, difficulty: Difficulty }> = (props) => {
    const [perk, setPerk] = createSignal<Perk | null>(null);

    const setRandomRemovingAnimation = (pixel: Pixel): Pixel => {
        const anims = [styles['pixels-out-1'], styles['pixels-out-2']];
        const anim = anims[Math.floor(Math.random() * anims.length)];
        pixel.style = { ...pixel.style, 'animation-name': anim, 'animation-duration': `${props.difficulty.gameTick / 1000}s` };
        return { ...pixel };
    }

    const setPerkTimeoutAnimation = (pixel: Pixel): Pixel => {
        if (!pixel.perk) {
            return pixel;
        }
        setPerk(pixel.perk);
        pixel.perk.style = { ...pixel.perk.style, 'animation-duration': `${pixel.perk?.timeActive}s` };
        createTimer(() => {
            console.log('## perk timed out, removing', pixel.perk);
            pixel.perk = undefined;
            setPerk(null);
        },
            (pixel.perk?.timeActive || 0) * 1000,
            pixel.perk?.isPaused);

        return pixel;
    }

    createEffect(() => {
        if (props.pixel.perk) {
            props = mergeProps({pixel: setPerkTimeoutAnimation(props.pixel)}, props);
        }
        if (props.pixel.type === PixelType.REMOVING) {
            props = mergeProps({pixel: setRandomRemovingAnimation(props.pixel)}, props);
        }
    });

    return (<div classList={{
        [styles.pixel]: true,
        [styles.p1]: props.pixel.type === PixelType.TAKEN,
        [styles.p2]: props.pixel.type === PixelType.REMOVING,
    }}
        style={props.pixel.type !== PixelType.EMPTY ? props.pixel.style : {}}>
        <Show when={perk()}>
            <div classList={{
                [styles.perk]: true,
                [styles[props.pixel.perk?.perkType || '']]: true
            }}></div>
            <div classList={{
                [styles.perk]: true,
                [styles['perk-timeout']]: true,
                [styles['perk-paused']]: props.pixel.perk?.isPaused()
            }}
                style={props.pixel.perk?.style}></div>
            <Show when={perk()?.perkType === PerkType.POINT_MULTIPLIER}>
                <div classList={{ [styles.perk]: true, [styles['perk-overlay']]: true }}>{perk()?.multiplier}</div>
            </Show>
        </Show>
    </div>)
}

export default PixelComponent;
