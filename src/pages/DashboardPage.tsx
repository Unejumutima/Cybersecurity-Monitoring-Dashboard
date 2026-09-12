/**
 * DashboardPage.tsx
 * -----------------
 * Security overview page. Receives live data from useSecurityEvents (via
 * AppLayout context), merging with Phase 1 static mock data where live data
 * isn't available yet (vulnerabilities, OWASP).
 *
 * Props are passed down from AppLayout so the single WS connection is shared
 * across the whole app rather than each page opening its own socket.
 */

import {
  ShieldExclamationIcon,
  BoltIcon,
  BugAntIcon,
  CheckBadgeIcon,
} from '@heroicons/react/24/outline';

import KpiCard              from '../components/dashboard/KpiCard';
import RecentEventsTable    from '../components/dashboard/RecentEventsTable';
import CriticalAlerts       from '../components/dashboard/CriticalAlerts';
import VulnerabilitySummary from '../components/dashboard/VulnerabilitySummary';
import EventTrendChart      from '../components/charts/EventTrendChart';
import SeverityDonutChart   from '../components/charts/SeverityDonutChart';

import type { SecurityMetric, TrendDataPoint, SeverityDistribution } from '../types/security';
import type { LiveSecurityEvent } from '../hooks/useSecurityEvents';
import type { WsStatus } from '../hooks/useWebSocket';

// Phase-1 static data still used for sections not yet live
import { mockVulnerabilities, mockAlerts, mockTrendData, mockSeverityDistribution } from '../data/mockData';

// Map live events → the shape that RecentEventsTable already understands
import type { SecurityEvent } from '../types/security';

const kpiIcons: React.ReactNode[] = [
  <ShieldExclamationIcon className="w-5 h-5 text-slate-400" aria-hidden="true" />,
  <BoltIcon              className="w-5 h-5 text-red-400"   aria-hidden="true" />,
  <BugAntIcon            className="w-5 h-5 text-orange-400" aria-hidden="true" />,
  <CheckBadgeIcon        className="w-5 h-5 text-cyan-400"  aria-hidden="true" />,
];

function mapLiveToDisplayEvent(e: LiveSecurityEvent): SecurityEvent {
  return {
    id:           e.id,
    title:        e.message.slice(0, 80) + (e.message.length > 80 ? '…' : ''),
    description:  e.message,
    severity:     e.severity,
    // Map live event type to the closest existing EventCategory
    category: (() => {
      const map: Record<LiveSecurityEvent['eventType'], SecurityEvent['category']> = {
        failed_auth:         'intrusion_attempt',
        brute_force:         'brute_force',
        sql_injection:       'intrusion_attempt',
        xss_attempt:         'intrusion_attempt',
        suspicious_api:      'reconnaissance',
        port_scan:           'reconnaissance',
        unauthorized_access: 'intrusion_attempt',
        malware_alert:       'malware',
        data_exfiltration:   'data_exfiltration',
        privilege_escalation:'privilege_escalation',
      };
      return map[e.eventType];
    })(),
    status:       e.status,
    sourceIp:     e.source,
    destinationIp: e.endpoint,
    affectedHost: e.endpoint,
    timestamp:    e.timestamp,
    detectedBy:   'Live Monitor',
  };
}

interface DashboardPageProps {
  liveEvents:   LiveSecurityEvent[];
  kpis:         SecurityMetric[];
  trendData:    TrendDataPoint[];
  distribution: SeverityDistribution[];
  wsStatus:     WsStatus;
}

export default function DashboardPage({
  liveEvents,
  kpis,
  trendData,
  distribution,
  wsStatus,
}: DashboardPageProps) {
  // Use live trend data if we have any, otherwise fall back to Phase-1 mock
  const activeTrend = trendData.length > 0 ? trendData : mockTrendData;

  // Same for distribution
  const activeDist = liveEvents.length > 0 ? distribution : mockSeverityDistribution;

  // KPIs: use live if connected, else fall back to static mock
  const activeKpis = kpis;

  // Recent events: newest 8 live events mapped to display shape
  const recentEvents = liveEvents.slice(0, 8).map(mapLiveToDisplayEvent);

  const isLive = wsStatus === 'connected';

  return (
    <div className="space-y-6 p-5 lg:p-6">

      {/* ── Page heading ───────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Security Overview</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Simulated threat monitoring ·{' '}
            {wsStatus === 'connected'   && <span className="text-emerald-400">Live stream active</span>}
            {wsStatus === 'connecting'  && <span className="text-yellow-400">Connecting…</span>}
            {wsStatus === 'reconnecting'&& <span className="text-orange-400">Reconnecting…</span>}
            {wsStatus === 'disconnected'&& <span className="text-red-400">Disconnected</span>}
          </p>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border shrink-0 ${
          isLive
            ? 'bg-emerald-500/10 border-emerald-500/20'
            : 'bg-slate-800/60 border-slate-700'
        }`}>
          <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600'}`} aria-hidden="true" />
          <span className={`text-xs font-medium ${isLive ? 'text-emerald-400' : 'text-slate-500'}`}>
            {isLive ? 'Live' : 'Offline'}
          </span>
        </div>
      </div>

      {/* ── KPI cards ──────────────────────────────────────────────────── */}
      <section aria-label="Key performance indicators">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {activeKpis.map((metric, i) => (
            <KpiCard key={metric.label} metric={metric} icon={kpiIcons[i]} />
          ))}
        </div>
      </section>

      {/* ── Charts ─────────────────────────────────────────────────────── */}
      <section aria-label="Security charts" className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <EventTrendChart data={activeTrend} days={Math.min(activeTrend.length, 14) || 14} />
        </div>
        <div className="lg:col-span-1">
          <SeverityDonutChart distribution={activeDist} />
        </div>
      </section>

      {/* ── Recent events table ─────────────────────────────────────────── */}
      <section aria-label="Recent security events">
        {recentEvents.length > 0 ? (
          <RecentEventsTable events={recentEvents} />
        ) : (
          <div className="rounded-xl bg-[#0d1424] border border-slate-800 p-10 text-center">
            <p className="text-sm text-slate-600">
              Waiting for live events from the WebSocket server…
            </p>
          </div>
        )}
      </section>

      {/* ── Bottom row ──────────────────────────────────────────────────── */}
      <section aria-label="Vulnerability and alert summaries" className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <VulnerabilitySummary vulnerabilities={mockVulnerabilities} />
        <CriticalAlerts alerts={mockAlerts} />
      </section>
    </div>
  );
}
