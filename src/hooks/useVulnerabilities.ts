/**
 * useVulnerabilities.ts
 * ---------------------
 * Fetches vulnerability data from the REST API.
 * Uses a single reducer-style state object so the effect body never calls
 * setState synchronously — all mutations happen inside async .then()/.catch()
 * callbacks, which satisfies the react-hooks/set-state-in-effect rule.
 */

import { useState, useEffect, useRef, useCallback, useReducer } from 'react';

export type VulnSeverity = 'critical' | 'high' | 'medium' | 'low' | 'informational';
export type VulnStatus   = 'open' | 'in_remediation' | 'resolved' | 'accepted_risk';

export interface ApiVulnerability {
  id:                string;
  title:             string;
  description:       string;
  severity:          VulnSeverity;
  cvssScore:         number;
  affectedComponent: string;
  affectedAsset:     string;
  discoveredAt:      string;
  status:            VulnStatus;
  cveId?:            string;
  remediationSteps:  string;
  owaspCategory?:    string;
}

export interface VulnSummary {
  total:      number;
  bySeverity: Record<VulnSeverity, number>;
  note:       string;
}

// ─── Single consolidated state ────────────────────────────────────────────────

type LoadState = 'idle' | 'loading' | 'success' | 'error';

interface FetchState {
  vulnerabilities: ApiVulnerability[];
  summary:         VulnSummary | null;
  loadState:       LoadState;
  error:           string | null;
  note:            string;
}

type FetchAction =
  | { type: 'LOADING' }
  | { type: 'SUCCESS'; vulnerabilities: ApiVulnerability[]; summary: VulnSummary; note: string }
  | { type: 'ERROR';   message: string };

function fetchReducer(state: FetchState, action: FetchAction): FetchState {
  switch (action.type) {
    case 'LOADING':
      return { ...state, loadState: 'loading', error: null };
    case 'SUCCESS':
      return {
        loadState: 'success',
        vulnerabilities: action.vulnerabilities,
        summary:         action.summary,
        note:            action.note,
        error:           null,
      };
    case 'ERROR':
      return { ...state, loadState: 'error', error: action.message };
    default:
      return state;
  }
}

const INITIAL_STATE: FetchState = {
  vulnerabilities: [],
  summary:         null,
  loadState:       'idle',
  error:           null,
  note:            '',
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export interface UseVulnerabilitiesReturn extends FetchState {
  refetch: () => void;
}

const API_BASE = 'http://localhost:4000';

export function useVulnerabilities(): UseVulnerabilitiesReturn {
  const [state, dispatch] = useReducer(fetchReducer, INITIAL_STATE);

  // Incrementing this triggers a re-fetch
  const [fetchTrigger, setFetchTrigger] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    // All state changes happen inside async callbacks — never synchronously
    // in the effect body — which satisfies react-hooks/set-state-in-effect.
    Promise.resolve()
      .then(() => {
        dispatch({ type: 'LOADING' });
        return Promise.all([
          fetch(`${API_BASE}/api/vulnerabilities`,         { signal: controller.signal }),
          fetch(`${API_BASE}/api/vulnerabilities/summary`, { signal: controller.signal }),
        ]);
      })
      .then(async ([vulnsRes, summaryRes]) => {
        if (!vulnsRes.ok)   throw new Error(`API ${vulnsRes.status}: ${vulnsRes.statusText}`);
        if (!summaryRes.ok) throw new Error(`API ${summaryRes.status}: ${summaryRes.statusText}`);
        const vulnsJson   = await vulnsRes.json()   as { data: ApiVulnerability[]; note: string };
        const summaryJson = await summaryRes.json() as VulnSummary;
        dispatch({
          type:            'SUCCESS',
          vulnerabilities: vulnsJson.data,
          summary:         summaryJson,
          note:            vulnsJson.note,
        });
      })
      .catch((err: unknown) => {
        if (err instanceof Error && err.name === 'AbortError') return;
        const msg = err instanceof Error ? err.message : 'Unknown error';
        dispatch({
          type:    'ERROR',
          message: `Could not load vulnerability data: ${msg}. Is the backend running on port 4000?`,
        });
      });

    return () => { controller.abort(); };
  }, [fetchTrigger]);

  const refetch = useCallback(() => { setFetchTrigger((n) => n + 1); }, []);

  return { ...state, refetch };
}
