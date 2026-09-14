/**
 * OWASPPage.tsx
 * -------------
 * OWASP Top 10 Security Posture Dashboard
 * Features:
 *   - Overall posture score + band counts
 *   - Radar chart of all 10 category scores
 *   - Category grid with scores, bands, open vulnerabilities
 *   - Detail panel showing full description, improvements, linked vulnerabilities
 *   - Loading / error / empty states
 */

import { useState } from 'react';
import {
  useOwasp,
  type OWASPCategory,
  type PostureBand,
} from '../hooks/useOwasp';
import OWASPRadarChart from '../components/charts/OWASPRadarChart';
import {
  ShieldCheckIcon,
  ShieldExclamationIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  ChevronRightIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

// ─── Posture band styling ─────────────────────────────────────────────────────

const BAND_BADGE: Record<PostureBand, string> = {
  good:              'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40',
  needs_improvement: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40',
  high_risk:         'bg-red-500/20 text-red-400 border border-red-500/40',
};

const BAND_LABELS: Record<PostureBand, string> = {
  good: 'Good', needs_improvement: 'Needs Improvement', high_risk: 'High Risk',
};

function bandColor(band: PostureBand): string {
  if (band === 'good') return 'text-emerald-400';
  if (band === 'needs_improvement') return 'text-yellow-400';
  return 'text-red-400';
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

function PostureBadge({ band }: { band: PostureBand }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wide ${BAND_BADGE[band]}`}>
      {BAND_LABELS[band]}
    </span>
  );
}

interface CategoryCardProps {
  category: OWASPCategory;
  onClick: () => void;
}
function CategoryCard({ category, onClick }: CategoryCardProps) {
  const { id, name, score, postureBand, openVulnCount } = category;
  const Icon = postureBand === 'good' ? ShieldCheckIcon : ShieldExclamationIcon;

  return (
    <button
      onClick={onClick}
      className="group relative w-full rounded-xl bg-[#0d1424] border border-slate-800 hover:border-cyan-500/50 transition-all p-5 text-left focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
    >
      {/* Header: ID + Badge */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <Icon className={`w-5 h-5 shrink-0 ${bandColor(postureBand)}`} />
          <span className="font-mono text-sm font-bold text-slate-200">{id}</span>
        </div>
        <PostureBadge band={postureBand} />
      </div>

      {/* Name */}
      <h3 className="text-sm font-semibold text-slate-100 mb-2 group-hover:text-cyan-400 transition-colors">
        {name}
      </h3>

      {/* Score + vulnerability count */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[10px] text-slate-600 uppercase tracking-wider mb-0.5">Score</p>
          <p className={`text-2xl font-bold tabular-nums ${bandColor(postureBand)}`}>
            {score.toFixed(0)}
            <span className="text-xs text-slate-600 font-normal">/100</span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-slate-600 uppercase tracking-wider mb-0.5">Open Vulns</p>
          <p className="text-lg font-bold text-slate-400 tabular-nums">{openVulnCount}</p>
        </div>
      </div>

      {/* Arrow icon hint */}
      <ChevronRightIcon className="absolute bottom-5 right-5 w-4 h-4 text-slate-700 group-hover:text-cyan-500 transition-colors" />
    </button>
  );
}

interface DetailPanelProps {
  category: OWASPCategory;
  onClose: () => void;
}
function DetailPanel({ category, onClose }: DetailPanelProps) {
  const { id, name, fullDescription, score, postureBand, openVulnCount, resolvedVulnCount, linkedEventTypes, improvements } = category;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-[#0d1424] border border-slate-700 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[#0d1424] border-b border-slate-800 px-6 py-4 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-sm font-bold text-cyan-400">{id}</span>
              <PostureBadge band={postureBand} />
            </div>
            <h2 className="text-xl font-bold text-slate-100">{name}</h2>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 p-1.5 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-slate-300 transition-colors"
            aria-label="Close detail panel"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-6">
          {/* Score + vulnerability counts */}
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[140px] rounded-lg bg-slate-900/60 border border-slate-700/50 px-4 py-3">
              <p className="text-[10px] text-slate-600 uppercase tracking-wider mb-1">Security Score</p>
              <p className={`text-3xl font-bold tabular-nums ${bandColor(postureBand)}`}>
                {score.toFixed(0)}
                <span className="text-base text-slate-600 font-normal">/100</span>
              </p>
            </div>
            <div className="flex-1 min-w-[140px] rounded-lg bg-slate-900/60 border border-slate-700/50 px-4 py-3">
              <p className="text-[10px] text-slate-600 uppercase tracking-wider mb-1">Open Vulnerabilities</p>
              <p className="text-3xl font-bold text-red-400 tabular-nums">{openVulnCount}</p>
            </div>
            <div className="flex-1 min-w-[140px] rounded-lg bg-slate-900/60 border border-slate-700/50 px-4 py-3">
              <p className="text-[10px] text-slate-600 uppercase tracking-wider mb-1">Resolved</p>
              <p className="text-3xl font-bold text-emerald-400 tabular-nums">{resolvedVulnCount}</p>
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-2">Description</h3>
            <p className="text-sm text-slate-400 leading-relaxed">{fullDescription}</p>
          </div>

          {/* Linked event types */}
          {linkedEventTypes.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Related Security Event Types
              </h3>
              <div className="flex flex-wrap gap-2">
                {linkedEventTypes.map((evt: string) => (
                  <span
                    key={evt}
                    className="px-2.5 py-1 rounded-md bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-mono"
                  >
                    {evt}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Improvements */}
          {improvements.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Recommended Security Improvements
              </h3>
              <ul className="space-y-2" role="list">
                {improvements.map((imp: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-400">
                    <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-cyan-500 mt-1.5" aria-hidden="true" />
                    <span>{imp}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function OWASPPage() {
  const { categories, overallScore, overallBand, bandCounts, loadState, error, note, refetch } = useOwasp();
  const [selectedCategory, setSelectedCategory] = useState<OWASPCategory | null>(null);

  // ── Loading state ─────────────────────────────────────────────────────────
  if (loadState === 'loading' || loadState === 'idle') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-500">Loading OWASP posture data…</p>
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
    <>
      <div className="space-y-5 p-5 lg:p-6">

        {/* ── Page heading ────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl font-bold text-slate-100">OWASP Top 10 Security Posture</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Security posture tracking ·{' '}
              <span className="text-amber-500 font-medium">Demo data — not a formal OWASP certification or audit</span>
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

        {/* ── Overall posture KPIs ────────────────────────────────────────── */}
        <section aria-label="Overall posture metrics" className="flex flex-wrap gap-3">
          <KpiTile
            label="Overall Score"
            value={Math.round(overallScore)}
            color={bandColor(overallBand)}
          />
          <KpiTile
            label="Good"
            value={bandCounts.good}
            color="text-emerald-400"
          />
          <KpiTile
            label="Needs Improvement"
            value={bandCounts.needs_improvement}
            color="text-yellow-400"
          />
          <KpiTile
            label="High Risk"
            value={bandCounts.high_risk}
            color="text-red-400"
          />
        </section>

        {/* ── Radar chart ─────────────────────────────────────────────────── */}
        <OWASPRadarChart categories={categories} overallScore={overallScore} />

        {/* ── Category grid ───────────────────────────────────────────────── */}
        <div>
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">
            OWASP Top 10 Categories
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {categories.map((cat: OWASPCategory) => (
              <CategoryCard key={cat.id} category={cat} onClick={() => setSelectedCategory(cat)} />
            ))}
          </div>
        </div>

        {/* ── Demo data note ──────────────────────────────────────────────── */}
        <p className="text-[11px] text-slate-700 text-center">{note}</p>
      </div>

      {/* ── Detail panel modal ──────────────────────────────────────────────── */}
      {selectedCategory && (
        <DetailPanel category={selectedCategory} onClose={() => setSelectedCategory(null)} />
      )}
    </>
  );
}
