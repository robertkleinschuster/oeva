import {importGTFSZip} from "./import.ts";

self.onmessage = async (e) => {
    const {file} = e.data;

    const result = await importGTFSZip(file, (progress, filename) => {
         self.postMessage({ type: 'PROGRESS', progress: progress, currentFile: filename });
    })

    self.postMessage({ type: 'DONE', importedFiles: result.importedFiles, missingFiles: result.missingFiles });
}