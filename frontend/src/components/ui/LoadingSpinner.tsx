export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const s = { sm: 'w-4 h-4 border-2', md: 'w-8 h-8 border-2', lg: 'w-10 h-10 border-[3px]' }[size];
  return (
    <div className={`${s} border-brand-500 border-t-transparent rounded-full animate-spin`} />
  );
}

export function SkeletonCard() {
  return (
    <div className="card p-5 pointer-events-none">
      <div className="flex items-center gap-2 mb-3">
        <div className="skeleton h-5 w-20" />
      </div>
      <div className="skeleton h-4 w-3/4 mb-2" />
      <div className="skeleton h-3 w-1/2 mb-4" />
      <div className="flex items-center gap-2">
        <div className="skeleton h-6 w-6 rounded-full" />
        <div className="skeleton h-3 w-28" />
      </div>
    </div>
  );
}
