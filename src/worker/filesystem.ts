import {isWriteFileMessage, WriteFileReturnMessage} from "./message.ts";

self.onmessage = (evt: MessageEvent) => {
    if (isWriteFileMessage(evt.data)) {
        writeFile(
            evt.data.directory,
            new File([evt.data.fileContent], evt.data.fileName, {type: evt.data.fileType})
        ).then(() => {
            self.postMessage(new WriteFileReturnMessage(evt.data.id))
        })
    }
}

async function writeFile(directory: string, file: File): Promise<void> {
    const parts = directory.split('/').filter(p => p.trim() !== '');
    let dirHandle = await navigator.storage.getDirectory();

    // Traverse the path and create directories if they don't exist
    for (const part of parts) {
        dirHandle = await dirHandle.getDirectoryHandle(part, {create: true});
    }

    // Create the file and write content
    const fileHandle = await dirHandle.getFileHandle(file.name, {create: true});
    const writable = await fileHandle.createSyncAccessHandle();
    writable.write(await file.arrayBuffer());
    writable.close();
}