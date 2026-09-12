/**
 * SecurityEventsRoute.tsx
 * -----------------------
 * Thin wrapper: pulls shared state and forwards to SecurityEventsPage.
 */
import { useAppContext } from '../hooks/useAppContext';
import SecurityEventsPage from '../pages/SecurityEventsPage';

export default function SecurityEventsRoute() {
  const { events, wsStatus, reconnect } = useAppContext();
  return (
    <SecurityEventsPage
      events={events}
      isConnected={wsStatus === 'connected'}
      onReconnect={reconnect}
    />
  );
}
