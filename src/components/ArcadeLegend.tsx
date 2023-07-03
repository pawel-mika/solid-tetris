import { Component, For } from 'solid-js';
import { PerkType } from '../model/Perk';
import { Pixel, PixelType } from '../model/Pixel';
import PerkFactory from '../utils/PerkFactory';
import ScreenUtils from '../utils/ScreenUtils';
import Settings from '../utils/Settings';
import PixelComponent from './Pixel';
import styles from './ArcadeLegend.module.scss';

interface LegendItem {
    perkPixel: Pixel;
    description: string;
}

const ArcadeLegend: Component = () => {

    const getLegendItem = (perkType: PerkType, description: string): LegendItem => ({
        perkPixel: {
            ...ScreenUtils.createPixel(PixelType.TAKEN),
            perk: { ...PerkFactory.getRandomPerk(), perkType }
        },
        description
    });

    const legend: Array<LegendItem> = [
        getLegendItem(PerkType.REMOVE_ROW_BELOW, 'Remove one row below'),
        getLegendItem(PerkType.REMOVE_ROW_ABOVE, 'Remove one row above'),
        getLegendItem(PerkType.REMOVE_EVEN_ROWS, 'Remove even rows'),
        getLegendItem(PerkType.POINT_MULTIPLIER, 'Point multiplier per cleared rows'),
        getLegendItem(PerkType.CLEAR_BOARD, 'Clear the whole board')
    ];

    legend.forEach((li) => li.perkPixel.perk?.setPaused(true));

    return (<div class={styles.legend}>Perks legend:
        <For each={legend}>{(li) =>
            <div class={styles.legendItem}>
                <PixelComponent pixel={li.perkPixel} difficulty={Settings.getDifficulties()[0]}></PixelComponent>
                <span>{li.description}</span>
            </div>}
        </For>
    </div>);
}

export default ArcadeLegend;
