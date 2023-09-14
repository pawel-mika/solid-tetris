import { Accessor, Setter, Signal } from 'solid-js';
import { JSX } from 'solid-js/jsx-runtime';

export enum PerkType {
  POINT_MULTIPLIER = 'point-multiplier',
  REMOVE_ROW_ABOVE = 'remove-row-above',
  REMOVE_ROW_BELOW = 'remove-row-below',
  GRAVITY_CASCADE = 'gravity-cascade',  // new
  REMOVE_EVEN_ROWS = 'remove-even-rows',
  CLEAR_BOARD = 'clear-board',
}
export interface Perk {
  perkType: PerkType;
  timeActive: number;
  multiplier?: number;
  isPaused: Accessor<boolean>;
  setPaused: Setter<boolean>;
  style?: JSX.CSSProperties;
}

export interface PerkProbabilityWeight {
  perkType: PerkType;
  probability: number;
}
