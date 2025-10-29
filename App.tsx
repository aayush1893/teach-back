
import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import InputCard from './components/InputCard';
import SimplifiedTextCard from './components/SimplifiedTextCard';
import QuizCard from './components/QuizCard';
import MasteryBadge from './components/MasteryBadge';
import MetricsFooter from './components/MetricsFooter';
import HelpModal from './components/HelpModal';
import DisclaimerModal from './components/DisclaimerModal';
import PrintSummary from './components/PrintSummary';
import ChatBot from './components/ChatBot';
import LiveConversation from './components/LiveConversation';
import Toast from './components/Toast';
import ConfirmationModal from './components/ConfirmationModal';
import VideoPlayerModal from './components/VideoPlayerModal';
import { generateTeachBack, generateTutorialVideo } from './services/geminiService';
import { TeachBackData, QuizState, UserAnswers, SessionMetrics, SavedSessionState } from './types';
import { useTimer } from './hooks/useTimer';
import { tourSteps } from './components/tourSteps';
import { sampleInputText, mockTeachBackData } from './data/mockTeachBackData';

// React Joyride is loaded from a CDN, so we declare it here.
declare const Joyride: any;
// aistudio is globally available for API key selection
declare const window: any;


const SESSION_STORAGE_KEY = 'teachback_session_v1';
const TOUR_STORAGE_KEY = 'teachback_tour_completed_v1';

type ActiveTab = 'teach-back' | 'chat-helper' | 'live-qa';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('teach-back');
  
  // State for Teach-Back Tab
  const [inputText, setInputText] = useState('');
  const [generatedContent, setGeneratedContent] = useState<TeachBackData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quizState, setQuizState] = useState<QuizState>(QuizState.NotStarted);
  const [userAnswers, setUserAnswers] = useState<UserAnswers>({});
  const [sessionMetrics, setSessionMetrics] = useState<SessionMetrics>({
    attempts: 0,
    masteryTime: null,
    readingGrade: null
  });
  const [translatedAudio, setTranslatedAudio] = useState<AudioBuffer | null>(null);


  const { elapsedTime, start: startTimer, stop: stopTimer, reset: resetTimer, setElapsedTime, formattedTime } = useTimer();

  // Modals, Session, Notifications, Tour, and Video
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showDisclaimerModal, setShowDisclaimerModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showPostTourModal, setShowPostTourModal] = useState(false);
  const [hasSavedSession, setHasSavedSession] = useState(false);
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error' | 'info'} | null>(null);
  const [runTour, setRunTour] = useState(false);
  const [isDemoActive, setIsDemoActive] = useState(false);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [apiKeySelected, setApiKeySelected] = useState(false);

  useEffect(() => {
    const totalSessions = parseInt(localStorage.getItem('teachback_total_sessions') || '0', 10);
    localStorage.setItem('teachback_total_sessions', (totalSessions + 1).toString());
    
    if (localStorage.getItem(SESSION_STORAGE_KEY)) {
        setHasSavedSession(true);
    }

    const checkKey = async () => {
      if (window.aistudio?.hasSelectedApiKey) {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        setApiKeySelected(hasKey);
      }
    };
    checkKey();
  }, []);
  
  const resetSession = useCallback((clearInput = false) => {
    if (clearInput) {
        setInputText('');
    }
    setGeneratedContent(null);
    setQuizState(QuizState.NotStarted);
    setUserAnswers({});
    resetTimer();
    setSessionMetrics({ attempts: 0, masteryTime: null, readingGrade: null });
    setTranslatedAudio(null);
    setIsDemoActive(false);
  }, [resetTimer]);
  
  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);
    resetSession();
    startTimer();
    setSessionMetrics(prev => ({ ...prev, attempts: 1 }));

    try {
      const data = await generateTeachBack(inputText);
      setGeneratedContent(data);
      setQuizState(QuizState.InProgress);
      setSessionMetrics(prev => ({ ...prev, readingGrade: data.reading_grade }));
      setUserAnswers({});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      resetSession();
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerChange = (questionIndex: number, answer: string) => {
    setUserAnswers(prev => ({ ...prev, [questionIndex]: answer }));
  };

  const handleSubmitQuiz = () => {
    if (!generatedContent) return;
    setQuizState(QuizState.Submitted);
    const allCorrect = generatedContent.qa.every((item, index) => userAnswers[index] === item.a_correct);

    if (allCorrect) {
      setQuizState(QuizState.Mastered);
      const masteryTime = stopTimer();
      setSessionMetrics(prev => ({ ...prev, masteryTime }));
      const masteredCount = parseInt(localStorage.getItem('teachback_mastered_count') || '0', 10);
      localStorage.setItem('teachback_mastered_count', (masteredCount + 1).toString());
    }
  };

  const handleTryAgain = () => {
    setQuizState(QuizState.InProgress);
    setUserAnswers({});
    setSessionMetrics(prev => ({ ...prev, attempts: prev.attempts + 1 }));
  };

  const handleDownloadSummary = () => {
    window.print();
  };

  // --- Session Management ---
  const handleSaveSession = () => {
    if (!generatedContent) {
      setToast({ message: 'Nothing to save yet.', type: 'info' });
      return;
    }
    const sessionState: SavedSessionState = {
      inputText,
      generatedContent,
      quizState,
      userAnswers,
      sessionMetrics,
      elapsedTime,
    };
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionState));
    setHasSavedSession(true);
    setToast({ message: 'Session saved successfully!', type: 'success' });
  };

  const handleLoadSession = () => {
    const savedSession = localStorage.getItem(SESSION_STORAGE_KEY);
    if (savedSession) {
      try {
        const sessionState: SavedSessionState = JSON.parse(savedSession);
        setInputText(sessionState.inputText);
        setGeneratedContent(sessionState.generatedContent);
        setQuizState(sessionState.quizState);
        setUserAnswers(sessionState.userAnswers);
        setSessionMetrics(sessionState.sessionMetrics);
        setElapsedTime(sessionState.elapsedTime);
        if(sessionState.quizState === QuizState.InProgress || sessionState.quizState === QuizState.Submitted) {
            startTimer(sessionState.elapsedTime);
        } else {
            stopTimer();
        }
        setToast({ message: 'Session loaded!', type: 'success' });
        setActiveTab('teach-back');
      } catch (e) {
        setToast({ message: 'Failed to load session. Data might be corrupted.', type: 'error' });
        localStorage.removeItem(SESSION_STORAGE_KEY);
        setHasSavedSession(false);
      }
    } else {
      setToast({ message: 'No saved session found.', type: 'info' });
    }
  };
  
  const handleClearSession = () => {
      setShowConfirmModal(true);
  };
  
  const confirmClearSession = () => {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      setHasSavedSession(false);
      setShowConfirmModal(false);
      resetSession(true); // also clear input text
      setToast({ message: 'Session cleared.', type: 'info' });
  };
  
  // --- Tour / Demo Logic ---
  const handleStartTour = () => {
    setIsDemoActive(true);
    setInputText(sampleInputText);
    setGeneratedContent(mockTeachBackData);
    setQuizState(QuizState.InProgress);
    setUserAnswers({});
    setSessionMetrics({ attempts: 1, masteryTime: null, readingGrade: mockTeachBackData.reading_grade });
    setElapsedTime(0);
    startTimer(0);
    setActiveTab('teach-back');
    
    setTimeout(() => setRunTour(true), 100);
  };

  const handleJoyrideCallback = (data: any) => {
    const { status, type, index, action } = data;
    const finishedStatuses = ['finished', 'skipped'];

    if (action === 'next') {
        const nextStep = tourSteps[index + 1];
        if (nextStep?.target === '[data-tour-id="chat-helper-content"]') {
            setActiveTab('chat-helper');
        } else if (nextStep?.target === '[data-tour-id="live-qa-content"]') {
            setActiveTab('live-qa');
        } else if (nextStep?.target === '[data-tour-id="session-buttons"]') {
            setActiveTab('teach-back');
        }
    }

    if (finishedStatuses.includes(status) || type === 'tour:end') {
      setRunTour(false);
      localStorage.setItem(TOUR_STORAGE_KEY, 'true');
      setShowPostTourModal(true);
    }
  };

  // --- Video Generation ---
  const handleGenerateVideo = async () => {
    if (window.aistudio && !apiKeySelected) {
        setToast({ message: 'This paid feature requires an API key with billing enabled. For info, see ai.google.dev/gemini-api/docs/billing.', type: 'info' });
        try {
            await window.aistudio.openSelectKey();
            setApiKeySelected(true);
        } catch (e) {
            console.error("API Key selection dialog error:", e);
            setToast({ message: 'Could not open API key selection.', type: 'error' });
            return;
        }
    }

    setIsGeneratingVideo(true);
    setToast({ message: 'Video generation started... This may take a few minutes.', type: 'info' });

    try {
        const url = await generateTutorialVideo();
        setVideoUrl(url);
        setShowVideoModal(true);
    } catch (error) {
        console.error("Video generation failed:", error);
        let errorMessage = 'Failed to generate video. Please try again.';
        if (error instanceof Error && error.message.includes("Requested entity was not found")) {
            errorMessage = "Video generation failed. Your API key might be invalid. Please re-select your key.";
            setApiKeySelected(false);
        }
        setToast({ message: errorMessage, type: 'error' });
    } finally {
        setIsGeneratingVideo(false);
    }
};

  const TabButton: React.FC<{ tabName: ActiveTab; label: string }> = ({ tabName, label }) => (
    <button
      onClick={() => setActiveTab(tabName)}
      className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === tabName ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}
      role="tab"
      aria-selected={activeTab === tabName}
      data-tour-id={`${tabName}-tab`}
    >
      {label}
    </button>
  );

  const isSessionActive = generatedContent !== null;

  return (
    <div className="min-h-screen flex flex-col">
      {typeof Joyride !== 'undefined' && (
        <Joyride
          steps={tourSteps}
          run={runTour}
          continuous
          showProgress
          showSkipButton
          callback={handleJoyrideCallback}
          styles={{ options: { zIndex: 10000 } }}
        />
      )}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={confirmClearSession}
        title="Clear Session"
        message="Are you sure you want to delete your saved session? This action cannot be undone."
       />
      <ConfirmationModal
        isOpen={showPostTourModal}
        onClose={() => {setShowPostTourModal(false); setIsDemoActive(false);}}
        onConfirm={() => { resetSession(true); setShowPostTourModal(false); }}
        title="Tour Complete!"
        message="Would you like to clear the demo content and start your own session?"
        confirmText="Yes, clear it"
        cancelText="No, I'll explore"
      />
      <VideoPlayerModal 
        isOpen={showVideoModal}
        onClose={() => setShowVideoModal(false)}
        videoUrl={videoUrl}
      />
      <Header 
        onHelpClick={() => setShowHelpModal(true)} 
        onDisclaimerClick={() => setShowDisclaimerModal(true)} 
        onTourClick={handleStartTour}
        onGenerateVideoClick={handleGenerateVideo}
        isGeneratingVideo={isGeneratingVideo}
      />
      
      <HelpModal isOpen={showHelpModal} onClose={() => setShowHelpModal(false)} />
      <DisclaimerModal isOpen={showDisclaimerModal} onClose={() => setShowDisclaimerModal(false)} />

      <main className="flex-grow container mx-auto p-4 sm:p-6 space-y-6">
          <nav data-tour-id="tabs" className="bg-white p-2 rounded-lg shadow-sm border flex flex-wrap items-center justify-center gap-2" role="tablist">
            <TabButton tabName="teach-back" label="Teach-Back" />
            <TabButton tabName="chat-helper" label="Chat Helper" />
            <TabButton tabName="live-qa" label="Live Q&A" />
          </nav>

          <div role="tabpanel" hidden={activeTab !== 'teach-back'}>
             <div className="space-y-6">
                {!generatedContent && !isLoading && !error && !isDemoActive && (
                    <div className="text-center py-12 px-6 bg-white rounded-lg shadow-md border">
                        <h2 className="text-2xl font-semibold text-gray-700">Welcome to the Teach-Back Engine!</h2>
                        <p className="mt-2 text-gray-500 max-w-2xl mx-auto">Paste or dictate complex medical instructions below, and click "Generate" to receive a simplified explanation and a short quiz to test your understanding.</p>
                    </div>
                )}

                <InputCard 
                    inputText={inputText}
                    setInputText={setInputText}
                    onGenerate={handleGenerate}
                    isLoading={isLoading}
                    onSave={handleSaveSession}
                    onLoad={handleLoadSession}
                    onClear={handleClearSession}
                    hasSavedSession={hasSavedSession}
                    isSessionActive={isSessionActive}
                    setToast={setToast}
                    translatedAudio={translatedAudio}
                    setTranslatedAudio={setTranslatedAudio}
                />
                {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md" role="alert"><p className="font-bold">An Error Occurred</p><p>{error}</p></div>}
                
                {generatedContent && (
                    <>
                        <SimplifiedTextCard text={generatedContent.simplified_text} safetyFlags={generatedContent.safety_flags} />
                        {quizState !== QuizState.Mastered && (
                            <QuizCard 
                                qaItems={generatedContent.qa}
                                remediation={generatedContent.remediation}
                                quizState={quizState}
                                userAnswers={userAnswers}
                                onAnswerChange={handleAnswerChange}
                                onSubmit={handleSubmitQuiz}
                                onTryAgain={handleTryAgain}
                            />
                        )}
                        {quizState === QuizState.Mastered && <MasteryBadge onDownload={handleDownloadSummary} />}
                    </>
                )}
             </div>
          </div>
          <div data-tour-id="chat-helper-content" role="tabpanel" hidden={activeTab !== 'chat-helper'}>
             <ChatBot isDemoActive={isDemoActive} />
          </div>
           <div data-tour-id="live-qa-content" role="tabpanel" hidden={activeTab !== 'live-qa'}>
             <LiveConversation isDemoActive={isDemoActive} />
          </div>

      </main>
      
      {activeTab === 'teach-back' && <MetricsFooter metrics={sessionMetrics} formattedTime={formattedTime} />}

      <div className="hidden print:block">
        <PrintSummary data={generatedContent} userAnswers={userAnswers} />
      </div>
    </div>
  );
};

export default App;