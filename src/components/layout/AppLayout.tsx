import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header  from './Header';
import { mockAlerts } from '../../data/mockData';

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const unacknowledgedCount = mockAlerts.filter((a) => !a.acknowledged).length;

  return (
    // Full-viewport flex container: sidebar on the left, main on the right
    <div className="flex h-screen overflow-hidden bg-[#0a0e1a]">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content column */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header
          onMenuClick={() => setSidebarOpen(true)}
          alertCount={unacknowledgedCount}
        />

        {/* Scrollable page content */}
        <main
          id="main-content"
          className="flex-1 overflow-y-auto"
          aria-label="Main content"
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
