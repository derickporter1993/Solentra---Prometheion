/**
 * Data Sync Page
 *
 * Configure and execute data sync operations with masking
 */

'use client';

import { useState } from 'react';

type SyncMode = 'prod_subset_masked' | 'sandbox_delta' | 'synthetic_seed';

interface SelectedObject {
  name: string;
  recordCount: number;
  hasPii: boolean;
  selected: boolean;
}

export default function DataSyncPage() {
  const [mode, setMode] = useState<SyncMode>('prod_subset_masked');
  const [step, setStep] = useState<'mode' | 'objects' | 'preview'>('mode');

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Data Sync</h1>
        <p className="mt-1 text-sm text-gray-500">
          Configure and execute masked data sync between orgs
        </p>
      </div>

      {/* Steps indicator */}
      <div className="mb-8">
        <div className="flex items-center">
          <StepIndicator number={1} label="Select Mode" active={step === 'mode'} completed={step !== 'mode'} />
          <div className="flex-1 h-0.5 bg-gray-200 mx-4"></div>
          <StepIndicator number={2} label="Choose Objects" active={step === 'objects'} completed={step === 'preview'} />
          <div className="flex-1 h-0.5 bg-gray-200 mx-4"></div>
          <StepIndicator number={3} label="Preview & Run" active={step === 'preview'} completed={false} />
        </div>
      </div>

      {/* Content */}
      {step === 'mode' && (
        <ModeSelection mode={mode} setMode={setMode} onNext={() => setStep('objects')} />
      )}

      {step === 'objects' && (
        <ObjectSelection onBack={() => setStep('mode')} onNext={() => setStep('preview')} />
      )}

      {step === 'preview' && (
        <PreviewAndRun onBack={() => setStep('objects')} />
      )}
    </div>
  );
}

function StepIndicator({
  number,
  label,
  active,
  completed,
}: {
  number: number;
  label: string;
  active: boolean;
  completed: boolean;
}) {
  return (
    <div className="flex items-center">
      <div
        className={`
          w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
          ${completed ? 'bg-green-500 text-white' : active ? 'bg-brand-600 text-white' : 'bg-gray-200 text-gray-600'}
        `}
      >
        {completed ? '✓' : number}
      </div>
      <span className={`ml-2 text-sm font-medium ${active ? 'text-brand-600' : 'text-gray-500'}`}>
        {label}
      </span>
    </div>
  );
}

function ModeSelection({
  mode,
  setMode,
  onNext,
}: {
  mode: SyncMode;
  setMode: (mode: SyncMode) => void;
  onNext: () => void;
}) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">What do you want to sync?</h2>

      <div className="grid grid-cols-3 gap-6 mb-8">
        <ModeCard
          id="prod_subset_masked"
          title="Prod Subset (Masked)"
          description="Copy a filtered subset from production to sandbox with PII masked"
          icon="🔒"
          selected={mode === 'prod_subset_masked'}
          onClick={() => setMode('prod_subset_masked')}
          features={['Mask-first architecture', 'Filtered subsets', 'Referential integrity']}
        />
        <ModeCard
          id="sandbox_delta"
          title="Sandbox Delta"
          description="Sync changes between sandboxes since last refresh"
          icon="🔄"
          selected={mode === 'sandbox_delta'}
          onClick={() => setMode('sandbox_delta')}
          features={['Delta detection', 'Conflict handling', 'Diff preview']}
        />
        <ModeCard
          id="synthetic_seed"
          title="Synthetic Seed"
          description="Generate realistic test data matching your schema"
          icon="🧪"
          selected={mode === 'synthetic_seed'}
          onClick={() => setMode('synthetic_seed')}
          features={['Schema-aware', 'Volume control', 'Relationship fill']}
        />
      </div>

      {/* Quick Templates */}
      <div className="mb-8">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Quick Start Templates</h3>
        <div className="flex gap-4">
          <TemplateChip label="Sales Cloud" count={15} />
          <TemplateChip label="Service Cloud" count={12} />
          <TemplateChip label="Platform Core" count={8} />
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t border-gray-200">
        <button
          onClick={onNext}
          className="px-6 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700"
        >
          Choose Objects →
        </button>
      </div>
    </div>
  );
}

function ModeCard({
  id,
  title,
  description,
  icon,
  selected,
  onClick,
  features,
}: {
  id: string;
  title: string;
  description: string;
  icon: string;
  selected: boolean;
  onClick: () => void;
  features: string[];
}) {
  return (
    <button
      onClick={onClick}
      className={`
        p-6 rounded-lg border-2 text-left transition-all
        ${selected ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-200' : 'border-gray-200 hover:border-gray-300'}
      `}
    >
      <div className="text-3xl mb-3">{icon}</div>
      <div className="font-semibold text-gray-900">{title}</div>
      <div className="text-sm text-gray-500 mt-1">{description}</div>
      <ul className="mt-4 space-y-1">
        {features.map((feature) => (
          <li key={feature} className="text-xs text-gray-600 flex items-center">
            <span className="text-green-500 mr-1">✓</span>
            {feature}
          </li>
        ))}
      </ul>
    </button>
  );
}

function TemplateChip({ label, count }: { label: string; count: number }) {
  return (
    <button className="px-4 py-2 bg-gray-100 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors">
      {label} <span className="text-gray-500">({count} objects)</span>
    </button>
  );
}

function ObjectSelection({
  onBack,
  onNext,
}: {
  onBack: () => void;
  onNext: () => void;
}) {
  const [search, setSearch] = useState('');
  const [objects, setObjects] = useState<SelectedObject[]>([
    { name: 'Account', recordCount: 45000, hasPii: true, selected: true },
    { name: 'Contact', recordCount: 120000, hasPii: true, selected: true },
    { name: 'Opportunity', recordCount: 28000, hasPii: false, selected: true },
    { name: 'Lead', recordCount: 15000, hasPii: true, selected: false },
    { name: 'Case', recordCount: 85000, hasPii: true, selected: false },
    { name: 'Task', recordCount: 250000, hasPii: false, selected: false },
    { name: 'Event', recordCount: 45000, hasPii: false, selected: false },
    { name: 'OpportunityLineItem', recordCount: 95000, hasPii: false, selected: true },
  ]);

  const toggleObject = (name: string) => {
    setObjects(objects.map(o => o.name === name ? { ...o, selected: !o.selected } : o));
  };

  const selectedCount = objects.filter(o => o.selected).length;
  const totalRecords = objects.filter(o => o.selected).reduce((sum, o) => sum + o.recordCount, 0);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Choose Objects</h2>
          <p className="text-sm text-gray-500">Select the objects you want to sync</p>
        </div>
        <div className="text-sm text-gray-500">
          {selectedCount} objects selected • {totalRecords.toLocaleString()} records
        </div>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search objects... (⌘K)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-brand-500 focus:border-brand-500"
        />
      </div>

      {/* Object List */}
      <div className="border border-gray-200 rounded-lg overflow-hidden mb-6">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Object</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Records</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">PII</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dependencies</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Select</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {objects
              .filter(o => o.name.toLowerCase().includes(search.toLowerCase()))
              .map((obj) => (
                <tr key={obj.name} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <span className="font-medium text-gray-900">{obj.name}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {obj.recordCount.toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    {obj.hasPii && (
                      <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                        PII
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {obj.name === 'Contact' && '→ Account'}
                    {obj.name === 'Opportunity' && '→ Account'}
                    {obj.name === 'OpportunityLineItem' && '→ Opportunity'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <input
                      type="checkbox"
                      checked={obj.selected}
                      onChange={() => toggleObject(obj.name)}
                      className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-gray-300 rounded"
                    />
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Relationship Graph Preview */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Relationship Graph</h3>
        <div className="flex items-center justify-center gap-4 py-4 text-sm text-gray-600">
          <div className="px-3 py-1 bg-blue-100 rounded">Account</div>
          <span>←</span>
          <div className="px-3 py-1 bg-blue-100 rounded">Contact</div>
          <span className="mx-4">|</span>
          <div className="px-3 py-1 bg-blue-100 rounded">Account</div>
          <span>←</span>
          <div className="px-3 py-1 bg-blue-100 rounded">Opportunity</div>
          <span>←</span>
          <div className="px-3 py-1 bg-blue-100 rounded">OppLineItem</div>
        </div>
        <p className="text-xs text-gray-500 text-center">
          Dependencies will be synced in correct order (parent → child)
        </p>
      </div>

      <div className="flex justify-between pt-4 border-t border-gray-200">
        <button onClick={onBack} className="px-4 py-2 text-gray-700 hover:text-gray-900">
          ← Back
        </button>
        <button
          onClick={onNext}
          className="px-6 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700"
        >
          Preview Sync →
        </button>
      </div>
    </div>
  );
}

function PreviewAndRun({ onBack }: { onBack: () => void }) {
  const [runMode, setRunMode] = useState<'live' | 'dry_run' | 'shadow'>('dry_run');

  return (
    <div className="space-y-6">
      {/* Estimates */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Sync Preview</h2>

        <div className="grid grid-cols-4 gap-6 mb-6">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">4</div>
            <div className="text-sm text-gray-500">Objects</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">288K</div>
            <div className="text-sm text-gray-500">Records</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">~18 min</div>
            <div className="text-sm text-gray-500">Est. Duration</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">4,200</div>
            <div className="text-sm text-gray-500">API Calls</div>
          </div>
        </div>

        {/* Masking Summary */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <span className="text-yellow-600 mr-2">🔒</span>
            <span className="font-medium text-yellow-800">12 PII fields will be masked</span>
          </div>
          <p className="text-sm text-yellow-700 mt-1">
            Email, Phone, Name, and Address fields will be masked using your default policy
          </p>
          <a href="/policies" className="text-sm text-yellow-800 underline mt-2 inline-block">
            View Masking Policy →
          </a>
        </div>

        {/* Governor Limit Impact */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Governor Limit Impact</h3>
          <div className="flex items-center gap-8">
            <div>
              <div className="text-sm text-gray-500">Daily API Calls</div>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500" style={{ width: '9%' }}></div>
                </div>
                <span className="text-sm text-gray-600">9,200 / 100,000</span>
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Bulk API Batches</div>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500" style={{ width: '2%' }}></div>
                </div>
                <span className="text-sm text-gray-600">18 / 10,000</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Run Mode */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Run Mode</h3>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <button
            onClick={() => setRunMode('dry_run')}
            className={`p-4 rounded-lg border-2 text-left ${
              runMode === 'dry_run' ? 'border-brand-500 bg-brand-50' : 'border-gray-200'
            }`}
          >
            <div className="font-medium text-gray-900">Dry Run</div>
            <div className="text-sm text-gray-500">Preview only, no data moved</div>
          </button>
          <button
            onClick={() => setRunMode('shadow')}
            className={`p-4 rounded-lg border-2 text-left ${
              runMode === 'shadow' ? 'border-brand-500 bg-brand-50' : 'border-gray-200'
            }`}
          >
            <div className="font-medium text-gray-900">Shadow Mode</div>
            <div className="text-sm text-gray-500">Extract and mask, don't load</div>
          </button>
          <button
            onClick={() => setRunMode('live')}
            className={`p-4 rounded-lg border-2 text-left ${
              runMode === 'live' ? 'border-brand-500 bg-brand-50' : 'border-gray-200'
            }`}
          >
            <div className="font-medium text-gray-900">Live Sync</div>
            <div className="text-sm text-gray-500">Execute full sync to target</div>
          </button>
        </div>

        <div className="flex justify-between pt-4 border-t border-gray-200">
          <button onClick={onBack} className="px-4 py-2 text-gray-700 hover:text-gray-900">
            ← Back
          </button>
          <div className="flex gap-4">
            <button className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
              Export Plan (JSON)
            </button>
            <button className="px-6 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700">
              {runMode === 'dry_run' ? 'Run Dry Run' : runMode === 'shadow' ? 'Run Shadow' : 'Start Sync'}
            </button>
          </div>
        </div>
      </div>

      {/* Compare to Native Refresh */}
      <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-6 border border-green-200">
        <h3 className="text-lg font-semibold text-green-900 mb-2">Compare to Native Refresh</h3>
        <div className="grid grid-cols-4 gap-4 text-sm">
          <div>
            <div className="text-green-700">Time Saved</div>
            <div className="text-xl font-bold text-green-900">~3.5 hours</div>
          </div>
          <div>
            <div className="text-green-700">Records Avoided</div>
            <div className="text-xl font-bold text-green-900">1.8M</div>
          </div>
          <div>
            <div className="text-green-700">PII Protected</div>
            <div className="text-xl font-bold text-green-900">12 fields</div>
          </div>
          <div>
            <div className="text-green-700">Config Preserved</div>
            <div className="text-xl font-bold text-green-900">100%</div>
          </div>
        </div>
      </div>
    </div>
  );
}
