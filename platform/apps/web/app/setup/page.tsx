/**
 * Setup Wizard Page
 *
 * Non-linear wizard for connecting orgs and configuring the workspace
 */

'use client';

import { useState } from 'react';

type StepStatus = 'pending' | 'in_progress' | 'completed' | 'error';

interface WizardStep {
  id: string;
  title: string;
  description: string;
  status: StepStatus;
  dependencies: string[];
}

const initialSteps: WizardStep[] = [
  {
    id: 'source',
    title: 'Connect Source Org',
    description: 'Connect your production or source sandbox',
    status: 'pending',
    dependencies: [],
  },
  {
    id: 'target',
    title: 'Connect Target Org',
    description: 'Connect your target sandbox(es)',
    status: 'pending',
    dependencies: [],
  },
  {
    id: 'permissions',
    title: 'Verify Permissions',
    description: 'Check API access and permissions',
    status: 'pending',
    dependencies: ['source', 'target'],
  },
  {
    id: 'compatibility',
    title: 'Compatibility Check',
    description: 'Analyze schema and config compatibility',
    status: 'pending',
    dependencies: ['source', 'target'],
  },
  {
    id: 'preset',
    title: 'Choose Preset',
    description: 'Select a sync template or customize',
    status: 'pending',
    dependencies: ['permissions'],
  },
];

export default function SetupWizardPage() {
  const [steps, setSteps] = useState<WizardStep[]>(initialSteps);
  const [activeStep, setActiveStep] = useState<string | null>(null);

  const updateStepStatus = (stepId: string, status: StepStatus) => {
    setSteps(steps.map(s => s.id === stepId ? { ...s, status } : s));
  };

  const canStartStep = (step: WizardStep) => {
    return step.dependencies.every(depId => {
      const dep = steps.find(s => s.id === depId);
      return dep?.status === 'completed';
    });
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Setup Wizard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Connect your Salesforce orgs and configure your workspace
        </p>
      </div>

      {/* Progress Graph */}
      <div className="mb-8 bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Setup Progress</h2>

        <div className="flex items-center justify-center gap-4 py-8">
          {/* Visual graph representation */}
          <div className="flex flex-col items-center">
            <StepNode
              step={steps.find(s => s.id === 'source')!}
              isActive={activeStep === 'source'}
              onClick={() => setActiveStep('source')}
              canStart={canStartStep(steps.find(s => s.id === 'source')!)}
            />
          </div>

          <div className="flex items-center">
            <div className="w-8 h-0.5 bg-gray-300"></div>
            <div className="w-4 h-4 rotate-45 border-t-2 border-r-2 border-gray-300 -ml-2"></div>
          </div>

          <div className="flex flex-col gap-4">
            <StepNode
              step={steps.find(s => s.id === 'permissions')!}
              isActive={activeStep === 'permissions'}
              onClick={() => setActiveStep('permissions')}
              canStart={canStartStep(steps.find(s => s.id === 'permissions')!)}
            />
            <StepNode
              step={steps.find(s => s.id === 'compatibility')!}
              isActive={activeStep === 'compatibility'}
              onClick={() => setActiveStep('compatibility')}
              canStart={canStartStep(steps.find(s => s.id === 'compatibility')!)}
            />
          </div>

          <div className="flex items-center">
            <div className="w-8 h-0.5 bg-gray-300"></div>
            <div className="w-4 h-4 rotate-45 border-t-2 border-r-2 border-gray-300 -ml-2"></div>
          </div>

          <div className="flex flex-col items-center">
            <StepNode
              step={steps.find(s => s.id === 'preset')!}
              isActive={activeStep === 'preset'}
              onClick={() => setActiveStep('preset')}
              canStart={canStartStep(steps.find(s => s.id === 'preset')!)}
            />
          </div>
        </div>

        <div className="flex flex-col items-center mt-4">
          <StepNode
            step={steps.find(s => s.id === 'target')!}
            isActive={activeStep === 'target'}
            onClick={() => setActiveStep('target')}
            canStart={canStartStep(steps.find(s => s.id === 'target')!)}
          />
        </div>
      </div>

      {/* Active Step Content */}
      {activeStep && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <StepContent
            step={steps.find(s => s.id === activeStep)!}
            onComplete={() => {
              updateStepStatus(activeStep, 'completed');
              setActiveStep(null);
            }}
            onCancel={() => setActiveStep(null)}
          />
        </div>
      )}

      {/* No Active Step - Show Instructions */}
      {!activeStep && (
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-6 text-center">
          <p className="text-gray-500">
            Click on a step above to begin. Steps with dependencies will unlock as you complete prerequisites.
          </p>
        </div>
      )}
    </div>
  );
}

function StepNode({
  step,
  isActive,
  onClick,
  canStart,
}: {
  step: WizardStep;
  isActive: boolean;
  onClick: () => void;
  canStart: boolean;
}) {
  const statusStyles = {
    pending: canStart
      ? 'border-gray-300 bg-white hover:border-brand-500 cursor-pointer'
      : 'border-gray-200 bg-gray-100 cursor-not-allowed opacity-50',
    in_progress: 'border-brand-500 bg-brand-50 ring-2 ring-brand-200',
    completed: 'border-green-500 bg-green-50',
    error: 'border-red-500 bg-red-50',
  };

  const iconStyles = {
    pending: 'text-gray-400',
    in_progress: 'text-brand-600',
    completed: 'text-green-600',
    error: 'text-red-600',
  };

  return (
    <button
      onClick={() => canStart && onClick()}
      disabled={!canStart}
      className={`
        flex flex-col items-center p-4 rounded-lg border-2 transition-all
        ${statusStyles[step.status]}
        ${isActive ? 'ring-2 ring-brand-500' : ''}
      `}
    >
      <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${iconStyles[step.status]}`}>
        {step.status === 'completed' ? (
          <CheckIcon />
        ) : step.status === 'in_progress' ? (
          <SpinnerIcon />
        ) : step.status === 'error' ? (
          <ErrorIcon />
        ) : (
          <CircleIcon />
        )}
      </div>
      <span className="text-sm font-medium text-gray-900">{step.title}</span>
      <span className="text-xs text-gray-500 text-center mt-1">{step.description}</span>
    </button>
  );
}

function StepContent({
  step,
  onComplete,
  onCancel,
}: {
  step: WizardStep;
  onComplete: () => void;
  onCancel: () => void;
}) {
  if (step.id === 'source' || step.id === 'target') {
    return <ConnectOrgStep step={step} onComplete={onComplete} onCancel={onCancel} />;
  }

  if (step.id === 'permissions') {
    return <PermissionsStep onComplete={onComplete} onCancel={onCancel} />;
  }

  if (step.id === 'compatibility') {
    return <CompatibilityStep onComplete={onComplete} onCancel={onCancel} />;
  }

  if (step.id === 'preset') {
    return <PresetStep onComplete={onComplete} onCancel={onCancel} />;
  }

  return <div>Unknown step</div>;
}

function ConnectOrgStep({
  step,
  onComplete,
  onCancel,
}: {
  step: WizardStep;
  onComplete: () => void;
  onCancel: () => void;
}) {
  const [authMethod, setAuthMethod] = useState<'jwt' | 'oauth'>('oauth');

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{step.title}</h3>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Choose authentication method
        </label>
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setAuthMethod('jwt')}
            className={`p-4 rounded-lg border-2 text-left ${
              authMethod === 'jwt'
                ? 'border-brand-500 bg-brand-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="font-medium text-gray-900">JWT Bearer</div>
            <div className="text-sm text-gray-500">Recommended for automation</div>
          </button>
          <button
            onClick={() => setAuthMethod('oauth')}
            className={`p-4 rounded-lg border-2 text-left ${
              authMethod === 'oauth'
                ? 'border-brand-500 bg-brand-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="font-medium text-gray-900">Web OAuth</div>
            <div className="text-sm text-gray-500">Quick interactive setup</div>
          </button>
        </div>
      </div>

      {authMethod === 'oauth' && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Org Alias
          </label>
          <input
            type="text"
            placeholder="e.g., production, dev-sandbox"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-brand-500 focus:border-brand-500"
          />
          <p className="mt-1 text-sm text-gray-500">
            A friendly name to identify this org
          </p>
        </div>
      )}

      {authMethod === 'jwt' && (
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Connected App Client ID
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-brand-500 focus:border-brand-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Username
            </label>
            <input
              type="email"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-brand-500 focus:border-brand-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Private Key (PEM)
            </label>
            <textarea
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-brand-500 focus:border-brand-500 font-mono text-sm"
              placeholder="-----BEGIN RSA PRIVATE KEY-----"
            />
          </div>
        </div>
      )}

      <div className="flex justify-between pt-4 border-t border-gray-200">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-gray-700 hover:text-gray-900"
        >
          Cancel
        </button>
        <button
          onClick={onComplete}
          className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700"
        >
          {authMethod === 'oauth' ? 'Connect with Salesforce' : 'Test & Connect'}
        </button>
      </div>
    </div>
  );
}

function PermissionsStep({
  onComplete,
  onCancel,
}: {
  onComplete: () => void;
  onCancel: () => void;
}) {
  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Verify Permissions</h3>

      <div className="space-y-4 mb-6">
        <CheckItem status="pass" label="API Access" description="REST API enabled" />
        <CheckItem status="pass" label="Bulk API" description="Bulk API 2.0 enabled" />
        <CheckItem status="pass" label="Tooling API" description="Metadata access available" />
        <CheckItem status="warning" label="Daily API Limit" description="75% remaining (75,000 calls)" />
        <CheckItem status="pass" label="Object Permissions" description="Read access to standard objects" />
      </div>

      <div className="flex justify-between pt-4 border-t border-gray-200">
        <button onClick={onCancel} className="px-4 py-2 text-gray-700 hover:text-gray-900">
          Back
        </button>
        <button onClick={onComplete} className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700">
          Continue
        </button>
      </div>
    </div>
  );
}

function CompatibilityStep({
  onComplete,
  onCancel,
}: {
  onComplete: () => void;
  onCancel: () => void;
}) {
  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Compatibility Analysis</h3>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
        <div className="flex items-center">
          <CheckIcon className="text-green-600" />
          <span className="ml-2 font-medium text-green-800">No compatibility issues found</span>
        </div>
      </div>

      <div className="space-y-4 mb-6">
        <CheckItem status="pass" label="Record Types" description="All record types match" />
        <CheckItem status="pass" label="Picklist Values" description="All values available in target" />
        <CheckItem status="pass" label="Currencies" description="Currency codes match" />
        <CheckItem status="info" label="Owners" description="3 users need mapping" />
      </div>

      <div className="flex justify-between pt-4 border-t border-gray-200">
        <button onClick={onCancel} className="px-4 py-2 text-gray-700 hover:text-gray-900">
          Back
        </button>
        <button onClick={onComplete} className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700">
          Continue
        </button>
      </div>
    </div>
  );
}

function PresetStep({
  onComplete,
  onCancel,
}: {
  onComplete: () => void;
  onCancel: () => void;
}) {
  const [selected, setSelected] = useState<string>('sales');

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Choose a Preset</h3>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <PresetCard
          id="sales"
          title="Sales Cloud"
          description="Account, Contact, Opportunity, Lead + 12 related"
          selected={selected === 'sales'}
          onClick={() => setSelected('sales')}
        />
        <PresetCard
          id="service"
          title="Service Cloud"
          description="Case, Contact, Knowledge + 8 related"
          selected={selected === 'service'}
          onClick={() => setSelected('service')}
        />
        <PresetCard
          id="custom"
          title="Custom"
          description="Select your own objects"
          selected={selected === 'custom'}
          onClick={() => setSelected('custom')}
        />
      </div>

      <div className="flex justify-between pt-4 border-t border-gray-200">
        <button onClick={onCancel} className="px-4 py-2 text-gray-700 hover:text-gray-900">
          Back
        </button>
        <button onClick={onComplete} className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700">
          Complete Setup
        </button>
      </div>
    </div>
  );
}

function PresetCard({
  id,
  title,
  description,
  selected,
  onClick,
}: {
  id: string;
  title: string;
  description: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`p-4 rounded-lg border-2 text-left ${
        selected ? 'border-brand-500 bg-brand-50' : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      <div className="font-medium text-gray-900">{title}</div>
      <div className="text-sm text-gray-500 mt-1">{description}</div>
    </button>
  );
}

function CheckItem({
  status,
  label,
  description,
}: {
  status: 'pass' | 'warning' | 'error' | 'info';
  label: string;
  description: string;
}) {
  const colors = {
    pass: 'text-green-600',
    warning: 'text-yellow-600',
    error: 'text-red-600',
    info: 'text-blue-600',
  };

  return (
    <div className="flex items-start">
      <span className={colors[status]}>
        {status === 'pass' ? <CheckIcon /> : status === 'warning' ? <WarningIcon /> : <InfoIcon />}
      </span>
      <div className="ml-3">
        <div className="font-medium text-gray-900">{label}</div>
        <div className="text-sm text-gray-500">{description}</div>
      </div>
    </div>
  );
}

// Icons
function CheckIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={`w-5 h-5 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function CircleIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" strokeWidth={2} />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

function ErrorIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function WarningIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
