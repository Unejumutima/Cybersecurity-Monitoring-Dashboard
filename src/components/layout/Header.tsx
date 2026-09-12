import { Bars3Icon, BellIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { ShieldExclamationIcon } from '@heroicons/react/24/solid';
import type { WsStatus } from '../../hooks/useWebSocket';

interface HeaderProps {
  onMenuClick: () => void;
  alertCount:  number;
  wsStatus:    WsStatus;
  onReconnect: () => void;
}

// Label + colour per connection state
const WS_STATUS_CONFIG: Record<WsStatus, { label: string; dot: string; text: string }> = {
  connected:    { label: 'Connected',    dot: 'bg-emerald-500',              text: 'text-emerald-400' },
  connecting:   { label: 'Connecting…',  dot: 'bg-yellow-500 animate-pulse', text: 'text-yellow-400' },
  reconnecting: { label: 'Reconnecting…',dot: 'bg-orange-500 animate-pulse', text: 'text-orange-400' },
  disconnected: { label: 'Disconnected', dot: 'bg-red-500',                  text: 'text-red-400'    },
};

export default function Header({ onMenuClick, alertCount, wsStatus, onReconnect }: HeaderProps) {
  const wsCfg = WS_STATUS_CONFIG[wsStatus];

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between gap-4 px-4 py-3 bg-[#0a0e1a]/90 backdrop-blur border-b border-slate-800">

      {/* Left — hamburger + threat level */}
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

      {/* Right — WS status + search + bell + user */}
      <div className="flex items-center gap-2">

        {/* WebSocket connection status */}
        <button
          onClick={wsStatus === 'disconnected' ? onReconnect : undefined}
          title={wsStatus === 'disconnected' ? 'Click to reconnect' : `WebSocket: ${wsCfg.label}`}
          className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-colors
            ${wsStatus === 'connected'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              : wsStatus === 'disconnected'
              ? 'bg-red-500/10 border-red-500/20 text-red-400 cursor-pointer hover:bg-red-500/20'
              : 'bg-slate-800/60 border-slate-700 text-slate-400'
            }`}
          aria-label={`WebSocket status: ${wsCfg.label}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${wsCfg.dot}`} aria-hidden="true" />
          <span className={wsCfg.text}>{wsCfg.label}</span>
        </button>

        {/* Search box */}
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
