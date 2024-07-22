import * as uuid from "uuid"

export interface Message {
    readonly type: string,
    readonly id: string,
    readonly isResponse?: boolean
}


export interface InvokeMessage extends Message {
    readonly type: 'invoke'
    readonly func: string
}

export interface ReturnMessage extends Message {
    readonly type: 'return'
    readonly func: string
}

export function isInvokeMessage(message: Message): message is InvokeMessage {
    return message.type === 'invoke'
}

export function isReturnMessage(message: Message): message is InvokeMessage {
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

export function isWriteFileMessage(message: Message): message is WriteFileMessage {
    return isInvokeMessage(message) && message.func === 'writeFile'
}


export function isWriteFileReturnMessage(message: Message): message is WriteFileReturnMessage {
    return isReturnMessage(message) && message.func === 'writeFile'
}
