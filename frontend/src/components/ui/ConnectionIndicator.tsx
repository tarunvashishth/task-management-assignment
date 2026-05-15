import { ConnectionState } from '../../types';

interface Props {
  state: ConnectionState;
}

const CONFIG = {
  connected: { color: 'bg-green-500', label: 'Connected' },
  connecting: { color: 'bg-yellow-500', label: 'Reconnecting...' },
  disconnected: { color: 'bg-red-500', label: 'Disconnected' },
};

export function ConnectionIndicator({ state }: Props) {
  const { color, label } = CONFIG[state];

  return (
    <div className="flex items-center gap-1.5 text-sm text-gray-500">
      <span className={`w-2 h-2 rounded-full ${color}`} />
      <span>{label}</span>
    </div>
  );
}
