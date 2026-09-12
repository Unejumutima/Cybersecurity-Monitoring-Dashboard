import {
  ShieldExclamationIcon,
  BoltIcon,
  BugAntIcon,
  CheckBadgeIcon,
} from '@heroicons/react/24/outline';

import KpiCard               from '../components/dashboard/KpiCard';
import RecentEventsTable     from '../components/dashboard/RecentEventsTable';
import CriticalAlerts        from '../components/dashboard/CriticalAlerts';
import VulnerabilitySummary  from '../components/dashboard/VulnerabilitySummary';
import EventTrendChart       from '../components/charts/EventTrendChart';
import SeverityDonutChart    from '../components/charts/SeverityDonutChart';

import {
  mockSecurityMetrics,
  mockSecurityEvents,
  mockVulnerabilities,
  mockAlerts,
  mockTrendData,
  mockSeverityDistribution,
} from '../data/mockData';

// Icons paired to each KPI metric (order matches mockSecurityMetrics array)
const kpiIcons: React.ReactNode[] = [
  <ShieldExclamationIcon className="w-5 h-5 text-slate-400" aria-hidden="true" />,
  <BoltIcon              className="w-5 h-5 text-red-400"   aria-hidden="true" />,
  <BugAntIcon            className="w-5 h-5 text-orange-400" aria-hidden="true" />,
  <CheckBadgeIcon        className="w-5 h-5 text-cyan-400"  aria-hidden="true" />,
];

export default function DashboardPage() {
  // Show only the 8 most recent events in the table
  const recentEvents = [...mockSecurityEvents]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 8);

  return (
    <div className="space-y-6 p-5 lg:p-6">
      {/* ── Page heading ───────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Security Overview</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Real-time threat monitoring · Last updated just now
          </p>
        </div>
        {/* Live indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 shrink-0">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
          <span className="text-xs font-medium text-emerald-400">Live</span>
        </div>
      </div>

      {/* ── KPI cards ──────────────────────────────────────────────────── */}
      <section aria-label="Key performance indicators">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {mockSecurityMetrics.map((metric, i) => (
            <KpiCard key={metric.label} metric={metric} icon={kpiIcons[i]} />
          ))}
        </div>
      </section>

      {/* ── Charts row ─────────────────────────────────────────────────── */}
      <section aria-label="Security charts" className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Trend chart spans 2/3 */}
        <div className="lg:col-span-2">
          <EventTrendChart data={mockTrendData} days={14} />
        </div>
        {/* Donut chart spans 1/3 */}
        <div className="lg:col-span-1">
          <SeverityDonutChart distribution={mockSeverityDistribution} />
        </div>
      </section>

      {/* ── Recent events table (full width) ───────────────────────────── */}
      <section aria-label="Recent security events">
        <RecentEventsTable events={recentEvents} />
      </section>

      {/* ── Bottom row: Vulnerability summary + Critical alerts ────────── */}
      <section aria-label="Vulnerability and alert summaries" className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <VulnerabilitySummary vulnerabilities={mockVulnerabilities} />
        <CriticalAlerts alerts={mockAlerts} />
      </section>
    </div>
  );
}
