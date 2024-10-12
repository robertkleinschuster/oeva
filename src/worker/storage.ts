import {
    DownloadFileProgressMessage,
    DownloadFileReturnMessage, ExtractFileProgressMessage, ExtractFileReturnMessage,
    getDirectoryHandle,
    isDownloadFileMessage, isExtractFileMessage,
    isWriteFileMessage,
    WriteFileReturnMessage
} from "../shared/messages.ts";
import JSZip from "jszip";

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
    if (isExtractFileMessage(evt.data)) {
        extractFile(
            evt.data.directory,
            evt.data.filename,
            evt.data.destination,
            file => {
                self.postMessage(new ExtractFileProgressMessage(evt.data.id, file))
            }
        ).then(() => {
            self.postMessage(new ExtractFileReturnMessage(evt.data.id))
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
    writable.truncate(0)
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
            progress(Math.round(bytes / contentLength * 100), bytes, contentLength)
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

async function extractFile(directory: string, filename: string, destination: string, progress: (file: string) => void): Promise<void> {
    const destinationHandle = await getDirectoryHandle(destination, true);
    const sourceHandle = await (await getDirectoryHandle(directory)).getFileHandle(filename)
    const sourceFile = await sourceHandle.getFile()

    const skip = ['shapes.txt']

    const zip = new JSZip();
    const content = await zip.loadAsync(await sourceFile.arrayBuffer());

    for (const file of Object.values(content.files)) {
        if (file) {
            if (skip.includes(file.name)) {
                continue
            }
            progress(file.name)

            const fileHandle = await getFileHandle(destinationHandle, file.name);
            const writable = await fileHandle.createSyncAccessHandle();
            writable.truncate(0)

            const fileContentBlob = await file.async('blob');

            const chunkSize = 1024 * 64;
            let offset = 0;
            const fileSize = fileContentBlob.size;

            while (offset < fileSize) {
                const chunk = fileContentBlob.slice(offset, offset + chunkSize);
                const reader = chunk.stream().getReader();
                let result;
                while (!(result = await reader.read()).done) {
                    writable.write(result.value);
                }
                offset += chunkSize;
            }

            writable.close();
        }
    }
}