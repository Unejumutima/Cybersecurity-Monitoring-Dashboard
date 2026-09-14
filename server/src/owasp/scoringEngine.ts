/**
 * scoringEngine.ts
 * ----------------
 * Pure scoring logic — no Express, no I/O.
 * Takes the static category definitions and the live vulnerability dataset
 * and produces fully computed OWASPCategory objects.
 *
 * ── How the score is calculated ────────────────────────────────────────────
 *
 * Each category starts at a BASE_SCORE of 100.
 *
 * Deductions are applied for every vulnerability mapped to the category:
 *
 *   Severity   Status              Deduction
 *   ─────────  ──────────────────  ─────────
 *   critical   open                  -22
 *   critical   in_remediation        -12
 *   critical   accepted_risk         -10
 *   high       open                  -14
 *   high       in_remediation         -7
 *   high       accepted_risk          -6
 *   medium     open                   -6
 *   medium     in_remediation         -3
 *   medium     accepted_risk          -2
 *   low        open                   -2
 *   low        in_remediation         -1
 *   any        resolved               0   (no deduction — good signal)
 *
 * After all deductions the score is clamped to [0, 100].
 *
 * Posture band thresholds:
 *   ≥ 75  →  "good"
 *   50–74 →  "needs_improvement"
 *   < 50  →  "high_risk"
 *
 * Overall score = simple average of all 10 category scores (equal weighting).
 *
 * ── Why this approach ──────────────────────────────────────────────────────
 * - Deterministic: same inputs always produce the same output, easy to test.
 * - Transparent: every deduction is traceable to a specific vulnerability.
 * - Proportional: critical/open findings hurt more than low/in-remediation.
 * - Bounded: score never goes below 0 or above 100.
 */

import { OWASP_CATEGORY_DEFINITIONS } from '../data/owaspCategories';
import type { Vulnerability } from '../types/vulnerability';
import type { OWASPCategory, PostureBand } from '../types/owasp';

// ─── Deduction table ──────────────────────────────────────────────────────────

type VulnStatus   = 'open' | 'in_remediation' | 'resolved' | 'accepted_risk';
type VulnSeverity = 'critical' | 'high' | 'medium' | 'low' | 'informational';

const DEDUCTIONS: Record<VulnSeverity, Record<VulnStatus, number>> = {
  critical:      { open: 22, in_remediation: 12, accepted_risk: 10, resolved: 0 },
  high:          { open: 14, in_remediation:  7, accepted_risk:  6, resolved: 0 },
  medium:        { open:  6, in_remediation:  3, accepted_risk:  2, resolved: 0 },
  low:           { open:  2, in_remediation:  1, accepted_risk:  1, resolved: 0 },
  informational: { open:  0, in_remediation:  0, accepted_risk:  0, resolved: 0 },
};

const BASE_SCORE = 100;

// ─── Band assignment ──────────────────────────────────────────────────────────

export function scoreToPostureBand(score: number): PostureBand {
  if (score >= 75) return 'good';
  if (score >= 50) return 'needs_improvement';
  return 'high_risk';
}

// ─── Core computation ─────────────────────────────────────────────────────────

/**
 * Compute all 10 OWASPCategory objects from the live vulnerability list.
 * Called at request-time so scores always reflect the current vuln dataset.
 */
export function computeOWASPCategories(
  vulnerabilities: Vulnerability[],
): OWASPCategory[] {
  return OWASP_CATEGORY_DEFINITIONS.map((def) => {
    // Vulns whose owaspCategory field matches this category's id
    const linked = vulnerabilities.filter(
      (v) => v.owaspCategory === def.id,
    );

    // Accumulate deductions
    let deduction = 0;
    for (const v of linked) {
      const sev = v.severity as VulnSeverity;
      const sta = v.status   as VulnStatus;
      const table = DEDUCTIONS[sev];
      if (table) deduction += table[sta] ?? 0;
    }

    const score = Math.max(0, BASE_SCORE - deduction);

    const openVulnCount     = linked.filter((v) => v.status !== 'resolved').length;
    const resolvedVulnCount = linked.filter((v) => v.status === 'resolved').length;

    return {
      id:               def.id,
      name:             def.name,
      description:      def.description,
      fullDescription:  def.fullDescription,
      score,
      postureBand:      scoreToPostureBand(score),
      openVulnCount,
      resolvedVulnCount,
      linkedVulnIds:    linked.map((v) => v.id),
      linkedEventTypes: def.linkedEventTypes,
      improvements:     def.improvements,
    };
  });
}

/**
 * Compute overall posture score from individual category scores.
 * Uses equal weighting across all 10 categories.
 */
export function computeOverallScore(categories: OWASPCategory[]): number {
  if (categories.length === 0) return 0;
  const sum = categories.reduce((acc, c) => acc + c.score, 0);
  return Math.round(sum / categories.length);
}
