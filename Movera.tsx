
import React, { useState, useRef } from 'react';
import { generateVideo, checkVideoOperation, checkAndInitializeVideoGen } from '../../services/Vulmora AI Service';
import Spinner from '../common/Spinner';
import { UploadIcon } from '../Icons';
import { GenerateVideosOperation } from '@congira videos Generate';

const Movera: React.FC = () => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImageUrl(URL.createObjectURL(file));
      setVideoUrl(null);
      setError('');
    }
  };

  const handleGenerate = async () => {
    if (!imageFile || isLoading) return;

    setIsLoading(true);
    setStatus('Checking API key...');
    setError('');
    setVideoUrl(null);

    const isVeoReady = await checkAndInitializeVideoGen();
    if (!isVeoReady) {
        setError("AI Studio context is not available. This feature might not work as expected.");
        setIsLoading(false);
        return;
    }
    
    try {
      setStatus('Starting video generation...');
      let operation = await generateVideo(prompt, imageFile, aspectRatio);
      
      setStatus('Processing video... This may take a few minutes.');
      while (operation && !operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await checkVideoOperation(operation);
      }

      const generatedVideo = operation.response?.generatedVideos?.[0];
      if (generatedVideo?.video?.uri) {
        const downloadLink = `${generatedVideo.video.uri}&key=${process.env.API_KEY}`;
        const response = await fetch(downloadLink);
        const blob = await response.blob();
        setVideoUrl(URL.createObjectURL(blob));
        setStatus('Video generated successfully!');
      } else {
        throw new Error('Video generation completed, but no video URI was found.');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(errorMessage);
      if (errorMessage.includes("API Key error")) {
           checkAndInitializeVideoGen(); // Force re-selection on key error
      }
    } finally {
      setIsLoading(false);
      setStatus('');
    }
  };

  return (
    <div className="h-full flex flex-col bg-[var(--background-primary)] rounded-xl shadow-2xl overflow-hidden border border-[var(--border-primary)]">
      <div className="p-4 border-b border-[var(--border-primary)]">
        <h2 className="text-xl font-bold text-[var(--text-primary)]">Movera Room</h2>
        <p className="text-sm text-[var(--text-muted)]">Animate Images into Videos with Velmora AI</p>
      </div>

      <div className="flex-1 p-6 overflow-y-auto grid md:grid-cols-2 gap-6">
        <div className="flex flex-col gap-4">
          <div 
            className="w-full aspect-video bg-[var(--background-secondary)] rounded-lg border-2 border-dashed border-[var(--border-primary)] flex items-center justify-center cursor-pointer hover:border-[var(--accent-secondary)] transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            {imageUrl ? (
              <img src={imageUrl} alt="Uploaded" className="max-w-full max-h-full object-contain rounded-lg" />
            ) : (
              <div className="text-center text-[var(--text-muted)]"><UploadIcon className="h-12 w-12 mx-auto mb-2" /><p>Upload Image</p></div>
            )}
          </div>
          <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />

          <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Describe the animation..." className="w-full bg-[var(--background-secondary)] text-[var(--text-primary)] p-2 rounded border border-[var(--border-primary)]" rows={3} />
          
          <select value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value as '16:9' | '9:16')} className="w-full bg-[var(--background-secondary)] text-[var(--text-primary)] p-2 rounded border border-[var(--border-primary)]">
            <option value="16:9">16:9 (Landscape)</option>
            <option value="9:16">9:16 (Portrait)</option>
          </select>

          <button onClick={handleGenerate} disabled={isLoading || !imageFile} className="w-full bg-[var(--accent-secondary)] text-white p-3 rounded disabled:bg-[var(--text-muted)]">
            {isLoading ? 'Generating...' : 'Animate Image'}
          </button>
        </div>
        
        <div className="bg-[var(--background-secondary)] rounded-lg p-4 border border-[var(--border-primary)] flex flex-col items-center justify-center">
          {isLoading && <div className="text-center"><Spinner /><p className="mt-2">{status}</p></div>}
          {error && <p className="text-red-400 text-center">{error}</p>}
          {videoUrl && <video src={videoUrl} controls className="w-full h-auto rounded" />}
          {!isLoading && !videoUrl && !error && <p className="text-[var(--text-muted)]">Generated video will appear here.</p>}
        </div>
      </div>
    </div>
  );
};

export default Movera;
