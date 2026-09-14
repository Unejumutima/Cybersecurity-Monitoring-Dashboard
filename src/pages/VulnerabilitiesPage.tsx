/**
 * VulnerabilitiesPage.tsx
 * -----------------------
 * Displays vulnerability data fetched from the REST API.
 * Features:
 *   - KPI cards (total, critical, high, medium, low)
 *   - Severity + status filter bar
 *   - Sortable vulnerability table
 *   - Expandable row with full description, CVSS, component, remediation
 *   - Loading / error / empty states
 */

import { useState, useMemo } from 'react';
import {
  useVulnerabilities,
  type ApiVulnerability,
  type VulnSeverity,
  type VulnStatus,
} from '../hooks/useVulnerabilities';
import {
  BugAntIcon,
  FunnelIcon,
  ArrowPathIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

// ─── Severity / status styling maps ──────────────────────────────────────────

const SEV_BADGE: Record<VulnSeverity, string> = {
  critical:      'bg-red-500/20 text-red-400 border border-red-500/40',
  high:          'bg-orange-500/20 text-orange-400 border border-orange-500/40',
  medium:        'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40',
  low:           'bg-blue-500/20 text-blue-400 border border-blue-500/40',
  informational: 'bg-slate-500/20 text-slate-400 border border-slate-500/40',
};

const SEV_BAR: Record<VulnSeverity, string> = {
  critical: 'bg-red-500', high: 'bg-orange-500',
  medium: 'bg-yellow-500', low: 'bg-blue-500', informational: 'bg-slate-400',
};

const STATUS_BADGE: Record<VulnStatus, string> = {
  open:           'text-red-400 bg-red-500/10 border-red-500/30',
  in_remediation: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
  resolved:       'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  accepted_risk:  'text-slate-400 bg-slate-500/10 border-slate-500/30',
};

const STATUS_LABELS: Record<VulnStatus, string> = {
  open: 'Open', in_remediation: 'In Remediation',
  resolved: 'Resolved', accepted_risk: 'Accepted Risk',
};

// CVSS score colour thresholds
function cvssColor(score: number): string {
  if (score >= 9.0) return 'text-red-400';
  if (score >= 7.0) return 'text-orange-400';
  if (score >= 4.0) return 'text-yellow-400';
  return 'text-blue-400';
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function KpiTile({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex-1 min-w-[120px] rounded-xl bg-[#0d1424] border border-slate-800 px-5 py-4">
      <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-3xl font-bold tabular-nums ${color}`}>{value}</p>
    </div>
  );
}

function SeverityBadge({ severity }: { severity: VulnSeverity }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wide ${SEV_BADGE[severity]}`}>
      {severity}
    </span>
  );
}

interface ExpandedRowProps { vuln: ApiVulnerability }
function ExpandedRow({ vuln }: ExpandedRowProps) {
  return (
    <tr>
      <td colSpan={7} className="px-0 pb-0 pt-0">
        <div className="mx-4 mb-3 rounded-lg bg-slate-900/60 border border-slate-700/50 p-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Left column */}
          <div className="space-y-3">
            <div>
              <p className="text-slate-500 uppercase tracking-wider text-[10px] mb-1">Description</p>
              <p className="text-slate-300 leading-relaxed">{vuln.description}</p>
            </div>
            {vuln.owaspCategory && (
              <div>
                <p className="text-slate-500 uppercase tracking-wider text-[10px] mb-1">OWASP Category</p>
                <span className="px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[11px] font-mono">
                  {vuln.owaspCategory}
                </span>
              </div>
            )}
          </div>
          {/* Right column */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-slate-500 uppercase tracking-wider text-[10px] mb-1">CVSS Score</p>
                <p className={`text-xl font-bold tabular-nums ${cvssColor(vuln.cvssScore)}`}>
                  {vuln.cvssScore.toFixed(1)}
                  <span className="text-xs text-slate-600 font-normal"> / 10</span>
                </p>
              </div>
              <div>
                <p className="text-slate-500 uppercase tracking-wider text-[10px] mb-1">Affected Component</p>
                <p className="text-slate-300 font-mono text-[11px] break-all">{vuln.affectedComponent}</p>
              </div>
            </div>
            <div>
              <p className="text-slate-500 uppercase tracking-wider text-[10px] mb-1">Recommended Remediation</p>
              <p className="text-slate-300 leading-relaxed">{vuln.remediationSteps}</p>
            </div>
          </div>
        </div>
      </td>
    </tr>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

const ALL_SEVERITIES: VulnSeverity[] = ['critical', 'high', 'medium', 'low', 'informational'];
const ALL_STATUSES: VulnStatus[]     = ['open', 'in_remediation', 'resolved', 'accepted_risk'];

export default function VulnerabilitiesPage() {
  const { vulnerabilities, summary, loadState, error, note, refetch } = useVulnerabilities();

  const [severityFilter, setSeverityFilter] = useState<VulnSeverity | 'all'>('all');
  const [statusFilter,   setStatusFilter]   = useState<VulnStatus   | 'all'>('all');
  const [expandedId,     setExpandedId]     = useState<string | null>(null);

  const filtered = useMemo(() => {
    return vulnerabilities
      .filter((v) => severityFilter === 'all' || v.severity === severityFilter)
      .filter((v) => statusFilter   === 'all' || v.status   === statusFilter);
  }, [vulnerabilities, severityFilter, statusFilter]);

  function toggleExpand(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  // ── Loading state ─────────────────────────────────────────────────────────
  if (loadState === 'loading' || loadState === 'idle') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-500">Loading vulnerability data…</p>
      </div>
    );
  }

  // ── Error state ───────────────────────────────────────────────────────────
  if (loadState === 'error') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-8 text-center">
        <ExclamationTriangleIcon className="w-10 h-10 text-red-400" />
        <p className="text-sm text-slate-300 max-w-md">{error}</p>
        <button
          onClick={refetch}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-sm font-medium text-cyan-400 hover:bg-cyan-500/20 transition-colors"
        >
          <ArrowPathIcon className="w-4 h-4" />
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5 p-5 lg:p-6">

      {/* ── Page heading ────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Vulnerabilities</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Vulnerability tracking ·{' '}
            <span className="text-amber-500 font-medium">Demo data — not real vulnerability advisories</span>
          </p>
        </div>
        <button
          onClick={refetch}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ArrowPathIcon className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {/* ── KPI row ─────────────────────────────────────────────────────── */}
      {summary && (
        <section aria-label="Vulnerability counts" className="flex flex-wrap gap-3">
          <KpiTile label="Total"    value={summary.total}                  color="text-slate-100" />
          <KpiTile label="Critical" value={summary.bySeverity.critical}    color="text-red-400" />
          <KpiTile label="High"     value={summary.bySeverity.high}        color="text-orange-400" />
          <KpiTile label="Medium"   value={summary.bySeverity.medium}      color="text-yellow-400" />
          <KpiTile label="Low"      value={summary.bySeverity.low}         color="text-blue-400" />
        </section>
      )}

      {/* ── Severity bar visual ─────────────────────────────────────────── */}
      {summary && summary.total > 0 && (
        <div className="flex h-2 rounded-full overflow-hidden gap-0.5" aria-label="Severity distribution bar" role="img">
          {ALL_SEVERITIES.map((sev) => {
            const count = summary.bySeverity[sev];
            if (count === 0) return null;
            return (
              <div
                key={sev}
                className={SEV_BAR[sev]}
                style={{ width: `${(count / summary.total) * 100}%` }}
                title={`${sev}: ${count}`}
              />
            );
          })}
        </div>
      )}

      {/* ── Filter bar ──────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-4 items-center">
        {/* Severity filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <FunnelIcon className="w-4 h-4 text-slate-600 shrink-0" />
          <span className="text-xs text-slate-600">Severity:</span>
          {(['all', ...ALL_SEVERITIES] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSeverityFilter(s)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                severityFilter === s
                  ? 'bg-slate-700 border-slate-500 text-slate-100'
                  : 'bg-transparent border-slate-700 text-slate-500 hover:text-slate-300'
              }`}
            >
              {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        {/* Status filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-600">Status:</span>
          {(['all', ...ALL_STATUSES] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                statusFilter === s
                  ? 'bg-slate-700 border-slate-500 text-slate-100'
                  : 'bg-transparent border-slate-700 text-slate-500 hover:text-slate-300'
              }`}
            >
              {s === 'all' ? 'All' : STATUS_LABELS[s]}
            </button>
          ))}
        </div>

        <span className="ml-auto text-xs text-slate-600 tabular-nums">
          {filtered.length} of {vulnerabilities.length}
        </span>
      </div>

      {/* ── Table ───────────────────────────────────────────────────────── */}
      <div className="rounded-xl bg-[#0d1424] border border-slate-800 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-600">
            <BugAntIcon className="w-8 h-8" />
            <p className="text-sm">No vulnerabilities match the selected filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" role="table" aria-label="Vulnerability list">
              <thead>
                <tr className="border-b border-slate-800/60">
                  {/* expand toggle */}
                  <th className="w-8" />
                  {['ID', 'Title', 'Severity', 'CVSS', 'Affected Asset', 'Status', 'Discovered'].map((col) => (
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
              <tbody>
                {filtered.map((vuln) => {
                  const isExpanded = expandedId === vuln.id;
                  return (
                    <>
                      <tr
                        key={vuln.id}
                        className={`border-b border-slate-800/40 cursor-pointer transition-colors ${
                          isExpanded ? 'bg-slate-800/30' : 'hover:bg-white/[0.02]'
                        }`}
                        onClick={() => toggleExpand(vuln.id)}
                        aria-expanded={isExpanded}
                      >
                        {/* Expand chevron */}
                        <td className="pl-4 pr-0">
                          {isExpanded
                            ? <ChevronDownIcon  className="w-3.5 h-3.5 text-slate-500" />
                            : <ChevronRightIcon className="w-3.5 h-3.5 text-slate-600" />
                          }
                        </td>

                        <td className="px-4 py-3 whitespace-nowrap">
                          <div>
                            <span className="font-mono text-[10px] text-slate-600">{vuln.id}</span>
                            {vuln.cveId && (
                              <span className="block font-mono text-[10px] text-cyan-700">{vuln.cveId}</span>
                            )}
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          <p className="text-xs font-medium text-slate-200 leading-snug max-w-xs truncate" title={vuln.title}>
                            {vuln.title}
                          </p>
                        </td>

                        <td className="px-4 py-3 whitespace-nowrap">
                          <SeverityBadge severity={vuln.severity} />
                        </td>

                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`text-sm font-bold tabular-nums ${cvssColor(vuln.cvssScore)}`}>
                            {vuln.cvssScore.toFixed(1)}
                          </span>
                        </td>

                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="font-mono text-xs text-slate-400">{vuln.affectedAsset}</span>
                        </td>

                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${STATUS_BADGE[vuln.status]}`}>
                            {STATUS_LABELS[vuln.status]}
                          </span>
                        </td>

                        <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-500">
                          {new Date(vuln.discoveredAt).toLocaleDateString('en-US', {
                            month: 'short', day: 'numeric', year: 'numeric',
                          })}
                        </td>
                      </tr>

                      {/* Expandable detail row */}
                      {isExpanded && <ExpandedRow key={`${vuln.id}-detail`} vuln={vuln} />}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Demo data note ──────────────────────────────────────────────── */}
      <p className="text-[11px] text-slate-700 text-center">{note}</p>
    </div>
  );
}
