import React, { useState, useEffect } from 'react';
import { runMapsSearch } from '../../services/Vulmora AI Service';
import { GroundingChunk } from '../../types';
import Spinner from '../common/Spinner';
import { MaploraIcon, LinkIcon } from '../Icons';

const Maplora: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [sources, setSources] = useState<GroundingChunk[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [useLocation, setUseLocation] = useState(true);
  const [location, setLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [locationError, setLocationError] = useState('');

  useEffect(() => {
    if (useLocation) {
      setLocationError(''); // Clear previous errors on retry
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setLocationError(''); // Also clear error on success
        },
        (error: GeolocationPositionError) => {
          console.error(`Geolocation Error (${error.code}): ${error.message}`);
          let friendlyMessage = 'Could not get your location. ';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              friendlyMessage += 'Permission denied. Please enable location access in your browser settings.';
              break;
            case error.POSITION_UNAVAILABLE:
              friendlyMessage += 'Location information is currently unavailable. Please ensure location services are enabled on your device and try again.';
              break;
            case error.TIMEOUT:
              friendlyMessage += 'The request to get your location timed out.';
              break;
            default:
              friendlyMessage += 'An unknown error occurred.';
              break;
          }
          setLocationError(friendlyMessage);
          setUseLocation(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000, // Increased timeout to 10 seconds for better accuracy
          maximumAge: 60000, // Allow cached position up to 1 minute old
        }
      );
    }
  }, [useLocation]);

  const handleSearch = async () => {
    if (prompt.trim() === '' || isLoading) return;

    setIsLoading(true);
    setResponse('');
    setSources([]);
    try {
      const { text, sources } = await runMapsSearch(prompt, location?.lat, location?.lng);
      setResponse(text);
      setSources(sources);
    } catch (error) {
      console.error('Error during maps search:', error);
      setResponse(error instanceof Error ? error.message : 'An unknown error occurred.');
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
        <h2 className="text-xl font-bold text-[var(--text-primary)]">Maplora Room</h2>
        <p className="text-sm text-[var(--text-muted)]">Velmora Maps Grounded Agent</p>
      </div>

      <div className="flex-1 p-6 flex flex-col gap-6 overflow-y-auto">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="What good Italian restaurants are nearby?"
            disabled={isLoading}
            className="flex-1 bg-[var(--background-secondary)] text-[var(--text-primary)] placeholder-[var(--text-muted)] rounded-lg px-4 py-3 border border-transparent focus:outline-none focus:ring-2 focus:ring-[var(--accent-secondary)]"
          />
          <button
            onClick={handleSearch}
            disabled={isLoading || !prompt.trim()}
            className="bg-[var(--accent-secondary)] text-white p-3 rounded-lg hover:bg-[var(--accent-secondary-hover)] transition-colors duration-200 disabled:bg-[var(--text-muted)] disabled:cursor-not-allowed"
          >
            <MaploraIcon className="h-6 w-6" />
          </button>
        </div>
        
        <div className="flex items-center">
            <input type="checkbox" id="useLocation" checked={useLocation} onChange={e => setUseLocation(e.target.checked)} className="h-4 w-4 rounded text-[var(--accent-secondary)] focus:ring-[var(--accent-secondary)] border-[var(--border-primary)] bg-[var(--background-secondary)]" />
            <label htmlFor="useLocation" className="ml-2 text-sm text-[var(--text-primary)]">Use current location</label>
        </div>
        {locationError && <p className="text-sm text-red-400">{locationError}</p>}


        {isLoading && <div className="flex justify-center py-10"><Spinner /></div>}

        {response && !isLoading && (
          <div className="mt-4 p-4 bg-[var(--background-secondary)] rounded-lg border border-[var(--border-primary)]">
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Result</h3>
            <p className="text-[var(--text-secondary)]">{response}</p>
            
            {sources.length > 0 && (
              <div className="mt-6">
                <h4 className="font-semibold text-[var(--text-primary)] mb-3">Places Mentioned:</h4>
                <ul className="space-y-2">
                  {sources.filter(s => s.maps).map((source, index) => (
                    <li key={index}>
                      <a 
                        href={source.maps?.uri} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center text-[var(--accent-tertiary)] hover:text-yellow-400 transition-colors duration-200 text-sm"
                      >
                        <LinkIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span className="truncate">{source.maps?.title}</span>
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

export default Maplora;
