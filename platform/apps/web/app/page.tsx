/**
 * Dashboard Page
 *
 * Overview of connected orgs, recent syncs, and quick actions
 */

export default function DashboardPage() {
  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Mask-first, no-surprise sandbox refresh
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Connected Orgs"
          value="5"
          subtitle="2 production, 3 sandboxes"
          trend="+1 this week"
        />
        <StatCard
          title="Syncs This Month"
          value="23"
          subtitle="21 successful, 2 failed"
          trend="+8 vs last month"
        />
        <StatCard
          title="Records Processed"
          value="1.2M"
          subtitle="98.5% success rate"
        />
        <StatCard
          title="API Calls Used"
          value="45K"
          subtitle="4.5% of daily limit"
          trend="On track"
        />
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ActionCard
            title="New Sync"
            description="Start a new data sync from production to sandbox"
            href="/sync"
            buttonText="Create Sync"
          />
          <ActionCard
            title="Connect Org"
            description="Add a new Salesforce org to your workspace"
            href="/setup"
            buttonText="Connect"
          />
          <ActionCard
            title="View Templates"
            description="Browse pre-built sync templates for Sales/Service Cloud"
            href="/sync/templates"
            buttonText="Browse"
          />
        </div>
      </div>

      {/* Recent Jobs */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Jobs</h2>
          <a href="/jobs" className="text-sm text-brand-600 hover:text-brand-700">
            View all →
          </a>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Job
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Source → Target
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Records
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Completed
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <JobRow
                id="job-001"
                source="Production"
                target="Dev Sandbox"
                status="completed"
                records={15420}
                completedAt="2 hours ago"
              />
              <JobRow
                id="job-002"
                source="QA Sandbox"
                target="UAT Sandbox"
                status="running"
                records={8500}
                completedAt="In progress..."
              />
              <JobRow
                id="job-003"
                source="Production"
                target="Staging"
                status="completed"
                records={22100}
                completedAt="Yesterday"
              />
            </tbody>
          </table>
        </div>
      </div>

      {/* Compare to Native Refresh */}
      <div className="mt-8 bg-gradient-to-r from-brand-50 to-brand-100 rounded-lg p-6 border border-brand-200">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-brand-900">
              Why not just use Sandbox Refresh?
            </h3>
            <p className="mt-1 text-sm text-brand-700">
              Native refresh copies everything. We give you masked subsets in minutes, not hours.
            </p>
            <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
              <div>
                <div className="font-semibold text-brand-900">~4 hours</div>
                <div className="text-brand-600">saved per refresh</div>
              </div>
              <div>
                <div className="font-semibold text-brand-900">100%</div>
                <div className="text-brand-600">PII masked</div>
              </div>
              <div>
                <div className="font-semibold text-brand-900">0</div>
                <div className="text-brand-600">config destroyed</div>
              </div>
            </div>
          </div>
          <a
            href="/sync/compare"
            className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors"
          >
            See Comparison
          </a>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  trend,
}: {
  title: string;
  value: string;
  subtitle: string;
  trend?: string;
}) {
  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 card-hover">
      <div className="text-sm font-medium text-gray-500">{title}</div>
      <div className="mt-2 text-3xl font-bold text-gray-900">{value}</div>
      <div className="mt-1 text-sm text-gray-500">{subtitle}</div>
      {trend && (
        <div className="mt-2 text-xs text-green-600">{trend}</div>
      )}
    </div>
  );
}

function ActionCard({
  title,
  description,
  href,
  buttonText,
}: {
  title: string;
  description: string;
  href: string;
  buttonText: string;
}) {
  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 card-hover">
      <h3 className="font-semibold text-gray-900">{title}</h3>
      <p className="mt-1 text-sm text-gray-500">{description}</p>
      <a
        href={href}
        className="mt-4 inline-block px-4 py-2 bg-brand-600 text-white text-sm rounded-lg hover:bg-brand-700 transition-colors"
      >
        {buttonText}
      </a>
    </div>
  );
}

function JobRow({
  id,
  source,
  target,
  status,
  records,
  completedAt,
}: {
  id: string;
  source: string;
  target: string;
  status: 'completed' | 'running' | 'failed';
  records: number;
  completedAt: string;
}) {
  const statusColors = {
    completed: 'bg-green-100 text-green-800',
    running: 'bg-blue-100 text-blue-800',
    failed: 'bg-red-100 text-red-800',
  };

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap">
        <a href={`/jobs/${id}`} className="text-sm font-medium text-brand-600 hover:text-brand-700">
          {id}
        </a>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {source} → {target}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[status]}`}>
          {status}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {records.toLocaleString()}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {completedAt}
      </td>
    </tr>
  );
}
