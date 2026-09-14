import { useAppContext } from '../hooks/useAppContext';
import AnalyticsPage   from '../pages/AnalyticsPage';

export default function AnalyticsRoute() {
  const { events, trendData, distribution, eventTypeCounts, topEndpoints, topSources, wsStatus, reconnect } =
    useAppContext();
  return (
    <AnalyticsPage
      liveEvents={events}
      trendData={trendData}
      distribution={distribution}
      eventTypeCounts={eventTypeCounts}
      topEndpoints={topEndpoints}
      topSources={topSources}
      wsStatus={wsStatus}
      onReconnect={reconnect}
    />
  );
}
