
import React, { useState } from 'react';
import { textToSpeech } from '../../services/Vulmora AI Service';
import Spinner from '../common/Spinner';

// --- Web Audio API Helpers to handle raw PCM data ---

/**
 * Decodes a base64 string into a Uint8Array.
 * @param base64 The base64 encoded string.
 * @returns A Uint8Array of the decoded data.
 */
function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Creates an AudioBuffer from raw PCM data for playback.
 * The TTS API returns audio as raw PCM, 1-channel, at a 24000 sample rate.
 * @param data The raw audio data as a Uint8Array.
 * @param ctx The AudioContext to use.
 * @returns A promise that resolves to an AudioBuffer.
 */
async function createAudioBuffer(
  data: Uint8Array,
  ctx: AudioContext,
): Promise<AudioBuffer> {
  const sampleRate = 24000;
  const numChannels = 1;
  
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  const channelData = buffer.getChannelData(0);

  for (let i = 0; i < frameCount; i++) {
    channelData[i] = dataInt16[i] / 32768.0;
  }
  
  return buffer;
}

/**
 * Converts raw PCM audio data into a Blob with a valid WAV header.
 * @param pcmData Raw audio data.
 * @param numChannels Number of audio channels.
 * @param sampleRate The sample rate.
 * @param bitsPerSample Bits per sample.
 * @returns A Blob representing the WAV file.
 */
function pcmToWav(pcmData: Uint8Array, numChannels: number, sampleRate: number, bitsPerSample: number): Blob {
  const dataLength = pcmData.length;
  const buffer = new ArrayBuffer(44 + dataLength);
  const view = new DataView(buffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  const blockAlign = (numChannels * bitsPerSample) / 8;
  const byteRate = sampleRate * blockAlign;

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataLength, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeString(36, 'data');
  view.setUint32(40, dataLength, true);

  new Uint8Array(buffer, 44).set(pcmData);

  return new Blob([view], { type: 'audio/wav' });
}

const availableVoices = [
    { id: 'Kore', name: 'Kore', gender: 'Female' },
    { id: 'Puck', name: 'Puck', gender: 'Male' },
    { id: 'Charon', name: 'Charon', gender: 'Male' },
    { id: 'Fenrir', name: 'Fenrir', gender: 'Male' },
    { id: 'Zephyr', name: 'Zephyr', gender: 'Female' },
];

const Audivox: React.FC = () => {
  const [text, setText] = useState('Hello! I am Velmora, an intelligent assistant.');
  const [voice, setVoice] = useState('Kore');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

  const getFilename = (text: string, voice: string): string => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const shortText = text.slice(0, 20).replace(/\s+/g, "_").replace(/[^\w-]/g, '');
    return `audivox_${voice}_${shortText}_${timestamp}.wav`;
  }

  const handleGenerateSpeech = async () => {
    if (!text.trim() || isLoading) return;
    setIsLoading(true);
    setError('');
    setAudioBlob(null);
    setStatus('Generating speech...');
    
    try {
      const base64Audio = await textToSpeech(text, voice);
      
      setStatus('Decoding audio...');
      const audioBytes = decode(base64Audio);
      
      // Create WAV blob for download
      const wavBlob = pcmToWav(audioBytes, 1, 24000, 16);
      setAudioBlob(wavBlob);

      // Create AudioBuffer for playback
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const audioBuffer = await createAudioBuffer(audioBytes, audioContext);
      
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      
      source.onended = () => {
        setStatus('Speech generated and ready for download.');
        audioContext.close();
      };
      
      source.start();
      setStatus('Playing audio...');

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(errorMessage);
      setStatus('Error generating speech.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-[var(--background-primary)] rounded-xl shadow-2xl overflow-hidden border border-[var(--border-primary)]">
      <div className="p-4 border-b border-[var(--border-primary)]">
        <h2 className="text-xl font-bold text-[var(--text-primary)]">Audivox Room</h2>
        <p className="text-sm text-[var(--text-muted)]">Text-to-Speech Generation</p>
      </div>

      <div className="flex-1 p-6 flex flex-col gap-4">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Enter text to convert to speech..."
          className="w-full flex-grow bg-[var(--background-secondary)] text-[var(--text-primary)] placeholder-[var(--text-muted)] rounded-lg p-4 border border-[var(--border-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-secondary)] resize-none"
          rows={6}
        />
        
        <div>
          <label className="font-semibold text-[var(--text-primary)] mb-2 block">Voice:</label>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
             {availableVoices.map((v) => (
                <button
                    key={v.id}
                    onClick={() => setVoice(v.id)}
                    className={`p-3 rounded-lg text-center transition-all duration-200 ${
                        voice === v.id
                        ? 'bg-[var(--accent-primary)] text-white ring-2 ring-white/80 shadow-lg'
                        : 'bg-[var(--background-secondary)] text-[var(--text-secondary)] hover:bg-[var(--border-primary)]'
                    }`}
                >
                    <div className="font-bold text-sm">{v.name}</div>
                    <div className="text-xs text-gray-400">{v.gender}</div>
                </button>
             ))}
          </div>
        </div>

        <button
          onClick={handleGenerateSpeech}
          disabled={isLoading || !text.trim()}
          className="w-full bg-[var(--accent-primary)] text-white font-bold py-3 rounded-lg hover:bg-[var(--accent-primary-hover)] transition-colors duration-200 disabled:bg-[var(--text-muted)] disabled:cursor-not-allowed flex items-center justify-center mt-2"
        >
          {isLoading ? <Spinner /> : 'Generate Speech'}
        </button>
        
        {audioBlob && !isLoading && (
          <a
            href={URL.createObjectURL(audioBlob)}
            download={getFilename(text, voice)}
            className="w-full bg-[var(--accent-secondary)] text-white font-bold py-3 rounded-lg hover:bg-[var(--accent-secondary-hover)] transition-colors duration-200 flex items-center justify-center text-center"
          >
            Download Audio
          </a>
        )}

        {/* Status and Error Display */}
        <div className="text-center h-5 mt-2">
            {error && <p className="text-red-400 text-sm">{error}</p>}
            {status && !error && <p className="text-[var(--text-secondary)] text-sm">{status}</p>}
        </div>
      </div>
    </div>
  );
};

export default Audivox;
