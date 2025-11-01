import React, { useState } from 'react';
import { CopyIcon, CheckIcon, DisclaimerIcon } from './icons';
import { SafetyFlags } from '../types';

interface SimplifiedTextCardProps {
  text: string;
  safetyFlags: SafetyFlags;
}

const SimplifiedTextCard: React.FC<SimplifiedTextCardProps> = ({ text, safetyFlags }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const hasFlags = safetyFlags.urgent_contact || safetyFlags.contraindication_mentioned || safetyFlags.red_flags.length > 0;

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700" data-tour-id="simplified-text-card">
      <div className="flex justify-between items-start mb-3">
        <h2 className="text-xl font-semibold">Simplified Version</h2>
        <button
          onClick={handleCopy}
          className="flex items-center text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
        >
          {copied ? (
            <>
              <CheckIcon className="w-4 h-4 mr-1 text-green-500" />
              Copied!
            </>
          ) : (
            <>
              <CopyIcon className="w-4 h-4 mr-1" />
              Copy
            </>
          )}
        </button>
      </div>
      <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{text}</p>
      
      {hasFlags && (
        <div className="mt-4 border-t dark:border-gray-700 pt-4">
            <div className="bg-amber-100 dark:bg-amber-900/30 border-l-4 border-amber-500 dark:border-amber-600 text-amber-700 dark:text-amber-200 p-4 rounded-md" role="alert">
                <div className="flex">
                    <div className="py-1"><DisclaimerIcon className="w-6 h-6 text-amber-500 dark:text-amber-400 mr-4" /></div>
                    <div>
                        <p className="font-bold">Safety Flags Identified</p>
                        <ul className="mt-2 list-disc list-inside text-sm">
                            {safetyFlags.urgent_contact && <li>Text suggests the need for urgent medical contact.</li>}
                            {safetyFlags.contraindication_mentioned && <li>A contraindication (a reason not to use a treatment) was mentioned.</li>}
                            {safetyFlags.red_flags.map((flag, index) => (
                                <li key={index}>The phrase "<span className="font-semibold">{flag}</span>" was found.</li>
                            ))}
                        </ul>
                        <p className="mt-2 text-xs">Please discuss these with your healthcare provider.</p>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default SimplifiedTextCard;