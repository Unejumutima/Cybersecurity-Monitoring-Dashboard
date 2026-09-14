/**
 * useOwasp.ts
 * -----------
 * Fetches OWASP Top 10 posture data from the REST API.
 * Follows the same pattern as useVulnerabilities: single useReducer state,
 * AbortController for cleanup, incremental fetchTrigger for refetch.
 */

import { useState, useEffect, useRef, useCallback, useReducer } from 'react';

export type OWASPId =
  | 'A01:2021' | 'A02:2021' | 'A03:2021' | 'A04:2021' | 'A05:2021'
  | 'A06:2021' | 'A07:2021' | 'A08:2021' | 'A09:2021' | 'A10:2021';

export type PostureBand = 'good' | 'needs_improvement' | 'high_risk';

export interface OWASPCategory {
  id:                OWASPId;
  name:              string;
  description:       string;
  fullDescription:   string;
  score:             number;
  postureBand:       PostureBand;
  openVulnCount:     number;
  resolvedVulnCount: number;
  linkedVulnIds:     string[];
  linkedEventTypes:  string[];
  improvements:      string[];
}

// ─── Single consolidated state ────────────────────────────────────────────────

type LoadState = 'idle' | 'loading' | 'success' | 'error';

interface FetchState {
  categories:   OWASPCategory[];
  overallScore: number;
  overallBand:  PostureBand;
  bandCounts:   Record<PostureBand, number>;
  loadState:    LoadState;
  error:        string | null;
  note:         string;
}

type FetchAction =
  | { type: 'LOADING' }
  | {
      type:         'SUCCESS';
      categories:   OWASPCategory[];
      overallScore: number;
      overallBand:  PostureBand;
      bandCounts:   Record<PostureBand, number>;
      note:         string;
    }
  | { type: 'ERROR'; message: string };

function fetchReducer(state: FetchState, action: FetchAction): FetchState {
  switch (action.type) {
    case 'LOADING':
      return { ...state, loadState: 'loading', error: null };
    case 'SUCCESS':
      return {
        categories:   action.categories,
        overallScore: action.overallScore,
        overallBand:  action.overallBand,
        bandCounts:   action.bandCounts,
        note:         action.note,
        loadState:    'success',
        error:        null,
      };
    case 'ERROR':
      return { ...state, loadState: 'error', error: action.message };
    default:
      return state;
  }
}

const INITIAL_STATE: FetchState = {
  categories:   [],
  overallScore: 0,
  overallBand:  'high_risk',
  bandCounts:   { good: 0, needs_improvement: 0, high_risk: 0 },
  loadState:    'idle',
  error:        null,
  note:         '',
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export interface UseOwaspReturn extends FetchState {
  refetch: () => void;
}

const API_BASE = 'http://localhost:4000';

export function useOwasp(): UseOwaspReturn {
  const [state, dispatch] = useReducer(fetchReducer, INITIAL_STATE);
  const [fetchTrigger, setFetchTrigger] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    Promise.resolve()
      .then(() => {
        dispatch({ type: 'LOADING' });
        return fetch(`${API_BASE}/api/owasp`, { signal: controller.signal });
      })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`API ${response.status}: ${response.statusText}`);
        }
        const json = await response.json() as {
          categories:   OWASPCategory[];
          overallScore: number;
          overallBand:  PostureBand;
          bandCounts:   Record<PostureBand, number>;
          note:         string;
        };
        dispatch({
          type:         'SUCCESS',
          categories:   json.categories,
          overallScore: json.overallScore,
          overallBand:  json.overallBand,
          bandCounts:   json.bandCounts,
          note:         json.note,
        });
      })
      .catch((err: unknown) => {
        if (err instanceof Error && err.name === 'AbortError') return;
        const msg = err instanceof Error ? err.message : 'Unknown error';
        dispatch({
          type: 'ERROR',
          message: `Could not load OWASP data: ${msg}. Is the backend running on port 4000?`,
        });
      });

    return () => { controller.abort(); };
  }, [fetchTrigger]);

  const refetch = useCallback(() => { setFetchTrigger((n) => n + 1); }, []);

  return { ...state, refetch };
}
