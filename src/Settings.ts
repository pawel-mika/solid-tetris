export interface KeyBinding {
    [rotate: string]: string;
    left: string;
    right: string;
    down: string;
    pause: string;
    newGame: string;
    drop: string;
}

class Settings {
    private static instance: Settings;

    private keyBindingPrefix = 'settings.kb.';
    private keyBinding: KeyBinding = {
        rotate: 'ArrowUp',
        right: 'ArrowRight',
        left: 'ArrowLeft',
        down: 'ArrowDown',
        pause: 'p',
        newGame: 'n',
        drop: 'Space',
    }

    public setKeyBinding(control: string, key: string): void {
        this.keyBinding[control] = key;
    }

    public getKeyBinding(): KeyBinding {
        this.loadKeyBindings();
        return this.keyBinding;
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