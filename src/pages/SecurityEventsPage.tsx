/**
 * SecurityEventsPage.tsx
 * ----------------------
 * Displays the full live security event log received over WebSocket.
 * Events arrive newest-first, capped at 200 by the hook.
 *
 * NOTE: All events shown here are SIMULATED for demonstration purposes.
 */

import { useState } from 'react';
import type { LiveSecurityEvent, LiveSeverity } from '../hooks/useSecurityEvents';
import SeverityBadge from '../components/dashboard/SeverityBadge';
import type { ThreatSeverity } from '../types/security';
import { formatRelativeTime } from '../utils/severity';
import { FunnelIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

interface SecurityEventsPageProps {
  events: LiveSecurityEvent[];
  /** Called when the user wants to reconnect */
  onReconnect: () => void;
  isConnected: boolean;
}

const EVENT_TYPE_LABELS: Record<LiveSecurityEvent['eventType'], string> = {
  failed_auth:        'Failed Auth',
  brute_force:        'Brute Force',
  sql_injection:      'SQL Injection',
  xss_attempt:        'XSS Attempt',
  suspicious_api:     'Suspicious API',
  port_scan:          'Port Scan',
  unauthorized_access:'Unauth Access',
  malware_alert:      'Malware',
  data_exfiltration:  'Data Exfil',
  privilege_escalation:'Priv Escalation',
};

const STATUS_CLASSES: Record<LiveSecurityEvent['status'], string> = {
  open:          'text-red-400 bg-red-500/10 border-red-500/30',
  investigating: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
  resolved:      'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
};

const ALL_SEVERITIES: LiveSeverity[] = [
  'critical', 'high', 'medium', 'low', 'informational',
];

export default function SecurityEventsPage({
  events,
  onReconnect,
  isConnected,
}: SecurityEventsPageProps) {
  const [severityFilter, setSeverityFilter] = useState<LiveSeverity | 'all'>('all');

  const filtered = severityFilter === 'all'
    ? events
    : events.filter((e) => e.severity === severityFilter);

  return (
    <div className="space-y-5 p-5 lg:p-6">

      {/* ── Page heading ─────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Security Events</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Simulated live event stream ·{' '}
            <span className="text-amber-500 font-medium">
              These events are simulated — not real attacks
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 tabular-nums">
            {filtered.length} / {events.length} events
          </span>
          {!isConnected && (
            <button
              onClick={onReconnect}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-xs font-medium text-cyan-400 hover:bg-cyan-500/20 transition-colors"
            >
              <ArrowPathIcon className="w-3.5 h-3.5" />
              Reconnect
            </button>
          )}
        </div>
      </div>

      {/* ── Severity filter pills ─────────────────────────────────────── */}
      <div className="flex items-center gap-2 flex-wrap">
        <FunnelIcon className="w-4 h-4 text-slate-600 shrink-0" />
        <button
          onClick={() => setSeverityFilter('all')}
          className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
            severityFilter === 'all'
              ? 'bg-slate-700 border-slate-600 text-slate-100'
              : 'bg-transparent border-slate-700 text-slate-500 hover:text-slate-300'
          }`}
        >
          All
        </button>
        {ALL_SEVERITIES.map((sev) => {
          const count = events.filter((e) => e.severity === sev).length;
          return (
            <button
              key={sev}
              onClick={() => setSeverityFilter(sev)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                severityFilter === sev
                  ? 'bg-slate-700 border-slate-600 text-slate-100'
                  : 'bg-transparent border-slate-700 text-slate-500 hover:text-slate-300'
              }`}
            >
              {sev.charAt(0).toUpperCase() + sev.slice(1)}{' '}
              <span className="opacity-60">({count})</span>
            </button>
          );
        })}
      </div>

      {/* ── Event table ──────────────────────────────────────────────── */}
      <div className="rounded-xl bg-[#0d1424] border border-slate-800 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-600">
            <p className="text-sm">
              {events.length === 0
                ? 'Waiting for events from the WebSocket server…'
                : 'No events match the selected filter.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table
              className="w-full text-sm"
              role="table"
              aria-label="Live security events"
            >
              <thead>
                <tr className="border-b border-slate-800/60">
                  {['ID', 'Severity', 'Type', 'Message', 'Source', 'Endpoint', 'Status', 'Time'].map(
                    (col) => (
                      <th
                        key={col}
                        scope="col"
                        className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-600 whitespace-nowrap"
                      >
                        {col}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {filtered.map((event) => (
                  <tr
                    key={event.id}
                    className="hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-4 py-3 font-mono text-[10px] text-slate-600 whitespace-nowrap">
                      {event.id.slice(-10)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <SeverityBadge severity={event.severity as ThreatSeverity} />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-xs text-slate-400">
                        {EVENT_TYPE_LABELS[event.eventType]}
                      </span>
                    </td>
                    <td className="px-4 py-3 max-w-sm">
                      <p
                        className="text-xs text-slate-300 leading-snug line-clamp-2"
                        title={event.message}
                      >
                        {event.message}
                      </p>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="font-mono text-xs text-slate-500">
                        {event.source}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="font-mono text-xs text-slate-500">
                        {event.endpoint}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${STATUS_CLASSES[event.status]}`}
                      >
                        {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-500">
                      {formatRelativeTime(event.timestamp)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
