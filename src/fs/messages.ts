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

export function isInvokeMessage(message: Messages): message is InvokeMessage {
    return message.type === 'invoke'
}

export function isReturnMessage(message: Messages): message is InvokeMessage {
    return message.type === 'return'
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
