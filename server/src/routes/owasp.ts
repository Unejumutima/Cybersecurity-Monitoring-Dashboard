/**
 * routes/owasp.ts
 * ---------------
 * REST API endpoints for OWASP Top 10 posture data.
 *
 * GET  /api/owasp          → all 10 categories + overall score
 * GET  /api/owasp/:id      → single category detail (e.g. /api/owasp/A01:2021)
 *
 * Scores are computed fresh on every request from the mock vulnerability
 * dataset. In a production system these would be derived from real scanner
 * output.
 *
 * IMPORTANT: The "compliance score" is an estimated security posture metric
 * based on demo data. This is NOT a formal OWASP audit or certification.
 */

import { Router, type Request, type Response } from 'express';
import { mockVulnerabilities } from '../data/vulnerabilities';
import { computeOWASPCategories, computeOverallScore, scoreToPostureBand } from '../owasp/scoringEngine';
import type { OWASPResponse, OWASPCategoryResponse, PostureBand } from '../types/owasp';

const router = Router();

const DEMO_NOTE =
  'OWASP posture scores are estimated from mock/demo data only. ' +
  'This is not a formal OWASP audit or certification. ' +
  'Scores reflect the status of simulated vulnerability findings mapped to each category.';

// ── GET /api/owasp ────────────────────────────────────────────────────────────

router.get('/', (_req: Request, res: Response) => {
  const categories  = computeOWASPCategories(mockVulnerabilities);
  const overallScore = computeOverallScore(categories);

  const bandCounts: Record<PostureBand, number> = {
    good: 0, needs_improvement: 0, high_risk: 0,
  };
  for (const c of categories) bandCounts[c.postureBand]++;

  const body: OWASPResponse = {
    categories,
    overallScore,
    overallBand: scoreToPostureBand(overallScore),
    bandCounts,
    note: DEMO_NOTE,
  };

  res.json(body);
});

// ── GET /api/owasp/:id ────────────────────────────────────────────────────────

router.get('/:id', (req: Request, res: Response) => {
  const categories = computeOWASPCategories(mockVulnerabilities);
  // URL-decode in case colons were encoded (e.g. A01%3A2021)
  const requestedId = decodeURIComponent(req.params.id);
  const category    = categories.find((c) => c.id === requestedId);

  if (!category) {
    res
      .status(404)
      .json({ error: `OWASP category '${requestedId}' not found`, note: DEMO_NOTE });
    return;
  }

  const body: OWASPCategoryResponse = { category, note: DEMO_NOTE };
  res.json(body);
});

export default router;
