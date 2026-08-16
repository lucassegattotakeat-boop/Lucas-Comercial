import clsx from 'clsx';

export function Pill({ tone, children }: { tone: 'green' | 'red' | 'slate'; children: React.ReactNode }) {
  return (
    <span
      className={clsx('inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium', {
        'bg-emerald-100 text-emerald-700': tone === 'green',
        'bg-red-100 text-red-700': tone === 'red',
        'bg-slate-100 text-slate-600': tone === 'slate',
      })}
    >
      {children}
    </span>
  );
}
