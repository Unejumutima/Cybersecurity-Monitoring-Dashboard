/**
 * routes/vulnerabilities.ts
 * -------------------------
 * REST API endpoints for vulnerability data.
 *
 * GET  /api/vulnerabilities           → list with optional ?severity= and ?status= filters
 * GET  /api/vulnerabilities/summary   → severity counts only (lightweight)
 * GET  /api/vulnerabilities/:id       → single vulnerability detail
 *
 * All data is MOCK/DEMO. The note field in every response makes this explicit.
 */

import { Router, type Request, type Response } from 'express';
import { query, param, validationResult } from 'express-validator';
import { mockVulnerabilities } from '../data/vulnerabilities';
import type {
  VulnSeverity,
  VulnStatus,
  VulnerabilitiesResponse,
  VulnerabilityDetailResponse,
} from '../types/vulnerability';

const router = Router();

const DEMO_NOTE =
  'This data is mock/demo data for portfolio demonstration purposes. ' +
  'It does not represent real vulnerability advisories or real systems.';

// ── Helper ────────────────────────────────────────────────────────────────────

function buildBySeverity(vulns: typeof mockVulnerabilities): Record<VulnSeverity, number> {
  return {
    critical:      vulns.filter((v) => v.severity === 'critical').length,
    high:          vulns.filter((v) => v.severity === 'high').length,
    medium:        vulns.filter((v) => v.severity === 'medium').length,
    low:           vulns.filter((v) => v.severity === 'low').length,
    informational: vulns.filter((v) => v.severity === 'informational').length,
  };
}

// ── GET /api/vulnerabilities ──────────────────────────────────────────────────

const validSeverities = ['critical', 'high', 'medium', 'low', 'informational'];
const validStatuses = ['open', 'in_remediation', 'resolved', 'accepted_risk'];

router.get(
  '/',
  // Validation middleware
  query('severity')
    .optional()
    .custom((value) => {
      const severities = value.split(',').map((s: string) => s.trim());
      return severities.every((s: string) => validSeverities.includes(s));
    })
    .withMessage('Invalid severity value'),
  query('status')
    .optional()
    .custom((value) => {
      const statuses = value.split(',').map((s: string) => s.trim());
      return statuses.every((s: string) => validStatuses.includes(s));
    })
    .withMessage('Invalid status value'),
  (req: Request, res: Response) => {
    // Check validation results
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array(), note: DEMO_NOTE });
      return;
    }

    const { severity, status } = req.query;

    let results = [...mockVulnerabilities];

    if (severity && typeof severity === 'string') {
      const severities = severity.split(',').map((s) => s.trim()) as VulnSeverity[];
      results = results.filter((v) => severities.includes(v.severity));
    }

    if (status && typeof status === 'string') {
      const statuses = status.split(',').map((s) => s.trim()) as VulnStatus[];
      results = results.filter((v) => statuses.includes(v.status));
    }

    // Always sort: critical first, then by CVSS score descending
    const severityOrder: Record<VulnSeverity, number> = {
      critical: 0, high: 1, medium: 2, low: 3, informational: 4,
    };
    results.sort((a, b) => {
      const sevDiff = severityOrder[a.severity] - severityOrder[b.severity];
      return sevDiff !== 0 ? sevDiff : b.cvssScore - a.cvssScore;
    });

    const body: VulnerabilitiesResponse = {
      data:       results,
      total:      results.length,
      bySeverity: buildBySeverity(results),
      note:       DEMO_NOTE,
    };

    res.json(body);
  }
);

// ── GET /api/vulnerabilities/summary ─────────────────────────────────────────

router.get('/summary', (_req: Request, res: Response) => {
  res.json({
    total:      mockVulnerabilities.length,
    bySeverity: buildBySeverity(mockVulnerabilities),
    byStatus: {
      open:          mockVulnerabilities.filter((v) => v.status === 'open').length,
      in_remediation:mockVulnerabilities.filter((v) => v.status === 'in_remediation').length,
      resolved:      mockVulnerabilities.filter((v) => v.status === 'resolved').length,
      accepted_risk: mockVulnerabilities.filter((v) => v.status === 'accepted_risk').length,
    },
    note: DEMO_NOTE,
  });
});

// ── GET /api/vulnerabilities/:id ──────────────────────────────────────────────

router.get(
  '/:id',
  // Validation middleware
  param('id')
    .trim()
    .matches(/^VULN-\d{4}$/)
    .withMessage('Invalid vulnerability ID format. Expected format: VULN-0001'),
  (req: Request, res: Response) => {
    // Check validation results
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array(), note: DEMO_NOTE });
      return;
    }

    const vuln = mockVulnerabilities.find((v) => v.id === req.params.id);

    if (!vuln) {
      res.status(404).json({ error: `Vulnerability ${req.params.id} not found`, note: DEMO_NOTE });
      return;
    }

    const body: VulnerabilityDetailResponse = { data: vuln, note: DEMO_NOTE };
    res.json(body);
  }
);

export default router;
