import type { ThreatSeverity } from '../../types/security';
import { severityBadgeClasses, formatSeverityLabel } from '../../utils/severity';

interface SeverityBadgeProps {
  severity: ThreatSeverity;
  /** Use 'dot' to show a coloured dot instead of a text badge */
  variant?: 'badge' | 'dot';
}

export default function SeverityBadge({ severity, variant = 'badge' }: SeverityBadgeProps) {
  if (variant === 'dot') {
    const dotColors: Record<ThreatSeverity, string> = {
      critical:      'bg-red-500',
      high:          'bg-orange-500',
      medium:        'bg-yellow-500',
      low:           'bg-blue-500',
      informational: 'bg-slate-400',
    };
    return (
      <span
        className={`inline-block w-2 h-2 rounded-full shrink-0 ${dotColors[severity]}`}
        title={formatSeverityLabel(severity)}
        aria-label={formatSeverityLabel(severity)}
      />
    );
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wide ${severityBadgeClasses[severity]}`}
    >
      {formatSeverityLabel(severity)}
    </span>
  );
}
