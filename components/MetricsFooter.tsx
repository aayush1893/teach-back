

import React from 'react';
import { SessionMetrics } from '../types';

interface MetricsFooterProps {
  metrics: SessionMetrics;
  formattedTime: string;
}

const MetricItem: React.FC<{ label: string; value: string | number | null }> = ({ label, value }) => (
  <div className="text-center">
    <span className="block text-sm font-medium text-gray-500 dark:text-gray-400">{label}</span>
    <span className="block text-md sm:text-lg font-semibold text-blue-600 dark:text-blue-400">{value ?? '--'}</span>
  </div>
);

const MetricsFooter: React.FC<MetricsFooterProps> = ({ metrics, formattedTime }) => {
  return (
    <footer className="sticky bottom-0 left-0 right-0 bg-white dark:bg-gray-800 shadow-top z-10 border-t dark:border-gray-700" data-tour-id="metrics-footer">
      <div className="container mx-auto px-4 py-3">
        <div className="grid grid-cols-3 gap-4">
          <MetricItem label="Reading Grade" value={metrics.readingGradeAfter ? `~${metrics.readingGradeAfter}th` : null} />
          <MetricItem label="Attempts" value={metrics.attempts} />
          <MetricItem label="Time to Mastery" value={metrics.masteryTime !== null ? formattedTime : 'mm:ss'} />
        </div>
      </div>
    </footer>
  );
};

export default MetricsFooter;