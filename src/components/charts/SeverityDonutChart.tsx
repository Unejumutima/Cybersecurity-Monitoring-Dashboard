import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  type ChartOptions,
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import type { SeverityDistribution } from '../../types/security';
import { severityChartColors, formatSeverityLabel } from '../../utils/severity';

ChartJS.register(ArcElement, Tooltip, Legend);

interface SeverityDonutChartProps {
  distribution: SeverityDistribution[];
}

export default function SeverityDonutChart({ distribution }: SeverityDonutChartProps) {
  const labels = distribution.map((d) => formatSeverityLabel(d.severity));
  const counts = distribution.map((d) => d.count);
  const colors = distribution.map((d) => severityChartColors[d.severity]);
  const total  = counts.reduce((a, b) => a + b, 0);

  const chartData = {
    labels,
    datasets: [
      {
        data: counts,
        backgroundColor: colors.map((c) => `${c}30`), // dim fill
        borderColor:     colors,
        borderWidth: 2,
        hoverBackgroundColor: colors.map((c) => `${c}55`),
        hoverBorderWidth: 2,
      },
    ],
  };

  const options: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: {
      legend: {
        display: false, // We render our own legend below for better styling
      },
      tooltip: {
        backgroundColor: '#0f1629',
        borderColor: '#1e2d4d',
        borderWidth: 1,
        titleColor: '#e2e8f0',
        bodyColor: '#94a3b8',
        padding: 12,
        callbacks: {
          label: (ctx) => {
            const pct = distribution[ctx.dataIndex]?.percentage.toFixed(1);
            return `  ${ctx.label}: ${ctx.parsed} (${pct}%)`;
          },
        },
      },
    },
  };

  return (
    <div className="rounded-xl bg-[#0d1424] border border-slate-800 p-5">
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-slate-200">Threat Severity Distribution</h2>
        <p className="text-xs text-slate-600 mt-0.5">Today · {total} total events</p>
      </div>

      {/* Donut + centre label */}
      <div className="relative h-44 flex items-center justify-center">
        <Doughnut
          data={chartData}
          options={options}
          aria-label="Threat severity distribution doughnut chart"
        />
        {/* Centre overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
          <span className="text-2xl font-bold text-slate-100 tabular-nums">{total}</span>
          <span className="text-[10px] text-slate-600 uppercase tracking-wider">Events</span>
        </div>
      </div>

      {/* Custom legend */}
      <ul className="mt-4 space-y-2" role="list" aria-label="Severity legend">
        {distribution.map((d) => (
          <li key={d.severity} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-sm shrink-0"
                style={{ backgroundColor: severityChartColors[d.severity] }}
                aria-hidden="true"
              />
              <span className="text-xs text-slate-400">{formatSeverityLabel(d.severity)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-300 tabular-nums">{d.count}</span>
              <span className="text-[10px] text-slate-600 tabular-nums w-10 text-right">
                {d.percentage.toFixed(1)}%
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
