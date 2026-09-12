import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  type ChartOptions,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import type { TrendDataPoint } from '../../types/security';
import { severityChartColors, severityChartBgColors } from '../../utils/severity';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

interface EventTrendChartProps {
  data: TrendDataPoint[];
  /** How many of the most recent days to show. Default: 14 */
  days?: number;
}

export default function EventTrendChart({ data, days = 14 }: EventTrendChartProps) {
  const slice = data.slice(-days);

  // Format date labels as "Nov 1", "Nov 2" etc.
  const labels = slice.map((d) => {
    const date = new Date(d.date);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  });

  const makeDataset = (
    label: string,
    key: keyof Omit<TrendDataPoint, 'date'>,
    color: string,
    bgColor: string,
    hidden = false,
  ) => ({
    label,
    data:  slice.map((d) => d[key] as number),
    borderColor:     color,
    backgroundColor: bgColor,
    borderWidth: 2,
    pointRadius: 0,
    pointHoverRadius: 4,
    pointHoverBackgroundColor: color,
    fill: key === 'critical', // Only fill the critical line for emphasis
    tension: 0.4,
    hidden,
  });

  const chartData = {
    labels,
    datasets: [
      makeDataset('Critical',      'critical',      severityChartColors.critical,      severityChartBgColors.critical),
      makeDataset('High',          'high',          severityChartColors.high,           severityChartBgColors.high),
      makeDataset('Medium',        'medium',        severityChartColors.medium,         severityChartBgColors.medium),
      makeDataset('Low',           'low',           severityChartColors.low,            severityChartBgColors.low,           true),
      makeDataset('Informational', 'informational', severityChartColors.informational,  severityChartBgColors.informational, true),
    ],
  };

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top',
        align: 'end',
        labels: {
          color: '#94a3b8',       // slate-400
          boxWidth: 12,
          boxHeight: 2,
          useBorderRadius: true,
          borderRadius: 2,
          padding: 16,
          font: { size: 11 },
        },
      },
      tooltip: {
        backgroundColor: '#0f1629',
        borderColor: '#1e2d4d',
        borderWidth: 1,
        titleColor: '#e2e8f0',
        bodyColor: '#94a3b8',
        padding: 12,
        callbacks: {
          title: (items) => items[0]?.label ?? '',
        },
      },
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(255,255,255,0.04)',
        },
        ticks: {
          color: '#475569',    // slate-600
          font: { size: 11 },
          maxTicksLimit: 7,
        },
        border: { color: 'rgba(255,255,255,0.06)' },
      },
      y: {
        grid: {
          color: 'rgba(255,255,255,0.04)',
        },
        ticks: {
          color: '#475569',
          font: { size: 11 },
          stepSize: 5,
        },
        border: { color: 'rgba(255,255,255,0.06)' },
        beginAtZero: true,
      },
    },
  };

  return (
    <div className="rounded-xl bg-[#0d1424] border border-slate-800 p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-200">Security Events Trend</h2>
          <p className="text-xs text-slate-600 mt-0.5">Last {days} days · by severity</p>
        </div>
      </div>
      <div className="h-56">
        <Line data={chartData} options={options} aria-label="Security events trend line chart" />
      </div>
    </div>
  );
}
