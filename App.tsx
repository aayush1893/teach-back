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
import { generateTeachBack } from './services/geminiService';
import { TeachBackData, QuizState, UserAnswers, SessionMetrics, SavedSessionState } from './types';
import { useTimer } from './hooks/useTimer';

const SESSION_STORAGE_KEY = 'teachback_session_v1';

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

  // Modals, Session Management, and Notifications
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showDisclaimerModal, setShowDisclaimerModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [hasSavedSession, setHasSavedSession] = useState(false);
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error' | 'info'} | null>(null);

  useEffect(() => {
    const totalSessions = parseInt(localStorage.getItem('teachback_total_sessions') || '0', 10);
    localStorage.setItem('teachback_total_sessions', (totalSessions + 1).toString());
    
    if (localStorage.getItem(SESSION_STORAGE_KEY)) {
        setHasSavedSession(true);
    }
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
      setToast({ message: 'Saved session cleared.', type: 'info' });
  };


  const TabButton: React.FC<{ tabName: ActiveTab; label: string }> = ({ tabName, label }) => (
    <button
      onClick={() => setActiveTab(tabName)}
      className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === tabName ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}
      role="tab"
      aria-selected={activeTab === tabName}
    >
      {label}
    </button>
  );

  const isSessionActive = generatedContent !== null;

  return (
    <div className="min-h-screen flex flex-col">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={confirmClearSession}
        title="Clear Session"
        message="Are you sure you want to delete your saved session? This action cannot be undone."
       />
      <Header onHelpClick={() => setShowHelpModal(true)} onDisclaimerClick={() => setShowDisclaimerModal(true)} />
      
      <HelpModal isOpen={showHelpModal} onClose={() => setShowHelpModal(false)} />
      <DisclaimerModal isOpen={showDisclaimerModal} onClose={() => setShowDisclaimerModal(false)} />

      <main className="flex-grow container mx-auto p-4 sm:p-6 space-y-6">
          <nav className="bg-white p-2 rounded-lg shadow-sm border flex flex-wrap items-center justify-center gap-2" role="tablist">
            <TabButton tabName="teach-back" label="Teach-Back" />
            <TabButton tabName="chat-helper" label="Chat Helper" />
            <TabButton tabName="live-qa" label="Live Q&A" />
          </nav>

          <div role="tabpanel" hidden={activeTab !== 'teach-back'}>
             <div className="space-y-6">
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
                
                {!generatedContent && !isLoading && !error && (
                    <div className="text-center py-12 px-6 bg-white rounded-lg shadow-md border">
                        <h2 className="text-2xl font-semibold text-gray-700">Welcome to the Teach-Back Engine!</h2>
                        <p className="mt-2 text-gray-500 max-w-2xl mx-auto">Paste or dictate complex medical instructions above, and click "Generate" to receive a simplified explanation and a short quiz to test your understanding.</p>
                    </div>
                )}

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
          <div role="tabpanel" hidden={activeTab !== 'chat-helper'}>
             <ChatBot />
          </div>
           <div role="tabpanel" hidden={activeTab !== 'live-qa'}>
             <LiveConversation />
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