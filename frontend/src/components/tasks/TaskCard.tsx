import { Task, User } from '../../types';

interface EditingUser { userId: string; userEmail: string }

interface Props {
  task: Task;
  currentUserId: string;
  editingUsers: EditingUser[];
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

const STATUS = {
  pending:     { label: 'Pending',     dot: 'bg-amber-400',   badge: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',  border: 'border-l-amber-400'   },
  'in-progress': { label: 'In Progress', dot: 'bg-brand-500',  badge: 'bg-brand-50 text-brand-700 ring-1 ring-brand-200',  border: 'border-l-brand-500'   },
  completed:   { label: 'Completed',   dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200', border: 'border-l-emerald-500' },
};

function getEmail(val: string | User | undefined): string {
  if (!val) return '';
  if (typeof val === 'string') return val;
  return val.email;
}

function getId(val: string | User | undefined): string {
  if (!val) return '';
  if (typeof val === 'string') return val;
  return val.id || (val as unknown as { _id?: string })._id || '';
}

function Avatar({ email, size = 'sm' }: { email: string; size?: 'sm' | 'xs' }) {
  const s = size === 'sm' ? 'w-6 h-6 text-xs' : 'w-5 h-5 text-[10px]';
  const hue = email.charCodeAt(0) % 6;
  const colors = [
    'bg-violet-500', 'bg-sky-500', 'bg-emerald-500',
    'bg-amber-500', 'bg-rose-500', 'bg-indigo-500',
  ];
  return (
    <div
      className={`${s} ${colors[hue]} rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 ring-2 ring-white`}
      title={email}
    >
      {email.slice(0, 2).toUpperCase()}
    </div>
  );
}

export function TaskCard({ task, currentUserId, editingUsers, onEdit, onDelete }: Props) {
  const creatorEmail  = getEmail(task.creator_id);
  const assigneeEmail = getEmail(task.assignee_id);
  const creatorId     = getId(task.creator_id);
  const isCreator     = creatorId === currentUserId;
  const canEdit       = isCreator || getId(task.assignee_id) === currentUserId;

  const deadline  = task.deadline ? new Date(task.deadline) : null;
  const isOverdue = deadline && deadline < new Date() && task.status !== 'completed';

  const s = STATUS[task.status];
  const MAX_EDITORS = 2;

  return (
    <div className={`card p-0 overflow-hidden border-l-4 ${s.border} group`}>
      <div className="p-5">
        {/* Top row: badge + editors + actions */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full ${s.badge}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
              {s.label}
            </span>
            {isOverdue && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-red-50 text-red-600 ring-1 ring-red-200">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                </svg>
                Overdue
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            {/* Editing indicators — always visible, with pulsing dot */}
            {editingUsers.length > 0 && (
              <div
                className="flex items-center gap-1.5 mr-1 px-2 py-0.5 rounded-full bg-amber-50 ring-1 ring-amber-200 animate-pulse"
                title={`${editingUsers.map((u) => u.userEmail).join(', ')} editing`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                <div className="flex -space-x-1.5">
                  {editingUsers.slice(0, MAX_EDITORS).map((u) => (
                    <Avatar key={u.userId} email={u.userEmail} size="xs" />
                  ))}
                  {editingUsers.length > MAX_EDITORS && (
                    <div className="w-5 h-5 rounded-full bg-gray-200 text-gray-600 text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
                      +{editingUsers.length - MAX_EDITORS}
                    </div>
                  )}
                </div>
                <span className="text-[10px] font-semibold text-amber-700 uppercase tracking-wide">Editing</span>
              </div>
            )}

            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
            {canEdit && (
              <button
                onClick={() => onEdit(task)}
                aria-label="Edit task"
                className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-all duration-150 active:scale-95"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            )}
            {isCreator && (
              <button
                onClick={() => onDelete(task._id)}
                aria-label="Delete task"
                className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-150 active:scale-95"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
            </div>
          </div>
        </div>

        {/* Title */}
        <h3 className="font-semibold text-gray-900 leading-snug mb-1 pr-2">{task.title}</h3>

        {/* Description */}
        {task.description && (
          <p className="text-sm text-gray-500 line-clamp-2 mb-3">{task.description}</p>
        )}

        {/* Footer row */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
          <div className="flex items-center gap-1.5 min-w-0">
            {assigneeEmail ? (
              <>
                <Avatar email={assigneeEmail} />
                <span className="text-xs text-gray-500 truncate">{assigneeEmail}</span>
              </>
            ) : (
              <span className="text-xs text-gray-400 italic">Unassigned</span>
            )}
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {deadline && (
              <span className={`text-xs font-medium ${isOverdue ? 'text-red-500' : 'text-gray-400'}`}>
                {deadline.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Creator strip */}
      {creatorEmail && (
        <div className="px-5 py-1.5 bg-gray-50 border-t border-gray-100 text-xs text-gray-400">
          by <span className="font-medium text-gray-500">{creatorEmail}</span>
        </div>
      )}
    </div>
  );
}
