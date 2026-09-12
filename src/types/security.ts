// ─── Enums ────────────────────────────────────────────────────────────────────

export type ThreatSeverity = 'critical' | 'high' | 'medium' | 'low' | 'informational';

export type EventStatus = 'open' | 'investigating' | 'resolved' | 'false_positive';

export type VulnerabilityStatus = 'open' | 'in_remediation' | 'resolved' | 'accepted_risk';

export type EventCategory =
  | 'intrusion_attempt'
  | 'malware'
  | 'phishing'
  | 'brute_force'
  | 'data_exfiltration'
  | 'privilege_escalation'
  | 'lateral_movement'
  | 'reconnaissance'
  | 'denial_of_service'
  | 'insider_threat';

// ─── Core Interfaces ──────────────────────────────────────────────────────────

export interface SecurityEvent {
  id: string;
  title: string;
  description: string;
  severity: ThreatSeverity;
  category: EventCategory;
  status: EventStatus;
  sourceIp: string;
  destinationIp: string;
  affectedHost: string;
  timestamp: string; // ISO 8601
  detectedBy: string; // e.g. "IDS", "SIEM", "EDR"
  mitreTactic?: string; // e.g. "TA0001 - Initial Access"
  mitreTechnique?: string; // e.g. "T1078 - Valid Accounts"
}

export interface Vulnerability {
  id: string;
  cveId: string;
  title: string;
  description: string;
  severity: ThreatSeverity;
  cvssScore: number; // 0.0 – 10.0
  affectedAsset: string;
  affectedComponent: string;
  status: VulnerabilityStatus;
  discoveredAt: string; // ISO 8601
  lastUpdated: string;
  remediationGuidance: string;
  owaspCategory?: string; // e.g. "A01:2021"
}

export interface OWASPCategory {
  id: string; // e.g. "A01:2021"
  name: string; // e.g. "Broken Access Control"
  rank: number; // 1–10
  description: string;
  complianceScore: number; // 0–100
  openFindings: number;
  resolvedFindings: number;
  riskLevel: ThreatSeverity;
}

export interface SecurityMetric {
  label: string;
  value: number;
  previousValue: number; // for trend comparison
  unit?: string;
  trend: 'up' | 'down' | 'stable';
  trendIsPositive: boolean; // true = green indicator, false = red
}

export interface TrendDataPoint {
  date: string; // "YYYY-MM-DD"
  critical: number;
  high: number;
  medium: number;
  low: number;
  informational: number;
}

export interface SeverityDistribution {
  severity: ThreatSeverity;
  count: number;
  percentage: number;
}

export interface Alert {
  id: string;
  title: string;
  severity: ThreatSeverity;
  timestamp: string;
  source: string;
  acknowledged: boolean;
}
