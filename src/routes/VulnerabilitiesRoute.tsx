// VulnerabilitiesPage manages its own data via useVulnerabilities hook —
// no shared WS state needed here.
import VulnerabilitiesPage from '../pages/VulnerabilitiesPage';

export default function VulnerabilitiesRoute() {
  return <VulnerabilitiesPage />;
}
