import BlockFactory from "./BlockFactory";
import { Pixel, PixelType, Row, TBlock, Tile, TScreen } from "./TetrisBoard";

class TilesUtils {
    private static instance: TilesUtils;

    public convertBlock = (block: Array<Array<number>>): TBlock =>
        block.map((valArray) => valArray.map(val => val === 1
            ? { type: PixelType.TAKEN } : { type: PixelType.EMPTY }));

    public getRandomByte = () => Math.floor(Math.random() * 255).toString(16).padStart(2,'0');
    public getRandomColor = () => `#${this.getRandomByte()}${this.getRandomByte()}${this.getRandomByte()}`.substring(0, 7);

    public createNewTile = (block: TBlock): Tile => ({
        block,
        top: 0,
        left: 0,
        width: BlockFactory.getBlockWidth(block),
        height: block.length
    });

    public centerTile = (tile: Tile, screenWidth: number): Tile => {
        tile.left = Math.floor((screenWidth - BlockFactory.getBlockWidth(tile.block)) / 2);
        return tile;
    }

    public randomColorTile = (tile: Tile): Tile => {
        const color = this.getRandomColor();
        const style = { 'background-color': color };
        const block = tile.block.map((pixels) => pixels.map(pixel => ({ ...pixel, style })));
        return { ...tile, block };
    }

    /**
     * Compare two screens in terms of pixel.type only.
     * Returns true if the same, false for different screens.
     * @param screenA first screen to compare
     * @param screenB second screen to compare
     */
    public screenComparator(screenA: TScreen, screenB: TScreen): boolean {
        return screenA.find((row: Row, rIndex: number) => row.pixels.find((pixel: Pixel, pIndex: number) => pixel.type !== screenB[rIndex].pixels[pIndex].type)) === undefined;
    }

    private static createNewInstance(): TilesUtils {
        this.instance = new TilesUtils();
        return this.instance;
    }

    public static getInstance(): TilesUtils {
        return this.instance ? this.instance : this.createNewInstance();
    }
}

export default TilesUtils.getInstance();