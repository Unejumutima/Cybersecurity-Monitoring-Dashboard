import { WrenchScrewdriverIcon } from '@heroicons/react/24/outline';

interface PlaceholderPageProps {
  title: string;
  description: string;
}

/**
 * Temporary stub page for nav sections that will be built in later phases.
 * Keeps routing wired up without any fake content.
 */
export default function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
      <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-800/60 border border-slate-700 mb-5">
        <WrenchScrewdriverIcon className="w-8 h-8 text-slate-500" aria-hidden="true" />
      </div>
      <h1 className="text-xl font-bold text-slate-200 mb-2">{title}</h1>
      <p className="text-sm text-slate-500 max-w-sm">{description}</p>
      <span className="mt-5 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-xs font-medium text-cyan-400">
        Planned for a future phase
      </span>
    </div>
  );
}
