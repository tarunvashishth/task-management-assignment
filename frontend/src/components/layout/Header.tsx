import { useAuth } from '../../context/AuthContext';
import { ConnectionIndicator } from '../ui/ConnectionIndicator';
import { ConnectionState } from '../../types';

interface Props {
  connectionState: ConnectionState;
}

export function Header({ connectionState }: Props) {
  const { user, logout } = useAuth();
  const initials = user?.email.slice(0, 2).toUpperCase() ?? '';

  return (
    <header className="bg-gradient-to-r from-slate-900 via-brand-900 to-slate-900 px-4 sm:px-6 flex items-center justify-between h-14 sticky top-0 z-30 shadow-lg">
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-brand-500 flex items-center justify-center shadow">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        </div>
        <span className="text-white font-bold tracking-tight text-base">TaskManager</span>
      </div>

      <div className="flex items-center gap-3">
        <ConnectionIndicator state={connectionState} />
        {user && (
          <div className="flex items-center gap-2 pl-3 border-l border-white/10">
            <div className="w-7 h-7 rounded-full bg-brand-500 flex items-center justify-center text-white text-xs font-bold select-none">
              {initials}
            </div>
            <span className="text-sm text-white/70 hidden sm:block">{user.email}</span>
            <button
              onClick={logout}
              className="text-xs text-white/50 hover:text-white hover:bg-white/10 rounded-lg px-2.5 py-1.5 transition-all duration-150 min-h-[32px] ml-1"
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
