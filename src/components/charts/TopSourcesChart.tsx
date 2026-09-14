/**
 * TopSourcesChart.tsx
 * --------------------
 * Horizontal bar chart of the most frequent attacker source IPs.
 * Labelled plainly so non-security stakeholders understand it as
 * "where are the attacks coming from?".
 */
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  type ChartOptions,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import type { CountedItem } from '../../hooks/useSecurityEvents';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

interface TopSourcesChartProps {
  data: CountedItem[];
}

export default function TopSourcesChart({ data }: TopSourcesChartProps) {
  const sorted = [...data].sort((a, b) => b.count - a.count).slice(0, 8);
  const maxCount = sorted[0]?.count ?? 1;

  const chartData = {
    labels: sorted.map((d) => d.label),
    datasets: [
      {
        label: 'Events',
        data:  sorted.map((d) => d.count),
        backgroundColor: sorted.map((d) =>
          `rgba(248, 113, 113, ${0.25 + (d.count / maxCount) * 0.65})`,
        ),
        borderColor:  'rgba(248, 113, 113, 0.9)',
        borderWidth:  1,
        borderRadius: 4,
        borderSkipped: false as const,
      },
    ],
  };

  const options: ChartOptions<'bar'> = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#0f1629',
        borderColor: '#1e2d4d',
        borderWidth: 1,
        titleColor: '#e2e8f0',
        bodyColor: '#94a3b8',
        padding: 10,
        callbacks: {
          title: (items) => `Source IP: ${items[0]?.label}`,
          label: (ctx) => `  ${ctx.parsed.x} event${ctx.parsed.x !== 1 ? 's' : ''} from this IP`,
        },
      },
    },
    scales: {
      x: {
        grid:   { color: 'rgba(255,255,255,0.04)' },
        ticks:  { color: '#475569', font: { size: 11 } },
        border: { color: 'rgba(255,255,255,0.06)' },
        beginAtZero: true,
      },
      y: {
        grid:   { display: false },
        ticks:  { color: '#94a3b8', font: { size: 11, family: 'monospace' } },
        border: { display: false },
      },
    },
  };

  const isEmpty = data.length === 0;

  return (
    <div className="rounded-xl bg-[#0d1424] border border-slate-800 p-5 flex flex-col">
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-slate-200">Top Attack Sources</h2>
        <p className="text-xs text-slate-600 mt-0.5">IP addresses generating the most security events</p>
      </div>
      <div className="flex-1" style={{ minHeight: '220px' }}>
        {isEmpty ? (
          <div className="flex items-center justify-center h-full text-slate-600 text-sm">
            Waiting for events…
          </div>
        ) : (
          <Bar data={chartData} options={options} aria-label="Top attack source IPs bar chart" />
        )}
      </div>
    </div>
  );
}
