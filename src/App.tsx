import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout       from './components/layout/AppLayout';
import DashboardPage   from './pages/DashboardPage';
import PlaceholderPage from './pages/PlaceholderPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          {/* Default route */}
          <Route index element={<DashboardPage />} />

          {/* Security Events — Phase 2 */}
          <Route
            path="security-events"
            element={
              <PlaceholderPage
                title="Security Events"
                description="Full event log with filtering, search, and detailed event drill-down. Coming in Phase 2."
              />
            }
          />

          {/* Vulnerabilities — Phase 2 */}
          <Route
            path="vulnerabilities"
            element={
              <PlaceholderPage
                title="Vulnerabilities"
                description="CVE tracking, CVSS scoring, asset mapping, and remediation workflow. Coming in Phase 2."
              />
            }
          />

          {/* OWASP Top 10 — Phase 3 */}
          <Route
            path="owasp"
            element={
              <PlaceholderPage
                title="OWASP Top 10"
                description="Compliance posture per OWASP category with finding counts and trend tracking. Coming in Phase 3."
              />
            }
          />

          {/* Reports — Phase 4 */}
          <Route
            path="reports"
            element={
              <PlaceholderPage
                title="Reports"
                description="Exportable PDF security reports, executive summaries, and scheduled delivery. Coming in Phase 4."
              />
            }
          />

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
