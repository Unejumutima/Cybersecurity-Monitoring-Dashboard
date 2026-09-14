/**
 * useSecurityEvents.ts
 * --------------------
 * Consumes the WebSocket stream and maintains all derived state:
 *   - Live event list        (capped at MAX_EVENTS)
 *   - KPI metrics
 *   - Trend data             (rolling per-day severity buckets)
 *   - Severity distribution  (doughnut chart)
 *   - Attack-type counts     (bar chart)
 *   - Top targeted endpoints (horizontal bar chart)
 *   - Top source IPs         (horizontal bar chart)
 *   - Alert count
 */

import { useState, useCallback, useRef } from 'react';
import { useWebSocket, type WsStatus } from './useWebSocket';
import type { TrendDataPoint, SeverityDistribution, SecurityMetric } from '../types/security';

// ─── Types (mirror server/src/types/liveEvent.ts) ─────────────────────────────

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

/** One bar in the attack-type / endpoint / source charts */
export interface CountedItem {
  label: string;
  count: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_EVENTS    = 200;
const MAX_ALERTS    = 20;
const TOP_N         = 8;   // how many items to keep in top-N lists

const ALL_SEVERITIES: LiveSeverity[] = [
  'critical', 'high', 'medium', 'low', 'informational',
];

export const EVENT_TYPE_LABELS: Record<LiveEventType, string> = {
  failed_auth:         'Failed Auth',
  brute_force:         'Brute Force',
  sql_injection:       'SQL Injection',
  xss_attempt:         'XSS Attempt',
  suspicious_api:      'Suspicious API',
  port_scan:           'Port Scan',
  unauthorized_access: 'Unauth Access',
  malware_alert:       'Malware Alert',
  data_exfiltration:   'Data Exfiltration',
  privilege_escalation:'Priv Escalation',
};

// ─── Pure derivation helpers ──────────────────────────────────────────────────

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function emptyTotals() {
  return { critical: 0, high: 0, medium: 0, low: 0, informational: 0 };
}

function buildDistribution(events: LiveSecurityEvent[]): SeverityDistribution[] {
  const total = events.length || 1;
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
  prev:   LiveSecurityEvent[],
): SecurityMetric[] {
  const critCount     = events.filter((e) => e.severity === 'critical').length;
  const prevCrit      = prev.filter((e) => e.severity === 'critical').length;
  const openCount     = events.filter((e) => e.status === 'open').length;
  const prevOpen      = prev.filter((e) => e.status === 'open').length;
  const resolvedCount = events.filter((e) => e.status === 'resolved').length;
  const owaspScore    = Math.min(99, 64 + Math.floor(resolvedCount / 5));
  const prevOwasp     = Math.min(99, 64 + Math.floor(
    prev.filter((e) => e.status === 'resolved').length / 5,
  ));

  return [
    {
      label: 'Total Security Events', value: events.length, previousValue: prev.length,
      trend: events.length >= prev.length ? 'up' : 'down', trendIsPositive: false,
    },
    {
      label: 'Critical Threats', value: critCount, previousValue: prevCrit,
      trend: critCount >= prevCrit ? 'up' : 'down', trendIsPositive: false,
    },
    {
      label: 'Open Vulnerabilities', value: openCount, previousValue: prevOpen,
      trend: openCount <= prevOpen ? 'down' : 'up', trendIsPositive: openCount <= prevOpen,
    },
    {
      label: 'OWASP Compliance', value: owaspScore, previousValue: prevOwasp,
      unit: '%', trend: owaspScore >= prevOwasp ? 'up' : 'down', trendIsPositive: true,
    },
  ];
}

/** Count frequency of a string field and return top-N sorted descending */
function topN(events: LiveSecurityEvent[], field: keyof LiveSecurityEvent, n = TOP_N): CountedItem[] {
  const freq: Record<string, number> = {};
  for (const e of events) {
    const key = String(e[field]);
    freq[key] = (freq[key] ?? 0) + 1;
  }
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([label, count]) => ({ label, count }));
}

/** Count frequency of eventType, applying human-readable labels */
function buildEventTypeCounts(events: LiveSecurityEvent[]): CountedItem[] {
  const freq: Partial<Record<LiveEventType, number>> = {};
  for (const e of events) {
    freq[e.eventType] = (freq[e.eventType] ?? 0) + 1;
  }
  return (Object.entries(freq) as [LiveEventType, number][])
    .sort((a, b) => b[1] - a[1])
    .map(([type, count]) => ({ label: EVENT_TYPE_LABELS[type], count }));
}

// ─── Public return type ───────────────────────────────────────────────────────

export interface SecurityEventsState {
  events:           LiveSecurityEvent[];
  kpis:             SecurityMetric[];
  trendData:        TrendDataPoint[];
  distribution:     SeverityDistribution[];
  /** Attack / event-type frequency breakdown */
  eventTypeCounts:  CountedItem[];
  /** Most frequently targeted endpoints */
  topEndpoints:     CountedItem[];
  /** Most frequent source IPs */
  topSources:       CountedItem[];
  alertCount:       number;
  wsStatus:         WsStatus;
  reconnect:        () => void;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useSecurityEvents(): SecurityEventsState {
  const [events,          setEvents]          = useState<LiveSecurityEvent[]>([]);
  const [trendData,       setTrendData]       = useState<TrendDataPoint[]>([]);
  const [kpis,            setKpis]            = useState<SecurityMetric[]>(buildKpis([], []));
  const [distribution,    setDistribution]    = useState<SeverityDistribution[]>(buildDistribution([]));
  const [eventTypeCounts, setEventTypeCounts] = useState<CountedItem[]>([]);
  const [topEndpoints,    setTopEndpoints]    = useState<CountedItem[]>([]);
  const [topSources,      setTopSources]      = useState<CountedItem[]>([]);
  const [alertCount,      setAlertCount]      = useState(0);

  const prevEventsRef = useRef<LiveSecurityEvent[]>([]);

  const handleMessage = useCallback((raw: string) => {
    let parsed: { type: string; payload: unknown };
    try {
      parsed = JSON.parse(raw) as { type: string; payload: unknown };
    } catch {
      console.warn('[useSecurityEvents] Non-JSON message:', raw.slice(0, 80));
      return;
    }

    if (parsed.type === 'ping') return;
    if (parsed.type !== 'security_event') return;

    const incoming = parsed.payload as LiveSecurityEvent;

    setEvents((prev) => {
      const next = [incoming, ...prev].slice(0, MAX_EVENTS);

      // ── Trend ──────────────────────────────────────────────────────────────
      const today = todayKey();
      setTrendData((pt) => {
        const last = pt[pt.length - 1];
        if (last && last.date === today) {
          const updated = { ...last, [incoming.severity]: last[incoming.severity] + 1 };
          return [...pt.slice(0, -1), updated];
        }
        const fresh: TrendDataPoint = { date: today, ...emptyTotals() };
        fresh[incoming.severity]++;
        return [...pt, fresh].slice(-30);
      });

      // ── KPIs ───────────────────────────────────────────────────────────────
      setKpis(buildKpis(next, prevEventsRef.current));

      // ── Distribution ───────────────────────────────────────────────────────
      setDistribution(buildDistribution(next));

      // ── Analytics ──────────────────────────────────────────────────────────
      // Throttle to every 5 events to avoid thrashing on high-frequency streams
      if (next.length % 5 === 0 || next.length <= 5) {
        setEventTypeCounts(buildEventTypeCounts(next));
        setTopEndpoints(topN(next, 'endpoint'));
        setTopSources(topN(next, 'source'));
      }

      // ── Alert count ────────────────────────────────────────────────────────
      const critHigh = next.filter(
        (e) => (e.severity === 'critical' || e.severity === 'high') && e.status === 'open',
      ).length;
      setAlertCount(Math.min(critHigh, MAX_ALERTS));

      if (next.length % 10 === 0) prevEventsRef.current = next;

      return next;
    });
  }, []);

  const { status: wsStatus, reconnect } = useWebSocket({ onMessage: handleMessage });

  return {
    events, kpis, trendData, distribution,
    eventTypeCounts, topEndpoints, topSources,
    alertCount, wsStatus, reconnect,
  };
}
