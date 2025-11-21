
import React, { useState, useRef } from 'react';
import { analyzeVideo } from '../../services/Vulmora AI Service';
import Spinner from '../common/Spinner';
import { UploadIcon } from '../Icons';

const Vidsumma: React.FC = () => {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) { // 50MB limit
        alert("File is too large. Please select a video under 50MB.");
        return;
      }
      setVideoFile(file);
      setVideoUrl(URL.createObjectURL(file));
      setResult('');
    }
  };

  const handleAnalyze = async () => {
    if (!videoFile || prompt.trim() === '' || isLoading) return;

    setIsLoading(true);
    setResult('');
    try {
      const analysisResult = await analyzeVideo(prompt, videoFile);
      setResult(analysisResult);
    } catch (error) {
      console.error('Error analyzing video:', error);
      setResult(error instanceof Error ? error.message : 'An unknown error occurred during video analysis.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-[var(--background-primary)] rounded-xl shadow-2xl overflow-hidden border border-[var(--border-primary)]">
      <div className="p-4 border-b border-[var(--border-primary)]">
        <h2 className="text-xl font-bold text-[var(--text-primary)]">Vidsumma Room</h2>
        <p className="text-sm text-[var(--text-muted)]">Video Content Analysis with Velmora AI</p>
      </div>

      <div className="flex-1 p-6 overflow-y-auto grid md:grid-cols-2 gap-6">
        <div className="flex flex-col gap-4">
          <div 
            className="w-full aspect-video bg-[var(--background-secondary)] rounded-lg border-2 border-dashed border-[var(--border-primary)] flex flex-col items-center justify-center cursor-pointer hover:border-[var(--accent-secondary)] transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            {videoUrl ? (
              <video src={videoUrl} controls className="w-full h-full object-contain rounded-lg" />
            ) : (
              <div className="text-center text-[var(--text-muted)]">
                <UploadIcon className="h-12 w-12 mx-auto mb-2" />
                <p className="font-semibold">Click to upload a video</p>
                <p className="text-xs">Max 50MB</p>
              </div>
            )}
          </div>
          <input type="file" accept="video/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />

          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="What should I look for in the video? (e.g., 'Summarize this video', 'Identify the main objects and their interactions')"
            className="w-full bg-[var(--background-secondary)] text-[var(--text-primary)] placeholder-[var(--text-muted)] rounded-lg p-4 border border-[var(--border-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-secondary)] resize-none"
            rows={4}
          />

          <button
            onClick={handleAnalyze}
            disabled={isLoading || !videoFile || !prompt.trim()}
            className="w-full bg-[var(--accent-secondary)] text-white font-bold py-3 rounded-lg hover:bg-[var(--accent-secondary-hover)] transition-colors duration-200 disabled:bg-[var(--text-muted)] disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isLoading ? <Spinner /> : 'Analyze Video'}
          </button>
        </div>
        
        <div className="bg-[var(--background-secondary)] rounded-lg p-4 border border-[var(--border-primary)] overflow-y-auto">
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Analysis</h3>
          {result ? (
            <pre className="whitespace-pre-wrap text-[var(--text-primary)] font-sans text-sm">{result}</pre>
          ) : (
            <p className="text-[var(--text-muted)]">Analysis results will appear here.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Vidsumma;
