import { useEffect, useRef, useState } from 'react';
import { Task, User } from '../../types';

interface Props {
  task?: Task | null;
  users: User[];
  onClose: () => void;
  onSave: (data: Partial<Task> & { version?: number }) => Promise<Task | null>;
  onEditingChange?: (isEditing: boolean, taskId?: string) => void;
}

const STATUSES: Array<{ value: Task['status']; label: string; color: string }> = [
  { value: 'pending',     label: 'Pending',     color: 'text-amber-600'   },
  { value: 'in-progress', label: 'In Progress', color: 'text-brand-600'   },
  { value: 'completed',   label: 'Completed',   color: 'text-emerald-600' },
];

export function TaskModal({ task, users, onClose, onSave, onEditingChange }: Props) {
  const [title, setTitle]           = useState(task?.title ?? '');
  const [description, setDescription] = useState(task?.description ?? '');
  const [status, setStatus]         = useState<Task['status']>(task?.status ?? 'pending');
  const [assigneeId, setAssigneeId] = useState<string>(() => {
    const a = task?.assignee_id;
    if (!a) return '';
    if (typeof a === 'string') return a;
    return a.id || (a as unknown as { _id?: string })._id || '';
  });
  const [deadline, setDeadline]     = useState(task?.deadline ? task.deadline.slice(0, 10) : '');
  const [titleError, setTitleError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);
  const isEditing = !!task;
  const taskId = task?._id;

  useEffect(() => {
    titleRef.current?.focus();
    if (isEditing && taskId) onEditingChange?.(true, taskId);
    return () => { if (isEditing && taskId) onEditingChange?.(false, taskId); };
  }, [isEditing, onEditingChange, taskId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setTitleError('Title is required'); titleRef.current?.focus(); return; }
    setIsSubmitting(true);
    try {
      const data: Partial<Task> & { version?: number } = {
        title: title.trim(),
        description: description.trim() || undefined,
        status,
        assignee_id: assigneeId || undefined,
        deadline: deadline ? new Date(deadline).toISOString() : undefined,
      };
      if (isEditing) data.version = task.version;
      const result = await onSave(data);
      if (result) onClose();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />

      {/* Panel */}
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg animate-scale-in overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{isEditing ? 'Edit Task' : 'New Task'}</h2>
            <p className="text-sm text-gray-400 mt-0.5">{isEditing ? 'Update task details' : 'Add a task to your board'}</p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all duration-150"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              Title <span className="text-red-400">*</span>
            </label>
            <input
              ref={titleRef}
              type="text"
              value={title}
              onChange={(e) => { setTitle(e.target.value); setTitleError(''); }}
              className={`input ${titleError ? 'input-error' : ''}`}
              placeholder="What needs to be done?"
            />
            {titleError && <p className="text-red-500 text-xs mt-1.5">{titleError}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="input resize-none"
              placeholder="Add more context (optional)…"
            />
          </div>

          {/* Status + Deadline row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as Task['status'])}
                className="input"
              >
                {STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Deadline</label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="input"
              />
            </div>
          </div>

          {/* Assignee */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Assignee</label>
            <select
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              className="input"
            >
              <option value="">Unassigned</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.email}</option>
              ))}
            </select>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="btn-primary">
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Saving…
                </span>
              ) : isEditing ? 'Save changes' : 'Create task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
