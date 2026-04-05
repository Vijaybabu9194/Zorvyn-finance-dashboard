import { useEffect, useMemo, useState } from 'react';
import RoleSwitcher from './components/RoleSwitcher';
import TransactionForm from './components/TransactionForm';
import { useFinance } from './state/FinanceContext';
import { formatCurrency, formatDate, prettyMonth } from './utils/formatters';

const navItems = [
  { id: 'overview', label: 'Overview' },
  { id: 'performance', label: 'Performance' },
  { id: 'transactions', label: 'Transactions' },
  { id: 'forecasting', label: 'Forecasting' },
  { id: 'risk-monitor', label: 'Risk Monitor' }
];

function deltaLabel(value) {
  if (value === null || Number.isNaN(value)) return 'n/a';
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}

function csvEscape(value) {
  const str = String(value ?? '');
  return `"${str.replaceAll('"', '""')}"`;
}

function polarToCartesian(cx, cy, radius, angleDeg) {
  const angle = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(angle),
    y: cy + radius * Math.sin(angle)
  };
}

function createDonutSegmentPath(cx, cy, outerRadius, innerRadius, startAngle, endAngle) {
  const outerStart = polarToCartesian(cx, cy, outerRadius, endAngle);
  const outerEnd = polarToCartesian(cx, cy, outerRadius, startAngle);
  const innerStart = polarToCartesian(cx, cy, innerRadius, endAngle);
  const innerEnd = polarToCartesian(cx, cy, innerRadius, startAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;

  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${outerRadius} ${outerRadius} 0 ${largeArc} 0 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerEnd.x} ${innerEnd.y}`,
    `A ${innerRadius} ${innerRadius} 0 ${largeArc} 1 ${innerStart.x} ${innerStart.y}`,
    'Z'
  ].join(' ');
}

function Sidebar({ activeSection, onNavigate }) {
  return (
    <aside className="power-sidebar">
      <h2>Zorvyn Finance</h2>
      <p className="sidebar-caption">Executive Command Center</p>
      <nav>
        {navItems.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`side-link ${activeSection === item.id ? 'active' : ''}`}
            onClick={() => onNavigate(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>
      <div className="sidebar-foot">
        <p>Mode</p>
        <strong>Strategic</strong>
      </div>
    </aside>
  );
}

function KPIRail() {
  const { summary, monthlyComparison } = useFinance();

  const cards = [
    {
      title: 'Net Balance',
      value: formatCurrency(summary.balance),
      delta: deltaLabel(monthlyComparison.balanceDeltaPct),
      tone: summary.balance >= 0 ? 'good' : 'bad'
    },
    {
      title: 'Income Stream',
      value: formatCurrency(summary.income),
      delta: deltaLabel(monthlyComparison.incomeDeltaPct),
      tone: 'neutral'
    },
    {
      title: 'Expense Load',
      value: formatCurrency(summary.expenses),
      delta: deltaLabel(monthlyComparison.expenseDeltaPct),
      tone: 'warn'
    }
  ];

  return (
    <section className="kpi-rail">
      {cards.map((card) => (
        <article key={card.title} className={`kpi-card ${card.tone}`}>
          <p>{card.title}</p>
          <h3>{card.value}</h3>
          <span>{card.delta} vs last month</span>
        </article>
      ))}
    </section>
  );
}

function PerformanceDeck() {
  const { monthlyStats, categoryStats } = useFinance();
  const [hoveredBalanceIndex, setHoveredBalanceIndex] = useState(null);
  const [hoveredCategoryIndex, setHoveredCategoryIndex] = useState(null);
  const chartWidth = 640;
  const chartHeight = 240;
  const chartPad = 24;

  const plottedPoints = useMemo(() => {
    if (monthlyStats.length === 0) return [];

    const balances = monthlyStats.map((item) => item.balance);
    const min = Math.min(...balances);
    const max = Math.max(...balances);
    const spread = max - min || 1;

    return monthlyStats.map((item, index) => {
      const x = chartPad + (index / Math.max(monthlyStats.length - 1, 1)) * (chartWidth - chartPad * 2);
      const y = chartHeight - chartPad - ((item.balance - min) / spread) * (chartHeight - chartPad * 2);

      return {
        ...item,
        x,
        y
      };
    });
  }, [monthlyStats]);

  const pathData = useMemo(() => {
    if (plottedPoints.length === 0) return '';

    return plottedPoints
      .map((point, index) => {
        return `${index === 0 ? 'M' : 'L'}${point.x} ${point.y}`;
      })
      .join(' ');
  }, [plottedPoints]);

  const velocityScale = useMemo(() => {
    if (monthlyStats.length === 0) return null;

    const balances = monthlyStats.map((item) => item.balance);
    const min = Math.min(...balances);
    const max = Math.max(...balances);

    return {
      min,
      max,
      spread: max - min || 1
    };
  }, [monthlyStats]);

  const areaPathData = useMemo(() => {
    if (plottedPoints.length === 0) return '';

    const first = plottedPoints[0];
    const last = plottedPoints[plottedPoints.length - 1];
    const baseline = chartHeight - chartPad;

    return `${pathData} L ${last.x} ${baseline} L ${first.x} ${baseline} Z`;
  }, [pathData, plottedPoints]);

  const gridLines = useMemo(() => {
    if (!velocityScale) return [];

    const rows = 5;
    return Array.from({ length: rows }, (_, index) => {
      const ratio = index / (rows - 1);
      const y = chartPad + ratio * (chartHeight - chartPad * 2);
      const value = velocityScale.max - ratio * velocityScale.spread;

      return {
        y,
        value
      };
    });
  }, [velocityScale]);

  const velocityMetrics = useMemo(() => {
    if (monthlyStats.length === 0) return null;

    const balances = monthlyStats.map((item) => item.balance);
    const latest = monthlyStats[monthlyStats.length - 1]?.balance ?? 0;
    const peak = Math.max(...balances);
    const low = Math.min(...balances);
    const average = balances.reduce((acc, value) => acc + value, 0) / balances.length;

    return { latest, peak, low, average };
  }, [monthlyStats]);

  const topCategories = categoryStats.slice(0, 5);
  const total = topCategories.reduce((acc, item) => acc + item.amount, 0);
  const palette = ['#2f7df6', '#00b4a0', '#ff9f43', '#f65f7c', '#9a6bff'];

  const donutSegments = useMemo(() => {
    if (topCategories.length === 0 || total === 0) return [];

    let cursor = 0;
    return topCategories.map((item, index) => {
      const percentage = (item.amount / total) * 100;
      const sweep = (item.amount / total) * 360;
      const startAngle = cursor;
      const endAngle = cursor + sweep;
      cursor = endAngle;

      const midAngle = (startAngle + endAngle) / 2;
      const rad = ((midAngle - 90) * Math.PI) / 180;

      return {
        ...item,
        percentage,
        color: palette[index % palette.length],
        path: createDonutSegmentPath(120, 120, 102, 62, startAngle, endAngle),
        hoverDx: Math.cos(rad) * 4,
        hoverDy: Math.sin(rad) * 4
      };
    });
  }, [topCategories, total]);

  const activePoint = hoveredBalanceIndex === null ? null : plottedPoints[hoveredBalanceIndex] ?? null;
  const activeCategory = hoveredCategoryIndex === null ? null : donutSegments[hoveredCategoryIndex] ?? null;

  return (
    <section className="perf-grid">
      <article className="panel glass">
        <div className="panel-title-row">
          <h3>Capital Velocity</h3>
          <span className="chip">Live Snapshot</span>
        </div>
        {monthlyStats.length === 0 ? (
          <p className="empty">No data available.</p>
        ) : (
          <>
            <div className="velocity-wrap" onMouseLeave={() => setHoveredBalanceIndex(null)}>
              <svg viewBox="0 0 640 240" className="velocity-chart" role="img" aria-label="Balance trend">
                <defs>
                  <linearGradient id="velocityAreaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.38" />
                    <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.02" />
                  </linearGradient>
                </defs>

                <rect
                  className="velocity-plot-bg"
                  x={chartPad}
                  y={chartPad}
                  width={chartWidth - chartPad * 2}
                  height={chartHeight - chartPad * 2}
                  rx="10"
                />

                {gridLines.map((line, index) => (
                  <g key={`grid-${index}`}>
                    <line
                      className="velocity-grid-line"
                      x1={chartPad}
                      y1={line.y}
                      x2={chartWidth - chartPad}
                      y2={line.y}
                    />
                    <text x={chartPad + 6} y={line.y - 6} className="velocity-grid-label">
                      {formatCurrency(line.value)}
                    </text>
                  </g>
                ))}

                {activePoint ? (
                  <line
                    className="velocity-guide"
                    x1={activePoint.x}
                    y1={chartPad - 2}
                    x2={activePoint.x}
                    y2={chartHeight - chartPad + 2}
                  />
                ) : null}

                <path className="velocity-area" d={areaPathData} />
                <path className="velocity-line" d={pathData} />

                {plottedPoints.map((point, index) => {
                  const active = index === hoveredBalanceIndex;
                  return (
                    <circle
                      key={point.month}
                      className={`velocity-point ${active ? 'active' : ''}`}
                      cx={point.x}
                      cy={point.y}
                      r={active ? 6 : 4}
                      onMouseEnter={() => setHoveredBalanceIndex(index)}
                    />
                  );
                })}
              </svg>

              {activePoint ? (
                <div
                  className="chart-tooltip"
                  style={{
                    left: `${(activePoint.x / chartWidth) * 100}%`,
                    top: `${(activePoint.y / chartHeight) * 100}%`
                  }}
                >
                  <p>{prettyMonth(activePoint.month)}</p>
                  <strong>{formatCurrency(activePoint.balance)}</strong>
                  <span>
                    In {formatCurrency(activePoint.income)} | Out {formatCurrency(activePoint.expense)}
                  </span>
                </div>
              ) : null}
            </div>

            <div className="month-axis">
              {monthlyStats.map((m) => (
                <span key={m.month} className={activePoint?.month === m.month ? 'active' : ''}>
                  {prettyMonth(m.month)}
                </span>
              ))}
            </div>

            {velocityMetrics ? (
              <div className="velocity-metrics">
                <div>
                  <p>Latest</p>
                  <strong>{formatCurrency(velocityMetrics.latest)}</strong>
                </div>
                <div>
                  <p>Peak</p>
                  <strong>{formatCurrency(velocityMetrics.peak)}</strong>
                </div>
                <div>
                  <p>Lowest</p>
                  <strong>{formatCurrency(velocityMetrics.low)}</strong>
                </div>
                <div>
                  <p>Average</p>
                  <strong>{formatCurrency(velocityMetrics.average)}</strong>
                </div>
              </div>
            ) : null}
          </>
        )}
      </article>

      <article className="panel glass">
        <div className="panel-title-row">
          <h3>Expense Composition</h3>
          <span className="chip">Top 5</span>
        </div>
        {topCategories.length === 0 ? (
          <p className="empty">No category data available.</p>
        ) : (
          <>
            <div className="ring-wrap">
              <div className="donut-wrap" onMouseLeave={() => setHoveredCategoryIndex(null)}>
                <svg viewBox="0 0 240 240" className="donut-chart" role="img" aria-label="Expense composition">
                  {donutSegments.map((segment, index) => (
                    <path
                      key={segment.category}
                      d={segment.path}
                      fill={segment.color}
                      className={`donut-segment ${hoveredCategoryIndex === index ? 'active' : ''}`}
                      transform={
                        hoveredCategoryIndex === index
                          ? `translate(${segment.hoverDx} ${segment.hoverDy})`
                          : undefined
                      }
                      onMouseEnter={() => setHoveredCategoryIndex(index)}
                    />
                  ))}
                </svg>

                <div className="ring-core">
                  {activeCategory ? (
                    <>
                      <p>{activeCategory.category}</p>
                      <strong>{formatCurrency(activeCategory.amount)}</strong>
                      <span>{activeCategory.percentage.toFixed(1)}% share</span>
                    </>
                  ) : (
                    <>
                      <strong>{formatCurrency(total)}</strong>
                      <span>Tracked Spend</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="legend-grid">
              {donutSegments.map((item, index) => (
                <div
                  key={item.category}
                  className={`legend-item ${hoveredCategoryIndex === index ? 'active' : ''}`}
                  onMouseEnter={() => setHoveredCategoryIndex(index)}
                  onMouseLeave={() => setHoveredCategoryIndex(null)}
                >
                  <p>{item.category}</p>
                  <strong>
                    {formatCurrency(item.amount)} ({item.percentage.toFixed(1)}%)
                  </strong>
                </div>
              ))}
            </div>
          </>
        )}
      </article>
    </section>
  );
}

function IntelligenceDeck() {
  const { insights, advancedMetrics } = useFinance();

  const trendText =
    insights.monthlyDelta === null
      ? 'Need at least two months of data for trend intelligence.'
      : insights.monthlyDelta > 0
        ? `Spending rose ${formatCurrency(insights.monthlyDelta)} vs prior month.`
        : `Spending fell ${formatCurrency(Math.abs(insights.monthlyDelta))} vs prior month.`;

  return (
    <section className="intelligence-grid">
      <article className="panel glass">
        <h3>AI Financial Brief</h3>
        <ul className="brief-list">
          <li>
            Highest spend category:{' '}
            <strong>
              {insights.highestCategory
                ? `${insights.highestCategory.category} (${formatCurrency(insights.highestCategory.amount)})`
                : 'n/a'}
            </strong>
          </li>
          <li>{trendText}</li>
          <li>Predicted next monthly expense: {formatCurrency(advancedMetrics.forecastExpense)}</li>
        </ul>
      </article>

      <article className="panel glass">
        <h3>Budget Utilization</h3>
        <p className="budget-caption">Target: {formatCurrency(advancedMetrics.budgetLimit)} / month</p>
        <div className="budget-track" aria-hidden="true">
          <div
            className="budget-fill"
            style={{ width: `${Math.min(advancedMetrics.budgetUtilization, 100)}%` }}
          />
        </div>
        <p className="budget-caption">{advancedMetrics.budgetUtilization.toFixed(1)}% consumed</p>
      </article>
    </section>
  );
}

function RiskMonitorSection() {
  const { advancedMetrics } = useFinance();

  return (
    <section className="risk-grid">
      <article className="panel glass">
        <h3>Risk Signals</h3>
        <p className="budget-caption">Anomalies detected: {advancedMetrics.anomalies.length}</p>
        {advancedMetrics.anomalies.length === 0 ? (
          <p className="empty">No abnormal spikes in expense transactions.</p>
        ) : (
          <div className="signal-list">
            {advancedMetrics.anomalies.map((item) => (
              <div key={item.id}>
                <p>{item.description}</p>
                <strong>{formatCurrency(item.amount)}</strong>
              </div>
            ))}
          </div>
        )}
      </article>

      <article className="panel glass">
        <h3>Recurring Expense Radar</h3>
        {advancedMetrics.recurring.length === 0 ? (
          <p className="empty">No recurring patterns detected yet.</p>
        ) : (
          <div className="signal-list recurring-list">
            {advancedMetrics.recurring.map((item) => (
              <div key={item.category}>
                <p>{item.category}</p>
                <strong>{item.count} repeats</strong>
              </div>
            ))}
          </div>
        )}
      </article>
    </section>
  );
}

function TransactionWorkbench() {
  const { state, dispatch, categories, filteredTransactions } = useFinance();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);
  const [compact, setCompact] = useState(false);

  const editingItem = useMemo(
    () => state.transactions.find((item) => item.id === state.editingId) ?? null,
    [state.transactions, state.editingId]
  );

  const totalPages = Math.max(Math.ceil(filteredTransactions.length / pageSize), 1);
  const currentPage = Math.min(page, totalPages);
  const pageSlice = filteredTransactions.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  function updateFilter(key, value) {
    dispatch({ type: 'SET_FILTER', payload: { key, value } });
    setPage(1);
  }

  function exportCsv() {
    if (filteredTransactions.length === 0) return;
    const headers = ['Date', 'Description', 'Category', 'Type', 'Amount'];
    const body = filteredTransactions.map((item) =>
      [item.date, item.description, item.category, item.type, item.amount.toFixed(2)]
        .map(csvEscape)
        .join(',')
    );
    const csv = [headers.map(csvEscape).join(','), ...body].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'advanced-transactions.csv';
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function clearFilters() {
    updateFilter('search', '');
    updateFilter('type', 'all');
    updateFilter('category', 'all');
    updateFilter('startDate', '');
    updateFilter('endDate', '');
    updateFilter('minAmount', '');
    updateFilter('maxAmount', '');
  }

  return (
    <section className="panel glass transaction-workbench">
      <div className="panel-title-row">
        <h3>Transaction Command Workbench</h3>
        <div className="workbench-actions">
          <button className="btn secondary" type="button" onClick={() => setCompact((v) => !v)}>
            {compact ? 'Comfort View' : 'Compact View'}
          </button>
          <button className="btn secondary" type="button" onClick={exportCsv}>
            Export Visible CSV
          </button>
        </div>
      </div>

      <div className="advanced-filters">
        <input
          type="search"
          placeholder="Search description / category"
          value={state.filters.search}
          onChange={(e) => updateFilter('search', e.target.value)}
        />
        <select value={state.filters.type} onChange={(e) => updateFilter('type', e.target.value)}>
          <option value="all">All types</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>
        <select value={state.filters.category} onChange={(e) => updateFilter('category', e.target.value)}>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c === 'all' ? 'All categories' : c}
            </option>
          ))}
        </select>
        <input type="date" value={state.filters.startDate} onChange={(e) => updateFilter('startDate', e.target.value)} />
        <input type="date" value={state.filters.endDate} onChange={(e) => updateFilter('endDate', e.target.value)} />
        <input
          type="number"
          step="0.01"
          min="0"
          placeholder="Min amount"
          value={state.filters.minAmount}
          onChange={(e) => updateFilter('minAmount', e.target.value)}
        />
        <input
          type="number"
          step="0.01"
          min="0"
          placeholder="Max amount"
          value={state.filters.maxAmount}
          onChange={(e) => updateFilter('maxAmount', e.target.value)}
        />
        <button className="btn ghost" type="button" onClick={clearFilters}>
          Reset
        </button>
      </div>

      {state.role === 'admin' ? (
        <div className="admin-add-zone">
          <h4>{editingItem ? 'Edit Transaction' : 'Create Transaction'}</h4>
          <TransactionForm
            source={editingItem}
            onSave={(payload) => {
              if (editingItem) {
                dispatch({ type: 'SAVE_EDIT', payload: { ...payload, id: editingItem.id } });
              } else {
                dispatch({ type: 'ADD_TRANSACTION', payload });
              }
            }}
          />
          {editingItem ? (
            <button className="btn ghost" type="button" onClick={() => dispatch({ type: 'CANCEL_EDIT' })}>
              Cancel Edit
            </button>
          ) : null}
        </div>
      ) : (
        <p className="empty">Viewer mode: switch role to Admin to add or edit records.</p>
      )}

      {filteredTransactions.length === 0 ? (
        <p className="empty">No transactions match this command filter profile.</p>
      ) : (
        <div className="table-wrap">
          <table className={compact ? 'compact' : ''}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Category</th>
                <th>Type</th>
                <th className="amount-col">Amount</th>
                {state.role === 'admin' ? <th>Action</th> : null}
              </tr>
            </thead>
            <tbody>
              {pageSlice.map((item) => (
                <tr key={item.id}>
                  <td>{formatDate(item.date)}</td>
                  <td>{item.description}</td>
                  <td>{item.category}</td>
                  <td>
                    <span className={`pill ${item.type}`}>{item.type}</span>
                  </td>
                  <td className={`amount-col ${item.type}`}>{formatCurrency(item.amount)}</td>
                  {state.role === 'admin' ? (
                    <td>
                      <button
                        className="btn tiny"
                        type="button"
                        onClick={() => dispatch({ type: 'START_EDIT', payload: item.id })}
                      >
                        Edit
                      </button>
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="pagination-row">
        <p>
          Showing {(currentPage - 1) * pageSize + (pageSlice.length > 0 ? 1 : 0)}-
          {(currentPage - 1) * pageSize + pageSlice.length} of {filteredTransactions.length}
        </p>
        <div className="page-controls">
          <label>
            Rows
            <select
              value={String(pageSize)}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
            >
              <option value="6">6</option>
              <option value="10">10</option>
              <option value="15">15</option>
            </select>
          </label>
          <button className="btn ghost" type="button" onClick={() => setPage((p) => Math.max(1, p - 1))}>
            Prev
          </button>
          <span>
            {currentPage} / {totalPages}
          </span>
          <button
            className="btn ghost"
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
          </button>
        </div>
      </div>
    </section>
  );
}

export default function App() {
  const { advancedMetrics } = useFinance();
  const [activeSection, setActiveSection] = useState('overview');
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('finance-dashboard-theme');
    return saved === 'dark' ? 'dark' : 'light';
  });

  useEffect(() => {
    document.body.dataset.theme = theme;
    localStorage.setItem('finance-dashboard-theme', theme);
  }, [theme]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (visible.length > 0) {
          setActiveSection(visible[0].target.id);
        }
      },
      {
        threshold: [0.3, 0.6],
        rootMargin: '-20% 0px -55% 0px'
      }
    );

    navItems.forEach((item) => {
      const element = document.getElementById(item.id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => observer.disconnect();
  }, []);

  function navigateTo(sectionId) {
    const element = document.getElementById(sectionId);
    if (!element) return;

    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setActiveSection(sectionId);
  }

  return (
    <div className="power-shell">
      <Sidebar activeSection={activeSection} onNavigate={navigateTo} />

      <main className="power-main">
        <section id="overview" className="nav-section">
          <header className="topbar">
            <div>
              <p className="eyebrow">Finance Intelligence Platform</p>
              <h1>Strategic Treasury Dashboard</h1>
              <p className="subtitle">Advanced analytics, risk signals, and transaction command controls.</p>
            </div>

            <div className="topbar-actions">
              <button
                type="button"
                className="btn theme-toggle"
                onClick={() => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))}
              >
                {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
              </button>
              <RoleSwitcher />
            </div>
          </header>

          <KPIRail />
        </section>

        <section id="performance" className="nav-section">
          <PerformanceDeck />
        </section>

        <section id="transactions" className="nav-section">
          <TransactionWorkbench />
        </section>

        <section id="forecasting" className="nav-section">
          <IntelligenceDeck />
        </section>

        <section id="risk-monitor" className="nav-section">
          <RiskMonitorSection />
        </section>

        <footer className="foot-meta">
          <p>Recurring categories tracked: {advancedMetrics.recurring.length}</p>
          <p>Anomaly signals: {advancedMetrics.anomalies.length}</p>
        </footer>
      </main>
    </div>
  );
}
