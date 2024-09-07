import {H3Index, H3IndexInput} from "h3-js";

export class H3Cell {
    constructor(public buffer: ArrayBuffer = new ArrayBuffer(8)) {
    }

    fromIndex(index: H3Index) {
        const dataView = new DataView(this.buffer)
        dataView.setBigUint64(0, BigInt('0x' + index), true)
    }

    toIndex(): H3Index {
        const dataView = new DataView(this.buffer)
        return dataView.getBigUint64(0, true).toString(16)
    }

    toIndexInput(): H3IndexInput {
        const dataView = new DataView(this.buffer)

        return [
            dataView.getUint32(0, true),
            dataView.getUint32(4, true),
        ]
    }
}

