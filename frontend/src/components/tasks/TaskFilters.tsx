import { useEffect, useRef, useState } from 'react';
import { User, TaskFilters as Filters } from '../../types';

interface Props {
  users: User[];
  onChange: (filters: Filters) => void;
}

const STATUS_OPTIONS = [
  { value: '',            label: 'All',         dot: '' },
  { value: 'pending',     label: 'Pending',     dot: 'bg-amber-400' },
  { value: 'in-progress', label: 'In Progress', dot: 'bg-brand-500' },
  { value: 'completed',   label: 'Completed',   dot: 'bg-emerald-500' },
];

export function TaskFilters({ users, onChange }: Props) {
  const [status, setStatus] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasMountedRef = useRef(false);

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const f: Filters = {};
      if (status) f.status = status;
      if (assigneeId) f.assignee_id = assigneeId;
      if (from) f.from = from;
      if (to) f.to = to;
      onChange(f);
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [status, assigneeId, from, to, onChange]);

  function reset() {
    setStatus('');
    setAssigneeId('');
    setFrom('');
    setTo('');
  }

  const hasFilters = !!(status || assigneeId || from || to);

  return (
    <div className="space-y-3">
      {/* Status pills */}
      <div className="flex flex-wrap gap-2">
        {STATUS_OPTIONS.map((opt) => {
          const active = status === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => setStatus(opt.value)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-150 ${
                active
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-brand-300 hover:text-brand-700'
              }`}
            >
              {opt.dot && <span className={`w-1.5 h-1.5 rounded-full ${opt.dot}`} />}
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* Secondary filters row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Assignee */}
        <select
          value={assigneeId}
          onChange={(e) => setAssigneeId(e.target.value)}
          className={`text-sm rounded-xl px-3 py-2 border transition-all duration-150 min-h-[38px] bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent ${
            assigneeId ? 'border-brand-400 text-brand-700' : 'border-gray-200 text-gray-600'
          }`}
        >
          <option value="">All assignees</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>{u.email}</option>
          ))}
        </select>

        {/* Date range */}
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className={`text-sm rounded-xl px-3 py-2 border transition-all duration-150 min-h-[38px] bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent ${
              from ? 'border-brand-400 text-brand-700' : 'border-gray-200 text-gray-500'
            }`}
          />
          <span className="text-gray-400 text-xs">→</span>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className={`text-sm rounded-xl px-3 py-2 border transition-all duration-150 min-h-[38px] bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent ${
              to ? 'border-brand-400 text-brand-700' : 'border-gray-200 text-gray-500'
            }`}
          />
        </div>

        {hasFilters && (
          <button
            onClick={reset}
            className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-red-500 transition-colors duration-150 min-h-[38px] px-2"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
