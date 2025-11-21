
import React, { useState, useRef } from 'react';
import { editImage } from '../../services/Vulmora AI Service';
import Spinner from '../common/Spinner';
import { UploadIcon } from '../Icons';

const Imagix: React.FC = () => {
  const [originalImageFile, setOriginalImageFile] = useState<File | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
  const [editedImageUrl, setEditedImageUrl] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setOriginalImageFile(file);
      setOriginalImageUrl(URL.createObjectURL(file));
      setEditedImageUrl(null);
      setError('');
    }
  };

  const handleEdit = async () => {
    if (!originalImageFile || prompt.trim() === '' || isLoading) return;
    setIsLoading(true);
    setError('');
    setEditedImageUrl(null);
    try {
      const resultUrl = await editImage(prompt, originalImageFile);
      setEditedImageUrl(resultUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-[var(--background-primary)] rounded-xl shadow-2xl overflow-hidden border border-[var(--border-primary)]">
      <div className="p-4 border-b border-[var(--border-primary)]">
        <h2 className="text-xl font-bold text-[var(--text-primary)]">Imagix Room</h2>
        <p className="text-sm text-[var(--text-muted)]">Automatic Image Editing</p>
      </div>

      <div className="flex-1 p-6 overflow-y-auto grid md:grid-cols-2 gap-6">
        {/* Left Panel: Input */}
        <div className="flex flex-col gap-4">
          <div 
            className="w-full aspect-square bg-[var(--background-secondary)] rounded-lg border-2 border-dashed border-[var(--border-primary)] flex flex-col items-center justify-center cursor-pointer hover:border-[var(--accent-secondary)] transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            {originalImageUrl ? (
              <img src={originalImageUrl} alt="Original" className="w-full h-full object-contain rounded-lg" />
            ) : (
              <div className="text-center text-[var(--text-muted)]">
                <UploadIcon className="h-12 w-12 mx-auto mb-2" />
                <p className="font-semibold">Click to upload an image</p>
              </div>
            )}
          </div>
          <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />

          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the edit... (e.g., 'Remove the background', 'Add a retro filter')"
            className="w-full bg-[var(--background-secondary)] text-[var(--text-primary)] placeholder-[var(--text-muted)] rounded-lg p-4 border border-[var(--border-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-secondary)] resize-none"
            rows={3}
          />
          <button
            onClick={handleEdit}
            disabled={isLoading || !originalImageFile || !prompt.trim()}
            className="w-full bg-[var(--accent-secondary)] text-white font-bold py-3 rounded-lg hover:bg-[var(--accent-secondary-hover)] transition-colors duration-200 disabled:bg-[var(--text-muted)] disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isLoading ? <Spinner /> : 'Apply Edit'}
          </button>
        </div>
        
        {/* Right Panel: Output */}
        <div className="bg-[var(--background-secondary)] rounded-lg p-4 border border-[var(--border-primary)] flex flex-col items-center justify-center">
            {isLoading && <Spinner />}
            {error && !isLoading && <p className="text-red-400 text-center">{error}</p>}
            {editedImageUrl && !isLoading && (
              <>
                <img src={editedImageUrl} alt="Edited" className="w-full h-auto object-contain rounded-lg" />
                 <a href={editedImageUrl} download="edited-image.jpg" className="mt-4 px-4 py-2 bg-[var(--accent-primary)] text-white rounded-lg hover:bg-[var(--accent-primary-hover)] transition-colors">
                    Download Image
                 </a>
              </>
            )}
             {!isLoading && !error && !editedImageUrl && <p className="text-[var(--text-muted)]">The edited image will appear here.</p>}
        </div>
      </div>
    </div>
  );
};

export default Imagix;
