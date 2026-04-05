import { useFinance } from '../state/FinanceContext';
import { formatCurrency } from '../utils/formatters';

export default function SummaryCards() {
  const { summary } = useFinance();

  const cards = [
    {
      title: 'Total Balance',
      value: formatCurrency(summary.balance),
      tone: summary.balance >= 0 ? 'positive' : 'negative'
    },
    {
      title: 'Income',
      value: formatCurrency(summary.income),
      tone: 'neutral'
    },
    {
      title: 'Expenses',
      value: formatCurrency(summary.expenses),
      tone: 'negative'
    }
  ];

  return (
    <section className="summary-grid">
      {cards.map((card) => (
        <article key={card.title} className={`summary-card ${card.tone}`}>
          <p className="summary-title">{card.title}</p>
          <p className="summary-value">{card.value}</p>
        </article>
      ))}
    </section>
  );
}
