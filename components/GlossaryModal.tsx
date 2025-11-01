import React from 'react';
import { GlossaryTerm } from '../types';
import { XIcon, TrashIcon } from './icons';

interface GlossaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  glossary: GlossaryTerm[];
  onRemove: (term: string) => void;
}

const GlossaryModal: React.FC<GlossaryModalProps> = ({ isOpen, onClose, glossary, onRemove }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-75 flex justify-center items-center z-50 p-4" role="dialog" aria-modal="true">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="p-6 sticky top-0 bg-white dark:bg-gray-800 border-b dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-blue-600 dark:text-blue-400">My Glossary</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200" aria-label="Close glossary modal">
            <XIcon className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto space-y-4">
          {glossary.length > 0 ? (
            glossary.map((item) => (
              <div key={item.term} className="border-b dark:border-gray-700 pb-3 last:border-b-0">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-100">{item.term}</h3>
                        <p className="text-gray-600 dark:text-gray-300 mt-1">{item.definition}</p>
                    </div>
                    <button onClick={() => onRemove(item.term)} className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-1 ml-4" aria-label={`Remove ${item.term} from glossary`}>
                        <TrashIcon className="w-5 h-5" />
                    </button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">Your glossary is empty. Ask the chat helper for a definition and add it here!</p>
          )}
        </div>
        <div className="p-4 bg-gray-50 dark:bg-gray-900 text-right sticky bottom-0 border-t dark:border-gray-700">
          <button onClick={onClose} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default GlossaryModal;