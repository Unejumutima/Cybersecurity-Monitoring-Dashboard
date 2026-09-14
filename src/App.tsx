import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout             from './components/layout/AppLayout';
import DashboardRoute        from './routes/DashboardRoute';
import SecurityEventsRoute   from './routes/SecurityEventsRoute';
import AnalyticsRoute        from './routes/AnalyticsRoute';
import VulnerabilitiesRoute  from './routes/VulnerabilitiesRoute';
import OWASPRoute            from './routes/OWASPRoute';
import ReportsRoute          from './routes/ReportsRoute';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index                  element={<DashboardRoute />} />
          <Route path="security-events" element={<SecurityEventsRoute />} />
          <Route path="analytics"       element={<AnalyticsRoute />} />
          <Route path="vulnerabilities" element={<VulnerabilitiesRoute />} />

          <Route path="owasp" element={<OWASPRoute />} />
          <Route path="reports" element={<ReportsRoute />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
