import {describe, expect, it} from "@jest/globals";
import {decodeIFOPT} from "./IFOPT.ts";

describe('IFOPT', () => {
    it('should parse IFOPT code', () => {
        const ifopt = decodeIFOPT('at:45:50034:0:1')
        expect(ifopt.country).toEqual('at')
        expect(ifopt.municipality).toEqual('45')
        expect(ifopt.stop).toEqual('50034')
        expect(ifopt.area).toEqual('0')
        expect(ifopt.platform).toEqual('1')
    })
})