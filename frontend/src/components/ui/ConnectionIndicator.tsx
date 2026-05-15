import { ConnectionState } from '../../types';

interface Props { state: ConnectionState }

const CONFIG = {
  connected:    { dot: 'bg-emerald-400', ring: 'bg-emerald-400', label: 'Connected',      text: 'text-emerald-300' },
  connecting:   { dot: 'bg-amber-400',   ring: 'bg-amber-400',   label: 'Connecting…',   text: 'text-amber-300'   },
  disconnected: { dot: 'bg-red-400',     ring: 'bg-red-400',     label: 'Disconnected',   text: 'text-red-300'     },
};

export function ConnectionIndicator({ state }: Props) {
  const { dot, ring, label, text } = CONFIG[state];
  const pulse = state === 'connected';

  return (
    <div className="flex items-center gap-1.5">
      <span className="relative flex h-2 w-2">
        {pulse && (
          <span className={`animate-ping-slow absolute inline-flex h-full w-full rounded-full ${ring} opacity-60`} />
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${dot}`} />
      </span>
      <span className={`text-xs font-medium hidden sm:block ${text}`}>{label}</span>
    </div>
  );
}
