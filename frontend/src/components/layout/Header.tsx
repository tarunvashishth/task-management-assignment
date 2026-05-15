import { useAuth } from '../../context/AuthContext';
import { ConnectionIndicator } from '../ui/ConnectionIndicator';
import { ConnectionState } from '../../types';

interface Props {
  connectionState: ConnectionState;
}

export function Header({ connectionState }: Props) {
  const { user, logout } = useAuth();

  return (
    <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 flex items-center justify-between">
      <h1 className="text-lg font-semibold text-gray-800">TaskManager</h1>

      <div className="flex items-center gap-4">
        <ConnectionIndicator state={connectionState} />

        {user && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600 hidden sm:block">{user.email}</span>
            <button
              onClick={logout}
              className="text-sm text-gray-500 hover:text-red-500 transition-colors min-h-[44px] px-3"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
