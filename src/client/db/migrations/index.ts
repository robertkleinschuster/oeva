import {Migration} from 'kysely';
import {initial1} from "./001_initial";

export const migrations: Record<string, Migration> = {
    '001_initial': initial1,
};