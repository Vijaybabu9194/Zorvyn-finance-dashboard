import { useMemo } from 'react';
import { useFinance } from '../state/FinanceContext';
import { formatCurrency, formatDate } from '../utils/formatters';
import TransactionForm from './TransactionForm';

function csvEscape(value) {
  const str = String(value ?? '');
  return `"${str.replaceAll('"', '""')}"`;
}

export default function TransactionsSection() {
  const { state, dispatch, categories, filteredTransactions } = useFinance();

  const editingItem = useMemo(() => {
    return state.transactions.find((item) => item.id === state.editingId) ?? null;
  }, [state.editingId, state.transactions]);

  function setSort(key) {
    const direction =
      state.sort.key === key && state.sort.direction === 'desc' ? 'asc' : 'desc';
    dispatch({ type: 'SET_SORT', payload: { key, direction } });
  }

  function setDateRange(days) {
    const now = new Date();
    const endDate = now.toISOString().slice(0, 10);
    const start = new Date(now);
    start.setDate(start.getDate() - (days - 1));
    const startDate = start.toISOString().slice(0, 10);

    dispatch({ type: 'SET_FILTER', payload: { key: 'startDate', value: startDate } });
    dispatch({ type: 'SET_FILTER', payload: { key: 'endDate', value: endDate } });
  }

  function clearFilters() {
    dispatch({ type: 'SET_FILTER', payload: { key: 'search', value: '' } });
    dispatch({ type: 'SET_FILTER', payload: { key: 'type', value: 'all' } });
    dispatch({ type: 'SET_FILTER', payload: { key: 'category', value: 'all' } });
    dispatch({ type: 'SET_FILTER', payload: { key: 'startDate', value: '' } });
    dispatch({ type: 'SET_FILTER', payload: { key: 'endDate', value: '' } });
  }

  function exportVisibleToCsv() {
    if (filteredTransactions.length === 0) return;

    const headers = ['Date', 'Description', 'Category', 'Type', 'Amount'];
    const lines = filteredTransactions.map((item) =>
      [item.date, item.description, item.category, item.type, item.amount.toFixed(2)]
        .map(csvEscape)
        .join(',')
    );

    const csv = [headers.map(csvEscape).join(','), ...lines].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = 'visible-transactions.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="panel transactions-panel">
      <div className="panel-head">
        <h3>Transactions</h3>
        <div className="transaction-head-actions">
          <p>{filteredTransactions.length} visible entries</p>
          <button
            type="button"
            className="btn secondary"
            onClick={exportVisibleToCsv}
            disabled={filteredTransactions.length === 0}
          >
            Export CSV
          </button>
        </div>
      </div>

      <div className="filters">
        <input
          type="search"
          placeholder="Search by description or category"
          value={state.filters.search}
          onChange={(event) =>
            dispatch({ type: 'SET_FILTER', payload: { key: 'search', value: event.target.value } })
          }
        />

        <select
          value={state.filters.type}
          onChange={(event) =>
            dispatch({ type: 'SET_FILTER', payload: { key: 'type', value: event.target.value } })
          }
        >
          <option value="all">All types</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>

        <select
          value={state.filters.category}
          onChange={(event) =>
            dispatch({ type: 'SET_FILTER', payload: { key: 'category', value: event.target.value } })
          }
        >
          {categories.map((category) => (
            <option key={category} value={category}>
              {category === 'all' ? 'All categories' : category}
            </option>
          ))}
        </select>

        <label className="filter-label">
          From
          <input
            type="date"
            value={state.filters.startDate}
            onChange={(event) =>
              dispatch({ type: 'SET_FILTER', payload: { key: 'startDate', value: event.target.value } })
            }
          />
        </label>

        <label className="filter-label">
          To
          <input
            type="date"
            value={state.filters.endDate}
            onChange={(event) =>
              dispatch({ type: 'SET_FILTER', payload: { key: 'endDate', value: event.target.value } })
            }
          />
        </label>
      </div>

      <div className="range-actions">
        <button type="button" className="btn ghost tiny-chip" onClick={() => setDateRange(7)}>
          Last 7 Days
        </button>
        <button type="button" className="btn ghost tiny-chip" onClick={() => setDateRange(30)}>
          Last 30 Days
        </button>
        <button type="button" className="btn ghost tiny-chip" onClick={() => setDateRange(90)}>
          Last 90 Days
        </button>
        <button type="button" className="btn ghost tiny-chip" onClick={clearFilters}>
          Clear Filters
        </button>
      </div>

      {state.role === 'admin' ? (
        <div className="admin-form-wrap">
          <h4>{editingItem ? 'Edit Transaction' : 'Add Transaction'}</h4>
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
            <button type="button" className="btn ghost" onClick={() => dispatch({ type: 'CANCEL_EDIT' })}>
              Cancel Editing
            </button>
          ) : null}
        </div>
      ) : (
        <p className="role-note">Viewer mode: switch role to Admin to add or edit transactions.</p>
      )}

      <div className="table-wrap">
        {filteredTransactions.length === 0 ? (
          <p className="empty">No transactions match your filters.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>
                  <button type="button" className="sort-btn" onClick={() => setSort('date')}>
                    Date
                  </button>
                </th>
                <th>Description</th>
                <th>
                  <button type="button" className="sort-btn" onClick={() => setSort('category')}>
                    Category
                  </button>
                </th>
                <th>
                  <button type="button" className="sort-btn" onClick={() => setSort('type')}>
                    Type
                  </button>
                </th>
                <th className="amount-col">
                  <button type="button" className="sort-btn" onClick={() => setSort('amount')}>
                    Amount
                  </button>
                </th>
                {state.role === 'admin' ? <th>Actions</th> : null}
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((item) => (
                <tr key={item.id}>
                  <td>{formatDate(item.date)}</td>
                  <td>{item.description}</td>
                  <td>{item.category}</td>
                  <td>
                    <span className={`pill ${item.type}`}>{item.type}</span>
                  </td>
                  <td className={`amount-col ${item.type === 'income' ? 'income' : 'expense'}`}>
                    {item.type === 'income' ? '+' : '-'} {formatCurrency(item.amount)}
                  </td>
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
        )}
      </div>
    </section>
  );
}
