
import React from 'react';
import { XIcon } from './icons';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-75 flex justify-center items-center z-50 p-4" role="dialog" aria-modal="true">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 sticky top-0 bg-white dark:bg-gray-800 border-b dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-blue-600 dark:text-blue-400">How to Use Teach-Back Engine</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200" aria-label="Close help modal">
            <XIcon className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6 space-y-4 text-gray-700 dark:text-gray-300">
          <div>
            <h3 className="font-semibold text-lg">What this is:</h3>
            <p>Teach-Back Engine converts complex medical instructions into plain language and checks your understanding with a short quiz. It’s for learning and communication, not diagnosis.</p>
          </div>
          <div>
            <h3 className="font-semibold text-lg">When to use it:</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>Before or after a clinic visit to confirm you understand your discharge plan.</li>
              <li>When starting a new medication or device with multi-step directions.</li>
              <li>When preparing a prior authorization or appeal and you want to restate requirements clearly.</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-lg">How to use:</h3>
            <ol className="list-decimal list-inside space-y-1">
              <li>Paste the instruction text.</li>
              <li>Click <span className="font-semibold">Generate</span> to see a simpler version.</li>
              <li>Take the 3–5 question quiz.</li>
              <li>If you miss anything, read the short re-explanation and <span className="font-semibold">Try Again</span>.</li>
              <li>When you pass, download/print the summary and bring it to your next appointment.</li>
            </ol>
          </div>
          <div>
            <h3 className="font-semibold text-lg">What the results mean:</h3>
            <ul className="list-disc list-inside space-y-1">
              <li><strong>Reading grade:</strong> estimates complexity.</li>
              <li><strong>Mastered:</strong> means you answered all items correctly here; it doesn’t guarantee clinical accuracy.</li>
              <li><strong>Safety flags:</strong> show words/phrases that may warrant contacting your care team.</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-lg">Good practices:</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>Confirm anything you’re unsure about with a clinician.</li>
              <li>Share the simplified printout with caregivers.</li>
              <li>Don’t paste personal identifiers; keep it generic if possible.</li>
            </ul>
          </div>
           <div>
            <h3 className="font-semibold text-lg text-red-600 dark:text-red-500">Limitations:</h3>
            <p className="text-red-600 dark:text-red-500">This is an educational tool and not medical advice. If you have urgent symptoms (e.g., severe chest pain, trouble breathing, suicidal thoughts), call your local emergency number or seek immediate care.</p>
          </div>
        </div>
        <div className="p-4 bg-gray-50 dark:bg-gray-900 text-right sticky bottom-0 border-t dark:border-gray-700">
          <button onClick={onClose} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-500">
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};

export default HelpModal;