import { createSignal } from 'solid-js';
import { Perk, PerkProbabilityWeight, PerkType } from '../model/Perk';
import MiscUtils from './MiscUtils';

class PerkFactory {
    private static instance: PerkFactory;

    // array of arrays of perks and their probability of being drawn
    private perkProbabilityWeights: Array<PerkProbabilityWeight> = [
        { perkType: PerkType.POINT_MULTIPLIER, probability: 30 },
        { perkType: PerkType.REMOVE_ROW_ABOVE, probability: 31 },
        { perkType: PerkType.REMOVE_ROW_BELOW, probability: 31 },
        { perkType: PerkType.REMOVE_EVEN_ROWS, probability: 6 },
        { perkType: PerkType.GRAVITY_CASCADE, probability: 200 },
        { perkType: PerkType.CLEAR_BOARD, probability: 2 }
    ];

    private getRandomPerkType(): PerkType {
        const perksTable = this.perkProbabilityWeights
            .map(({probability, perkType}) => Array(probability).fill(perkType))
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
