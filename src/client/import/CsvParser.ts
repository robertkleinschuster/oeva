import Papa, {ParseResult} from "papaparse";

export class CsvParser {

    constructor(
        private progress: (progress: string) => void
    ) {
    }

    private async calculateLineCount(file: File): Promise<number> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = function (event) {
                const content = event.target?.result as string | null ?? '';
                const lines = content.split(/\r?\n/);
                resolve(lines.filter(line => line.length > 0).length);
            };

            reader.onerror = function () {
                reject(new Error("Error reading the file"));
            };

            reader.readAsText(file);
        });
    }

    async parse<T>(
        file: File,
        pump: (chunk: T[], meta: { cursor: number, lines: number }) => Promise<void>,
        options = {
            header: true,
            encoding: 'UTF-8',
            chunkSize: 655360
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
                            parser.abort()
                            reject(reason)
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