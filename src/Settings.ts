export interface KeyBinding {
  [rotate: string]: string;
  left: string;
  right: string;
  down: string;
  pause: string;
  newGame: string;
  drop: string;
}

export interface BoardConfig {
  name: string;
  width: number;
  height: number;
}

export interface Difficulty {
    name: string;
    gameTick: number;
}

class Settings {
  private static instance: Settings;

  private boardConfigs: Array<BoardConfig> = new Array<BoardConfig>({
    name: "Regular",
    width: 10,
    height: 20,
  }, {
    name: "Medium",
    width: 12,
    height: 24,
  }, {
    name: "Large",
    width: 14,
    height: 28,
  });

  private difficulties: Array<Difficulty> = new Array<Difficulty>({
    name: 'Easy',
    gameTick: 1000
  }, {
    name: 'Medium',
    gameTick: 750,
  }, {
    name: 'Hard',
    gameTick: 500,
  });

  private keyBindingPrefix = "settings.kb.";
  private keyBinding: KeyBinding = {
    rotate: "ArrowUp",
    right: "ArrowRight",
    left: "ArrowLeft",
    down: "ArrowDown",
    pause: "p",
    newGame: "n",
    drop: "Space",
  };

  public setKeyBinding(control: string, key: string): void {
    this.keyBinding[control] = key;
  }

  public getKeyBinding(): KeyBinding {
    this.loadKeyBindings();
    return this.keyBinding;
  }

  public getBoardConfigs(): Array<BoardConfig> {
    return this.boardConfigs;
  }

  public getDifficulties(): Array<Difficulty> {
    return this.difficulties;
  }

  private loadKeyBindings(): void {
    Object.getOwnPropertyNames(this.keyBinding).forEach((key: string) => {
      this.keyBinding[key] =
        sessionStorage.getItem(`${this.keyBindingPrefix}${key}`) ||
        this.keyBinding[key];
    });
  }

  public saveKeyBindings(): void {
    Object.getOwnPropertyNames(this.keyBinding).forEach((key: string) => {
      sessionStorage.setItem(
        `${this.keyBindingPrefix}${key}`,
        this.keyBinding[key]
      );
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
