import { Component, createMemo, Show } from 'solid-js';
import { Difficulty } from '../Settings';
import { Pixel, PixelType } from '../TetrisBoard';
import AnimableElement, { AnimableEvent } from './AnimableElement';
import styles from './Pixel.module.scss';

const PixelComponent: Component<{ pixel: Pixel, difficulty: Difficulty }> = (props) => {

    const renderPoints = (pixel: Pixel) => (
        <Show when={pixel.points !== 0}>
            <div class={styles.pointsWrapper}>
            {pixel.points}
            </div>
            {/* <AnimableElement animOutClass={styles.pointsWrapper}
                // onAnimStart={(e:AnimableEvent) => {console.log('start', e) ; pixel.points = 0;}} 
                onAnimEnd={(e: AnimableEvent) => { console.log('end - settings points to 0', e); pixel.points = 0; }}>
                <span>{pixel.points}</span>
            </AnimableElement> */}
        </Show>);

    const setRandomRemovingAnimation = (pixel: Pixel) => {
        const anims = [styles['pixels-out-1'], styles['pixels-out-2']];
        const anim = anims[Math.floor(Math.random() * anims.length)];
        pixel.style = { ...pixel.style, 'animation-name': anim, 'animation-duration': `${props.difficulty.gameTick / 1000}s` };
        return pixel;
    }

    if (props.pixel.type === PixelType.REMOVING) {
        props.pixel = setRandomRemovingAnimation(props.pixel);
    }

    return (<div class={styles.pixelWrapper}>
        {renderPoints(props.pixel)}
        <div classList={{
            [styles.pixel]: true,
            [styles.p1]: props.pixel.type === PixelType.TAKEN,
            [styles.p2]: props.pixel.type === PixelType.REMOVING
        }}
            style={props.pixel.type !== PixelType.EMPTY ? props.pixel.style : {}}>
        </div>
    </div>)
}

export default PixelComponent;