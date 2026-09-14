/**
 * owasp.ts — OWASP Top 10 data model
 * ------------------------------------
 * Types for OWASP Top 10 2021 posture-tracking data.
 *
 * IMPORTANT: Scores are calculated from mock vulnerability and event data
 * for demonstration purposes only. This is NOT a formal OWASP audit or
 * certification. "Compliance score" here means "estimated security posture
 * against this category based on available demo data."
 */

export type OWASPId =
  | 'A01:2021' | 'A02:2021' | 'A03:2021' | 'A04:2021' | 'A05:2021'
  | 'A06:2021' | 'A07:2021' | 'A08:2021' | 'A09:2021' | 'A10:2021';

/** Posture band shown in the UI */
export type PostureBand = 'good' | 'needs_improvement' | 'high_risk';

export interface OWASPCategory {
  /** Official OWASP 2021 identifier, e.g. "A01:2021" */
  id:               OWASPId;
  /** Official OWASP 2021 category name */
  name:             string;
  /** One-sentence plain-English description aimed at non-security stakeholders */
  description:      string;
  /** Full paragraph description with technical context */
  fullDescription:  string;
  /**
   * Security posture score: 0–100.
   * 100 = no open findings, all remediations complete.
   * Calculated by scoringEngine.ts — see that file for the formula.
   */
  score:            number;
  /** Derived from score: ≥75 = good, 50–74 = needs_improvement, <50 = high_risk */
  postureBand:      PostureBand;
  /** Number of open vulnerabilities mapped to this category */
  openVulnCount:    number;
  /** Number of resolved vulnerabilities mapped to this category */
  resolvedVulnCount:number;
  /** IDs of vulnerabilities mapped to this category */
  linkedVulnIds:    string[];
  /** Live-event types that are relevant to this category */
  linkedEventTypes: string[];
  /** Specific, actionable improvements for this category */
  improvements:     string[];
}

/** Response from GET /api/owasp */
export interface OWASPResponse {
  categories:      OWASPCategory[];
  /** Weighted average of all 10 category scores, 0–100 */
  overallScore:    number;
  overallBand:     PostureBand;
  /** Breakdown of how many categories fall in each band */
  bandCounts:      Record<PostureBand, number>;
  note:            string;
}

/** Response from GET /api/owasp/:id */
export interface OWASPCategoryResponse {
  category: OWASPCategory;
  note:     string;
}
