import type { Alert } from '../../types/security';
import SeverityBadge from './SeverityBadge';
import { formatRelativeTime, severityDotClasses } from '../../utils/severity';
import { BellAlertIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

interface CriticalAlertsProps {
  alerts: Alert[];
}

export default function CriticalAlerts({ alerts }: CriticalAlertsProps) {
  const unacked = alerts.filter((a) => !a.acknowledged);
  const acked   = alerts.filter((a) =>  a.acknowledged);
  const ordered = [...unacked, ...acked];

  return (
    <div className="rounded-xl bg-[#0d1424] border border-slate-800 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <BellAlertIcon className="w-4 h-4 text-red-400" />
          <h2 className="text-sm font-semibold text-slate-200">Critical Alerts</h2>
        </div>
        {unacked.length > 0 && (
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-500/15 border border-red-500/30 text-[11px] font-medium text-red-400">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            {unacked.length} unacknowledged
          </span>
        )}
      </div>

      {/* List */}
      <ul className="divide-y divide-slate-800/40" role="list" aria-label="Critical alerts list">
        {ordered.map((alert) => (
          <li
            key={alert.id}
            className={`flex items-start gap-3 px-5 py-3.5 ${alert.acknowledged ? 'opacity-50' : ''}`}
          >
            {/* Severity dot */}
            <span
              className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${severityDotClasses[alert.severity]} ${!alert.acknowledged && alert.severity === 'critical' ? 'animate-pulse' : ''}`}
              aria-hidden="true"
            />

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <p className={`text-xs font-medium leading-snug ${alert.acknowledged ? 'text-slate-500' : 'text-slate-200'}`}>
                  {alert.title}
                </p>
                {alert.acknowledged && (
                  <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" aria-label="Acknowledged" />
                )}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <SeverityBadge severity={alert.severity} />
                <span className="text-[10px] text-slate-600">{alert.source}</span>
                <span className="text-[10px] text-slate-600">·</span>
                <span className="text-[10px] text-slate-600">{formatRelativeTime(alert.timestamp)}</span>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
