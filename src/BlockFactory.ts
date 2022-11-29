class BlockFactory {
    private static instance: BlockFactory;

    private blocks = Array<Array<Array<number>>>(
        [
            [1, 1, 1, 1]
        ],
        [
            [1, 1 ,1],
            [1, 0, 0]
        ],
        [
            [1, 0, 0],
            [1, 1 ,1]
        ],
        [
            [1, 1 ,1],
            [0, 1, 0]
        ],
        [
            [0, 1 ,1],
            [1, 1, 0]
        ],
        [
            [1, 1, 0],
            [0, 1 ,1]
        ],
        [
            [1, 1],
            [1, 1]
        ]
        // debug block
        //  [
        //     [1, 1, 1, 1, 1],
        //     [1, 1, 1, 1, 1]
        // ]
    )

    public getRandomBlock() {
        const idx = Math.floor(Math.random() * this.blocks.length);
        return this.blocks[idx];
    }

    public getBlockWidth(block: Array<Array<unknown>>): number {
        return block.reduce((p, c) => p > c.length ? p : c.length, 0);
    }

    public rotateBlockCW(block: Array<Array<unknown>>) {
        const newHeight = this.getBlockWidth(block);
        const newWidth = block.length;
        return Array(newHeight).fill([]).map(
            (ry, iy) => Array(newWidth).fill([]).map(
                (rx, ix) => block[ix][iy]).reverse().map(x => x ? x : 0));
    }

    public rotateBlockCCW(block: Array<Array<unknown>>) {
        const newHeight = this.getBlockWidth(block);
        const newWidth = block.length;
        return Array(newHeight).fill([]).map(
            (ry, iy) => Array(newWidth).fill([]).map(
                (rx, ix) => block[ix][iy]).map(x => x ? x : 0)).reverse();
    }

    private static createNewInstance(): BlockFactory {
        this.instance = new BlockFactory();
        return this.instance;
    }

    public static getInstance(): BlockFactory {
        return this.instance ? this.instance : this.createNewInstance();
    }
}

export default BlockFactory.getInstance();