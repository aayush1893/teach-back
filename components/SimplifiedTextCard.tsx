import React, { useState } from 'react';
import { CopyIcon, CheckIcon, DisclaimerIcon, PlusIcon, MinusIcon, ContrastIcon, RefreshIcon } from './icons';
import { SafetyFlags } from '../types';

const FONT_SIZE_STEP = 2; // in pixels
const MIN_FONT_SIZE = 12; // in pixels
const MAX_FONT_SIZE = 24; // in pixels
const DEFAULT_FONT_SIZE = 16; // Corresponds to Tailwind's `text-base`

const AccessibilityToolbar: React.FC<{ onFontSizeChange: (size: number) => void; onToggleContrast: () => void; onReset: () => void; fontSize: number }> = ({ onFontSizeChange, onToggleContrast, onReset, fontSize }) => {
    return (
        <div className="flex items-center space-x-2 p-1 bg-gray-100 dark:bg-gray-700/50 rounded-md">
            <button onClick={() => onFontSizeChange(fontSize + FONT_SIZE_STEP)} disabled={fontSize >= MAX_FONT_SIZE} className="p-1.5 text-gray-600 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-600 rounded disabled:opacity-50" title="Increase font size" aria-label="Increase font size">
                <PlusIcon className="w-5 h-5" />
            </button>
            <button onClick={() => onFontSizeChange(fontSize - FONT_SIZE_STEP)} disabled={fontSize <= MIN_FONT_SIZE} className="p-1.5 text-gray-600 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-600 rounded disabled:opacity-50" title="Decrease font size" aria-label="Decrease font size">
                <MinusIcon className="w-5 h-5" />
            </button>
            <button onClick={onToggleContrast} className="p-1.5 text-gray-600 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-600 rounded" title="Toggle high contrast" aria-label="Toggle high contrast">
                <ContrastIcon className="w-5 h-5" />
            </button>
             <button onClick={onReset} className="p-1.5 text-gray-600 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-600 rounded" title="Reset view settings" aria-label="Reset view settings">
                <RefreshIcon className="w-5 h-5" />
            </button>
        </div>
    );
};

const SimplifiedTextCard: React.FC<{ text: string; safetyFlags: SafetyFlags }> = ({ text, safetyFlags }) => {
  const [copied, setCopied] = useState(false);
  const [fontSize, setFontSize] = useState(DEFAULT_FONT_SIZE);
  const [highContrast, setHighContrast] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const resetAccessibility = () => {
    setFontSize(DEFAULT_FONT_SIZE);
    setHighContrast(false);
  };

  const hasFlags = safetyFlags.urgent_contact || safetyFlags.contraindication_mentioned || safetyFlags.red_flags.length > 0;

  return (
    <div className={`bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 ${highContrast ? 'high-contrast' : ''}`} data-tour-id="simplified-text-card">
      <style>{`
        .high-contrast { background-color: #000 !important; }
        .high-contrast p, .high-contrast h2, .high-contrast li, .high-contrast strong { color: #fff !important; }
        .high-contrast div { border-color: #fff !important; }
      `}</style>
      <div className="flex justify-between items-start mb-3 gap-4">
        <h2 className="text-xl font-semibold">Simplified Version</h2>
        <div className="flex items-center space-x-4">
            <AccessibilityToolbar onFontSizeChange={setFontSize} onToggleContrast={() => setHighContrast(!highContrast)} onReset={resetAccessibility} fontSize={fontSize} />
            <button
              onClick={handleCopy}
              className="flex items-center text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
              title="Copy simplified text"
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
      </div>
      <div
        className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap transition-all duration-200"
        style={{ fontSize: `${fontSize}px`, lineHeight: `${fontSize * 1.6}px` }}
      >
        {text}
      </div>
      
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