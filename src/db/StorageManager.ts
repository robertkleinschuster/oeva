export enum PersistenceState {
    UNSUPPORTED,
    PROMPT,
    ENABLED,
}

/** Check if storage is persisted already.
 @returns {Promise<boolean>} Promise resolved with true if current origin is
  using persistent storage, false if not, and undefined if the API is not
  present.
 */
export async function isStoragePersisted(): Promise<boolean|undefined> {
    return navigator.storage && navigator.storage.persisted ?
        navigator.storage.persisted() :
        undefined;
}

/** Tries to convert to persisted storage.
  persisted the storage, false if not, and undefined if the API is not present.
 */
export async function persist(): Promise<boolean|undefined> {
    return navigator.storage && navigator.storage.persist ?
        navigator.storage.persist() :
        undefined;
}

/** Queries available disk quota.
 @see https://developer.mozilla.org/en-US/docs/Web/API/StorageEstimate
 */
export async function showEstimatedQuota(): Promise<StorageEstimate|undefined> {
    return navigator.storage && navigator.storage.estimate ?
        navigator.storage.estimate() :
        undefined;
}

/** Tries to persist storage without ever prompting user.

 "never" In case persisting is not ever possible. Caller don't bother
 asking user for permission.
 "prompt" In case persisting would be possible if prompting user first.
 "persisted" In case this call successfully silently persisted the storage,
 or if it was already persisted.
 */
export async function tryPersistWithoutPromtingUser(): Promise<PersistenceState> {
    if (!navigator.storage || !navigator.storage.persisted) {
        return PersistenceState.UNSUPPORTED;
    }
    let persisted = await navigator.storage.persisted();
    if (persisted) {
        return PersistenceState.ENABLED;
    }
    if (!navigator.permissions || !navigator.permissions.query) {
        return PersistenceState.PROMPT; // It MAY be successful to prompt. Don't know.
    }
    const permission = await navigator.permissions.query({
        name: "persistent-storage"
    });
    if (permission.state === "granted") {
        persisted = await navigator.storage.persist();
        if (persisted) {
            return PersistenceState.ENABLED;
        } else {
            throw new Error("Failed to persist");
        }
    }
    if (permission.state === "prompt") {
        return PersistenceState.PROMPT;
    }
    return PersistenceState.UNSUPPORTED;
}