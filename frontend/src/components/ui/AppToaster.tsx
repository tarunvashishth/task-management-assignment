import { Toaster, ToastIcon, toast, resolveValue } from 'react-hot-toast';

const TOAST_DURATION_MS = 20000;

const TYPE_STYLES: Record<string, { ring: string; bar: string; iconBg: string }> = {
  success: {
    ring: 'ring-emerald-100',
    bar: 'bg-emerald-400',
    iconBg: 'bg-emerald-50 text-emerald-600',
  },
  error: {
    ring: 'ring-red-100',
    bar: 'bg-red-400',
    iconBg: 'bg-red-50 text-red-600',
  },
  loading: {
    ring: 'ring-brand-100',
    bar: 'bg-brand-400',
    iconBg: 'bg-brand-50 text-brand-600',
  },
  blank: {
    ring: 'ring-gray-100',
    bar: 'bg-gray-300',
    iconBg: 'bg-gray-50 text-gray-600',
  },
};

export function AppToaster() {
  return (
    <Toaster
      position="top-right"
      gutter={12}
      toastOptions={{
        duration: TOAST_DURATION_MS,
      }}
      containerStyle={{ top: 16, right: 16 }}
    >
      {(t) => {
        const styles = TYPE_STYLES[t.type] ?? TYPE_STYLES.blank;
        const duration = t.duration ?? TOAST_DURATION_MS;
        return (
          <div
            role="status"
            aria-live="polite"
            className={`pointer-events-auto relative overflow-hidden bg-white rounded-2xl shadow-2xl ring-1 ${styles.ring} min-w-[320px] max-w-[420px] ${t.visible ? 'animate-toast-in' : 'animate-toast-out'}`}
          >
            <div className="flex items-start gap-3 px-5 py-4 pr-3">
              <div className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center ${styles.iconBg}`}>
                <ToastIcon toast={t} />
              </div>

              <div className="flex-1 min-w-0 pt-1.5 text-[15px] leading-snug text-gray-800 font-medium break-words">
                {resolveValue(t.message, t)}
              </div>

              <button
                type="button"
                onClick={() => toast.dismiss(t.id)}
                aria-label="Dismiss notification"
                className="flex-shrink-0 w-8 h-8 -mr-1 -mt-0.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 active:scale-95 transition-all duration-150 flex items-center justify-center"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-100">
              <div
                className={`h-full origin-left ${styles.bar}`}
                style={{
                  animation: t.visible
                    ? `toast-progress ${duration}ms linear forwards`
                    : 'none',
                }}
              />
            </div>
          </div>
        );
      }}
    </Toaster>
  );
}
