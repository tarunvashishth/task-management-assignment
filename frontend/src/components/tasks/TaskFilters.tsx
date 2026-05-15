import { useEffect, useRef, useState } from 'react';
import { User, TaskFilters as Filters } from '../../types';

interface Props {
  users: User[];
  onChange: (filters: Filters) => void;
}

export function TaskFilters({ users, onChange }: Props) {
  const [status, setStatus] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const f: Filters = {};
      if (status) f.status = status;
      if (assigneeId) f.assignee_id = assigneeId;
      if (from) f.from = from;
      if (to) f.to = to;
      onChange(f);
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [status, assigneeId, from, to, onChange]);

  function reset() {
    setStatus('');
    setAssigneeId('');
    setFrom('');
    setTo('');
  }

  const hasFilters = !!(status || assigneeId || from || to);

  return (
    <div className="flex flex-wrap gap-3 items-center">
      <select
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white min-h-[44px]"
      >
        <option value="">All statuses</option>
        <option value="pending">Pending</option>
        <option value="in-progress">In Progress</option>
        <option value="completed">Completed</option>
      </select>

      <select
        value={assigneeId}
        onChange={(e) => setAssigneeId(e.target.value)}
        className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white min-h-[44px]"
      >
        <option value="">All assignees</option>
        {users.map((u) => (
          <option key={u.id} value={u.id}>{u.email}</option>
        ))}
      </select>

      <div className="flex items-center gap-2">
        <label className="text-sm text-gray-500">From</label>
        <input
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 min-h-[44px]"
        />
      </div>

      <div className="flex items-center gap-2">
        <label className="text-sm text-gray-500">To</label>
        <input
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 min-h-[44px]"
        />
      </div>

      {hasFilters && (
        <button
          onClick={reset}
          className="text-sm text-blue-500 hover:text-blue-700 min-h-[44px] px-2"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
