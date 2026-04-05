import React, { createContext, useContext, useEffect, useMemo, useReducer } from 'react';
import { availableRoles, initialTransactions } from '../data/mockData';

const FinanceContext = createContext(null);

const persisted = localStorage.getItem('finance-dashboard-state');
let persistedState = null;

try {
  persistedState = persisted ? JSON.parse(persisted) : null;
} catch {
  persistedState = null;
}

const initialState = {
  role: persistedState?.role && availableRoles.includes(persistedState.role) ? persistedState.role : 'viewer',
  transactions: Array.isArray(persistedState?.transactions) ? persistedState.transactions : initialTransactions,
  filters: {
    search: '',
    type: 'all',
    category: 'all',
    startDate: '',
    endDate: '',
    minAmount: '',
    maxAmount: ''
  },
  sort: {
    key: 'date',
    direction: 'desc'
  },
  editingId: null
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_ROLE':
      return { ...state, role: action.payload };
    case 'SET_FILTER':
      return {
        ...state,
        filters: {
          ...state.filters,
          [action.payload.key]: action.payload.value
        }
      };
    case 'SET_SORT':
      return { ...state, sort: action.payload };
    case 'ADD_TRANSACTION':
      return {
        ...state,
        transactions: [{ ...action.payload, id: Date.now() }, ...state.transactions]
      };
    case 'START_EDIT':
      return { ...state, editingId: action.payload };
    case 'CANCEL_EDIT':
      return { ...state, editingId: null };
    case 'SAVE_EDIT':
      return {
        ...state,
        editingId: null,
        transactions: state.transactions.map((item) =>
          item.id === action.payload.id ? { ...item, ...action.payload } : item
        )
      };
    default:
      return state;
  }
}

function sortItems(items, sort) {
  const sorted = [...items];
  sorted.sort((a, b) => {
    let comparison = 0;

    if (sort.key === 'amount') {
      comparison = a.amount - b.amount;
    } else if (sort.key === 'date') {
      comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
    } else {
      comparison = String(a[sort.key]).localeCompare(String(b[sort.key]));
    }

    return sort.direction === 'asc' ? comparison : -comparison;
  });

  return sorted;
}

export function FinanceProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const categories = useMemo(() => {
    return ['all', ...new Set(state.transactions.map((item) => item.category))];
  }, [state.transactions]);

  const filteredTransactions = useMemo(() => {
    const query = state.filters.search.trim().toLowerCase();
    const startDate = state.filters.startDate ? new Date(state.filters.startDate).getTime() : null;
    const endDate = state.filters.endDate ? new Date(state.filters.endDate).getTime() : null;
    const minAmount = state.filters.minAmount === '' ? null : Number(state.filters.minAmount);
    const maxAmount = state.filters.maxAmount === '' ? null : Number(state.filters.maxAmount);

    const filtered = state.transactions.filter((item) => {
      const matchesQuery =
        query.length === 0 ||
        item.description.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query);

      const matchesType = state.filters.type === 'all' || item.type === state.filters.type;
      const matchesCategory =
        state.filters.category === 'all' || item.category === state.filters.category;
      const itemDate = new Date(item.date).getTime();
      const matchesStartDate = startDate === null || itemDate >= startDate;
      const matchesEndDate = endDate === null || itemDate <= endDate;
      const matchesMinAmount = minAmount === null || item.amount >= minAmount;
      const matchesMaxAmount = maxAmount === null || item.amount <= maxAmount;

      return (
        matchesQuery &&
        matchesType &&
        matchesCategory &&
        matchesStartDate &&
        matchesEndDate &&
        matchesMinAmount &&
        matchesMaxAmount
      );
    });

    return sortItems(filtered, state.sort);
  }, [state.filters, state.sort, state.transactions]);

  const summary = useMemo(() => {
    const income = state.transactions
      .filter((item) => item.type === 'income')
      .reduce((acc, item) => acc + item.amount, 0);

    const expenses = state.transactions
      .filter((item) => item.type === 'expense')
      .reduce((acc, item) => acc + item.amount, 0);

    return {
      income,
      expenses,
      balance: income - expenses
    };
  }, [state.transactions]);

  const monthlyStats = useMemo(() => {
    const map = new Map();

    state.transactions.forEach((item) => {
      const month = item.date.slice(0, 7);
      const current = map.get(month) ?? { month, income: 0, expense: 0 };

      if (item.type === 'income') current.income += item.amount;
      if (item.type === 'expense') current.expense += item.amount;

      map.set(month, current);
    });

    return [...map.values()]
      .sort((a, b) => a.month.localeCompare(b.month))
      .map((entry) => ({
        ...entry,
        balance: entry.income - entry.expense
      }));
  }, [state.transactions]);

  const categoryStats = useMemo(() => {
    const map = new Map();

    state.transactions
      .filter((item) => item.type === 'expense')
      .forEach((item) => {
        const current = map.get(item.category) ?? 0;
        map.set(item.category, current + item.amount);
      });

    return [...map.entries()]
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [state.transactions]);

  const highestCategory = categoryStats[0] ?? null;

  const monthlyComparison = useMemo(() => {
    const latest = monthlyStats[monthlyStats.length - 1] ?? null;
    const previous = monthlyStats[monthlyStats.length - 2] ?? null;

    if (!latest || !previous) {
      return {
        incomeDeltaPct: null,
        expenseDeltaPct: null,
        balanceDeltaPct: null
      };
    }

    function calculateDelta(current, prior) {
      if (prior === 0) return null;
      return ((current - prior) / prior) * 100;
    }

    return {
      incomeDeltaPct: calculateDelta(latest.income, previous.income),
      expenseDeltaPct: calculateDelta(latest.expense, previous.expense),
      balanceDeltaPct: calculateDelta(latest.balance, previous.balance)
    };
  }, [monthlyStats]);

  const advancedMetrics = useMemo(() => {
    const expenseTransactions = state.transactions.filter((item) => item.type === 'expense');
    const monthlyExpenses = monthlyStats.map((item) => item.expense);
    const avgExpense =
      monthlyExpenses.length > 0
        ? monthlyExpenses.reduce((acc, val) => acc + val, 0) / monthlyExpenses.length
        : 0;

    const recent = monthlyExpenses.slice(-3);
    const forecastExpense =
      recent.length > 0
        ? recent.reduce((acc, val) => acc + val, 0) / recent.length
        : avgExpense;

    const budgetLimit = 240000;
    const latestExpense = monthlyStats[monthlyStats.length - 1]?.expense ?? 0;
    const budgetUtilization = budgetLimit === 0 ? 0 : (latestExpense / budgetLimit) * 100;

    const txnMean =
      expenseTransactions.length > 0
        ? expenseTransactions.reduce((acc, item) => acc + item.amount, 0) / expenseTransactions.length
        : 0;
    const anomalyThreshold = txnMean * 2.3;
    const anomalies = expenseTransactions.filter((item) => item.amount >= anomalyThreshold);

    const recurringMap = new Map();
    expenseTransactions.forEach((item) => {
      recurringMap.set(item.category, (recurringMap.get(item.category) ?? 0) + 1);
    });
    const recurring = [...recurringMap.entries()]
      .filter(([, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([category, count]) => ({ category, count }));

    return {
      budgetLimit,
      budgetUtilization,
      forecastExpense,
      anomalies,
      recurring
    };
  }, [monthlyStats, state.transactions]);

  const insights = useMemo(() => {
    const latest = monthlyStats[monthlyStats.length - 1];
    const previous = monthlyStats[monthlyStats.length - 2];

    let monthlyDelta = null;
    if (latest && previous) {
      monthlyDelta = latest.expense - previous.expense;
    }

    return {
      highestCategory,
      monthlyDelta,
      avgExpense:
        monthlyStats.length > 0
          ? monthlyStats.reduce((acc, m) => acc + m.expense, 0) / monthlyStats.length
          : 0
    };
  }, [highestCategory, monthlyStats]);

  const value = {
    state,
    dispatch,
    categories,
    filteredTransactions,
    summary,
    monthlyStats,
    categoryStats,
    insights,
    monthlyComparison,
    advancedMetrics
  };

  useEffect(() => {
    localStorage.setItem(
      'finance-dashboard-state',
      JSON.stringify({ role: state.role, transactions: state.transactions })
    );
  }, [state.role, state.transactions]);

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
}

export function useFinance() {
  const context = useContext(FinanceContext);

  if (!context) {
    throw new Error('useFinance must be used within FinanceProvider');
  }

  return context;
}
