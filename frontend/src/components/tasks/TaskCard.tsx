import { Task, User } from '../../types';

interface EditingUser {
  userId: string;
  userEmail: string;
}

interface Props {
  task: Task;
  currentUserId: string;
  editingUsers: EditingUser[];
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

const STATUS_STYLES = {
  pending: 'bg-gray-100 text-gray-600',
  'in-progress': 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
};

const STATUS_LABELS = {
  pending: 'Pending',
  'in-progress': 'In Progress',
  completed: 'Completed',
};

function getEmail(val: string | User | undefined): string {
  if (!val) return '';
  if (typeof val === 'string') return val;
  return val.email;
}

function getId(val: string | User | undefined): string {
  if (!val) return '';
  if (typeof val === 'string') return val;
  // Populated Mongoose lean docs use _id; auth endpoints normalize to id
  return val.id || (val as unknown as { _id?: string })._id || '';
}

function Initials({ email }: { email: string }) {
  const initials = email.slice(0, 2).toUpperCase();
  return (
    <div
      className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center flex-shrink-0"
      title={email}
    >
      {initials}
    </div>
  );
}

export function TaskCard({ task, currentUserId, editingUsers, onEdit, onDelete }: Props) {
  const creatorEmail = getEmail(task.creator_id);
  const assigneeEmail = getEmail(task.assignee_id);
  const creatorId = getId(task.creator_id);
  const isCreator = creatorId === currentUserId;
  const canEdit = isCreator || getId(task.assignee_id) === currentUserId;

  const deadline = task.deadline ? new Date(task.deadline) : null;
  const isOverdue = deadline && deadline < new Date() && task.status !== 'completed';

  const MAX_VISIBLE = 2;
  const visibleEditors = editingUsers.slice(0, MAX_VISIBLE);
  const overflow = editingUsers.length - MAX_VISIBLE;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_STYLES[task.status]}`}>
              {STATUS_LABELS[task.status]}
            </span>
            {isOverdue && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-600">Overdue</span>
            )}
          </div>

          <h3 className="font-medium text-gray-800 truncate">{task.title}</h3>

          {task.description && (
            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{task.description}</p>
          )}

          <div className="flex items-center gap-3 mt-2 flex-wrap">
            {assigneeEmail && (
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Initials email={assigneeEmail} />
                <span>{assigneeEmail}</span>
              </div>
            )}

            {deadline && (
              <span className={`text-xs ${isOverdue ? 'text-red-500' : 'text-gray-400'}`}>
                Due {deadline.toLocaleDateString()}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Editing users avatar chips */}
          {editingUsers.length > 0 && (
            <div className="flex items-center -space-x-1 mr-2">
              {visibleEditors.map((u) => (
                <Initials key={u.userId} email={u.userEmail} />
              ))}
              {overflow > 0 && (
                <div className="w-6 h-6 rounded-full bg-gray-300 text-gray-600 text-xs flex items-center justify-center">
                  +{overflow}
                </div>
              )}
            </div>
          )}

          {canEdit && (
            <button
              onClick={() => onEdit(task)}
              className="p-1.5 text-gray-400 hover:text-blue-500 transition-colors rounded min-w-[44px] min-h-[44px] flex items-center justify-center"
              title="Edit task"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          )}

          {isCreator && (
            <button
              onClick={() => onDelete(task._id)}
              className="p-1.5 text-gray-400 hover:text-red-500 transition-colors rounded min-w-[44px] min-h-[44px] flex items-center justify-center"
              title="Delete task"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="mt-2 text-xs text-gray-400">
        by {creatorEmail}
      </div>
    </div>
  );
}
