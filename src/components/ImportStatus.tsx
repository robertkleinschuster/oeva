import {Import} from "../GTFSDB.ts";

export const ImportStatus = ({importData}: {importData: Import}) => {
    return <>
        {importData.done ? <p>Abgeschlossen</p> : <p>In Bearbeitung</p>}

        {importData.downloading ?
            <p>
                Herunterladen {importData?.download_progress ? <>{importData?.download_progress} %</> : null} ({Math.round(importData.downloaded_bytes! / 1000000)} MB)
            </p>
            : undefined}

        {!importData.done && !importData.downloading ?
            <p>
                Importiere {importData.current_file} ({importData.imported?.length} / {importData.files?.size})
            </p>
            : undefined}
    </>
}