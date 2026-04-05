import { useMemo } from 'react';
import { useFinance } from '../state/FinanceContext';
import { prettyMonth } from '../utils/formatters';

export default function BalanceTrendChart() {
  const { monthlyStats } = useFinance();

  const points = useMemo(() => {
    if (monthlyStats.length === 0) return [];

    const width = 560;
    const height = 220;
    const padding = 24;

    const balances = monthlyStats.map((item) => item.balance);
    const min = Math.min(...balances);
    const max = Math.max(...balances);
    const spread = max - min || 1;

    return monthlyStats.map((item, index) => {
      const x = padding + (index / Math.max(monthlyStats.length - 1, 1)) * (width - padding * 2);
      const normalized = (item.balance - min) / spread;
      const y = height - padding - normalized * (height - padding * 2);
      return { ...item, x, y };
    });
  }, [monthlyStats]);

  if (monthlyStats.length === 0) {
    return (
      <section className="panel chart-panel">
        <h3>Balance Trend</h3>
        <p className="empty">No transaction data to build a trend yet.</p>
      </section>
    );
  }

  const polyline = points.map((point) => `${point.x},${point.y}`).join(' ');

  return (
    <section className="panel chart-panel">
      <h3>Balance Trend</h3>
      <svg viewBox="0 0 560 220" role="img" aria-label="Balance trend line chart">
        <defs>
          <linearGradient id="trendFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="rgba(31, 184, 205, 0.35)" />
            <stop offset="100%" stopColor="rgba(31, 184, 205, 0.03)" />
          </linearGradient>
        </defs>

        <polyline points={polyline} className="chart-line" />

        {points.map((point) => (
          <g key={point.month}>
            <circle cx={point.x} cy={point.y} r="5" className="chart-dot" />
            <text x={point.x} y="208" textAnchor="middle" className="chart-label">
              {prettyMonth(point.month)}
            </text>
          </g>
        ))}
      </svg>
    </section>
  );
}
