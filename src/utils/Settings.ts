import { EGameMode, GameMode } from '../model/GameState';
import { BoardConfig, Difficulty, KeyBinding } from '../model/Settings';

class Settings {
  private static instance: Settings;

  private boardConfigs: Array<BoardConfig> = new Array<BoardConfig>(
    {
      name: 'Regular',
      width: 10,
      height: 20,
    },
    {
      name: 'Medium',
      width: 12,
      height: 24,
    },
    {
      name: 'Large',
      width: 14,
      height: 28,
    }
  );

  private difficulties: Array<Difficulty> = new Array<Difficulty>(
    {
      name: 'Easy',
      gameTick: 1000,
    },
    {
      name: 'Medium',
      gameTick: 750,
    },
    {
      name: 'Hard',
      gameTick: 500,
    },
    {
      name: 'Ultra',
      gameTick: 250,
    },
    {
      name: 'Ridiculous',
      gameTick: 125,
    }
  );

  private keyBindingPrefix = 'settings.kb.';
  private keyBinding: KeyBinding = {
    rotate: 'ArrowUp',
    right: 'ArrowRight',
    left: 'ArrowLeft',
    down: 'ArrowDown',
    pause: 'p',
    newGame: 'n',
    drop: 'Space',
  };

  private gameModes: Array<GameMode> = new Array<GameMode>({
    name: 'Classic',
    mode: EGameMode.CLASSIC
  }, {
    name: 'Endless',
    mode: EGameMode.ENDLESS
  }, {
    name: 'Arcade',
    mode: EGameMode.ARCADE
  });

  public setKeyBinding(control: string, key: string): void {
    this.keyBinding[control] = key;
  }

  public getKeyBinding(): KeyBinding {
    this.loadKeyBindings();
    return this.keyBinding;
  }

  public getGameModes(): Array<GameMode> {
    return this.gameModes;
  }

  public getBoardConfigs(): Array<BoardConfig> {
    return this.boardConfigs;
  }

  public getBoardConfigByName(name: string): BoardConfig {
    return this.boardConfigs.find((bc) => bc.name === name) || this.boardConfigs[0];
  }

  public getGameModeByName(name: string): GameMode {
    return this.gameModes.find((gm) => gm.name === name) || this.gameModes[0];
  }

  public getDifficulties(): Array<Difficulty> {
    return this.difficulties;
  }

  public loadBoardConfig(): BoardConfig {
    return JSON.parse(sessionStorage.getItem('settings.boardConfig') || 'null') || this.boardConfigs[0];
  }

  public saveBoardConfig(boardConfig: BoardConfig): void {
    sessionStorage.setItem('settings.boardConfig', JSON.stringify(boardConfig));
  }

  public loadGameMode(): GameMode {
    return JSON.parse(sessionStorage.getItem('settings.gameMode') || 'null') || this.gameModes[0];
  }

  public saveGameMode(gameMode: GameMode): void {
    sessionStorage.setItem('settings.gameMode', JSON.stringify(gameMode));
  }

  private loadKeyBindings(): void {
    Object.getOwnPropertyNames(this.keyBinding).forEach((key: string) => {
      this.keyBinding[key] = sessionStorage.getItem(`${this.keyBindingPrefix}${key}`) || this.keyBinding[key];
    });
  }

  public saveKeyBindings(): void {
    Object.getOwnPropertyNames(this.keyBinding).forEach((key: string) => {
      sessionStorage.setItem(`${this.keyBindingPrefix}${key}`, this.keyBinding[key]);
    });
  }

  private static createNewInstance(): Settings {
    this.instance = new Settings();
    return this.instance;
  }

  public static getInstance(): Settings {
    return this.instance ? this.instance : this.createNewInstance();
  }
}

export default Settings.getInstance();
