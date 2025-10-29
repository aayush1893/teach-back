
import React, { useState, useMemo, useEffect } from 'react';
import { QAItem, Remediation, UserAnswers, QuizState } from '../types';
import { CheckIcon, XIcon } from './icons';

interface QuizCardProps {
  qaItems: QAItem[];
  remediation: Remediation;
  quizState: QuizState;
  userAnswers: UserAnswers;
  onAnswerChange: (questionIndex: number, answer: string) => void;
  onSubmit: () => void;
  onTryAgain: () => void;
}

const shuffleArray = <T,>(array: T[]): T[] => {
  return [...array].sort(() => Math.random() - 0.5);
};

const QuizCard: React.FC<QuizCardProps> = ({ qaItems, remediation, quizState, userAnswers, onAnswerChange, onSubmit, onTryAgain }) => {
  const shuffledOptions = useMemo(() => {
    return qaItems.map(item => shuffleArray([...item.a_distractors, item.a_correct]));
  }, [qaItems]);
  
  const [isSubmitDisabled, setIsSubmitDisabled] = useState(true);

  useEffect(() => {
    setIsSubmitDisabled(Object.keys(userAnswers).length !== qaItems.length);
  }, [userAnswers, qaItems.length]);

  const isWrongAnswer = (qIndex: number) => {
      return quizState === QuizState.Submitted && userAnswers[qIndex] !== qaItems[qIndex].a_correct;
  }
  
  const isCorrectAnswer = (qIndex: number) => {
      return quizState === QuizState.Submitted && userAnswers[qIndex] === qaItems[qIndex].a_correct;
  }

  const hasIncorrectAnswers = quizState === QuizState.Submitted && qaItems.some((_, i) => isWrongAnswer(i));

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200" data-tour-id="quiz-card">
      <h2 className="text-xl font-semibold mb-4">2. Quick Quiz</h2>
      <div className="space-y-6">
        {qaItems.map((item, qIndex) => (
          <div key={qIndex} className={`p-4 rounded-lg border ${isCorrectAnswer(qIndex) ? 'border-green-300 bg-green-50' : ''} ${isWrongAnswer(qIndex) ? 'border-red-300 bg-red-50' : ''}`}>
            <p className="font-semibold mb-3">{qIndex + 1}. {item.q}</p>
            <fieldset className="space-y-2">
              <legend className="sr-only">Answers for question {qIndex+1}</legend>
              {shuffledOptions[qIndex].map((option, oIndex) => {
                const isChecked = userAnswers[qIndex] === option;
                const isCorrectOption = option === item.a_correct;

                return (
                  <div key={oIndex} className="flex items-center">
                    <input
                      id={`q${qIndex}o${oIndex}`}
                      name={`question-${qIndex}`}
                      type="radio"
                      value={option}
                      checked={isChecked}
                      onChange={(e) => onAnswerChange(qIndex, e.target.value)}
                      disabled={quizState === QuizState.Submitted || quizState === QuizState.Mastered}
                      className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500 disabled:opacity-50"
                    />
                    <label htmlFor={`q${qIndex}o${oIndex}`} className={`ml-3 block text-sm text-gray-700 ${quizState === QuizState.Submitted && isCorrectOption ? 'font-bold text-green-700' : ''} ${quizState === QuizState.Submitted && isChecked && !isCorrectOption ? 'font-bold text-red-700' : ''}`}>
                      {option}
                      {quizState === QuizState.Submitted && isCorrectOption && <CheckIcon className="inline w-4 h-4 ml-1 text-green-600" />}
                      {quizState === QuizState.Submitted && isChecked && !isCorrectOption && <XIcon className="inline w-4 h-4 ml-1 text-red-600" />}
                    </label>
                  </div>
                );
              })}
            </fieldset>
            {quizState === QuizState.Submitted && (
                 <div className="mt-3 text-sm p-3 rounded-md bg-gray-100">
                    <p><strong>Why:</strong> {isCorrectAnswer(qIndex) ? item.rationale_correct : item.rationale_incorrect}</p>
                </div>
            )}
          </div>
        ))}
      </div>
      
      {quizState !== QuizState.Mastered && (
         <div className="mt-6 text-center">
             <button
               onClick={onSubmit}
               disabled={isSubmitDisabled || quizState === QuizState.Submitted}
               className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
             >
               Submit Answers
             </button>
         </div>
      )}

      {hasIncorrectAnswers && (
        <div className="mt-6 p-4 bg-yellow-50 border-l-4 border-yellow-400">
          <h3 className="text-lg font-semibold text-yellow-800">Let's Explain Again</h3>
          <p className="mt-2 text-yellow-700">{remediation.if_wrong}</p>
          <ul className="mt-2 list-disc list-inside text-yellow-700 space-y-1">
            {remediation.examples.map((ex, i) => <li key={i}>{ex}</li>)}
          </ul>
          <div className="mt-4">
             <button
               onClick={onTryAgain}
               className="px-6 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600"
             >
               Try Again
             </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizCard;