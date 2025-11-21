
import React, { useState } from 'react';
import { runProAnalysis } from '../../services/Vulmora AI Service';
import Spinner from '../common/Spinner';

const Flashbot: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (prompt.trim() === '' || isLoading) return;

    setIsLoading(true);
    setResponse('');
    try {
      const result = await runProAnalysis(prompt, 'fast');
      setResponse(result);
    } catch (error) {
      console.error('Error during flash analysis:', error);
      setResponse(error instanceof Error ? error.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="h-full flex flex-col bg-[var(--background-primary)] rounded-xl shadow-2xl overflow-hidden border border-[var(--border-primary)]">
      <div className="p-4 border-b border-[var(--border-primary)]">
        <h2 className="text-xl font-bold text-[var(--text-primary)]">Flashbot Room</h2>
        <p className="text-sm text-[var(--text-muted)]">Instantaneous Responses with Velmora AI</p>
      </div>

      <div className="flex-1 p-6 flex flex-col gap-6">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Enter your query for a fast response..."
          className="w-full h-40 bg-[var(--background-secondary)] text-[var(--text-primary)] placeholder-[var(--text-muted)] rounded-lg p-4 border border-[var(--border-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-tertiary)] resize-none"
        />

        <button
          onClick={handleSubmit}
          disabled={isLoading || !prompt.trim()}
          className="w-full bg-[var(--accent-tertiary)] text-white font-bold py-3 rounded-lg hover:bg-[var(--accent-tertiary-hover)] transition-colors duration-200 disabled:bg-[var(--text-muted)] disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isLoading ? <Spinner /> : 'Get Instant Response'}
        </button>

        {response && (
          <div className="mt-4 p-4 bg-[var(--background-secondary)] rounded-lg border border-[var(--border-primary)] flex-1 overflow-y-auto">
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Response</h3>
            <pre className="whitespace-pre-wrap text-[var(--text-primary)] font-sans text-sm">{response}</pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default Flashbot;
