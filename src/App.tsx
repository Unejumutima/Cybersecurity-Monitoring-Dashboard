import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout             from './components/layout/AppLayout';
import DashboardRoute        from './routes/DashboardRoute';
import SecurityEventsRoute   from './routes/SecurityEventsRoute';
import AnalyticsRoute        from './routes/AnalyticsRoute';
import VulnerabilitiesRoute  from './routes/VulnerabilitiesRoute';
import PlaceholderPage       from './pages/PlaceholderPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index                  element={<DashboardRoute />} />
          <Route path="security-events" element={<SecurityEventsRoute />} />
          <Route path="analytics"       element={<AnalyticsRoute />} />
          <Route path="vulnerabilities" element={<VulnerabilitiesRoute />} />

          <Route
            path="owasp"
            element={
              <PlaceholderPage
                title="OWASP Top 10"
                description="Compliance posture per OWASP category with finding counts and trend tracking. Coming in Phase 4."
              />
            }
          />
          <Route
            path="reports"
            element={
              <PlaceholderPage
                title="Reports"
                description="Exportable PDF security reports, executive summaries, and scheduled delivery. Coming in Phase 5."
              />
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
