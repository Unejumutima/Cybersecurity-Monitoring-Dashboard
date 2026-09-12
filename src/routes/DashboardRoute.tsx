/**
 * DashboardRoute.tsx
 * ------------------
 * Thin wrapper: pulls shared WebSocket state from AppLayout context
 * and passes it as explicit props to DashboardPage.
 * Keeps DashboardPage testable — it accepts plain props, not React context.
 */
import { useAppContext } from '../hooks/useAppContext';
import DashboardPage    from '../pages/DashboardPage';

export default function DashboardRoute() {
  const { events, kpis, trendData, distribution, wsStatus } = useAppContext();
  return (
    <DashboardPage
      liveEvents={events}
      kpis={kpis}
      trendData={trendData}
      distribution={distribution}
      wsStatus={wsStatus}
    />
  );
}
