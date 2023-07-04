        // alternate mixin
        // const newScreen = screen.map(row => ({ pixels: row.pixels.map(p => p) }));
        // for(let tTop = 0; tTop < theTile.height; tTop++) {
        //     for(let tLeft = 0; tLeft < theTile.width; tLeft++) {
        //         if(theTile.block[tTop][tLeft].type !== PixelType.EMPTY) {
        //             newScreen[tTop+theTile.height].pixels[tLeft+theTile.left] = theTile.block[tTop][tLeft];
        //         }
        //     }
        // }

        // alternate mixin
        // const newScreen = screen.map(row => ({ pixels: row.pixels.map(p => p) }));
        // for(let sTop = 0; sTop < BOARD_HEIGHT; sTop++) {
        //     for(let sLeft = 0; sLeft < BOARD_WIDTH; sLeft++) {
        //         const ty = sTop - theTile.top;
        //         const tx = sLeft - theTile.left;
        //         const tpixel = theTile.block[ty]?.[tx];
        //         newScreen[sTop].pixels[sLeft] = tpixel && tpixel.type !== PixelType.EMPTY ? tpixel : screen[sTop].pixels[sLeft];
        //     }
        // }
        // return newScreen;