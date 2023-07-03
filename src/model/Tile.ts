import { Pixel } from './Pixel';

export type TBlock = Array<Array<Pixel>>;

export interface Tile {
  block: TBlock;
  top: number;
  left: number;
  width: number;
  height: number;
  possibleTop?: number;
  possibleLeft?: number;
}
