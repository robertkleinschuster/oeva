import {cellToLatLng, greatCircleDistance, gridRingUnsafe, H3IndexInput, latLngToCell, UNITS} from "h3-js";
import {H3_RESOLUTION} from "../db/Schedule";
import {H3Cell} from "./H3Cell";

export function index2ArrayBuffer(cell: string) {
    const cellObj = new H3Cell();
    cellObj.fromIndex(cell)
    return cellObj.buffer
}

export function arrayBuffer2IndexInput(cell: ArrayBuffer): H3IndexInput {
    return new H3Cell(cell).toIndexInput()
}

export function latLngToCellArrayBuffer(lat: number, lon: number): ArrayBuffer {
    return index2ArrayBuffer(latLngToCell(lat, lon, H3_RESOLUTION))
}

export function calcDistance(a: ArrayBuffer, b: ArrayBuffer) {
    return Math.round(greatCircleDistance(cellToLatLng(arrayBuffer2IndexInput(a)), cellToLatLng(arrayBuffer2IndexInput(b)), UNITS.m))
}

export function calcRingRadius(center: ArrayBuffer, ringSize: number) {
    const ring = gridRingUnsafe(arrayBuffer2IndexInput(center), ringSize)
    if (ring.length) {
        return calcDistance(index2ArrayBuffer(ring[0]), center)
    }
    return 0;
}

