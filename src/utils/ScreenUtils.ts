import { PerkType } from '../model/Perk';
import { Pixel, PixelType } from "../model/Pixel";
import { Row } from '../model/Row';
import { TScreen } from '../model/Screen';

class ScreenUtils {
    private static instance: ScreenUtils;

    private static createNewInstance(): ScreenUtils {
        this.instance = new ScreenUtils();
        return this.instance;
    }

    public static getInstance(): ScreenUtils {
        return this.instance ? this.instance : this.createNewInstance();
    }

    public createPixel = (type = PixelType.EMPTY): Pixel => ({ type, id: `${Math.random()}` });

    public getTakenPixels(screen: TScreen): Array<Pixel> {
        return screen.reduce((acc, rows) => [...acc, ...rows.pixels.filter((pixel) => pixel.type !== PixelType.EMPTY)], new Array<Pixel>());
    }

    public getTakenPixelsCount(screen: TScreen): number {
        return this.getTakenPixels(screen).length;
    }

    public markLinesToRemove(screen: TScreen, boardWidth: number): TScreen {
        return screen.map((row, rowIndex) => {
            const taken = row.pixels.filter(({ type }) => type !== PixelType.EMPTY).length;
            const pixelsWithPerks = row.pixels.filter(({perk}) => perk);
            const hasPerks = pixelsWithPerks.length > 0;
            if (!hasPerks && taken === boardWidth) {
                this.markLineToRemove(row, rowIndex);
            } else if(hasPerks && taken === boardWidth) {
                const perkActions = {
                    [PerkType.REMOVE_ROW_ABOVE]: () => rowIndex > 0 && this.markLineToRemove(screen[rowIndex - 1], rowIndex - 1),
                    [PerkType.REMOVE_ROW_BELOW]: () => rowIndex < screen.length - 1 && this.markLineToRemove(screen[rowIndex + 1], rowIndex + 1),
                    [PerkType.REMOVE_EVEN_ROWS]: () => this.markEvenLinesToRemove(screen),
                    [PerkType.POINT_MULTIPLIER]: () => this.markLineToRemove(row, rowIndex),
                    [PerkType.CLEAR_BOARD]: () => this.markAllLinesToRemove(screen),
                  };
                pixelsWithPerks.forEach((pixel) => {
                    if (pixel.perk?.perkType && pixel.perk?.perkType in perkActions) {
                        perkActions[pixel.perk?.perkType]();
                    }
                });
                this.markLineToRemove(row, rowIndex);
            }
            return row;
        });
    }

    private markLineToRemove(row: Row, idx: number): void {
        console.log(`Marking line to remove:`, idx)
        row.pixels = row.pixels.map((pixel) => pixel.type === PixelType.TAKEN ? ({...pixel, type: PixelType.REMOVING}) : pixel);
    }

    private markEvenLinesToRemove(screen: TScreen): void {
        screen.forEach((row: Row, index: number) => {
            if (index % 2 === 0) {
                this.markLineToRemove(row, index);
            }
        });
    };

    private markAllLinesToRemove(screen: TScreen): void {
        screen.forEach((row: Row, idx: number) => this.markLineToRemove(row, idx));
    }
}

export default ScreenUtils.getInstance();
