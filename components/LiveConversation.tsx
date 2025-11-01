

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Modality, Blob, LiveServerMessage } from '@google/genai';
import { ChatMessage } from '../types';
import { connectLiveSession } from '../services/geminiService';
import { MicrophoneIcon, StopIcon, SparklesIcon } from './icons';
import { mockLiveTranscript } from '../data/mockChatData';

const isApiSupported = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && (window.AudioContext || (window as any).webkitAudioContext));

// Audio Encoding/Decoding utilities
function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
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

interface LiveConversationProps {
    isDemoActive: boolean;
}

type LiveSession = Awaited<ReturnType<typeof connectLiveSession>>;

const LiveConversation: React.FC<LiveConversationProps> = ({ isDemoActive }) => {
    const [transcript, setTranscript] = useState<ChatMessage[]>([]);
    const [isConnecting, setIsConnecting] = useState(false);
    const [isLive, setIsLive] = useState(false);
    const sessionRef = useRef<LiveSession | null>(null);
    const audioInfrastructureRef = useRef<{
        inputAudioContext: AudioContext,
        outputAudioContext: AudioContext,
        processor: ScriptProcessorNode,
        stream: MediaStream
    } | null>(null);
    const transcriptContainerRef = useRef<HTMLDivElement>(null);
    
    // Refs for streaming transcription text
    const currentInputTranscriptionRef = useRef('');
    const currentOutputTranscriptionRef = useRef('');

    useEffect(() => {
        if (transcriptContainerRef.current) {
            transcriptContainerRef.current.scrollTop = transcriptContainerRef.current.scrollHeight;
        }
    }, [transcript]);

    const stopSession = useCallback(async () => {
        setIsLive(false);
        setIsConnecting(false);

        if (sessionRef.current) {
            sessionRef.current.close();
            sessionRef.current = null;
        }
        if (audioInfrastructureRef.current) {
            audioInfrastructureRef.current.stream.getTracks().forEach(track => track.stop());
            audioInfrastructureRef.current.processor.disconnect();
            if (audioInfrastructureRef.current.inputAudioContext.state !== 'closed') {
                await audioInfrastructureRef.current.inputAudioContext.close();
            }
            if (audioInfrastructureRef.current.outputAudioContext.state !== 'closed') {
                await audioInfrastructureRef.current.outputAudioContext.close();
            }
            audioInfrastructureRef.current = null;
        }
    }, []);

    const startSession = async () => {
        if (!isApiSupported) {
             alert("Your browser does not support the necessary Audio APIs for this feature.");
             return;
        }
        setIsConnecting(true);
        currentInputTranscriptionRef.current = '';
        currentOutputTranscriptionRef.current = '';
        setTranscript([]);

        try {
            // FIX: Cast window to any to support vendor-prefixed webkitAudioContext
            const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            let nextStartTime = 0;
            const sources = new Set<AudioBufferSourceNode>();

            const sessionPromise = connectLiveSession({
                onopen: async () => {
                    // FIX: Cast window to any to support vendor-prefixed webkitAudioContext
                    const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
                    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                    const source = inputAudioContext.createMediaStreamSource(stream);
                    const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
                    
                    scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
                        const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                        const pcmBlob: Blob = {
                            data: encode(new Uint8Array(new Int16Array(inputData.map(f => f * 32768)).buffer)),
                            mimeType: 'audio/pcm;rate=16000',
                        };
                        sessionPromise.then(session => session.sendRealtimeInput({ media: pcmBlob }));
                    };
                    source.connect(scriptProcessor);
                    scriptProcessor.connect(inputAudioContext.destination);

                    audioInfrastructureRef.current = { inputAudioContext, outputAudioContext, processor: scriptProcessor, stream };
                    setIsConnecting(false);
                    setIsLive(true);
                },
                onmessage: async (message: LiveServerMessage) => {
                    // Handle transcriptions
                    if (message.serverContent?.inputTranscription) {
                        currentInputTranscriptionRef.current += message.serverContent.inputTranscription.text;
                    }
                    if (message.serverContent?.outputTranscription) {
                       currentOutputTranscriptionRef.current += message.serverContent.outputTranscription.text;
                    }
                    if (message.serverContent?.turnComplete) {
                        const fullInput = currentInputTranscriptionRef.current.trim();
                        const fullOutput = currentOutputTranscriptionRef.current.trim();
                        
                        setTranscript(prev => {
                            let newTranscript = [...prev];
                            if (fullInput) newTranscript.push({ role: 'user', text: fullInput });
                            if (fullOutput) newTranscript.push({ role: 'model', text: fullOutput });
                            return newTranscript;
                        });

                        currentInputTranscriptionRef.current = '';
                        currentOutputTranscriptionRef.current = '';
                    }
                    
                    // Handle audio playback
                    const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                    if (base64Audio) {
                        nextStartTime = Math.max(nextStartTime, outputAudioContext.currentTime);
                        const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioContext, 24000, 1);
                        const source = outputAudioContext.createBufferSource();
                        source.buffer = audioBuffer;
                        source.connect(outputAudioContext.destination);
                        source.addEventListener('ended', () => sources.delete(source));
                        source.start(nextStartTime);
                        nextStartTime += audioBuffer.duration;
                        sources.add(source);
                    }
                    if (message.serverContent?.interrupted) {
                        sources.forEach(source => source.stop());
                        sources.clear();
                        nextStartTime = 0;
                    }
                },
                onerror: (e) => {
                    console.error("Live session error:", e);
                    alert("A connection error occurred. The session will now close.");
                    stopSession();
                },
                onclose: () => {
                    // console.log("Live session closed.");
                },
            });
            sessionRef.current = await sessionPromise;
        } catch (error) {
            console.error("Failed to start live session:", error);
            alert("Could not start session. Check microphone permissions and try again.");
            await stopSession();
        }
    };
    
    useEffect(() => {
        return () => { stopSession(); };
    }, [stopSession]);
    
    const displayTranscript = isDemoActive ? mockLiveTranscript : transcript;

    return (
        <div data-tour-id="live-qa-content" className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 flex flex-col h-[65vh] sm:h-[70vh] max-h-[700px]">
            <div className="flex justify-between items-center mb-4 border-b dark:border-gray-700 pb-3">
                 <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Live Q&A</h2>
                 <button
                    onClick={isLive || isConnecting ? stopSession : startSession}
                    disabled={!isApiSupported || isDemoActive}
                    title={!isApiSupported ? "Your browser does not support the necessary APIs for this feature." : (isLive ? "End Session" : "Start Live Q&A")}
                    className={`px-4 py-2 text-sm font-medium border rounded-md flex items-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${isLive || isConnecting ? 'text-red-700 bg-red-100 border-red-300 hover:bg-red-200 dark:text-red-300 dark:bg-red-900/50 dark:border-red-700 dark:hover:bg-red-900' : 'text-blue-700 bg-blue-50 border-blue-200 hover:bg-blue-100 dark:text-blue-300 dark:bg-blue-900/50 dark:border-blue-700 dark:hover:bg-blue-900'}`}
                 >
                     {isConnecting ? (
                         <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            Connecting...
                         </>
                     ) : isLive ? (
                         <> <StopIcon className="w-4 h-4 mr-2" /> End Session </>
                     ) : (
                         <> <MicrophoneIcon className="w-4 h-4 mr-2" /> Start Live Q&A </>
                     )}
                 </button>
            </div>
            <div ref={transcriptContainerRef} className="flex-grow overflow-y-auto pr-4 -mr-4 space-y-4">
                 {!isLive && displayTranscript.length === 0 && !isDemoActive && (
                    <div className="text-center text-gray-500 dark:text-gray-400 pt-10">
                         {!isApiSupported ? (
                            <p>Sorry, your browser doesn't support the required features for live conversations.</p>
                        ) : (
                            <p>Click "Start Live Q&A" to begin a voice conversation.</p>
                        )}
                    </div>
                )}
                {displayTranscript.map((msg, index) => (
                    <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                        {msg.role === 'model' && <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center flex-shrink-0"><SparklesIcon className="w-5 h-5"/></div>}
                        <div className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-lg ${msg.role === 'user' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'}`}>
                           <p className="text-sm">{msg.text}</p>
                        </div>
                    </div>
                ))}
                 {isLive && transcript.length === 0 && (
                    <div className="text-center text-gray-500 dark:text-gray-400 pt-10">
                        <p className="flex items-center justify-center"><span className="relative flex h-3 w-3 mr-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span></span> Listening... Ask me a question.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LiveConversation;
