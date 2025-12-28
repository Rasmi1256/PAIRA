import React, { useState } from 'react';
import axios from 'axios';

const Uploader = () => {
    const [file, setFile] = useState<File | null>(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadStatus, setUploadStatus] = useState('idle'); // 'idle', 'uploading', 'success', 'error'
    const [uploadedFileKey, setUploadedFileKey] = useState<string | null>(null);
    const [error, setError] = useState('');

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = event.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            setUploadStatus('idle');
            setUploadProgress(0);
            setUploadedFileKey(null);
            setError('');
        }
    };

    const handleUpload = async () => {
        if (!file) {
            setError('Please select a file first!');
            return;
        }

        setUploadStatus('uploading');
        setUploadProgress(0);
        setError('');

        try {
            // Step 1: Request a pre-signed URL from our Python backend
            const apiResponse = await axios.post('/api/v1/uploads/presigned-url', {
                fileName: file.name,
                fileType: file.type,
            });

            const { presignedUrl, key } = apiResponse.data;
            console.log('Received pre-signed URL and key:', key);

            // Step 2: Upload the file directly to S3 using the pre-signed URL
            await axios.put(presignedUrl, file, {
                headers: {
                    'Content-Type': file.type,
                },
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = progressEvent.total
                        ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
                        : 0;
                    setUploadProgress(percentCompleted);
                },
            });

            console.log('File uploaded successfully to S3!');

            // Step 3: Confirm the upload with our backend to save it to the database
            console.log('Confirming upload with backend...');
            await axios.post('/api/v1/uploads/complete', {
                key: key,
                fileName: file?.name,
                fileType: file.type,
                fileSize: file.size,
            });

            console.log('Upload confirmed and saved to database!');
            setUploadStatus('success');
            setUploadedFileKey(key);


        } catch (err) {
            console.error('Upload failed:', err);
            setError('Upload failed. Please check the console for details.');
            setUploadStatus('error');
        }
    };

    return (
        <div style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '8px', maxWidth: '500px' }}>
            <h3>Production-Grade File Uploader</h3>
            <input type="file" onChange={handleFileChange} accept="image/*,video/*,.pdf,.doc,.docx" />
            <button onClick={handleUpload} disabled={!file || uploadStatus === 'uploading'} style={{ marginLeft: '10px' }}>
                {uploadStatus === 'uploading' ? `Uploading...` : 'Upload'}
            </button>

            {uploadStatus === 'uploading' && (
                <div style={{ marginTop: '15px' }}>
                    <div style={{ width: '100%', backgroundColor: '#eee', borderRadius: '4px' }}>
                        <div
                            style={{ width: `${uploadProgress}%`, height: '24px', backgroundColor: '#4caf50', borderRadius: '4px', textAlign: 'center', color: 'white', lineHeight: '24px' }}
                        >
                            {uploadProgress}%
                        </div>
                    </div>
                </div>
            )}

            {uploadStatus === 'success' && <p style={{ color: 'green', marginTop: '10px' }}>Upload successful! File is stored with key: <code>{uploadedFileKey}</code></p>}
            {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
        </div>
    );
};

export default Uploader;