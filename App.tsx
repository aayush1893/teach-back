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
import ClassificationBanner from './components/ClassificationBanner';
import DomainDetailsCard from './components/DomainDetailsCard';
import FeedbackModal from './components/FeedbackModal';
import { classifyText, generateStructuredData } from './services/geminiService';
import type { ImagePart } from './services/geminiService';
import { TeachBackData, QuizState, UserAnswers, SessionMetrics, SavedSessionState, ClassificationResult, Context } from './types';
import { useTimer } from './hooks/useTimer';
import { tourSteps } from './components/tourSteps';
import { sampleInputText, mockTeachBackData } from './data/mockTeachBackData';
import { XIcon, LightbulbIcon } from './components/icons';

declare const Joyride: any;

const SESSION_STORAGE_KEY = 'teachback_session_v2'; // Version bump for new data structure
const TOUR_STORAGE_KEY = 'teachback_tour_completed_v1';
const THEME_STORAGE_KEY = 'teachback-theme';
const OVERRIDE_COUNTER_KEY = 'tbe_override_used';
const UNKNOWN_COUNTER_KEY = 'tbe_unknown_count';
const MASTERY_COUNT_KEY = 'tbe_mastery_count';


type ActiveTab = 'teach-back' | 'chat-helper' | 'live-qa';
type Theme = 'light' | 'dark';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('teach-back');
  const [theme, setTheme] = useState<Theme>('light');
  
  const [inputText, setInputText] = useState('');
  const [inputImage, setInputImage] = useState<ImagePart | null>(null);
  const [classificationResult, setClassificationResult] = useState<ClassificationResult | null>(null);
  const [generatedContent, setGeneratedContent] = useState<TeachBackData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quizState, setQuizState] = useState<QuizState>(QuizState.NotStarted);
  const [userAnswers, setUserAnswers] = useState<UserAnswers>({});
  const [sessionMetrics, setSessionMetrics] = useState<SessionMetrics>({
    attempts: 0,
    masteryTime: null,
    readingGradeAfter: null
  });
  const [translatedAudio, setTranslatedAudio] = useState<AudioBuffer | null>(null);

  const { elapsedTime, start: startTimer, stop: stopTimer, reset: resetTimer, setElapsedTime, formattedTime } = useTimer();

  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showDisclaimerModal, setShowDisclaimerModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showPostTourModal, setShowPostTourModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [hasSavedSession, setHasSavedSession] = useState(false);
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error' | 'info'} | null>(null);
  const [runTour, setRunTour] = useState(false);
  const [isDemoActive, setIsDemoActive] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    // Check for saved theme preference on initial load
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');
    setTheme(initialTheme);

    if (localStorage.getItem(SESSION_STORAGE_KEY)) {
        setHasSavedSession(true);
    }

    // Offline detection
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    // Apply theme class to the root element and save preference
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);
  
  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };
  
  const updateInputText = (text: string) => {
    setInputText(text);
    if (inputImage) setInputImage(null);
  };
  
  const updateInputImage = (image: ImagePart | null) => {
    setInputImage(image);
    if (inputText) setInputText('');
  };

  const resetSession = useCallback((clearInput = false) => {
    if (clearInput) {
      setInputText('');
      setInputImage(null);
    }
    setGeneratedContent(null);
    setClassificationResult(null);
    setQuizState(QuizState.NotStarted);
    setUserAnswers({});
    resetTimer();
    setSessionMetrics({ attempts: 0, masteryTime: null, readingGradeAfter: null });
    setTranslatedAudio(null);
    setIsDemoActive(false);
  }, [resetTimer]);
  
  const runGenerator = async (context: Context) => {
      setGeneratedContent(null); // Clear previous content before generating new
      const data = await generateStructuredData(inputText, context, inputImage ?? undefined);
      setGeneratedContent(data);
      setQuizState(QuizState.InProgress);
      setSessionMetrics(prev => ({ ...prev, readingGradeAfter: data.reading_grade_after }));
      setUserAnswers({});
  };

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);
    resetSession();
    startTimer();
    
    try {
      // Stage 1: Classify
      const classification = await classifyText(inputText, inputImage ?? undefined);
      setClassificationResult(classification);
      if (classification.context === 'unknown') {
        const unknownCount = parseInt(localStorage.getItem(UNKNOWN_COUNTER_KEY) || '0', 10);
        localStorage.setItem(UNKNOWN_COUNTER_KEY, (unknownCount + 1).toString());
      }
      
      // Stage 2: Generate
      setSessionMetrics({ attempts: 1, masteryTime: null, readingGradeAfter: null });
      await runGenerator(classification.context);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      resetSession();
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleContextOverride = async (newContext: Context) => {
    setIsLoading(true);
    setError(null);
    
    const overrideCount = parseInt(localStorage.getItem(OVERRIDE_COUNTER_KEY) || '0', 10);
    localStorage.setItem(OVERRIDE_COUNTER_KEY, (overrideCount + 1).toString());
    
    setToast({message: `Re-generating for category: ${newContext}`, type: 'info'});

    try {
        await runGenerator(newContext);
    } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred while re-generating.');
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
      
      // Smart feedback prompt logic
      const masteryCount = parseInt(localStorage.getItem(MASTERY_COUNT_KEY) || '0', 10);
      localStorage.setItem(MASTERY_COUNT_KEY, (masteryCount + 1).toString());
      
      if (masteryCount === 0) { // First time mastering anything
          setShowFeedbackModal(true);
      } else if (Math.random() < 0.33) { // ~33% chance on subsequent masteries
          setShowFeedbackModal(true);
      }
    }
  };

  const handleTryAgain = () => {
    setQuizState(QuizState.InProgress);
    setUserAnswers({});
    setSessionMetrics(prev => ({ ...prev, attempts: prev.attempts + 1 }));

    // Shuffle questions for the new attempt
    if (generatedContent) {
      const shuffledQA = [...generatedContent.qa].sort(() => Math.random() - 0.5);
      setGeneratedContent(prevContent => {
        if (!prevContent) return null;
        return {
          ...prevContent,
          qa: shuffledQA,
        };
      });
    }
  };

  const handleDownloadSummary = () => {
    window.print();
  };

  const handleSaveSession = () => {
    if (!generatedContent || !classificationResult) {
      setToast({ message: 'Nothing to save yet.', type: 'info' });
      return;
    }
    const sessionState: SavedSessionState = {
      inputText,
      classificationResult,
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
        updateInputText(sessionState.inputText);
        updateInputImage(null);
        setClassificationResult(sessionState.classificationResult);
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
      resetSession(true);
      setToast({ message: 'Session cleared.', type: 'info' });
  };
  
  const handleStartTour = () => {
    setIsDemoActive(true);
    updateInputText(sampleInputText);
    updateInputImage(null);
    setClassificationResult({ context: 'discharge', confidence: 0.92, top_k: [], unknown_reasons: [] });
    setGeneratedContent(mockTeachBackData);
    setQuizState(QuizState.InProgress);
    setUserAnswers({});
    setSessionMetrics({ attempts: 1, masteryTime: null, readingGradeAfter: mockTeachBackData.reading_grade_after });
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
        if (nextStep?.target === '[data-tour-id="chat-helper-content"]') setActiveTab('chat-helper');
        else if (nextStep?.target === '[data-tour-id="live-qa-content"]') setActiveTab('live-qa');
        else if (nextStep?.target === '[data-tour-id="session-buttons"]') setActiveTab('teach-back');
    }

    if (finishedStatuses.includes(status) || type === 'tour:end') {
      setRunTour(false);
      localStorage.setItem(TOUR_STORAGE_KEY, 'true');
      setShowPostTourModal(true);
    }
  };

  const TabButton: React.FC<{ tabName: ActiveTab; label: string }> = ({ tabName, label }) => (
    <button
      onClick={() => setActiveTab(tabName)}
      className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === tabName ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
      role="tab"
      aria-selected={activeTab === tabName}
      data-tour-id={`${tabName}-tab`}
    >
      {label}
    </button>
  );

  const isSessionActive = generatedContent !== null;
  const isFooterVisible = activeTab === 'teach-back' && isSessionActive;

  return (
    <div className="min-h-screen flex flex-col">
      {typeof Joyride !== 'undefined' && <Joyride steps={tourSteps} run={runTour} continuous showProgress showSkipButton callback={handleJoyrideCallback} styles={{ options: { zIndex: 10000, arrowColor: '#ffffff', backgroundColor: '#ffffff', primaryColor: '#2563eb', textColor: '#334155', width: 380, } }} />}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <ConfirmationModal isOpen={showConfirmModal} onClose={() => setShowConfirmModal(false)} onConfirm={confirmClearSession} title="Clear Session" message="Are you sure you want to delete your saved session? This action cannot be undone." />
      <ConfirmationModal isOpen={showPostTourModal} onClose={() => {setShowPostTourModal(false); setIsDemoActive(false);}} onConfirm={() => { resetSession(true); setShowPostTourModal(false); }} title="Tour Complete!" message="Would you like to clear the demo content and start your own session?" confirmText="Yes, clear it" cancelText="No, I'll explore" />
      <Header onHelpClick={() => setShowHelpModal(true)} onDisclaimerClick={() => setShowDisclaimerModal(true)} onTourClick={handleStartTour} theme={theme} onToggleTheme={toggleTheme} />
      <HelpModal isOpen={showHelpModal} onClose={() => setShowHelpModal(false)} />
      <DisclaimerModal isOpen={showDisclaimerModal} onClose={() => setShowDisclaimerModal(false)} />
      <FeedbackModal isOpen={showFeedbackModal} onClose={() => setShowFeedbackModal(false)} />

      <main className="flex-grow container mx-auto p-4 sm:p-6 space-y-6">
          {isOffline && (
            <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded-md dark:bg-yellow-900/40 dark:text-yellow-200 dark:border-yellow-600" role="status">
              <p className="font-bold">You are offline</p>
              <p className="text-sm">Some features, like generating new content or live chat, are unavailable. You can still load a saved session.</p>
            </div>
          )}
          <nav data-tour-id="tabs" className="bg-white dark:bg-gray-800 p-2 rounded-lg shadow-sm border dark:border-gray-700 flex flex-wrap items-center justify-center gap-2" role="tablist">
            <TabButton tabName="teach-back" label="Teach-Back" />
            <TabButton tabName="chat-helper" label="Chat Helper" />
            <TabButton tabName="live-qa" label="Live Q&A" />
          </nav>

          <div role="tabpanel" hidden={activeTab !== 'teach-back'}>
             <div className="space-y-6">
                {!generatedContent && !isLoading && !error && !isDemoActive && (
                    <div className="text-center py-12 px-6 bg-white dark:bg-gray-800 rounded-lg shadow-md border dark:border-gray-700">
                        <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-200">Welcome to the Teach-Back Engine!</h2>
                        <p className="mt-2 text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">Paste, dictate, or upload a PDF of complex medical instructions below. The app will first classify your document and then provide a simplified explanation and a short quiz.</p>
                    </div>
                )}

                <InputCard 
                  inputText={inputText} 
                  setInputText={updateInputText} 
                  onPdfUpload={updateInputImage}
                  isPdfUploaded={inputImage !== null}
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
                  isOffline={isOffline}
                />
                
                {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md dark:bg-red-900/30 dark:text-red-200 dark:border-red-600" role="alert"><p className="font-bold">An Error Occurred</p><p>{error}</p></div>}
                
                {classificationResult && <ClassificationBanner result={classificationResult} onOverride={handleContextOverride} isLoading={isLoading} />}

                {generatedContent && (
                    <>
                        <SimplifiedTextCard text={generatedContent.simplified_text} safetyFlags={generatedContent.safety_flags} />
                        <DomainDetailsCard data={generatedContent} />
                        {quizState !== QuizState.Mastered && (
                            <QuizCard qaItems={generatedContent.qa} remediation={generatedContent.remediation} quizState={quizState} userAnswers={userAnswers} onAnswerChange={handleAnswerChange} onSubmit={handleSubmitQuiz} onTryAgain={handleTryAgain} />
                        )}
                        {quizState === QuizState.Mastered && 
                            <MasteryBadge onDownload={handleDownloadSummary} />}
                    </>
                )}
             </div>
          </div>
          <div data-tour-id="chat-helper-content" role="tabpanel" hidden={activeTab !== 'chat-helper'}>
             <ChatBot isDemoActive={isDemoActive} isOffline={isOffline} />
          </div>
           <div data-tour-id="live-qa-content" role="tabpanel" hidden={activeTab !== 'live-qa'}>
             <LiveConversation isDemoActive={isDemoActive} isOffline={isOffline} />
          </div>
      </main>
      
      <button
        onClick={() => setShowFeedbackModal(true)}
        className={`fixed right-6 ${isFooterVisible ? 'bottom-20' : 'bottom-6'} bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-all duration-300 transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 z-20`}
        aria-label="Provide feedback"
        title="Provide Feedback"
      >
        <LightbulbIcon className="w-6 h-6" />
      </button>

      {isFooterVisible && <MetricsFooter metrics={sessionMetrics} formattedTime={formattedTime} />}

      <div className="hidden print:block">
        <PrintSummary data={generatedContent} userAnswers={userAnswers} />
      </div>
    </div>
  );
};

export default App;