import {describe, expect, it} from "vitest";
import {H3Cell} from "./H3Cell";

describe('H3Cell', () => {
    it('should convert from hex and back', () => {
        const cell = new H3Cell();
        cell.fromIndex('8c2d55c256ac9ff')
        expect(cell.toIndex()).toEqual('8c2d55c256ac9ff')
    })
    it('should convert to little endian array', () => {
        const cell = new H3Cell();
        cell.fromIndex('8c2d55c256ac9ff')
        expect(cell.toIndexInput()).toEqual([
            627755519,
            146986332
        ])
    })
})