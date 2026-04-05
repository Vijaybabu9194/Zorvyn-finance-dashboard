import { useFinance } from '../state/FinanceContext';

export default function RoleSwitcher() {
  const { state, dispatch } = useFinance();

  return (
    <div className="role-switcher">
      <label htmlFor="role-select">Role</label>
      <select
        id="role-select"
        value={state.role}
        onChange={(event) => dispatch({ type: 'SET_ROLE', payload: event.target.value })}
      >
        <option value="viewer">Viewer</option>
        <option value="admin">Admin</option>
      </select>
    </div>
  );
}
