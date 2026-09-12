/**
 * useAppContext.ts
 * ----------------
 * Type-safe helper for child routes to consume the shared security state
 * provided by AppLayout via react-router-dom's Outlet context.
 *
 * Lives in its own file so AppLayout can export only a component
 * (required by React fast-refresh).
 */
import { useOutletContext } from 'react-router-dom';
import type { SecurityEventsState } from './useSecurityEvents';

export type AppOutletContext = SecurityEventsState;

export function useAppContext(): AppOutletContext {
  return useOutletContext<AppOutletContext>();
}
