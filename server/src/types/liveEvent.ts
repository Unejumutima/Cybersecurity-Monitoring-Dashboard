// ─── Live Security Event ───────────────────────────────────────────────────────
// This is the structure sent over the WebSocket to the frontend.
// It is intentionally simpler than the frontend's full SecurityEvent type
// (no CVE links, no OWASP mapping) — those belong to the vulnerability scanner
// phase. The frontend maps this onto its own display types.

export type LiveSeverity =
  | 'critical'
  | 'high'
  | 'medium'
  | 'low'
  | 'informational';

export type LiveEventType =
  | 'failed_auth'
  | 'brute_force'
  | 'sql_injection'
  | 'xss_attempt'
  | 'suspicious_api'
  | 'port_scan'
  | 'unauthorized_access'
  | 'malware_alert'
  | 'data_exfiltration'
  | 'privilege_escalation';

export type LiveEventStatus = 'open' | 'investigating' | 'resolved';

export interface LiveSecurityEvent {
  /** Unique event ID, e.g. "EVT-LIVE-1715698800000-4f2a" */
  id: string;
  /** ISO 8601 timestamp generated at event creation time */
  timestamp: string;
  /** Categorised event type */
  eventType: LiveEventType;
  /** Threat severity level */
  severity: LiveSeverity;
  /** Source IP address of the simulated attacker */
  source: string;
  /** Target endpoint or host */
  endpoint: string;
  /** Human-readable description of the event */
  message: string;
  /** Current triage status */
  status: LiveEventStatus;
}

// ─── WebSocket message envelope ───────────────────────────────────────────────
// Every message sent over the WebSocket is wrapped in this envelope so the
// frontend can distinguish event types without inspecting payload shapes.

export type WsMessageType = 'security_event' | 'ping';

export interface WsMessage<T = unknown> {
  type: WsMessageType;
  payload: T;
}
