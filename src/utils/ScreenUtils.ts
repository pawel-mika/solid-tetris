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
                    [PerkType.GRAVITY_CASCADE]: () => this.applyGravityCascade(screen),
                    [PerkType.CLEAR_BOARD]: () => this.markAllLinesToRemove(screen),
                  };
                pixelsWithPerks.forEach((pixel) => {
                    if (pixel.perk?.perkType && pixel.perk?.perkType in perkActions) {
                        perkActions[pixel.perk?.perkType]();
                        // if(pixel.perk?.perkType !== PerkType.GRAVITY_CASCADE) {
                        //     this.markLineToRemove(row, rowIndex);
                        // }
                    }
                });
                this.markLineToRemove(row, rowIndex);
            }
            return row;
        });
    }

    private markLineToRemove(row: Row, idx: number): void {
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

    // ignore a line we've already cleared and came with gravity cascade from!?
    public applyGravityCascade(screen: TScreen): boolean {
        let somethingDropped = false;
        for (let row = screen.length - 1; row > 0; row--) {
            const rowPixels = screen[row].pixels;
            const abovePixels = screen[row - 1]?.pixels;
            if(!abovePixels) { continue; };
            for(let col = 0; col < rowPixels.length; col ++)  {
                if(rowPixels[col].type === PixelType.EMPTY && abovePixels[col].type !== PixelType.EMPTY) {
                    rowPixels[col] = abovePixels[col];
                    abovePixels[col] = this.createPixel(PixelType.EMPTY);
                    somethingDropped = true;
                }
            }
          }
          return somethingDropped ? this.applyGravityCascade(screen) : somethingDropped;
      }

      /**
       * 
       * @param initial screen/frame
       * @returns screen a frame of cascade or null if no more frames (all pixels dropped to the lowest)
       */
      public getGravityCascadeFrame(screen: TScreen): TScreen | null {
        let somethingDropped = false;
        for (let row = screen.length - 1; row > 0; row--) {
            const rowPixels = screen[row].pixels;
            const abovePixels = screen[row - 1]?.pixels;
            if(!abovePixels) { continue; };
            for(let col = 0; col < rowPixels.length; col ++)  {
                if(rowPixels[col].type === PixelType.EMPTY && abovePixels[col].type !== PixelType.EMPTY) {
                    rowPixels[col] = abovePixels[col];
                    abovePixels[col] = this.createPixel(PixelType.EMPTY);
                    somethingDropped = true;
                }
            }
          }
          return somethingDropped ? screen : null;
      }

      /**
       * @param framesStack an array of screen for anim with initial screen in 1 element
       * @returns an array of frames to animate
       */
      public prepareGravityCascadeAnim(framesStack: Array<TScreen | null> = new Array<TScreen>): Array<TScreen | null> {
        const screen = framesStack[framesStack.length - 1] as TScreen;
        let somethingDropped = false;
        if(screen === null) {
            return framesStack;
        }
        for (let row = screen.length - 1; row > 0; row--) {
            const rowPixels = screen[row].pixels;
            const abovePixels = screen[row - 1]?.pixels;
            if(!abovePixels) {
                continue;
            };
            for(let col = 0; col < rowPixels.length; col ++)  {
                if(rowPixels[col].type === PixelType.EMPTY && abovePixels[col].type !== PixelType.EMPTY) {
                    rowPixels[col] = abovePixels[col];
                    abovePixels[col] = this.createPixel(PixelType.EMPTY);
                    somethingDropped = true;
                }
            }
          }
          return somethingDropped ? this.prepareGravityCascadeAnim([...framesStack, this.cloneScreen(screen, true)]) : [...framesStack, null];
      }

      // * THIS IS BAD because it causes every perk to be restarted (new object, new reference:()
      public cloneScreen(screen: TScreen, copyPerks: boolean = false): TScreen {
        const copyScreen: TScreen = new Array();
        screen.forEach((row) => {
            const copyRow = { pixels: new Array<Pixel>()};
            row.pixels.forEach((pixel) => copyRow.pixels.push(copyPerks && pixel.perk ? pixel : {...pixel}));
            copyScreen.push(copyRow);
        });
        return copyScreen;
      }

      public logScreen(screen:TScreen): void {
        if(screen) {
            const screenString = screen.map((row) => `${row.pixels.map(({ type }) => type === PixelType.TAKEN ? 'X' : '.').join('')}\r\n`);
            console.log(screenString.join(''));
        }
      }
}

export default ScreenUtils.getInstance();
