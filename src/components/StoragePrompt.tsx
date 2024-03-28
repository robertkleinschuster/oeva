import {persist, PersistenceState, tryPersistWithoutPromtingUser} from "../db/StorageManager.ts";
import {useEffect, useState} from "react";
import {Block, f7, Link} from "framework7-react";

export const StoragePrompt = () => {
    const [state, setState] = useState<PersistenceState>()
    useEffect(() => {
        tryPersistWithoutPromtingUser().then(setState).catch(console.error)
    }, []);

    if (state === PersistenceState.UNSUPPORTED) {
        return <Block>Permanenter Speicher: Nicht unterstützt</Block>
    }
    if (state === PersistenceState.PROMPT) {
        return <Block>
            <span>Permanenter Speicher: </span>
            <Link onClick={() => {
                persist().then(() => f7.dialog.confirm('Permanenter Speicher wurde erfolgreich aktiviert.'))
            }}>Aktivieren</Link>
        </Block>
    }
    return <Block>Permanenter Speicher: Aktiv</Block>
}