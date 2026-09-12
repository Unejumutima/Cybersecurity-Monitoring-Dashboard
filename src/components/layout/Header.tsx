import { Bars3Icon, BellIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { ShieldExclamationIcon } from '@heroicons/react/24/solid';

interface HeaderProps {
  onMenuClick: () => void;
  /** Number of unacknowledged alerts */
  alertCount: number;
}

export default function Header({ onMenuClick, alertCount }: HeaderProps) {
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between gap-4 px-4 py-3 bg-[#0a0e1a]/90 backdrop-blur border-b border-slate-800">
      {/* Left — hamburger + page context */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-white/5"
          aria-label="Open navigation menu"
        >
          <Bars3Icon className="w-5 h-5" />
        </button>

        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500">
          <ShieldExclamationIcon className="w-4 h-4 text-cyan-500" />
          <span>Threat Level:</span>
          <span className="font-semibold text-red-400">HIGH</span>
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
        </div>
      </div>

      {/* Right — search + notifications + user */}
      <div className="flex items-center gap-2">
        {/* Search */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/50 text-slate-400 text-sm">
          <MagnifyingGlassIcon className="w-4 h-4 shrink-0" />
          <span className="text-slate-600 text-xs">Search events…</span>
          <kbd className="ml-2 px-1.5 py-0.5 text-[10px] rounded bg-slate-700 text-slate-500 font-mono">⌘K</kbd>
        </div>

        {/* Bell with badge */}
        <button
          className="relative p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-white/5"
          aria-label={`${alertCount} unacknowledged alerts`}
        >
          <BellIcon className="w-5 h-5" />
          {alertCount > 0 && (
            <span className="absolute top-1 right-1 flex items-center justify-center w-4 h-4 rounded-full bg-red-500 text-[9px] font-bold text-white leading-none">
              {alertCount > 9 ? '9+' : alertCount}
            </span>
          )}
        </button>

        {/* User avatar */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-700">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-xs font-bold text-white select-none">
            SO
          </div>
          <div className="hidden sm:block">
            <p className="text-xs font-medium text-slate-300 leading-tight">SOC Analyst</p>
            <p className="text-[10px] text-slate-600 leading-tight">Tier 1</p>
          </div>
        </div>
      </div>
    </header>
  );
}
