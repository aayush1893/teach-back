import React from 'react';
import { TeachBackData, PrescriptionDomain, EobDomain, PriorAuthDomain, DischargeDomain, LabDomain, UnknownDomain } from '../types';
import { PillIcon, FileTextIcon, ClipboardListIcon, ActivityIcon, FlaskConicalIcon, InfoIcon } from './icons';

interface DomainDetailsCardProps {
  data: TeachBackData;
}

const DetailItem: React.FC<{ label: string, value: string | number | string[] | undefined }> = ({ label, value }) => {
  if (!value || value === 'N/A' || (Array.isArray(value) && value.length === 0)) return null;
  return (
    <div className="py-2">
      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</dt>
      <dd className="mt-1 text-sm text-gray-900 dark:text-gray-200">
        {Array.isArray(value) ? (
          <ul className="list-disc list-inside space-y-1">
            {value.map((item, i) => <li key={i}>{item}</li>)}
          </ul>
        ) : (
          value
        )}
      </dd>
    </div>
  );
};

const CardWrapper: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
        <div className="flex items-center mb-4">
            {icon}
            <h2 className="text-xl font-semibold ml-3">{title}</h2>
        </div>
        <dl className="divide-y divide-gray-200 dark:divide-gray-700">
            {children}
        </dl>
    </div>
);

const PrescriptionView: React.FC<{ data: PrescriptionDomain }> = ({ data }) => (
  <CardWrapper title="Prescription Details" icon={<PillIcon className="w-6 h-6 text-blue-500" />}>
    <DetailItem label="Dose" value={data.dose} />
    <DetailItem label="Route" value={data.route} />
    <DetailItem label="Frequency" value={data.frequency} />
    <DetailItem label="Timing" value={data.timing} />
    <DetailItem label="If you miss a dose" value={data.missed_dose_instructions} />
    <DetailItem label="Common Side Effects" value={data.common_side_effects} />
    <DetailItem label="Interaction Warnings" value={data.interaction_warnings} />
  </CardWrapper>
);

const EobView: React.FC<{ data: EobDomain }> = ({ data }) => (
  <CardWrapper title="EOB Summary" icon={<FileTextIcon className="w-6 h-6 text-green-500" />}>
    <DetailItem label="Claim ID" value={data.claim_id} />
    <DetailItem label="Service Date" value={data.service_date} />
    <DetailItem label="Billed" value={data.billed} />
    <DetailItem label="Allowed" value={data.allowed} />
    <DetailItem label="Deductible" value={data.deductible} />
    <DetailItem label="Copay" value={data.copay} />
    <DetailItem label="Coinsurance" value={data.coinsurance} />
    <DetailItem label="Not Covered Reason" value={data.not_covered_reason} />
    <DetailItem label="Appeal Window" value={`${data.appeal_window_days} days`} />
    <DetailItem label="Next Steps" value={data.next_steps} />
  </CardWrapper>
);

const PriorAuthView: React.FC<{ data: PriorAuthDomain }> = ({ data }) => (
  <CardWrapper title="Prior Authorization Status" icon={<ClipboardListIcon className="w-6 h-6 text-purple-500" />}>
    <DetailItem label="Status" value={data.status} />
    <DetailItem label="Missing Items" value={data.missing_items} />
    <DetailItem label="Clinical Criteria" value={data.clinical_criteria} />
    <DetailItem label="Deadline" value={data.deadline} />
    <DetailItem label="Checklist" value={data.checklist} />
    <DetailItem label="Template for Addendum" value={data.template_addendum} />
  </CardWrapper>
);

const DischargeView: React.FC<{ data: DischargeDomain }> = ({ data }) => (
  <CardWrapper title="Discharge Summary" icon={<ActivityIcon className="w-6 h-6 text-red-500" />}>
    <DetailItem label="Follow-ups" value={data.followups} />
    <DetailItem label="Medication Changes" value={data.med_changes} />
    <DetailItem label="When to Call Provider" value={data.when_to_call} />
    <DetailItem label="Activity Restrictions" value={data.activity_restrictions} />
  </CardWrapper>
);

const LabView: React.FC<{ data: LabDomain }> = ({ data }) => (
  <CardWrapper title="Lab Results" icon={<FlaskConicalIcon className="w-6 h-6 text-indigo-500" />}>
    <DetailItem label="Test" value={data.test} />
    <DetailItem label="Value" value={data.value} />
    <DetailItem label="Unit" value={data.unit} />
    <DetailItem label="Reference Range" value={data.reference_range} />
    <DetailItem label="Interpretation" value={data.interpretation} />
    <DetailItem label="Next Steps" value={data.next_steps} />
  </CardWrapper>
);

const GeneralModeView: React.FC<{ data: UnknownDomain }> = ({ data }) => (
  <CardWrapper title="General Summary & Checklist" icon={<InfoIcon className="w-6 h-6 text-gray-500" />}>
    <DetailItem label="Key Points" value={data.key_points} />
    <DetailItem label="Action Checklist" value={data.action_checklist} />
    <DetailItem label="Questions to Ask Your Provider" value={data.questions_to_ask_provider} />
  </CardWrapper>
);

const DomainDetailsCard: React.FC<DomainDetailsCardProps> = ({ data }) => {
  const { context, domain } = data;

  switch (context) {
    case 'prescription':
      return domain.prescription ? <PrescriptionView data={domain.prescription} /> : null;
    case 'eob':
      return domain.eob ? <EobView data={domain.eob} /> : null;
    case 'prior_auth':
      return domain.prior_auth ? <PriorAuthView data={domain.prior_auth} /> : null;
    case 'discharge':
      return domain.discharge ? <DischargeView data={domain.discharge} /> : null;
    case 'lab':
      return domain.lab ? <LabView data={domain.lab} /> : null;
    case 'unknown':
      return domain.unknown ? <GeneralModeView data={domain.unknown} /> : null;
    default:
      return null;
  }
};

export default DomainDetailsCard;