import { NavLink } from 'react-router-dom';
import {
  ShieldCheckIcon,
  Squares2X2Icon,
  BoltIcon,
  BugAntIcon,
  ChartBarIcon,
  ListBulletIcon,
  DocumentChartBarIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  label: string;
  to: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

const navItems: NavItem[] = [
  { label: 'Dashboard',        to: '/',                icon: Squares2X2Icon       },
  { label: 'Security Events',  to: '/security-events', icon: BoltIcon             },
  { label: 'Analytics',        to: '/analytics',       icon: ChartBarIcon         },
  { label: 'Vulnerabilities',  to: '/vulnerabilities', icon: BugAntIcon           },
  { label: 'OWASP Top 10',     to: '/owasp',           icon: ListBulletIcon       },
  { label: 'Reports',          to: '/reports',         icon: DocumentChartBarIcon },
];

const baseLinkClass =
  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150';
const inactiveLinkClass = 'text-slate-400 hover:text-slate-100 hover:bg-white/5';
const activeLinkClass   = 'text-cyan-400 bg-cyan-500/10 border border-cyan-500/20';

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={[
          'fixed top-0 left-0 z-30 h-full w-64 flex flex-col',
          'bg-[#0d1424] border-r border-slate-800',
          'transition-transform duration-200 ease-in-out',
          isOpen ? 'translate-x-0' : '-translate-x-full',
          'lg:translate-x-0 lg:static lg:z-auto',
        ].join(' ')}
      >
        {/* Logo / brand */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-cyan-500/15 border border-cyan-500/30">
              <ShieldCheckIcon className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <span className="block text-sm font-bold text-slate-100 leading-tight">SecureOps</span>
              <span className="block text-[10px] text-slate-500 uppercase tracking-widest">SOC Dashboard</span>
            </div>
          </div>
          {/* Close button — mobile only */}
          <button
            onClick={onClose}
            className="lg:hidden p-1 rounded text-slate-500 hover:text-slate-300"
            aria-label="Close sidebar"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1" aria-label="Main navigation">
          <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-600">
            Navigation
          </p>
          {navItems.map(({ label, to, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                [baseLinkClass, isActive ? activeLinkClass : inactiveLinkClass].join(' ')
              }
              onClick={onClose}
            >
              <Icon className="w-4.5 h-4.5 shrink-0" aria-hidden="true" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-slate-800">
          <p className="text-[10px] text-slate-600 leading-relaxed">
            Data refreshed every 60 s<br />
            <span className="text-slate-700">© 2024 SecureOps Platform</span>
          </p>
        </div>
      </aside>
    </>
  );
}
