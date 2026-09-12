import type { SecurityEvent } from '../../types/security';
import SeverityBadge from './SeverityBadge';
import { formatRelativeTime } from '../../utils/severity';

interface RecentEventsTableProps {
  events: SecurityEvent[];
}

const statusClasses: Record<SecurityEvent['status'], string> = {
  open:           'text-red-400 bg-red-500/10 border-red-500/30',
  investigating:  'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
  resolved:       'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  false_positive: 'text-slate-400 bg-slate-500/10 border-slate-500/30',
};

const statusLabels: Record<SecurityEvent['status'], string> = {
  open:           'Open',
  investigating:  'Investigating',
  resolved:       'Resolved',
  false_positive: 'False Positive',
};

export default function RecentEventsTable({ events }: RecentEventsTableProps) {
  return (
    <div className="rounded-xl bg-[#0d1424] border border-slate-800 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
        <h2 className="text-sm font-semibold text-slate-200">Recent Security Events</h2>
        <span className="text-xs text-slate-500">{events.length} events shown</span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm" role="table" aria-label="Recent security events">
          <thead>
            <tr className="border-b border-slate-800/60">
              {['Event ID', 'Title', 'Severity', 'Category', 'Affected Host', 'Status', 'Time'].map((col) => (
                <th
                  key={col}
                  scope="col"
                  className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-600 whitespace-nowrap"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/40">
            {events.map((event) => (
              <tr
                key={event.id}
                className="hover:bg-white/[0.02] transition-colors"
              >
                <td className="px-4 py-3 font-mono text-xs text-slate-500 whitespace-nowrap">
                  {event.id}
                </td>
                <td className="px-4 py-3 max-w-xs">
                  <p className="text-slate-200 font-medium text-xs leading-snug truncate" title={event.title}>
                    {event.title}
                  </p>
                  {event.mitreTechnique && (
                    <p className="text-slate-600 text-[10px] mt-0.5 truncate">{event.mitreTechnique}</p>
                  )}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <SeverityBadge severity={event.severity} />
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="text-xs text-slate-400 capitalize">
                    {event.category.replace(/_/g, ' ')}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="font-mono text-xs text-slate-400">{event.affectedHost}</span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${statusClasses[event.status]}`}
                  >
                    {statusLabels[event.status]}
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
    </div>
  );
}
