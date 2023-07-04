import { Pixel, PixelType } from "../model/Pixel";
import { Row } from '../model/Row';
import { TScreen } from '../model/Screen';
import { TBlock, Tile } from '../model/Tile';
import BlockFactory from "./BlockFactory";
import ScreenUtils from './ScreenUtils';

class TilesUtils {
    private static instance: TilesUtils;
    
    private static createNewInstance(): TilesUtils {
        this.instance = new TilesUtils();
        return this.instance;
    }

    public static getInstance(): TilesUtils {
        return this.instance ? this.instance : this.createNewInstance();
    }

    public convertBlock = (block: Array<Array<number>>): TBlock =>
        block.map((valArray) => valArray.map(val => val === 1
            ? ScreenUtils.createPixel(PixelType.TAKEN) : ScreenUtils.createPixel(PixelType.EMPTY)));

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

    public hasFullLines = (screen: TScreen): boolean => {
        return screen.find((row, index) => {
            const taken = row.pixels.filter(({ type }) => type !== PixelType.EMPTY).length;
            if (taken === row.pixels.length) {
                return row;
            }
            return null;
        }) != undefined;
    }

    public getFullLines(screen: TScreen): Array<Row> {
        return screen.filter((row: Row) => {
            const taken = row.pixels.filter(({ type }) => type !== PixelType.EMPTY).length;
            return taken === row.pixels.length;
        });
    }

    public getNonEmptyPixels = (tile: Tile): Array<Pixel> => {
        return tile.block.reduce((acc, rows) => [...acc, ...rows.filter((pixel) => pixel.type !== PixelType.EMPTY)], new Array<Pixel>());
    }

    public getNonEmptyPixelsLenght = (tile: Tile): number => {
        return this.getNonEmptyPixels(tile).length;
    }

    public roundPoints = (value: number) => Math.round(value * 100) / 100;
}

export default TilesUtils.getInstance();
