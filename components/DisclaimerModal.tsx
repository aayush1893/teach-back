
import React from 'react';
import { XIcon } from './icons';

interface DisclaimerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DisclaimerModal: React.FC<DisclaimerModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-75 flex justify-center items-center z-50 p-4" role="dialog" aria-modal="true">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg">
        <div className="p-6 border-b dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-amber-600 dark:text-amber-400">Important Disclaimer</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200" aria-label="Close disclaimer modal">
            <XIcon className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6 space-y-4 text-gray-700 dark:text-gray-300">
          <p className="font-semibold">This educational tool does not replace professional medical advice, diagnosis, or treatment.</p>
          <p>The information generated is based on the text you provide and is intended to simplify and clarify instructions, not to provide medical guidance. Always consult with a qualified healthcare professional for any health concerns or before making any decisions related to your health or treatment.</p>
          <p className="text-red-600 dark:text-red-500 font-bold">For emergencies, call your local emergency number immediately.</p>
          <div className="text-sm bg-gray-100 dark:bg-gray-700 p-3 rounded-md">
            <h4 className="font-semibold">Privacy Note</h4>
            <p>Your text is sent to the AI model for processing but is not stored or saved on our servers. All session data remains in your browser. Anonymized counters (e.g., number of sessions) may be stored in your browser's local storage.</p>
          </div>
        </div>
        <div className="p-4 bg-gray-50 dark:bg-gray-900 text-right sticky bottom-0 border-t dark:border-gray-700">
          <button onClick={onClose} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-500">
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
};

export default DisclaimerModal;