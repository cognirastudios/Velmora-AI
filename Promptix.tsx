
import React, { useState } from 'react';
import { generateImage } from '../../services/Vulmora AI Service';
import Spinner from '../common/Spinner';
import Ratiobox from './Ratiobox';

const Promptix: React.FC = () => {
  const [prompt, setPrompt] = useState('A photorealistic image of a futuristic city skyline at dusk, with flying vehicles and neon lights.');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (prompt.trim() === '' || isLoading) return;
    setIsLoading(true);
    setError('');
    setImageUrl(null);
    try {
      const resultUrl = await generateImage(prompt, aspectRatio);
      setImageUrl(resultUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-[var(--background-primary)] rounded-xl shadow-2xl overflow-hidden border border-[var(--border-primary)]">
      <div className="p-4 border-b border-[var(--border-primary)]">
        <h2 className="text-xl font-bold text-[var(--text-primary)]">Promptix Room</h2>
        <p className="text-sm text-[var(--text-muted)]">Image Generation from Description with Velmora AI</p>
      </div>

      <div className="flex-1 p-6 grid md:grid-cols-2 gap-6 overflow-y-auto">
        {/* Left Panel: Controls */}
        <div className="flex flex-col gap-4">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the image you want to create..."
            className="w-full flex-grow bg-[var(--background-secondary)] text-[var(--text-primary)] placeholder-[var(--text-muted)] rounded-lg p-4 border border-[var(--border-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] resize-none"
            rows={6}
          />
          
          <Ratiobox selectedRatio={aspectRatio} onRatioChange={setAspectRatio} />

          <button
            onClick={handleGenerate}
            disabled={isLoading || !prompt.trim()}
            className="w-full bg-[var(--accent-primary)] text-white font-bold py-3 rounded-lg hover:bg-[var(--accent-primary-hover)] transition-colors duration-200 disabled:bg-[var(--text-muted)] disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isLoading ? <Spinner /> : 'Generate Image'}
          </button>
        </div>

        {/* Right Panel: Output */}
        <div className="bg-[var(--background-secondary)] rounded-lg p-4 border border-[var(--border-primary)] flex flex-col items-center justify-center">
          {isLoading && <Spinner />}
          {error && !isLoading && <p className="text-red-400 text-center">{error}</p>}
          {imageUrl && !isLoading && (
            <>
              <img src={imageUrl} alt="Generated" className="w-full h-auto object-contain rounded-lg" />
              <a href={imageUrl} download="generated-image.jpg" className="mt-4 px-4 py-2 bg-[var(--accent-secondary)] text-white rounded-lg hover:bg-[var(--accent-secondary-hover)] transition-colors">
                Download Image
              </a>
            </>
          )}
          {!isLoading && !error && !imageUrl && <p className="text-[var(--text-muted)]">Generated image will appear here.</p>}
        </div>
      </div>
    </div>
  );
};

export default Promptix;
