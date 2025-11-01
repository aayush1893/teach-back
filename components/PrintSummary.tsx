import React from 'react';
import { TeachBackData, UserAnswers } from '../types';

// A small helper to render key-value pairs nicely
const DetailItem: React.FC<{ label: string, value: string | number | string[] | undefined }> = ({ label, value }) => {
  if (!value || (Array.isArray(value) && value.length === 0)) return null;
  return (
    <div className="mb-2">
      <p className="font-semibold text-gray-800">{label}:</p>
      {Array.isArray(value) ? (
        <ul className="list-disc list-inside text-gray-700">
          {value.map((item, i) => <li key={i}>{item}</li>)}
        </ul>
      ) : (
        <p className="text-gray-700">{value}</p>
      )}
    </div>
  );
};


const PrintSummary: React.FC<{ data: TeachBackData | null; userAnswers: UserAnswers }> = ({ data, userAnswers }) => {
  if (!data) return null;
  
  const { domain, context } = data;

  const renderDomainDetails = () => {
    switch (context) {
        case 'prescription':
            const p = domain.prescription;
            return p ? <>
                <DetailItem label="Dose" value={p.dose} />
                <DetailItem label="Route" value={p.route} />
                <DetailItem label="Frequency" value={p.frequency} />
                <DetailItem label="Timing" value={p.timing} />
                <DetailItem label="Missed Dose Instructions" value={p.missed_dose_instructions} />
                <DetailItem label="Common Side Effects" value={p.common_side_effects} />
                <DetailItem label="Interaction Warnings" value={p.interaction_warnings} />
            </> : null;
        case 'eob':
            const e = domain.eob;
            return e ? <>
                <DetailItem label="Claim ID" value={e.claim_id} />
                <DetailItem label="Service Date" value={e.service_date} />
                <DetailItem label="Amount Billed" value={e.billed} />
                <DetailItem label="Amount Allowed" value={e.allowed} />
                <DetailItem label="Deductible" value={e.deductible} />
                <DetailItem label="Copay" value={e.copay} />
                <DetailItem label="Coinsurance" value={e.coinsurance} />
                <DetailItem label="Not Covered Reason" value={e.not_covered_reason} />
                <DetailItem label="Appeal Window" value={`${e.appeal_window_days} days`} />
                <DetailItem label="Next Steps" value={e.next_steps} />
            </> : null;
        case 'prior_auth':
            const pa = domain.prior_auth;
            return pa ? <>
                <DetailItem label="Status" value={pa.status} />
                <DetailItem label="Missing Items" value={pa.missing_items} />
                <DetailItem label="Clinical Criteria" value={pa.clinical_criteria} />
                <DetailItem label="Deadline" value={pa.deadline} />
                <DetailItem label="Checklist" value={pa.checklist} />
                <DetailItem label="Template Addendum" value={pa.template_addendum} />
            </> : null;
        case 'discharge':
            const d = domain.discharge;
            return d ? <>
                <DetailItem label="Follow-ups" value={d.followups} />
                <DetailItem label="Medication Changes" value={d.med_changes} />
                <DetailItem label="When to Call Provider" value={d.when_to_call} />
                <DetailItem label="Activity Restrictions" value={d.activity_restrictions} />
            </> : null;
        case 'lab':
            const l = domain.lab;
            return l ? <>
                <DetailItem label="Test" value={l.test} />
                <DetailItem label="Value" value={l.value} />
                <DetailItem label="Unit" value={l.unit} />
                <DetailItem label="Reference Range" value={l.reference_range} />
                <DetailItem label="Interpretation" value={l.interpretation} />
                <DetailItem label="Next Steps" value={l.next_steps} />
            </> : null;
        case 'unknown':
            const u = domain.unknown;
            return u ? <>
                <DetailItem label="Key Points" value={u.key_points} />
                <DetailItem label="Action Checklist" value={u.action_checklist} />
                <DetailItem label="Questions to Ask Provider" value={u.questions_to_ask_provider} />
            </> : null;
        default:
            return <p>No specific details were extracted.</p>;
    }
  };

  const getContextTitle = () => {
      if (context === 'eob') return 'Explanation of Benefits (EOB) Details';
      if (context === 'prior_auth') return 'Prior Authorization Details';
      if (context === 'unknown') return 'General Summary & Checklist';
      return `${context.charAt(0).toUpperCase() + context.slice(1)} Details`;
  }

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

        {domain && (
            <section>
                 <h2 className="text-2xl font-semibold border-b pb-2 mb-4">{getContextTitle()}</h2>
                 <div className="p-4 border rounded-md bg-gray-50">
                    {renderDomainDetails()}
                 </div>
            </section>
        )}

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
