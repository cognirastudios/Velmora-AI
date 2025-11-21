
import React, { useState } from 'react';
import { runGroundedSearch } from '../../services/Vulmora AI Service';
import { GroundingChunk } from '../../types';
import Spinner from '../common/Spinner';
import { FactoraIcon, LinkIcon } from '../Icons';
import { useSettings } from '../../contexts/SettingsContext';

const Factora: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [sources, setSources] = useState<GroundingChunk[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { settings } = useSettings();

  const handleSearch = async () => {
    if (prompt.trim() === '' || isLoading) return;

    setIsLoading(true);
    setResponse('');
    setSources([]);
    try {
      const { text, sources } = await runGroundedSearch(prompt);
      setResponse(text);
      setSources(sources);
    } catch (error) {
      console.error('Error during grounded search:', error);
      setResponse(error instanceof Error ? error.message : 'An unknown error occurred during the search.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="h-full flex flex-col bg-[var(--background-primary)] rounded-xl shadow-2xl overflow-hidden border border-[var(--border-primary)]">
      <div className="p-4 border-b border-[var(--border-primary)]">
        <h2 className="text-xl font-bold text-[var(--text-primary)]">Factora Room</h2>
        <p className="text-sm text-[var(--text-muted)]">Velmora Search Grounded Agent</p>
      </div>

      <div className="flex-1 p-6 flex flex-col gap-6 overflow-y-auto">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about recent events or up-to-date info..."
            disabled={isLoading}
            className="flex-1 bg-[var(--background-secondary)] text-[var(--text-primary)] placeholder-[var(--text-muted)] rounded-lg px-4 py-3 border border-transparent focus:outline-none focus:ring-2 focus:ring-[var(--accent-tertiary)]"
          />
          <button
            onClick={handleSearch}
            disabled={isLoading || !prompt.trim()}
            className="bg-[var(--accent-tertiary)] text-white p-3 rounded-lg hover:bg-[var(--accent-tertiary-hover)] transition-colors duration-200 disabled:bg-[var(--text-muted)] disabled:cursor-not-allowed"
          >
            <FactoraIcon className="h-6 w-6" />
          </button>
        </div>

        {isLoading && (
          <div className="flex justify-center items-center py-10">
            <Spinner />
          </div>
        )}

        {response && !isLoading && (
          <div className="mt-4 p-4 bg-[var(--background-secondary)] rounded-lg border border-[var(--border-primary)]">
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Search Result</h3>
            <div className={`prose ${settings.theme === 'dark' ? 'prose-invert' : ''} max-w-none text-[var(--text-secondary)]`}>
              <p>{response}</p>
            </div>
            
            {sources.length > 0 && (
              <div className="mt-6">
                <h4 className="font-semibold text-[var(--text-primary)] mb-3">Sources:</h4>
                <ul className="space-y-2">
                  {sources.filter(s => s.web).map((source, index) => (
                    <li key={index}>
                      <a 
                        href={source.web?.uri} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center text-[var(--accent-tertiary)] hover:text-yellow-400 transition-colors duration-200 text-sm"
                      >
                        <LinkIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span className="truncate">{source.web?.title}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Factora;
