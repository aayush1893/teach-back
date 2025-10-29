
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { SparklesIcon, MicrophoneIcon, StopIcon, UploadIcon, SpeakerWaveIcon } from './icons';
import { transcribeAndTranslateAudio, synthesizeSpeech } from '../services/geminiService';
import { Language, SUPPORTED_LANGUAGES } from '../types';

declare const pdfjsLib: any;

interface InputCardProps {
  inputText: string;
  setInputText: (text: string) => void;
  onGenerate: () => void;
  isLoading: boolean;
  onSave: () => void;
  onLoad: () => void;
  onClear: () => void;
  hasSavedSession: boolean;
  isSessionActive: boolean;
  setToast: (toast: {message: string, type: 'success' | 'error' | 'info'}) => void;
  translatedAudio: AudioBuffer | null;
  setTranslatedAudio: (buffer: AudioBuffer | null) => void;
}

const InputCard: React.FC<InputCardProps> = ({ 
    inputText, setInputText, onGenerate, isLoading, 
    onSave, onLoad, onClear, hasSavedSession, isSessionActive, 
    setToast, translatedAudio, setTranslatedAudio 
}) => {
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State for new audio feature
  const [sourceLang, setSourceLang] = useState<Language>('en');
  const [targetLang, setTargetLang] = useState<Language>('es');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessingAudio, setIsProcessingAudio] = useState(false);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const isAudioApiSupported = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder);


  const isAnyLoading = isLoading || isPdfLoading || isProcessingAudio || isSynthesizing;
  const isGenerateButtonDisabled = isAnyLoading || inputText.trim().length < 20;
  
  // --- New Audio Translation Logic ---

  const handleStartRecording = async () => {
    if (!isAudioApiSupported) {
        setToast({ message: "Your browser doesn't support audio recording.", type: 'error' });
        return;
    }
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorderRef.current = new MediaRecorder(stream);
        audioChunksRef.current = [];
        
        mediaRecorderRef.current.ondataavailable = (event) => {
            audioChunksRef.current.push(event.data);
        };

        mediaRecorderRef.current.onstop = async () => {
            setIsProcessingAudio(true);
            setToast({ message: 'Processing audio...', type: 'info' });
            const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
            
            try {
                const targetLangName = SUPPORTED_LANGUAGES.find(l => l.code === targetLang)?.name || 'the selected language';
                const translatedText = await transcribeAndTranslateAudio(audioBlob, sourceLang, targetLang, targetLangName);
                setInputText(translatedText);
                setTranslatedAudio(null); // Clear previous audio
                setToast({ message: 'Translation complete!', type: 'success' });
            } catch (error) {
                console.error(error);
                setToast({ message: error instanceof Error ? error.message : 'Audio processing failed.', type: 'error' });
            } finally {
                setIsProcessingAudio(false);
            }

            stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorderRef.current.start();
        setIsRecording(true);
    } catch (err) {
        console.error("Error starting recording:", err);
        setToast({ message: 'Could not start microphone. Please check permissions.', type: 'error' });
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const handleListen = async () => {
    if (translatedAudio) {
      // Play existing audio
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioContext.createBufferSource();
      source.buffer = translatedAudio;
      source.connect(audioContext.destination);
      source.start(0);
    } else if (inputText.trim()) {
      // Synthesize new audio
      setIsSynthesizing(true);
      setToast({ message: 'Generating audio...', type: 'info' });
      try {
        const audioBuffer = await synthesizeSpeech(inputText, targetLang);
        setTranslatedAudio(audioBuffer);
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContext.destination);
        source.start(0);
      } catch (error) {
         console.error(error);
         setToast({ message: error instanceof Error ? error.message : 'Could not generate audio.', type: 'error' });
      } finally {
        setIsSynthesizing(false);
      }
    }
  };


  // --- PDF Logic ---
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsPdfLoading(true);
    setInputText('');
    setTranslatedAudio(null);
    setToast({ message: 'Processing PDF...', type: 'info' });

    try {
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const typedarray = new Uint8Array(e.target?.result as ArrayBuffer);
                const pdf = await pdfjsLib.getDocument(typedarray).promise;
                let fullText = '';
                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const textContent = await page.getTextContent();
                    fullText += textContent.items.map((item: any) => item.str).join(' ') + '\n';
                }
                
                if (fullText.trim().length > 0) {
                    setInputText(fullText);
                    setToast({ message: 'PDF text extracted successfully!', type: 'success' });
                } else {
                    setToast({ message: 'This looks like a scanned PDF. For best results, please copy and paste the text.', type: 'info' });
                }
            } catch (pdfError) {
                console.error("Error processing PDF:", pdfError);
                setToast({ message: 'Could not process PDF. The file may be corrupted or protected.', type: 'error' });
            } finally {
                setIsPdfLoading(false);
                if(fileInputRef.current) fileInputRef.current.value = '';
            }
        };
        reader.readAsArrayBuffer(file);
    } catch (error) {
        console.error("Error reading file:", error);
        setToast({ message: 'Could not read the selected file.', type: 'error' });
        setIsPdfLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
      <h2 className="text-xl font-semibold mb-3">1. Provide Instructions</h2>
       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
                <label htmlFor="source-lang" className="block text-sm font-medium text-gray-700">Spoken Language</label>
                <select 
                    id="source-lang" 
                    value={sourceLang}
                    onChange={e => setSourceLang(e.target.value as Language)}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                >
                    {SUPPORTED_LANGUAGES.map(lang => <option key={lang.code} value={lang.code}>{lang.name}</option>)}
                </select>
            </div>
             <div>
                <label htmlFor="target-lang" className="block text-sm font-medium text-gray-700">Translate To & Listen In</label>
                <select 
                    id="target-lang" 
                    value={targetLang}
                    onChange={e => setTargetLang(e.target.value as Language)}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                >
                    {SUPPORTED_LANGUAGES.map(lang => <option key={lang.code} value={lang.code}>{lang.name}</option>)}
                </select>
            </div>
       </div>

      <textarea
        data-tour-id="input-area"
        value={inputText}
        onChange={(e) => {
            setInputText(e.target.value)
            setTranslatedAudio(null);
        }}
        placeholder="Paste instructions, use the microphone to translate, or upload a PDF..."
        className="w-full h-48 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow resize-y"
        disabled={isAnyLoading}
        aria-label="Medical Instructions Input"
      />
      <p className="text-xs text-gray-500 mt-1">Minimum 20 characters. No personal data is saved.</p>
      
      <div className="mt-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div data-tour-id="input-buttons" className="flex items-center flex-wrap gap-2">
             <button
                onClick={isRecording ? handleStopRecording : handleStartRecording}
                disabled={isAnyLoading || !isAudioApiSupported}
                className={`px-4 py-2 text-sm font-medium border rounded-md flex items-center justify-center transition-colors ${isRecording ? 'text-red-700 bg-red-100 border-red-300 hover:bg-red-200' : 'text-blue-700 bg-blue-50 border-blue-200 hover:bg-blue-100'} disabled:opacity-50 disabled:cursor-not-allowed`}
                title={!isAudioApiSupported ? "Audio recording not supported in your browser" : (isRecording ? "Stop Recording" : "Start Recording")}
            >
                {isRecording ? <><StopIcon className="w-4 h-4 mr-2" /> Stop Recording</> : <><MicrophoneIcon className="w-4 h-4 mr-2" /> Transcribe & Translate</>}
            </button>
            <button
                onClick={handleListen}
                disabled={isAnyLoading || !inputText.trim()}
                className="px-4 py-2 text-sm font-medium border rounded-md flex items-center justify-center transition-colors text-gray-700 bg-white border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Listen to the text in the selected language"
            >
                {isSynthesizing ? 'Generating...' : <><SpeakerWaveIcon className="w-4 h-4 mr-2" /> Listen</>}
            </button>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".pdf" className="hidden" disabled={isAnyLoading} />
            <button
                onClick={handleUploadClick}
                disabled={isAnyLoading}
                className="px-4 py-2 text-sm font-medium border rounded-md flex items-center justify-center transition-colors text-gray-700 bg-white border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Upload PDF"
            >
                {isPdfLoading ? 'Processing...' : <><UploadIcon className="w-4 h-4 mr-2" /> Upload PDF</>}
            </button>
        </div>
        <button
          data-tour-id="generate-button"
          onClick={onGenerate}
          disabled={isGenerateButtonDisabled}
          className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 disabled:scale-100 order-first sm:order-last"
        >
          {isLoading || isProcessingAudio ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {isLoading ? 'Generating...' : 'Processing...'}
            </>
          ) : (
            <>
              <SparklesIcon className="w-5 h-5 mr-2" />
              Generate Explanation & Quiz
            </>
          )}
        </button>
      </div>
       <div data-tour-id="session-buttons" className="mt-6 border-t pt-4 flex flex-col sm:flex-row items-stretch sm:items-center sm:space-x-2 space-y-2 sm:space-y-0">
            <button onClick={onLoad} disabled={!hasSavedSession || isAnyLoading} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed">Load Session</button>
            <button onClick={onSave} disabled={!isSessionActive || isAnyLoading} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed">Save Session</button>
            <button onClick={onClear} disabled={(!hasSavedSession && !isSessionActive) || isAnyLoading} className="px-4 py-2 text-sm font-medium text-red-700 bg-red-50 border-red-200 rounded-md hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed">Clear Session</button>
        </div>
    </div>
  );
};

export default InputCard;