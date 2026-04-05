import { useEffect, useMemo, useState } from 'react';

const initialForm = {
  date: '',
  description: '',
  amount: '',
  category: '',
  type: 'expense'
};

export default function TransactionForm({ onSave, source }) {
  const [form, setForm] = useState(() =>
    source
      ? {
          ...source,
          amount: String(source.amount)
        }
      : initialForm
  );

  useEffect(() => {
    setForm(
      source
        ? {
            ...source,
            amount: String(source.amount)
          }
        : initialForm
    );
  }, [source]);

  const isValid = useMemo(() => {
    return (
      form.date.trim() &&
      form.description.trim() &&
      form.category.trim() &&
      Number(form.amount) > 0 &&
      (form.type === 'income' || form.type === 'expense')
    );
  }, [form]);

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function submit(event) {
    event.preventDefault();
    if (!isValid) return;

    onSave({
      ...form,
      amount: Number(form.amount)
    });

    if (!source) {
      setForm(initialForm);
    }
  }

  return (
    <form className="tx-form" onSubmit={submit}>
      <div className="field-row">
        <label>
          Date
          <input
            type="date"
            value={form.date}
            onChange={(event) => updateField('date', event.target.value)}
            required
          />
        </label>
        <label>
          Type
          <select
            value={form.type}
            onChange={(event) => updateField('type', event.target.value)}
            required
          >
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
        </label>
      </div>

      <div className="field-row">
        <label>
          Description
          <input
            type="text"
            value={form.description}
            onChange={(event) => updateField('description', event.target.value)}
            placeholder="e.g. Grocery run"
            required
          />
        </label>
        <label>
          Category
          <input
            type="text"
            value={form.category}
            onChange={(event) => updateField('category', event.target.value)}
            placeholder="e.g. Food"
            required
          />
        </label>
      </div>

      <div className="field-row">
        <label>
          Amount
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.amount}
            onChange={(event) => updateField('amount', event.target.value)}
            required
          />
        </label>
      </div>

      <button type="submit" className="btn primary" disabled={!isValid}>
        {source ? 'Save Changes' : 'Add Transaction'}
      </button>
    </form>
  );
}
