import FileSystemWorker from "../../worker/storage.ts?worker"
import {
    WriteFileMessage,
    isWriteFileReturnMessage,
    DownloadFileMessage,
    isDownloadFileReturnMessage, isDownloadFileProgressMessage, getDirectoryHandle
} from "../../shared/messages.ts"

const fsWorker = new FileSystemWorker()

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
export async function isStoragePersisted(): Promise<boolean | undefined> {
    return navigator.storage && navigator.storage.persisted ?
        navigator.storage.persisted() :
        undefined;
}

/** Tries to convert to persisted storage.
 persisted the storage, false if not, and undefined if the API is not present.
 */
export async function persist(): Promise<boolean | undefined> {
    return navigator.storage && navigator.storage.persist ?
        navigator.storage.persist() :
        undefined;
}

/** Queries available disk quota.
 @see https://developer.mozilla.org/en-US/docs/Web/API/StorageEstimate
 */
export async function showEstimatedQuota(): Promise<StorageEstimate | undefined> {
    return navigator.storage && navigator.storage.estimate ?
        navigator.storage.estimate() :
        undefined;
}

/** Tries to persist storage without ever prompting user. */
export async function tryPersistWithoutPromptingUser(): Promise<void> {
    if (!navigator.storage || !navigator.storage.persisted) {
        return;
    }
    let persisted = await navigator.storage.persisted();
    if (persisted) {
        return;
    }
    if (!navigator.permissions || !navigator.permissions.query) {
        return; // It MAY be successful to prompt. Don't know.
    }
    try {
        const permission = await navigator.permissions.query({
            name: "persistent-storage"
        });
        if (permission.state === "granted") {
            persisted = await navigator.storage.persist();
            if (persisted) {
                return;
            }
        }
        if (permission.state === "prompt") {
            return;
        }
    } catch (e) {
        console.info(e)
    }
    console.info('Could not automatically activate persistent storage.');
}

export async function listFilesAndDirectories(directoryHandle: FileSystemDirectoryHandle, path = ""): Promise<Map<string, File>> {
    const entries = new Map<string, File>();
    for await (const [name, handle] of directoryHandle) {
        const fullPath = `${path}/${name}`
        if (handle.kind === 'directory') {
            const files = await listFilesAndDirectories(handle as FileSystemDirectoryHandle, fullPath)
            files.forEach((file, name) => entries.set(name, file))
        } else {
            const file = await (handle as FileSystemFileHandle).getFile()
            entries.set(fullPath, file)
        }
    }
    return entries
}

export async function listRootDirectory(): Promise<Map<string, File>> {
    const root = await navigator.storage.getDirectory()
    return listFilesAndDirectories(root)
}


export async function readFile(directory: string, filename: string): Promise<File> {
    const directoryHandle = await getDirectoryHandle(directory)
    const fileHandle = await directoryHandle.getFileHandle(filename)
    return await fileHandle.getFile()
}

export async function writeFile(directory: string, file: File): Promise<void> {
    const message = new WriteFileMessage(
        directory,
        file.name,
        file.type,
        await file.arrayBuffer()
    )
    fsWorker.postMessage(message, [message.fileContent])
    return new Promise<void>(resolve => {
        const onMessage = (evt: MessageEvent) => {
            if (isWriteFileReturnMessage(evt.data) && evt.data.id === message.id) {
                resolve()
                fsWorker.removeEventListener('message', onMessage)
            }
        }
        fsWorker.addEventListener('message', onMessage)
    })
}

export async function downloadFile(url: string, directory: string, filename: string, progress: (progress: number, bytes: number, contentLength: number) => void) {
    const message = new DownloadFileMessage(url, directory, filename)
    fsWorker.postMessage(message)
    return new Promise<void>(resolve => {
        const onMessage = (evt: MessageEvent) => {
            if (isDownloadFileReturnMessage(evt.data) && evt.data.id === message.id) {
                resolve()
                fsWorker.removeEventListener('message', onMessage)
            }
            if (isDownloadFileProgressMessage(evt.data) && evt.data.id === message.id) {
                progress(evt.data.progress, evt.data.bytes, evt.data.contentLength)
            }
        }
        fsWorker.addEventListener('message', onMessage)
    })
}