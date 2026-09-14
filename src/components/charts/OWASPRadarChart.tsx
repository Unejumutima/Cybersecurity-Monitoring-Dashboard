/**
 * OWASPRadarChart.tsx
 * -------------------
 * Radar chart showing all 10 OWASP category scores.
 * Follows the same pattern as existing chart components (SeverityDonutChart etc.)
 */

import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  type ChartOptions,
} from 'chart.js';
import { Radar } from 'react-chartjs-2';
import type { OWASPCategory } from '../../hooks/useOwasp';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

interface OWASPRadarChartProps {
  categories: OWASPCategory[];
  overallScore: number;
}

export default function OWASPRadarChart({ categories, overallScore }: OWASPRadarChartProps) {
  const labels = categories.map((cat) => cat.id);
  const scores = categories.map((cat) => cat.score);

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Security Score',
        data: scores,
        backgroundColor: 'rgba(99, 102, 241, 0.2)',  // indigo fill
        borderColor: 'rgba(99, 102, 241, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(99, 102, 241, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(99, 102, 241, 1)',
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  const options: ChartOptions<'radar'> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        beginAtZero: true,
        max: 100,
        ticks: {
          stepSize: 25,
          color: '#64748b',
          backdropColor: 'transparent',
          font: { size: 10 },
        },
        grid: {
          color: '#1e293b',
        },
        pointLabels: {
          color: '#94a3b8',
          font: { size: 11, weight: 500 as const },
        },
        angleLines: {
          color: '#1e293b',
        },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: '#0f1629',
        borderColor: '#1e2d4d',
        borderWidth: 1,
        titleColor: '#e2e8f0',
        bodyColor: '#94a3b8',
        padding: 12,
        callbacks: {
          title: (items) => {
            const cat = categories[items[0].dataIndex];
            return cat ? `${cat.id}: ${cat.name}` : items[0].label;
          },
          label: (ctx) => {
            const cat = categories[ctx.dataIndex];
            const score = ctx.parsed.r.toFixed(0);
            const band = cat?.postureBand || 'unknown';
            return `  Score: ${score}/100 (${band.replace('_', ' ')})`;
          },
        },
      },
    },
  };

  return (
    <div className="rounded-xl bg-[#0d1424] border border-slate-800 p-5">
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-slate-200">OWASP Top 10 Security Radar</h2>
        <p className="text-xs text-slate-600 mt-0.5">
          Overall Score: <span className="font-semibold text-slate-400">{overallScore.toFixed(0)}/100</span>
        </p>
      </div>

      <div className="h-72 flex items-center justify-center">
        <Radar
          data={chartData}
          options={options}
          aria-label="OWASP Top 10 security posture radar chart"
        />
      </div>

      <div className="mt-4 text-xs text-slate-500 text-center">
        Hover over points to see category details
      </div>
    </div>
  );
}
