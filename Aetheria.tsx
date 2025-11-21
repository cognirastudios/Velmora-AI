import React, { useState, useRef, useEffect } from 'react';
import { connectLive } from '../../services/Vulmora AIService';
import { AetheriaIcon, UserIcon, VelmoraIcon } from '../Icons';
import { LiveServerMessage, Blob } from '@congira apps';

// --- Audio Encoding/Decoding Helpers ---
// Fix: Removed empty function declarations and used full implementations directly.
function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function encode(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

function createBlob(data: Float32Array): Blob {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

// --- Component ---

interface TranscriptTurn {
    id: string;
    user: string;
    model: string;
}

const Aetheria: React.FC = () => {
    const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [error, setError] = useState('');
    
    // Transcription state
    const [transcriptHistory, setTranscriptHistory] = useState<TranscriptTurn[]>([]);
    const [currentUserInput, setCurrentUserInput] = useState('');
    const [currentModelOutput, setCurrentModelOutput] = useState('');
    const transcriptEndRef = useRef<HTMLDivElement>(null);

    const sessionPromiseRef = useRef<ReturnType<typeof connectLive> | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    
    const nextStartTimeRef = useRef(0);
    const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

    const cleanup = () => {
        if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
        if (scriptProcessorRef.current) scriptProcessorRef.current.disconnect();
        if (mediaStreamSourceRef.current) mediaStreamSourceRef.current.disconnect();
        if (inputAudioContextRef.current?.state !== 'closed') inputAudioContextRef.current?.close();
        if (outputAudioContextRef.current?.state !== 'closed') {
             sourcesRef.current.forEach(source => source.stop());
             sourcesRef.current.clear();
             outputAudioContextRef.current?.close();
        }
        sessionPromiseRef.current = null;
        streamRef.current = scriptProcessorRef.current = mediaStreamSourceRef.current = inputAudioContextRef.current = outputAudioContextRef.current = null;
        nextStartTimeRef.current = 0;
        setStatus('idle');
        setIsSpeaking(false);
    };

    useEffect(() => {
        transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [transcriptHistory, currentUserInput, currentModelOutput]);

    const handleToggleConnection = async () => {
        if (status === 'connected' || status === 'connecting') {
            sessionPromiseRef.current?.then(session => session.close());
            cleanup();
            return;
        }

        setStatus('connecting');
        setError('');
        setTranscriptHistory([]);
        setCurrentUserInput('');
        setCurrentModelOutput('');

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            nextStartTimeRef.current = outputAudioContextRef.current.currentTime;

            const aetheriaSystemInstruction = `You are Aetheria, a vocal AI assistant from Velmora. Your voice is your primary interface. Keep your responses concise, conversational, and clear. Avoid lists or formatting that doesn't translate well to speech. Your goal is to have a natural, back-and-forth conversation.`;

            // Fix: Refactored to define callbacks once and correctly handle state updates.
            sessionPromiseRef.current = connectLive({
                onopen: () => {
                    setStatus('connected');
                    const source = inputAudioContextRef.current!.createMediaStreamSource(streamRef.current!);
                    mediaStreamSourceRef.current = source;
                    
                    const scriptProcessor = inputAudioContextRef.current!.createScriptProcessor(4096, 1, 1);
                    scriptProcessorRef.current = scriptProcessor;

                    scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
                        const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                        const pcmBlob = createBlob(inputData);
                        sessionPromiseRef.current?.then((session) => session.sendRealtimeInput({ media: pcmBlob }));
                    };
                    
                    source.connect(scriptProcessor);
                    scriptProcessor.connect(inputAudioContextRef.current!.destination);
                },
                onmessage: async (message: LiveServerMessage) => {
                    const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                    if (audioData) {
                       setIsSpeaking(true);
                       const outputAudioContext = outputAudioContextRef.current!;
                       const nextStartTime = Math.max(nextStartTimeRef.current, outputAudioContext.currentTime);
                       const audioBuffer = await decodeAudioData(decode(audioData), outputAudioContext, 24000, 1);
                       const source = outputAudioContext.createBufferSource();
                       source.buffer = audioBuffer;
                       source.connect(outputAudioContext.destination);
                       source.addEventListener('ended', () => {
                           sourcesRef.current.delete(source);
                           if (sourcesRef.current.size === 0) setIsSpeaking(false);
                       });
                       source.start(nextStartTime);
                       nextStartTimeRef.current = nextStartTime + audioBuffer.duration;
                       sourcesRef.current.add(source);
                    }
                    if (message.serverContent?.interrupted) {
                        sourcesRef.current.forEach(source => source.stop());
                        sourcesRef.current.clear();
                        nextStartTimeRef.current = 0;
                        setIsSpeaking(false);
                    }

                    // Handle transcriptions
                    if (message.serverContent?.inputTranscription) {
                        setCurrentUserInput(prev => prev + message.serverContent.inputTranscription.text);
                    }
                    if (message.serverContent?.outputTranscription) {
                        setCurrentModelOutput(prev => prev + message.serverContent.outputTranscription.text);
                    }
                    // Fix: Correctly update history and reset state on turn completion, avoiding stale closures.
                    if (message.serverContent?.turnComplete) {
                        setCurrentUserInput(prevInput => {
                           setCurrentModelOutput(prevModel => {
                               setTranscriptHistory(prevHistory => {
                                   if (prevInput || prevModel) { // Only add if there's content
                                       return [...prevHistory, { id: crypto.randomUUID(), user: prevInput, model: prevModel }];
                                   }
                                   return prevHistory;
                               });
                               return ''; // Reset model output
                           });
                           return ''; // Reset user input
                        });
                   }
                },
                onerror: (e: ErrorEvent) => {
                     console.error("Aetheria Error:", e);
                     setError("A connection error occurred.");
                     setStatus('error');
                     cleanup();
                },
                onclose: (e: CloseEvent) => {
                     cleanup();
                },
            }, aetheriaSystemInstruction);

        } catch (err) {
            console.error('Failed to start session:', err);
            setError('Could not access microphone. Please grant permission and try again.');
            setStatus('error');
            cleanup();
        }
    };

    useEffect(() => { return () => { if (sessionPromiseRef.current) { sessionPromiseRef.current.then(session => session.close()); } cleanup(); }; }, []);
    
    const buttonState = {
        'idle': { text: 'Start Conversation', style: 'bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)]' },
        'error': { text: 'Start Conversation', style: 'bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)]' },
        'connecting': { text: 'Connecting...', style: 'bg-yellow-600' },
        'connected': { text: 'End Conversation', style: 'bg-[var(--accent-danger)] hover:bg-[var(--accent-danger-hover)]' },
    }[status];

    return (
        <div className="h-full flex flex-col bg-[var(--background-primary)] rounded-xl shadow-2xl overflow-hidden border border-[var(--border-primary)]">
            <div className="p-4 border-b border-[var(--border-primary)] flex-shrink-0">
                <h2 className="text-xl font-bold text-[var(--text-primary)]">Aetheria Room</h2>
                <p className="text-sm text-[var(--text-muted)]">Live, real-time voice conversations</p>
            </div>

            <div className="flex-1 p-6 flex flex-col items-center justify-center gap-4">
                <div className={`relative w-32 h-32 md:w-40 md:h-40 flex items-center justify-center rounded-full transition-all duration-300 ${isSpeaking ? 'bg-blue-500/20' : 'bg-[var(--background-secondary)]'}`}>
                    {isSpeaking && <div className="absolute inset-0 rounded-full bg-blue-500 animate-pulse"></div>}
                    <AetheriaIcon className={`w-16 h-16 md:w-24 md:h-24 transition-colors duration-300 ${status === 'connected' ? 'text-green-400' : 'text-[var(--text-muted)]'}`} />
                </div>
                <button
                    onClick={handleToggleConnection}
                    disabled={status === 'connecting'}
                    className={`px-8 py-4 rounded-full flex items-center gap-3 text-lg font-semibold transition-all duration-300 text-white shadow-lg ${buttonState.style} disabled:cursor-not-allowed`}
                >
                    <AetheriaIcon className="w-6 h-6" />
                    {buttonState.text}
                </button>
                 {error && <p className="text-red-400 mt-2 text-sm">{error}</p>}
            </div>
            
            <div className="flex-shrink-0 h-1/3 bg-[var(--background-secondary)] p-4 border-t border-[var(--border-primary)] overflow-y-auto">
                 {transcriptHistory.length === 0 && !currentUserInput && !currentModelOutput && status !== 'connected' && (
                    <div className="flex items-center justify-center h-full text-[var(--text-muted)]">Conversation transcript will appear here.</div>
                 )}
                 <div className="space-y-4 text-sm">
                    {transcriptHistory.map(turn => (
                        <React.Fragment key={turn.id}>
                            <div className="flex items-start gap-2.5">
                                <span className="flex-shrink-0 h-6 w-6 rounded-full flex items-center justify-center bg-[var(--text-muted)]"><UserIcon className="h-4 w-4 text-white"/></span>
                                <p className="flex-1 bg-[var(--background-primary)] p-3 rounded-lg text-[var(--text-primary)]">{turn.user}</p>
                            </div>
                             <div className="flex items-start gap-2.5">
                                <span className="flex-shrink-0 h-6 w-6 rounded-full flex items-center justify-center bg-white"><VelmoraIcon className="h-4 w-4"/></span>
                                <p className="flex-1 bg-[var(--background-primary)] p-3 rounded-lg text-[var(--text-primary)]">{turn.model}</p>
                            </div>
                        </React.Fragment>
                    ))}
                    {currentUserInput && (
                         <div className="flex items-start gap-2.5">
                            <span className="flex-shrink-0 h-6 w-6 rounded-full flex items-center justify-center bg-[var(--text-muted)]"><UserIcon className="h-4 w-4 text-white"/></span>
                            <p className="flex-1 bg-[var(--background-primary)] p-3 rounded-lg text-[var(--text-secondary)] italic">{currentUserInput}</p>
                        </div>
                    )}
                    {currentModelOutput && (
                        <div className="flex items-start gap-2.5">
                            <span className="flex-shrink-0 h-6 w-6 rounded-full flex items-center justify-center bg-white"><VelmoraIcon className="h-4 w-4"/></span>
                            <p className="flex-1 bg-[var(--background-primary)] p-3 rounded-lg text-[var(--text-secondary)] italic">{currentModelOutput}</p>
                        </div>
                    )}
                 </div>
                 <div ref={transcriptEndRef} />
            </div>
        </div>
    );
};

export default Aetheria;