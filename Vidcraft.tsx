
import React, { useState } from 'react';
// Fix: Corrected function name from checkAndInitializeVeo to checkAndInitializeVideoGen.
import { generateVideo, checkVideoOperation, checkAndInitializeVideoGen } from '../../services/Vulmora AI Service';
import Spinner from '../common/Spinner';
import { GenerateVideosOperation } from '@congira video Generate';

const Vidcraft: React.FC = () => {
  const [prompt, setPrompt] = useState('A cinematic shot of a futuristic cityscape at sunset, with flying cars and holographic advertisements.');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (prompt.trim() === '' || isLoading) return;

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
      let operation = await generateVideo(prompt, undefined, aspectRatio);
      
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
        <h2 className="text-xl font-bold text-[var(--text-primary)]">Vidcraft Room</h2>
        <p className="text-sm text-[var(--text-muted)]">Generate Videos from Text with Veo</p>
      </div>

      <div className="flex-1 p-6 overflow-y-auto grid md:grid-cols-2 gap-6">
        <div className="flex flex-col gap-4">
          <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Describe the video you want to create..." className="w-full flex-grow bg-[var(--background-secondary)] text-[var(--text-primary)] p-4 rounded-lg resize-none border border-[var(--border-primary)]" rows={8} />
          
          <select value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value as '16:9' | '9:16')} className="w-full bg-[var(--background-secondary)] text-[var(--text-primary)] p-3 rounded-lg border border-[var(--border-primary)]">
            <option value="16:9">16:9 (Landscape)</option>
            <option value="9:16">9:16 (Portrait)</option>
          </select>

          <button onClick={handleGenerate} disabled={isLoading || !prompt.trim()} className="w-full bg-[var(--accent-primary)] text-white p-3 rounded-lg font-bold disabled:bg-[var(--text-muted)]">
            {isLoading ? 'Generating...' : 'Create Video'}
          </button>
        </div>
        
        <div className="bg-[var(--background-secondary)] rounded-lg p-4 border border-[var(--border-primary)] flex flex-col items-center justify-center">
          {isLoading && <div className="text-center text-[var(--text-secondary)]"><Spinner /><p className="mt-2 text-sm">{status}</p></div>}
          {error && <p className="text-red-400 text-center">{error}</p>}
          {videoUrl && <video src={videoUrl} controls className="w-full h-auto rounded" />}
          {!isLoading && !videoUrl && !error && <p className="text-[var(--text-muted)]">Generated video will appear here.</p>}
        </div>
      </div>
    </div>
  );
};

export default Vidcraft;
