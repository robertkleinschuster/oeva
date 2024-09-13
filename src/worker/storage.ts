import {
    DownloadFileProgressMessage,
    DownloadFileReturnMessage,
    getDirectoryHandle,
    isDownloadFileMessage,
    isWriteFileMessage,
    WriteFileReturnMessage
} from "../shared/messages.ts";

self.onmessage = (evt: MessageEvent) => {
    if (isWriteFileMessage(evt.data)) {
        writeFile(
            evt.data.directory,
            new File([evt.data.fileContent], evt.data.fileName, {type: evt.data.fileType})
        ).then(() => {
            self.postMessage(new WriteFileReturnMessage(evt.data.id))
        })
    }
    if (isDownloadFileMessage(evt.data)) {
        downloadFile(
            evt.data.url,
            evt.data.directory,
            evt.data.filename,
            (progress, bytes, contentLength) => {
                self.postMessage(new DownloadFileProgressMessage(evt.data.id, progress, bytes, contentLength))
            }
        ).then(() => {
            self.postMessage(new DownloadFileReturnMessage(evt.data.id))
        })
    }
}


async function getFileHandle(directoryHandle: FileSystemDirectoryHandle, filename: string): Promise<FileSystemFileHandle> {
    return await directoryHandle.getFileHandle(filename, {create: true});
}

async function writeFile(directory: string, file: File): Promise<void> {
    const dirHandle = await getDirectoryHandle(directory, true);

    // Create the file and write content
    const fileHandle = await getFileHandle(dirHandle, file.name);
    const writable = await fileHandle.createSyncAccessHandle();
    writable.write(await file.arrayBuffer());
    writable.close();
}

async function downloadFile(url: string, directory: string, filename: string, progress: (progress: number, bytes: number, contentLength: number) => void): Promise<void> {
    const response = await fetch(url)
    if (!response.body) throw new Error('Stream not supported by browser');
    const reader = response.body.getReader()
    const dirHandle = await getDirectoryHandle(directory, true)
    const fileHandle = await getFileHandle(dirHandle, filename)
    const writable = await fileHandle.createSyncAccessHandle()
    let bytes = 0
    const contentLength = Number.parseInt(response.headers.get('Content-Length') ?? '0')
    const pump = async () => {
        const {done, value} = await reader.read();
        if (value?.byteLength) {
            bytes += value.byteLength
        }
        if (contentLength) {
            progress(Math.round(bytes / contentLength) * 100, bytes, contentLength)
        } else {
            progress(0, bytes, 0)
        }
        if (done) {
            writable.close();
            return;
        }
        writable.write(value);
        await pump();
    };

    await pump();
}