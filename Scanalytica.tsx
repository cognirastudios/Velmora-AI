
import React, { useState, useRef } from 'react';
import { getChatResponse } from '../../services/Vulmora AI Service';
import Spinner from '../common/Spinner';
import { UploadIcon } from '../Icons';

const Scanalytica: React.FC = () => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('Extract the key information from this document.');
  const [result, setResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImageUrl(URL.createObjectURL(file));
      setResult('');
      setError('');
    }
  };

  const handleAnalyze = async () => {
    if (!imageFile || prompt.trim() === '' || isLoading) return;
    setIsLoading(true);
    setError('');
    setResult('');
    try {
      const analysisResult = await getChatResponse([], prompt, imageFile);
      setResult(analysisResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-[var(--background-primary)] rounded-xl shadow-2xl overflow-hidden border border-[var(--border-primary)]">
      <div className="p-4 border-b border-[var(--border-primary)]">
        <h2 className="text-xl font-bold text-[var(--text-primary)]">Scanalytica Room</h2>
        <p className="text-sm text-[var(--text-muted)]">Analyze Images and Documents</p>
      </div>

      <div className="flex-1 p-6 grid md:grid-cols-2 gap-6 overflow-y-auto">
        <div className="flex flex-col gap-4">
          <div 
            className="w-full h-64 bg-[var(--background-secondary)] rounded-lg border-2 border-dashed border-[var(--border-primary)] flex items-center justify-center cursor-pointer hover:border-[var(--accent-secondary)] transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            {imageUrl ? (
              <img src={imageUrl} alt="Uploaded document" className="max-h-full max-w-full object-contain" />
            ) : (
              <div className="text-center text-[var(--text-muted)]"><UploadIcon className="h-12 w-12 mx-auto mb-2" /><p>Upload Document or Image</p></div>
            )}
          </div>
          <input type="file" accept="image/*,application/pdf" ref={fileInputRef} onChange={handleFileChange} className="hidden" />

          <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} className="w-full bg-[var(--background-secondary)] text-[var(--text-primary)] p-2 rounded border border-[var(--border-primary)]" rows={3} />

          <button onClick={handleAnalyze} disabled={isLoading || !imageFile || !prompt.trim()} className="w-full bg-[var(--accent-secondary)] text-white p-3 rounded disabled:bg-[var(--text-muted)] flex items-center justify-center">
            {isLoading ? <Spinner /> : 'Analyze'}
          </button>
        </div>
        
        <div className="bg-[var(--background-secondary)] rounded-lg p-4 border border-[var(--border-primary)] overflow-y-auto">
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Analysis Result</h3>
           {isLoading && <div className="flex justify-center items-center h-full"><Spinner /></div>}
           {error && <p className="text-red-400">{error}</p>}
           {result ? (
            <pre className="whitespace-pre-wrap text-[var(--text-primary)] font-sans text-sm">{result}</pre>
          ) : (
            !isLoading && !error && <p className="text-[var(--text-muted)]">Analysis results will appear here.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Scanalytica;
