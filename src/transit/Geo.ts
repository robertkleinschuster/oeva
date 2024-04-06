import {cellToLatLng, greatCircleDistance, gridRingUnsafe, UNITS} from "h3-js";

export function calcDistance(a: string, b: string) {
    return Math.round(greatCircleDistance(cellToLatLng(a), cellToLatLng(b), UNITS.m))
}

export function calcRingRadius(center: string, ringSize: number) {
    const ring = gridRingUnsafe(center, ringSize)
    if (ring.length) {
        return calcDistance(ring[0], center)
    }
    return 0;
}

