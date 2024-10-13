import Papa, {ParseResult} from "papaparse";

export class CsvParser {

    constructor(
        private progress: (progress: string) => void
    ) {
    }

    private async calculateLineCount(file: File): Promise<number> {
        return new Promise((resolve, reject) => {
            const chunkSize = 64 * 1024; // 64 KB chunk size
            let offset = 0;
            let lineCount = 0;
            let leftover = '';

            const reader = new FileReader();

            reader.onload = function (event) {
                const content = event.target?.result as string || '';
                const lines = (leftover + content).split(/\r?\n/);

                // Update line count excluding the last item which might be incomplete
                lineCount += lines.length - 1;

                // Save incomplete line for the next chunk
                leftover = lines[lines.length - 1];

                // Continue reading if we haven't reached the end
                if (offset < file.size) {
                    readNextChunk();
                } else {
                    // Add the last leftover line if it exists
                    if (leftover.length > 0) {
                        lineCount++;
                    }
                    resolve(lineCount);
                }
            };

            reader.onerror = function () {
                reject(new Error("Error reading the file"));
            };

            function readNextChunk() {
                const slice = file.slice(offset, offset + chunkSize);
                reader.readAsText(slice);
                offset += chunkSize;
            }

            // Start reading the first chunk
            readNextChunk();
        });
    }

    async parse<T>(
        file: File,
        pump: (chunk: T[], meta: { cursor: number, lines: number }) => Promise<void>,
        options = {
            header: true,
            encoding: 'UTF-8',
            chunkSize: 1024 * 128
        }
    ): Promise<void> {
        this.progress(file.name)
        let cursor = 0
        const lines = options.header ? await this.calculateLineCount(file) - 1 : await this.calculateLineCount(file)
        return new Promise<void>((resolve, reject) => {
            Papa.parse(file, {
                header: options.header,
                dynamicTyping: false,
                skipEmptyLines: true,
                chunkSize: options.chunkSize,
                worker: false,
                encoding: options.encoding,
                chunk: (results: ParseResult<T>, parser: Papa.Parser) => {
                    parser.pause();
                    pump(results.data, {cursor, lines})
                        .then(() => {
                            cursor += results.data.length
                            const percent = Math.round((cursor / lines) * 100);
                            this.progress(file.name + ' ' + percent + ' %')
                            parser.resume()
                    })
                        .catch(reason => {
                            reject(reason)
                            parser.abort()
                        })

                },
                complete: () => {
                    resolve();
                },
                error: (error: Error) => {
                    reject(error);
                },
            });
        })
    }
}