/**
 * eventGenerator.ts
 * -----------------
 * Generates realistic simulated security events.
 * This module has NO knowledge of WebSockets or HTTP — it only produces events.
 * The server wires it up to the broadcast mechanism separately.
 *
 * IMPORTANT: These are SIMULATED security events for demonstration purposes.
 * They do not represent real network traffic or actual attacks.
 */

import { v4 as uuidv4 } from 'uuid';
import type {
  LiveSecurityEvent,
  LiveSeverity,
  LiveEventType,
} from './types/liveEvent';

// ─── Lookup tables ─────────────────────────────────────────────────────────────

const ATTACKER_IPS = [
  '185.220.101.47', '45.141.84.120', '91.108.4.200', '194.165.16.77',
  '79.137.192.5',   '62.233.50.246', '5.188.206.18',  '89.248.167.131',
  '185.234.219.58', '103.27.62.44',  '45.95.168.180', '146.70.35.45',
  '198.54.117.200', '23.129.64.131', '171.25.193.77',
];

const INTERNAL_HOSTS = [
  'web-prod-01.internal', 'web-prod-02.internal',
  'api-gateway-01.internal', 'api-gateway-02.internal',
  'db-prod-01.internal', 'db-prod-02.internal',
  'auth-service.internal', 'admin-portal.internal',
  'vpn-gw-01.internal', 'mail-gw-01.internal',
  'workstation-fin-07', 'workstation-dev-12',
];

const API_ENDPOINTS = [
  '/api/auth/login', '/api/auth/token', '/api/users/admin',
  '/api/v2/payments', '/api/v1/export', '/api/internal/config',
  '/admin/dashboard', '/wp-admin/install.php', '/.env',
  '/api/search', '/api/orders', '/api/reports/download',
];

// ─── Event templates ───────────────────────────────────────────────────────────
// Each template defines the static properties for a given event type.
// Dynamic fields (source IP, endpoint, timestamp, id) are filled in at generation time.

interface EventTemplate {
  eventType: LiveEventType;
  severity: LiveSeverity;
  messageTemplate: (source: string, endpoint: string) => string;
}

const EVENT_TEMPLATES: EventTemplate[] = [
  // ── Authentication attacks ──
  {
    eventType: 'failed_auth',
    severity: 'low',
    messageTemplate: (src, ep) =>
      `Failed login attempt from ${src} on ${ep} — invalid credentials (attempt 1 of threshold)`,
  },
  {
    eventType: 'failed_auth',
    severity: 'medium',
    messageTemplate: (src, ep) =>
      `Repeated authentication failures from ${src} on ${ep} — 12 failed attempts in 60 seconds`,
  },
  {
    eventType: 'brute_force',
    severity: 'high',
    messageTemplate: (src, ep) =>
      `Brute-force attack detected from ${src} targeting ${ep} — 340 login attempts in 3 minutes`,
  },
  {
    eventType: 'brute_force',
    severity: 'critical',
    messageTemplate: (src, ep) =>
      `Credential stuffing attack from ${src} against ${ep} — matching known leaked credential database patterns`,
  },

  // ── Injection attacks ──
  {
    eventType: 'sql_injection',
    severity: 'high',
    messageTemplate: (src, ep) =>
      `SQL injection probe from ${src} on ${ep} — payload: ' OR 1=1 -- detected in query parameter`,
  },
  {
    eventType: 'sql_injection',
    severity: 'critical',
    messageTemplate: (src, ep) =>
      `Blind SQL injection attempt from ${src} on ${ep} — time-based SLEEP() payload detected; possible data extraction`,
  },
  {
    eventType: 'xss_attempt',
    severity: 'medium',
    messageTemplate: (src, ep) =>
      `Reflected XSS probe from ${src} on ${ep} — payload: <script>document.cookie</script> in request parameter`,
  },
  {
    eventType: 'xss_attempt',
    severity: 'high',
    messageTemplate: (src, ep) =>
      `Stored XSS attempt from ${src} on ${ep} — malicious script tag found in user-submitted form field`,
  },

  // ── API abuse ──
  {
    eventType: 'suspicious_api',
    severity: 'medium',
    messageTemplate: (src, ep) =>
      `Suspicious API request from ${src} to ${ep} — unusual user-agent string and automated request pattern detected`,
  },
  {
    eventType: 'suspicious_api',
    severity: 'high',
    messageTemplate: (src, ep) =>
      `API rate limit exceeded by ${src} on ${ep} — 1,200 requests/min; possible scraping or DoS attempt`,
  },
  {
    eventType: 'suspicious_api',
    severity: 'informational',
    messageTemplate: (src, ep) =>
      `API endpoint enumeration from ${src} — sequential probing of ${ep} and adjacent paths observed`,
  },

  // ── Reconnaissance ──
  {
    eventType: 'port_scan',
    severity: 'medium',
    messageTemplate: (src, _ep) =>
      `Port scan detected from ${src} — SYN scan across TCP ports 22, 80, 443, 3389, 445 on internal subnet`,
  },
  {
    eventType: 'port_scan',
    severity: 'high',
    messageTemplate: (src, _ep) =>
      `Aggressive network scan from ${src} — 8,000+ hosts probed in under 4 minutes; likely automated scanner`,
  },

  // ── Unauthorised access ──
  {
    eventType: 'unauthorized_access',
    severity: 'high',
    messageTemplate: (src, ep) =>
      `Unauthorized access attempt from ${src} to privileged resource ${ep} — request blocked by ACL`,
  },
  {
    eventType: 'unauthorized_access',
    severity: 'critical',
    messageTemplate: (src, ep) =>
      `Admin panel accessed from unexpected IP ${src} — ${ep} requires MFA but challenge was bypassed`,
  },

  // ── Malware ──
  {
    eventType: 'malware_alert',
    severity: 'high',
    messageTemplate: (_src, ep) =>
      `Malware signature match on ${ep} — file matches Emotet dropper pattern; process execution blocked`,
  },
  {
    eventType: 'malware_alert',
    severity: 'critical',
    messageTemplate: (_src, ep) =>
      `Ransomware behaviour detected on ${ep} — rapid file enumeration and encryption activity; endpoint isolated`,
  },

  // ── Data exfiltration ──
  {
    eventType: 'data_exfiltration',
    severity: 'high',
    messageTemplate: (src, ep) =>
      `Unusual outbound data transfer from ${ep} to ${src} — 85 MB over non-standard port 4444; DLP policy triggered`,
  },
  {
    eventType: 'data_exfiltration',
    severity: 'critical',
    messageTemplate: (src, ep) =>
      `Potential data exfiltration: ${ep} sending sustained traffic to known Tor exit node ${src} — connection blocked`,
  },

  // ── Privilege escalation ──
  {
    eventType: 'privilege_escalation',
    severity: 'critical',
    messageTemplate: (_src, ep) =>
      `Privilege escalation detected on ${ep} — standard user process spawned child with SYSTEM token via token impersonation`,
  },
  {
    eventType: 'privilege_escalation',
    severity: 'high',
    messageTemplate: (_src, ep) =>
      `Sudo abuse detected on ${ep} — unexpected sudo invocation outside maintenance window by non-admin account`,
  },
];

// ─── Weighted random selection ─────────────────────────────────────────────────
// Lower-severity events are more common (mirrors real SOC volume).

const SEVERITY_WEIGHTS: Record<LiveSeverity, number> = {
  informational: 30,
  low:           25,
  medium:        25,
  high:          15,
  critical:       5,
};

function pickWeightedTemplate(): EventTemplate {
  // Filter templates to a severity bucket first, then pick randomly from that bucket.
  const totalWeight = Object.values(SEVERITY_WEIGHTS).reduce((a, b) => a + b, 0);
  let rand = Math.random() * totalWeight;

  let chosenSeverity: LiveSeverity = 'informational';
  for (const [sev, weight] of Object.entries(SEVERITY_WEIGHTS) as [LiveSeverity, number][]) {
    rand -= weight;
    if (rand <= 0) { chosenSeverity = sev; break; }
  }

  const bucket = EVENT_TEMPLATES.filter((t) => t.severity === chosenSeverity);
  // Fall back to full list if no template for that severity
  const pool = bucket.length > 0 ? bucket : EVENT_TEMPLATES;
  return pool[Math.floor(Math.random() * pool.length)];
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ─── Public API ────────────────────────────────────────────────────────────────

/**
 * Generates a single simulated security event with realistic field values.
 * No side effects — just returns the event object.
 */
export function generateSecurityEvent(): LiveSecurityEvent {
  const template = pickWeightedTemplate();
  const source   = pick(ATTACKER_IPS);
  const endpoint = pick(API_ENDPOINTS);
  const host     = pick(INTERNAL_HOSTS);

  return {
    id:        `EVT-LIVE-${Date.now()}-${uuidv4().slice(0, 6)}`,
    timestamp: new Date().toISOString(),
    eventType: template.eventType,
    severity:  template.severity,
    source,
    endpoint:  host,          // target host (the field label in the spec)
    message:   template.messageTemplate(source, endpoint),
    status:    'open',
  };
}

/**
 * Starts a periodic event generation loop.
 *
 * @param onEvent  Called with each generated event — the caller decides what to do with it.
 * @param intervalMs  How often to generate an event (default: 3 000 ms).
 * @returns A cleanup function that stops the loop when called.
 */
export function startEventGenerator(
  onEvent: (event: LiveSecurityEvent) => void,
  intervalMs = 3000,
): () => void {
  const timer = setInterval(() => {
    onEvent(generateSecurityEvent());
  }, intervalMs);

  console.log(`[EventGenerator] Started — emitting one event every ${intervalMs / 1000}s`);

  return () => {
    clearInterval(timer);
    console.log('[EventGenerator] Stopped');
  };
}
