import * as uuid from "uuid"

export interface Messages {
    readonly type: string,
    readonly id: string,
    readonly isResponse?: boolean
}


export interface InvokeMessage extends Messages {
    readonly type: 'invoke'
    readonly func: string
}

export interface ReturnMessage extends Messages {
    readonly type: 'return'
    readonly func: string
}

export interface ProgressMessage extends Messages {
    readonly type: 'progress'
    readonly func: string
}

export function isInvokeMessage(message: Messages): message is InvokeMessage {
    return message.type === 'invoke'
}

export function isReturnMessage(message: Messages): message is InvokeMessage {
    return message.type === 'return'
}

export function isProgressMessage(message: Messages): message is ProgressMessage {
    return message.type === 'progress'
}

export class WriteFileMessage implements InvokeMessage {
    readonly type = "invoke"
    readonly func = 'writeFile'
    readonly id = uuid.v4()

    constructor(
        public readonly directory: string,
        public readonly fileName: string,
        public readonly fileType: string,
        public readonly fileContent: ArrayBuffer,
    ) {
    }
}

export class WriteFileReturnMessage implements ReturnMessage {
    readonly type = "return"
    readonly func = 'writeFile'

    constructor(readonly id: string) {
    }
}

export function isWriteFileMessage(message: Messages): message is WriteFileMessage {
    return isInvokeMessage(message) && message.func === 'writeFile'
}


export function isWriteFileReturnMessage(message: Messages): message is WriteFileReturnMessage {
    return isReturnMessage(message) && message.func === 'writeFile'
}


export class DownloadFileMessage implements InvokeMessage {
    readonly type = "invoke"
    readonly func = 'downloadFile'
    readonly id = uuid.v4()

    constructor(
        public readonly url: string,
        public readonly directory: string,
        public readonly filename: string,
    ) {
    }
}

export class DownloadFileReturnMessage implements ReturnMessage {
    readonly type = "return"
    readonly func = 'downloadFile'

    constructor(readonly id: string) {
    }
}

export class DownloadFileProgressMessage implements ProgressMessage {
    readonly type = "progress"
    readonly func = 'downloadFile'

    constructor(
        readonly id: string,
        readonly progress: number,
        readonly bytes: number,
        readonly contentLength: number,
    ) {
    }
}

export function isDownloadFileMessage(message: Messages): message is DownloadFileMessage {
    return isInvokeMessage(message) && message.func === 'downloadFile'
}

export function isDownloadFileReturnMessage(message: Messages): message is DownloadFileReturnMessage {
    return isReturnMessage(message) && message.func === 'downloadFile'
}

export function isDownloadFileProgressMessage(message: Messages): message is DownloadFileProgressMessage {
    return isProgressMessage(message) && message.func === 'downloadFile'
}


export async function getDirectoryHandle(directory: string, create = false): Promise<FileSystemDirectoryHandle> {
    const parts = directory.split('/').filter(p => p.trim() !== '');
    let dirHandle = await navigator.storage.getDirectory();

    // Traverse the path and create directories if they don't exist
    for (const part of parts) {
        dirHandle = await dirHandle.getDirectoryHandle(part, {create: create});
    }
    return dirHandle
}