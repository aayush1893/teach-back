import React, { useState } from 'react';
import { ClassificationResult, Context, SELECTABLE_CONTEXTS } from '../types';
import { InfoIcon, DisclaimerIcon } from './icons';

interface ClassificationBannerProps {
  result: ClassificationResult;
  onOverride: (newContext: Context) => void;
  isLoading: boolean;
}

const formatContext = (context: string) => {
    if (context === 'eob') return 'EOB';
    if (context === 'prior_auth') return 'Prior Auth';
    return context.charAt(0).toUpperCase() + context.slice(1);
}

const ClassificationBanner: React.FC<ClassificationBannerProps> = ({ result, onOverride, isLoading }) => {
  const isConfident = result.confidence >= 0.6 && result.context !== 'unknown';

  const handleSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newContext = event.target.value as Context;
    onOverride(newContext);
  };
  
  if (isConfident) {
    return (
      <div className="p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3" role="status">
        <div className="flex items-center">
            <InfoIcon className="w-6 h-6 text-blue-500 dark:text-blue-400 mr-3 flex-shrink-0" />
            <div>
                <p className="font-semibold text-blue-800 dark:text-blue-200">Detected: {formatContext(result.context)}</p>
                <p className="text-sm text-blue-600 dark:text-blue-300">Confidence: {(result.confidence * 100).toFixed(0)}%</p>
            </div>
        </div>
        <div className="flex items-center gap-2">
            <label htmlFor="context-override" className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">Not right?</label>
            <select
                id="context-override"
                onChange={handleSelectChange}
                disabled={isLoading}
                className="block w-full sm:w-auto pl-3 pr-10 py-1.5 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600"
                aria-label="Change document category"
                defaultValue={result.context}
            >
                {SELECTABLE_CONTEXTS.map(ctx => (
                    <option key={ctx} value={ctx}>{formatContext(ctx)}</option>
                ))}
            </select>
        </div>
      </div>
    );
  }

  // Low confidence or "unknown"
  return (
    <div className="p-4 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-lg flex flex-col gap-4" role="alert">
        <div className="flex items-center">
            <DisclaimerIcon className="w-6 h-6 text-amber-600 dark:text-amber-400 mr-3 flex-shrink-0" />
            <div>
                <p className="font-semibold text-amber-800 dark:text-amber-200">We're not sure what this is.</p>
                <p className="text-sm text-amber-700 dark:text-amber-300">The app will use "General Mode" by default. Or, you can choose a category below.</p>
            </div>
        </div>
        {result.unknown_reasons && result.unknown_reasons.length > 0 && (
            <div className="text-sm text-amber-700 dark:text-amber-300 pl-9">
                <p className="font-medium">Possible reasons:</p>
                <ul className="list-disc list-inside">
                    {result.unknown_reasons.map((reason, i) => <li key={i}>{reason}</li>)}
                </ul>
            </div>
        )}
        <div className="pl-9 flex items-center gap-2">
            <label htmlFor="context-select" className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">Pick a category:</label>
             <select
                id="context-select"
                onChange={handleSelectChange}
                disabled={isLoading}
                className="block w-full sm:w-auto pl-3 pr-10 py-1.5 text-base border-gray-300 focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm rounded-md dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600"
                aria-label="Select document category"
                defaultValue=""
            >
                <option value="" disabled>-- Select --</option>
                {SELECTABLE_CONTEXTS.map(ctx => (
                    <option key={ctx} value={ctx}>{formatContext(ctx)}</option>
                ))}
            </select>
        </div>
    </div>
  );
};

export default ClassificationBanner;