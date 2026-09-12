import type { SecurityMetric } from '../../types/security';
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon, MinusIcon } from '@heroicons/react/24/solid';

interface KpiCardProps {
  metric: SecurityMetric;
  icon: React.ReactNode;
}

export default function KpiCard({ metric, icon }: KpiCardProps) {
  const { label, value, previousValue, unit, trend, trendIsPositive } = metric;

  const delta    = value - previousValue;
  const deltaAbs = Math.abs(delta);
  const deltaPct = previousValue > 0
    ? Math.round((deltaAbs / previousValue) * 100)
    : 0;

  const trendColor = trendIsPositive ? 'text-emerald-400' : 'text-red-400';
  const trendBg    = trendIsPositive ? 'bg-emerald-500/10' : 'bg-red-500/10';

  const TrendIcon =
    trend === 'up'     ? ArrowTrendingUpIcon :
    trend === 'down'   ? ArrowTrendingDownIcon :
                         MinusIcon;

  return (
    <div className="relative overflow-hidden rounded-xl bg-[#0d1424] border border-slate-800 p-5 flex flex-col gap-4">
      {/* Top row */}
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{label}</p>
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-slate-800/80 border border-slate-700/50 shrink-0">
          {icon}
        </div>
      </div>

      {/* Value */}
      <div className="flex items-end gap-3">
        <span className="text-3xl font-bold text-slate-100 leading-none tabular-nums">
          {value.toLocaleString()}
        </span>
        {unit && <span className="text-lg font-semibold text-slate-400 leading-tight">{unit}</span>}
      </div>

      {/* Trend */}
      <div className="flex items-center gap-1.5">
        <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium ${trendColor} ${trendBg}`}>
          <TrendIcon className="w-3.5 h-3.5" aria-hidden="true" />
          {deltaPct}%
        </span>
        <span className="text-xs text-slate-600">vs last period</span>
      </div>

      {/* Subtle corner accent */}
      <div
        className="absolute -bottom-4 -right-4 w-20 h-20 rounded-full opacity-5 blur-xl"
        style={{ background: trendIsPositive ? '#10b981' : '#ef4444' }}
        aria-hidden="true"
      />
    </div>
  );
}
