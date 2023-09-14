import { JSX } from 'solid-js/jsx-runtime';
import { Perk } from './Perk';

export enum PixelType {
  EMPTY,
  TAKEN,
  REMOVING,
}

export interface Pixel {
  type: PixelType;
  style?: JSX.CSSProperties;
  points?: number;
  perk?: Perk;
  id?: string;  // unique pixel id for better DOM rendering purposes
  disposePerk?: () => void;
}
