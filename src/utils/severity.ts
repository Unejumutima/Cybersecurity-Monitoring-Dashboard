import type { ThreatSeverity } from '../types/security';

// ─── Tailwind class helpers keyed by severity ─────────────────────────────────
// These return static class strings so Tailwind can include them in the build.

export const severityBadgeClasses: Record<ThreatSeverity, string> = {
  critical:      'bg-red-500/20 text-red-400 border border-red-500/40',
  high:          'bg-orange-500/20 text-orange-400 border border-orange-500/40',
  medium:        'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40',
  low:           'bg-blue-500/20 text-blue-400 border border-blue-500/40',
  informational: 'bg-slate-500/20 text-slate-400 border border-slate-500/40',
};

export const severityDotClasses: Record<ThreatSeverity, string> = {
  critical:      'bg-red-500',
  high:          'bg-orange-500',
  medium:        'bg-yellow-500',
  low:           'bg-blue-500',
  informational: 'bg-slate-400',
};

export const severityTextClasses: Record<ThreatSeverity, string> = {
  critical:      'text-red-400',
  high:          'text-orange-400',
  medium:        'text-yellow-400',
  low:           'text-blue-400',
  informational: 'text-slate-400',
};

/** Hex colours used by Chart.js (cannot use Tailwind classes there) */
export const severityChartColors: Record<ThreatSeverity, string> = {
  critical:      '#f87171', // red-400
  high:          '#fb923c', // orange-400
  medium:        '#facc15', // yellow-400
  low:           '#60a5fa', // blue-400
  informational: '#94a3b8', // slate-400
};

export const severityChartBgColors: Record<ThreatSeverity, string> = {
  critical:      'rgba(248, 113, 113, 0.15)',
  high:          'rgba(251, 146, 60,  0.15)',
  medium:        'rgba(250, 204, 21,  0.15)',
  low:           'rgba(96,  165, 250, 0.15)',
  informational: 'rgba(148, 163, 184, 0.15)',
};

export function formatSeverityLabel(s: ThreatSeverity): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('en-US', {
    month: 'short',
    day:   'numeric',
    hour:  '2-digit',
    minute:'2-digit',
    hour12: true,
  });
}

export function formatRelativeTime(iso: string): string {
  const now  = new Date(); // real current time
  const then = new Date(iso);
  const diffMs  = now.getTime() - then.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1)   return 'Just now';
  if (diffMin < 60)  return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr  < 24)  return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}
