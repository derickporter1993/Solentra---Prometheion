import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Salesforce DevOps Platform',
  description: 'Mask-first, no-surprise sandbox refresh and delta sync',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">
        <div className="flex min-h-screen">
          {/* Sidebar */}
          <aside className="w-64 bg-white border-r border-gray-200 hidden lg:block">
            <div className="flex flex-col h-full">
              {/* Logo */}
              <div className="flex items-center h-16 px-6 border-b border-gray-200">
                <span className="text-xl font-bold text-brand-600">DevOps Platform</span>
              </div>

              {/* Navigation */}
              <nav className="flex-1 px-4 py-6 space-y-2">
                <NavItem href="/" icon="home" label="Dashboard" />
                <NavItem href="/setup" icon="settings" label="Setup Wizard" />
                <NavItem href="/sync" icon="refresh" label="Data Sync" />
                <NavItem href="/jobs" icon="activity" label="Jobs" />
                <NavItem href="/portfolio" icon="grid" label="Portfolio" />

                <div className="pt-4 mt-4 border-t border-gray-200">
                  <NavItem href="/policies" icon="shield" label="Masking Policies" />
                  <NavItem href="/settings" icon="cog" label="Settings" />
                </div>
              </nav>

              {/* Footer */}
              <div className="px-4 py-4 border-t border-gray-200">
                <div className="flex items-center text-sm text-gray-500">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  All systems operational
                </div>
              </div>
            </div>
          </aside>

          {/* Main content */}
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}

function NavItem({
  href,
  icon,
  label,
}: {
  href: string;
  icon: string;
  label: string;
}) {
  return (
    <a
      href={href}
      className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 hover:text-brand-600 transition-colors"
    >
      <span className="mr-3 text-gray-400">
        <IconPlaceholder name={icon} />
      </span>
      {label}
    </a>
  );
}

function IconPlaceholder({ name }: { name: string }) {
  // Placeholder for icons - replace with actual icons from lucide-react
  return (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 6h16M4 12h16M4 18h16"
      />
    </svg>
  );
}
