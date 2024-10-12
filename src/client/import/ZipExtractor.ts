import JSZip from "jszip";
import {writeFile} from "../fs/StorageManager";

export class ZipExtractor {
    constructor(
        private progress: (progress: string) => void
    ) {
    }

    async extract(file: File, directory: string) {
        const zip = new JSZip();
        const content = await zip.loadAsync(file);

        for (const file of Object.values(content.files)) {
            if (file) {
                this.progress(file.name)
                const fileContent = await file.async('blob');
                await writeFile(directory, new File(
                    [fileContent],
                    file.name
                ))
            }
        }
    }
}