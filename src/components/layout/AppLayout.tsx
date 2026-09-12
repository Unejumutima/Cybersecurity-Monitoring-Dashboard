/**
 * AppLayout.tsx
 * -------------
 * The single WebSocket connection lives here so all child pages share it.
 * State from useSecurityEvents is passed as props to pages that need it.
 * This keeps each page component simple — they just receive data and render.
 */

import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header  from './Header';
import { useSecurityEvents } from '../../hooks/useSecurityEvents';
import type { AppOutletContext } from '../../hooks/useAppContext';

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Single shared WebSocket connection + all derived state
  const securityState = useSecurityEvents();

  const { alertCount, wsStatus, reconnect } = securityState;

  return (
    <div className="flex h-screen overflow-hidden bg-[#0a0e1a]">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header
          onMenuClick={() => setSidebarOpen(true)}
          alertCount={alertCount}
          wsStatus={wsStatus}
          onReconnect={reconnect}
        />

        <main
          id="main-content"
          className="flex-1 overflow-y-auto"
          aria-label="Main content"
        >
          {/* Pass the full security state to all child routes via Outlet context */}
          <Outlet context={securityState satisfies AppOutletContext} />
        </main>
      </div>
    </div>
  );
}
