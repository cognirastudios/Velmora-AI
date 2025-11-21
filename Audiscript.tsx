

import React, { useState, useEffect, useRef } from 'react';
import { AudivoxIcon } from '../Icons';

// --- Type Definitions for Web Speech API ---
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}
interface SpeechRecognitionResultList {
  [index: number]: SpeechRecognitionResult;
  length: number;
  item(index: number): SpeechRecognitionResult;
}
interface SpeechRecognitionResult {
  isFinal: boolean;
  [index: number]: SpeechRecognitionAlternative;
}
interface SpeechRecognitionAlternative {
  transcript: string;
}
interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: () => void;
  start: () => void;
  stop: () => void;
}

const languages = [
  { code: 'en-US', name: 'English (US)' },
  { code: 'en-GB', name: 'English (UK)' },
  { code: 'es-ES', name: 'Español (España)' },
  { code: 'fr-FR', name: 'Français' },
  { code: 'de-DE', name: 'Deutsch' },
  { code: 'it-IT', name: 'Italiano' },
  { code: 'ja-JP', name: '日本語' },
  { code: 'ar-SA', name: 'العربية' },
];

const Audiscript: React.FC = () => {
  const [isListening, setIsListening] = useState(false);
  const [finalTranscript, setFinalTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [selectedLang, setSelectedLang] = useState('en-US');
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = selectedLang;
    recognitionRef.current = recognition;

    recognition.onresult = (event) => {
      let interim = '';
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      setInterimTranscript(interim);
      if (final) {
        setFinalTranscript(prev => prev + final);
        setInterimTranscript('');
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    return () => {
      recognition.stop();
    };
  }, [selectedLang]);

  const handleToggleListen = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      setFinalTranscript('');
      setInterimTranscript('');
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  return (
    <div className="h-full flex flex-col bg-[var(--background-primary)] rounded-xl shadow-2xl overflow-hidden border border-[var(--border-primary)]">
      <div className="p-4 border-b border-[var(--border-primary)]">
        <h2 className="text-xl font-bold text-[var(--text-primary)]">Audiscript Room</h2>
        <p className="text-sm text-[var(--text-muted)]">Real-time Speech-to-Text Transcription</p>
      </div>

      <div className="flex-1 p-6 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <button
            onClick={handleToggleListen}
            className={`w-full sm:w-auto px-6 py-3 rounded-full flex items-center justify-center gap-3 text-lg font-semibold transition-all duration-300 text-white shadow-lg ${
              isListening
                ? 'bg-[var(--accent-danger)] hover:bg-[var(--accent-danger-hover)]'
                : 'bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)]'
            }`}
          >
            <div className={`relative w-6 h-6 flex items-center justify-center`}>
              {isListening && <div className="absolute w-full h-full bg-white/30 rounded-full animate-ping"></div>}
              <AudivoxIcon className="w-6 h-6" />
            </div>
            {isListening ? 'Stop Listening' : 'Start Transcription'}
          </button>
          <select
            value={selectedLang}
            onChange={(e) => setSelectedLang(e.target.value)}
            disabled={isListening}
            className="w-full sm:w-auto bg-[var(--background-secondary)] text-[var(--text-primary)] rounded-lg px-4 py-3 border border-[var(--border-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-secondary)] disabled:opacity-50"
          >
            {languages.map(lang => (
              <option key={lang.code} value={lang.code}>{lang.name}</option>
            ))}
          </select>
        </div>

        <div className="w-full flex-grow bg-[var(--background-secondary)] rounded-lg p-4 border border-[var(--border-primary)] overflow-y-auto">
          <p className="whitespace-pre-wrap text-[var(--text-primary)] font-sans text-sm">
            {finalTranscript || interimTranscript ? (
              <>
                {finalTranscript}
                <span className="text-[var(--text-muted)]">{interimTranscript}</span>
              </>
            ) : (
              <span className="text-[var(--text-muted)]">Your transcribed text will appear here...</span>
            )}
          </p>
        </div>
        
        <button 
            onClick={() => navigator.clipboard.writeText(finalTranscript)}
            disabled={!finalTranscript}
            className="mt-2 px-5 py-2 bg-[var(--accent-secondary)] text-white rounded-lg hover:bg-[var(--accent-secondary-hover)] disabled:bg-[var(--text-muted)] disabled:cursor-not-allowed transition-colors"
        >
            Copy Final Text
        </button>
      </div>
    </div>
  );
};

export default Audiscript;