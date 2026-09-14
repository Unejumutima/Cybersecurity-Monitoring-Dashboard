/**
 * AttackTypeChart.tsx
 * -------------------
 * Horizontal bar chart showing how many events were recorded for each
 * attack/event type. Updates whenever new WS events arrive.
 */
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
  type ChartOptions,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import type { CountedItem } from '../../hooks/useSecurityEvents';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

interface AttackTypeChartProps {
  data: CountedItem[];
}

// Gradient-like palette — distinct enough for 10 categories
const BAR_COLORS = [
  'rgba(248, 113, 113, 0.75)', // red    – critical-ish types
  'rgba(251, 146,  60, 0.75)', // orange
  'rgba(250, 204,  21, 0.75)', // yellow
  'rgba( 52, 211, 153, 0.75)', // emerald
  'rgba( 96, 165, 250, 0.75)', // blue
  'rgba(167, 139, 250, 0.75)', // violet
  'rgba(244, 114, 182, 0.75)', // pink
  'rgba( 45, 212, 191, 0.75)', // teal
  'rgba(251, 191,  36, 0.75)', // amber
  'rgba(148, 163, 184, 0.75)', // slate
];

export default function AttackTypeChart({ data }: AttackTypeChartProps) {
  // Sort descending so the longest bar is on top
  const sorted = [...data].sort((a, b) => b.count - a.count);

  const chartData = {
    labels: sorted.map((d) => d.label),
    datasets: [
      {
        label: 'Events',
        data:  sorted.map((d) => d.count),
        backgroundColor: sorted.map((_, i) => BAR_COLORS[i % BAR_COLORS.length]),
        borderColor:     sorted.map((_, i) => BAR_COLORS[i % BAR_COLORS.length].replace('0.75', '1')),
        borderWidth: 1,
        borderRadius: 4,
        borderSkipped: false as const,
      },
    ],
  };

  const options: ChartOptions<'bar'> = {
    indexAxis: 'y',           // horizontal bars
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
          label: (ctx) => `  ${ctx.parsed.x} event${ctx.parsed.x !== 1 ? 's' : ''}`,
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
        ticks:  { color: '#94a3b8', font: { size: 11 } },
        border: { display: false },
      },
    },
  };

  const isEmpty = data.length === 0;

  return (
    <div className="rounded-xl bg-[#0d1424] border border-slate-800 p-5 flex flex-col">
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-slate-200">Events by Attack Type</h2>
        <p className="text-xs text-slate-600 mt-0.5">Distribution across all detected event categories</p>
      </div>
      <div className="flex-1" style={{ minHeight: '220px' }}>
        {isEmpty ? (
          <div className="flex items-center justify-center h-full text-slate-600 text-sm">
            Waiting for events…
          </div>
        ) : (
          <Bar data={chartData} options={options} aria-label="Events by attack type bar chart" />
        )}
      </div>
    </div>
  );
}
