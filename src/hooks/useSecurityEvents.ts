/**
 * useSecurityEvents.ts
 * --------------------
 * Consumes the WebSocket stream and maintains all derived state:
 *   - Live event list  (capped at MAX_EVENTS to prevent memory growth)
 *   - KPI metrics      (total events, critical count, open vuln count, OWASP score)
 *   - Trend data       (rolling per-day severity buckets for the line chart)
 *   - Severity dist    (snapshot counts for the doughnut chart)
 *   - Alert list       (critical + high events become alerts)
 *
 * Separation of concerns:
 *   useWebSocket  →  raw bytes in/out
 *   useSecurityEvents  →  parse + derive state from those bytes
 */

import { useState, useCallback, useRef } from 'react';
import { useWebSocket, type WsStatus } from './useWebSocket';
import type { TrendDataPoint, SeverityDistribution, SecurityMetric } from '../types/security';

// ─── Types mirroring the backend's LiveSecurityEvent ─────────────────────────
// We duplicate just enough here to avoid a cross-package import.
// These must stay in sync with server/src/types/liveEvent.ts.

export type LiveSeverity =
  | 'critical' | 'high' | 'medium' | 'low' | 'informational';

export type LiveEventType =
  | 'failed_auth' | 'brute_force' | 'sql_injection' | 'xss_attempt'
  | 'suspicious_api' | 'port_scan' | 'unauthorized_access'
  | 'malware_alert' | 'data_exfiltration' | 'privilege_escalation';

export interface LiveSecurityEvent {
  id:        string;
  timestamp: string;
  eventType: LiveEventType;
  severity:  LiveSeverity;
  source:    string;
  endpoint:  string;
  message:   string;
  status:    'open' | 'investigating' | 'resolved';
}

// ─── Constants ────────────────────────────────────────────────────────────────

/** Maximum events kept in memory. Oldest are dropped when exceeded. */
const MAX_EVENTS = 200;

/** Alerts are generated from critical/high events; keep the last N. */
const MAX_ALERTS = 20;

const ALL_SEVERITIES: LiveSeverity[] = [
  'critical', 'high', 'medium', 'low', 'informational',
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function todayKey(): string {
  return new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
}

function emptyTotals() {
  return { critical: 0, high: 0, medium: 0, low: 0, informational: 0 };
}

function buildDistribution(
  events: LiveSecurityEvent[],
): SeverityDistribution[] {
  const total = events.length || 1; // avoid div/0
  const counts = emptyTotals();
  for (const e of events) counts[e.severity]++;
  return ALL_SEVERITIES.map((sev) => ({
    severity:   sev,
    count:      counts[sev],
    percentage: parseFloat(((counts[sev] / total) * 100).toFixed(1)),
  }));
}

function buildKpis(
  events: LiveSecurityEvent[],
  prevEvents: LiveSecurityEvent[],
): SecurityMetric[] {
  const critCount     = events.filter((e) => e.severity === 'critical').length;
  const prevCrit      = prevEvents.filter((e) => e.severity === 'critical').length;
  const openCount     = events.filter((e) => e.status === 'open').length;
  const prevOpen      = prevEvents.filter((e) => e.status === 'open').length;

  // OWASP score: starts at 64 (from Phase 1 mock) and slowly improves
  // as resolved events accumulate — kept simple and stable.
  const resolvedCount = events.filter((e) => e.status === 'resolved').length;
  const owaspScore    = Math.min(99, 64 + Math.floor(resolvedCount / 5));
  const prevOwasp     = Math.min(99, 64 + Math.floor(
    prevEvents.filter((e) => e.status === 'resolved').length / 5,
  ));

  return [
    {
      label:           'Total Security Events',
      value:           events.length,
      previousValue:   prevEvents.length,
      trend:           events.length >= prevEvents.length ? 'up' : 'down',
      trendIsPositive: false, // more events = worse
    },
    {
      label:           'Critical Threats',
      value:           critCount,
      previousValue:   prevCrit,
      trend:           critCount >= prevCrit ? 'up' : 'down',
      trendIsPositive: false,
    },
    {
      label:           'Open Vulnerabilities',
      value:           openCount,
      previousValue:   prevOpen,
      trend:           openCount <= prevOpen ? 'down' : 'up',
      trendIsPositive: openCount <= prevOpen, // fewer open = better
    },
    {
      label:           'OWASP Compliance',
      value:           owaspScore,
      previousValue:   prevOwasp,
      unit:            '%',
      trend:           owaspScore >= prevOwasp ? 'up' : 'down',
      trendIsPositive: true,
    },
  ];
}

// ─── Public return type ───────────────────────────────────────────────────────

export interface SecurityEventsState {
  /** Raw live events, newest first, capped at MAX_EVENTS */
  events:       LiveSecurityEvent[];
  /** KPI metric objects ready for <KpiCard> */
  kpis:         SecurityMetric[];
  /** 30-day rolling trend data points for <EventTrendChart> */
  trendData:    TrendDataPoint[];
  /** Per-severity counts for <SeverityDonutChart> */
  distribution: SeverityDistribution[];
  /** Recent critical/high events formatted as alerts */
  alertCount:   number;
  /** WebSocket connection state */
  wsStatus:     WsStatus;
  /** Call to force a reconnect */
  reconnect:    () => void;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useSecurityEvents(): SecurityEventsState {
  const [events, setEvents]           = useState<LiveSecurityEvent[]>([]);
  const [trendData, setTrendData]     = useState<TrendDataPoint[]>([]);
  const [kpis, setKpis]               = useState<SecurityMetric[]>(buildKpis([], []));
  const [distribution, setDistribution] = useState<SeverityDistribution[]>(
    buildDistribution([]),
  );
  const [alertCount, setAlertCount]   = useState(0);

  // We keep a ref snapshot of the previous event list for KPI delta calculations.
  // Using a ref (not state) prevents double-renders.
  const prevEventsRef = useRef<LiveSecurityEvent[]>([]);

  const handleMessage = useCallback((raw: string) => {
    let parsed: { type: string; payload: unknown };
    try {
      parsed = JSON.parse(raw) as { type: string; payload: unknown };
    } catch {
      console.warn('[useSecurityEvents] Non-JSON message received:', raw.slice(0, 80));
      return;
    }

    // Ignore ping frames — they're only for keep-alive
    if (parsed.type === 'ping') return;
    if (parsed.type !== 'security_event') return;

    const incoming = parsed.payload as LiveSecurityEvent;

    setEvents((prev) => {
      // Prepend newest event; trim to cap
      const next = [incoming, ...prev].slice(0, MAX_EVENTS);

      // ── Trend data ──────────────────────────────────────────────────────
      const today = todayKey();
      setTrendData((prevTrend) => {
        const last = prevTrend[prevTrend.length - 1];
        if (last && last.date === today) {
          // Increment today's bucket
          const updated = { ...last, [incoming.severity]: last[incoming.severity] + 1 };
          return [...prevTrend.slice(0, -1), updated];
        }
        // New day — append a fresh data point
        const fresh: TrendDataPoint = { date: today, ...emptyTotals() };
        fresh[incoming.severity]++;
        // Keep only the last 30 days
        return [...prevTrend, fresh].slice(-30);
      });

      // ── KPIs ────────────────────────────────────────────────────────────
      setKpis(buildKpis(next, prevEventsRef.current));

      // ── Distribution ────────────────────────────────────────────────────
      setDistribution(buildDistribution(next));

      // ── Alert count ─────────────────────────────────────────────────────
      const critHighCount = next.filter(
        (e) => (e.severity === 'critical' || e.severity === 'high') && e.status === 'open',
      ).length;
      setAlertCount(Math.min(critHighCount, MAX_ALERTS));

      // Snapshot for next delta calculation (every 10 events)
      if (next.length % 10 === 0) {
        prevEventsRef.current = next;
      }

      return next;
    });
  }, []);

  const { status: wsStatus, reconnect } = useWebSocket({ onMessage: handleMessage });

  return {
    events,
    kpis,
    trendData,
    distribution,
    alertCount,
    wsStatus,
    reconnect,
  };
}
