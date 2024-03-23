export interface IFOPT {
    country: string;
    municipality: string;
    stop: string;
    area: string | null;
    platform: string | null;
}

export function decodeIFOPT(ifopt: string): IFOPT {
    const [country, municipality, stop, area, platform] = ifopt.split(':', 5)
    return {
        country,
        municipality,
        stop,
        area: area ?? null,
        platform: platform ?? null,
    }
}

export function encodeIFOPT(ifopt: IFOPT, short: boolean = false): string {
    if (short) {
        return `${ifopt.country}:${ifopt.municipality}:${ifopt.stop}`;
    }
    return `${ifopt.country}:${ifopt.municipality}:${ifopt.stop}:${ifopt.area}:${ifopt.platform}`;
}
