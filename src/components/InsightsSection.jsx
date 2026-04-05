import { useFinance } from '../state/FinanceContext';
import { formatCurrency } from '../utils/formatters';

export default function InsightsSection() {
  const { insights } = useFinance();

  const trendText =
    insights.monthlyDelta === null
      ? 'Need at least two months of data for monthly comparison.'
      : insights.monthlyDelta > 0
        ? `Spending increased by ${formatCurrency(insights.monthlyDelta)} compared to the previous month.`
        : `Spending decreased by ${formatCurrency(Math.abs(insights.monthlyDelta))} compared to the previous month.`;

  return (
    <section className="panel insights-panel">
      <h3>Insights</h3>
      <ul>
        <li>
          Highest spending category:{' '}
          <strong>
            {insights.highestCategory
              ? `${insights.highestCategory.category} (${formatCurrency(insights.highestCategory.amount)})`
              : 'No expense data available'}
          </strong>
        </li>
        <li>{trendText}</li>
        <li>Average monthly expense: {formatCurrency(insights.avgExpense)}</li>
      </ul>
    </section>
  );
}
