import { useFinance } from '../state/FinanceContext';
import { formatCurrency } from '../utils/formatters';

const colors = ['#1fb8cd', '#f39f5a', '#ea5f89', '#76b041', '#f0544f', '#6b8afd'];

export default function CategoryBreakdownChart() {
  const { categoryStats } = useFinance();

  const total = categoryStats.reduce((acc, item) => acc + item.amount, 0);

  if (categoryStats.length === 0 || total === 0) {
    return (
      <section className="panel chart-panel">
        <h3>Spending Breakdown</h3>
        <p className="empty">No expenses recorded for category analysis.</p>
      </section>
    );
  }

  return (
    <section className="panel chart-panel">
      <h3>Spending Breakdown</h3>
      <div className="breakdown-list">
        {categoryStats.map((item, index) => {
          const pct = (item.amount / total) * 100;
          return (
            <div key={item.category} className="breakdown-item">
              <div className="breakdown-head">
                <span className="dot" style={{ backgroundColor: colors[index % colors.length] }} />
                <span>{item.category}</span>
                <strong>{formatCurrency(item.amount)}</strong>
              </div>
              <div className="bar-track" aria-hidden="true">
                <div
                  className="bar-fill"
                  style={{ width: `${pct}%`, backgroundColor: colors[index % colors.length] }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
