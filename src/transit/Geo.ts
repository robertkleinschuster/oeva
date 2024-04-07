import {cellToLatLng, greatCircleDistance, gridRingUnsafe, H3IndexInput, UNITS} from "h3-js";

export function calcDistance(a: H3IndexInput, b: H3IndexInput) {
    return Math.round(greatCircleDistance(cellToLatLng(a), cellToLatLng(b), UNITS.m))
}

export function calcRingRadius(center: H3IndexInput, ringSize: number) {
    const ring = gridRingUnsafe(center, ringSize)
    if (ring.length) {
        return calcDistance(ring[0], center)
    }
    return 0;
}

