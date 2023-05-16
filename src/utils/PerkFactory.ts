import { createSignal } from 'solid-js';
import { Perk, PerkType } from '../model/Perk';
import MiscUtils from './MiscUtils';

class PerkFactory {
    private static instance: PerkFactory;

    // array of arrays of perks and their probability of being drawn
    private perksProbabilityWeigth: Array<[PerkType, number]> = [
        [PerkType.POINT_MULTIPLIER, 30],
        [PerkType.REMOVE_ROW_ABOVE, 31],
        [PerkType.REMOVE_ROW_BELOW, 31],
        [PerkType.REMOVE_EVEN_ROWS, 6],
        [PerkType.CLEAR_BOARD, 2]
    ];

    private getRandomPerkType(): PerkType {
        const perksTable = this.perksProbabilityWeigth
            .map((val) => Array(val[1]).fill(val[0]))
            .reduce((acc, val) => acc.concat(val), []);
        const randomIndex = MiscUtils.getRandom(0, perksTable.length - 1, 0);
        return perksTable[randomIndex];
    }

    public getRandomPerk(): Perk {
        const [isPaused, setPaused] = createSignal<boolean>(false);
        return {
            perkType: this.getRandomPerkType(),
            timeActive: MiscUtils.getRandom(15, 30, 1),
            multiplier: MiscUtils.getRandom(1, 3, 1),
            isPaused,
            setPaused
        };
    }

    private static createNewInstance(): PerkFactory {
        this.instance = new PerkFactory();
        return this.instance;
    }

    public static getInstance(): PerkFactory {
        return this.instance ? this.instance : this.createNewInstance();
    }
}

export default PerkFactory.getInstance();
