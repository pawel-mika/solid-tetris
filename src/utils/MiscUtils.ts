class MiscUtils {
    private static instance: MiscUtils;

    private static createNewInstance(): MiscUtils {
        this.instance = new MiscUtils();
        return this.instance;
    }

    public static getInstance(): MiscUtils {
        return this.instance ? this.instance : this.createNewInstance();
    }

    public getRandom(from: number = 0 , to: number = 1, roundToDecimals: number = 2): number {
        const diff = to - from;
        return Number(((Math.random() * diff) + from).toFixed(roundToDecimals));
    }
}

export default MiscUtils.getInstance();
