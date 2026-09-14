/**
 * AnalyticsPage.tsx
 * -----------------
 * Threat analytics dashboard with five live-updating visualizations:
 *   1. Security events over time     (line chart — EventTrendChart)
 *   2. Events by severity            (doughnut — SeverityDonutChart)
 *   3. Events by attack type         (horizontal bar — AttackTypeChart)
 *   4. Most targeted endpoints       (horizontal bar — TopEndpointsChart)
 *   5. Top source IPs                (horizontal bar — TopSourcesChart)
 *
 * All data comes from the shared WebSocket stream via props.
 * NOTE: All events are SIMULATED demo data.
 */

import EventTrendChart   from '../components/charts/EventTrendChart';
import SeverityDonutChart from '../components/charts/SeverityDonutChart';
import AttackTypeChart   from '../components/charts/AttackTypeChart';
import TopEndpointsChart from '../components/charts/TopEndpointsChart';
import TopSourcesChart   from '../components/charts/TopSourcesChart';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

import type { TrendDataPoint, SeverityDistribution } from '../types/security';
import type { CountedItem, LiveSecurityEvent } from '../hooks/useSecurityEvents';
import type { WsStatus } from '../hooks/useWebSocket';
import { mockTrendData, mockSeverityDistribution } from '../data/mockData';

interface AnalyticsPageProps {
  liveEvents:       LiveSecurityEvent[];
  trendData:        TrendDataPoint[];
  distribution:     SeverityDistribution[];
  eventTypeCounts:  CountedItem[];
  topEndpoints:     CountedItem[];
  topSources:       CountedItem[];
  wsStatus:         WsStatus;
  onReconnect:      () => void;
}

/** Small stat bubble used in the summary row */
function StatBubble({ label, value, sub }: { label: string; value: number | string; sub?: string }) {
  return (
    <div className="flex flex-col items-center px-5 py-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
      <span className="text-2xl font-bold text-slate-100 tabular-nums">{value}</span>
      <span className="text-xs text-slate-400 mt-0.5">{label}</span>
      {sub && <span className="text-[10px] text-slate-600">{sub}</span>}
    </div>
  );
}

export default function AnalyticsPage({
  liveEvents,
  trendData,
  distribution,
  eventTypeCounts,
  topEndpoints,
  topSources,
  wsStatus,
  onReconnect,
}: AnalyticsPageProps) {
  const isLive       = wsStatus === 'connected';
  const hasData      = liveEvents.length > 0;
  const activeTrend  = hasData ? trendData  : mockTrendData;
  const activeDist   = hasData ? distribution : mockSeverityDistribution;

  // Quick stats for the summary row
  const critCount  = liveEvents.filter((e) => e.severity === 'critical').length;
  const highCount  = liveEvents.filter((e) => e.severity === 'high').length;
  const openCount  = liveEvents.filter((e) => e.status === 'open').length;
  const uniqueSrcs = new Set(liveEvents.map((e) => e.source)).size;

  return (
    <div className="space-y-6 p-5 lg:p-6">

      {/* ── Page heading ───────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Threat Analytics</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Simulated event analysis ·{' '}
            {isLive
              ? <span className="text-emerald-400">Live stream active</span>
              : <span className={wsStatus === 'connecting' ? 'text-yellow-400' : 'text-red-400'}>
                  {wsStatus === 'connecting' ? 'Connecting…' : 'Disconnected'}
                </span>
            }
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!isLive && (
            <button
              onClick={onReconnect}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-xs font-medium text-cyan-400 hover:bg-cyan-500/20 transition-colors"
            >
              <ArrowPathIcon className="w-3.5 h-3.5" />
              Reconnect
            </button>
          )}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${
            isLive ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-slate-800/60 border-slate-700'
          }`}>
            <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600'}`} />
            <span className={`text-xs font-medium ${isLive ? 'text-emerald-400' : 'text-slate-500'}`}>
              {isLive ? 'Live' : 'Offline'}
            </span>
          </div>
        </div>
      </div>

      {/* ── Summary stats row ──────────────────────────────────────────── */}
      <section aria-label="Analytics summary" className="flex flex-wrap gap-3">
        <StatBubble label="Total Events"    value={liveEvents.length} sub="in session" />
        <StatBubble label="Critical"        value={critCount} />
        <StatBubble label="High"            value={highCount} />
        <StatBubble label="Open"            value={openCount} />
        <StatBubble label="Unique Sources"  value={uniqueSrcs} sub="distinct IPs" />
        <StatBubble label="Event Types"     value={eventTypeCounts.length} sub="categories seen" />
      </section>

      {/* ── Row 1: Trend + Severity ─────────────────────────────────────── */}
      <section aria-label="Event trend and severity" className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <EventTrendChart
            data={activeTrend}
            days={Math.min(activeTrend.length, 14) || 14}
          />
        </div>
        <div className="lg:col-span-1">
          <SeverityDonutChart distribution={activeDist} />
        </div>
      </section>

      {/* ── Row 2: Attack type breakdown ────────────────────────────────── */}
      <section aria-label="Attack type distribution">
        <AttackTypeChart data={eventTypeCounts} />
      </section>

      {/* ── Row 3: Endpoints + Sources ──────────────────────────────────── */}
      <section aria-label="Top endpoints and sources" className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <TopEndpointsChart data={topEndpoints} />
        <TopSourcesChart   data={topSources}   />
      </section>

      {/* ── Data note ───────────────────────────────────────────────────── */}
      <p className="text-[11px] text-slate-700 text-center pb-2">
        All events shown are simulated for demonstration purposes and do not represent real security incidents.
      </p>
    </div>
  );
}
