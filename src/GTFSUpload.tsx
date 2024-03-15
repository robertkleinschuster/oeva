import {ChangeEvent, useState} from 'react';

const GTFSUpload = () => {
    const [file, setFile] = useState<File|null>(null);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [currentFile, setCurrentFile] = useState('');
    const [message, setMessage] = useState('');

    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (files && files[0]) {
            setFile(files[0]);
            setMessage('');
        }
    };

    const handleFileUpload = () => {
        if (file) {
            setUploading(true);
            const worker = new Worker(new URL('./importWorker.ts', import.meta.url), { type: 'module' });

            worker.onmessage = (e) => {
                const { type, progress, currentFile, importedFiles } = e.data;

                switch (type) {
                    case 'PROGRESS':
                        setProgress(progress);
                        setCurrentFile(currentFile)
                        break;
                    case 'DONE':
                        setMessage('Import completed successfully.');
                        console.log('Imported files:', importedFiles);
                        setUploading(false);
                        break;
                    // Handle other messages or errors as needed
                }
            };

            worker.onerror = (error) => {
                console.error('Worker error:', error);
                setMessage('An error occurred during import.');
                setUploading(false);
            };

            worker.postMessage({ file });
        } else {
            setMessage('Please select a file before uploading.');
        }
    };

    return (
        <div>
            <input type="file" accept=".zip" onChange={handleFileChange} />
            <button onClick={handleFileUpload} disabled={uploading}>
                {uploading ? `Uploading... ${progress.toFixed(0)}% (${currentFile})` : 'Upload'}
            </button>
            {message && <div>{message}</div>}
        </div>
    );
};

export default GTFSUpload;
