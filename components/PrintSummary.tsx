
import React from 'react';
import { TeachBackData, UserAnswers } from '../types';

interface PrintSummaryProps {
  data: TeachBackData | null;
  userAnswers: UserAnswers;
}

const PrintSummary: React.FC<PrintSummaryProps> = ({ data, userAnswers }) => {
  if (!data) return null;

  return (
    <div id="print-summary" className="p-8 font-sans">
      <header className="mb-8 border-b pb-4">
        <h1 className="text-3xl font-bold text-blue-700">Teach-Back Summary</h1>
        <p className="text-sm text-gray-600">Generated on: {new Date().toLocaleString()}</p>
      </header>

      <main className="space-y-8">
        <section>
          <h2 className="text-2xl font-semibold border-b pb-2 mb-4">Simplified Instructions</h2>
          <p className="text-base whitespace-pre-wrap">{data.simplified_text}</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold border-b pb-2 mb-4">Quiz Results</h2>
          <div className="space-y-4">
            {data.qa.map((item, index) => (
              <div key={index} className="p-4 border rounded-md bg-gray-50">
                <p className="font-bold">{index + 1}. {item.q}</p>
                <p className="mt-2 text-green-700"><strong>Your Answer:</strong> {userAnswers[index]}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold border-b pb-2 mb-4">Safety Flags Noted</h2>
          {data.safety_flags.red_flags.length > 0 ? (
            <ul className="list-disc list-inside text-red-600">
              {data.safety_flags.red_flags.map((flag, index) => <li key={index}>{flag}</li>)}
            </ul>
          ) : (
            <p>No specific red-flag phrases were identified in the text provided.</p>
          )}
        </section>
      </main>

      <footer className="mt-12 pt-4 border-t text-xs text-gray-500">
        <p className="font-bold">Disclaimer:</p>
        <p>This summary is an educational tool and does not replace professional medical advice. Discuss this information with your healthcare provider to ensure you fully understand your care plan. For emergencies, call your local emergency number immediately.</p>
      </footer>
    </div>
  );
};

export default PrintSummary;
