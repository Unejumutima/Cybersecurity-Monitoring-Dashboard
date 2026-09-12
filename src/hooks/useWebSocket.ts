/**
 * useWebSocket.ts
 * ---------------
 * Manages the WebSocket connection lifecycle.
 *   - Opens the connection on mount
 *   - Tracks connection state (connecting / connected / reconnecting / disconnected)
 *   - Calls onMessage for every incoming frame
 *   - Auto-reconnects with exponential back-off on unexpected close
 *   - Cleans up on unmount
 *
 * Has no knowledge of security events — transport layer only.
 */

import { useEffect, useRef, useState, useCallback } from 'react';

export type WsStatus = 'connecting' | 'connected' | 'disconnected' | 'reconnecting';

interface UseWebSocketOptions {
  onMessage: (raw: string) => void;
  reconnectDelayMs?:    number;
  maxReconnectDelayMs?: number;
}

interface UseWebSocketReturn {
  status:    WsStatus;
  reconnect: () => void;
}

const WS_URL = 'ws://localhost:4000';

export function useWebSocket({
  onMessage,
  reconnectDelayMs    = 2000,
  maxReconnectDelayMs = 30_000,
}: UseWebSocketOptions): UseWebSocketReturn {
  const [status, setStatus] = useState<WsStatus>('connecting');

  // All mutable state lives in refs so event-handler closures always see current values
  const wsRef            = useRef<WebSocket | null>(null);
  const currentDelay     = useRef(reconnectDelayMs);
  const reconnectTimer   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onMessageRef     = useRef(onMessage);
  const unmountedRef     = useRef(false);
  // Reconnect-delay config in refs so the effect doesn't need them as deps
  const initDelayRef     = useRef(reconnectDelayMs);
  const maxDelayRef      = useRef(maxReconnectDelayMs);

  // Keep callback ref current without re-running connection logic
  useEffect(() => { onMessageRef.current = onMessage; }, [onMessage]);
  useEffect(() => { initDelayRef.current = reconnectDelayMs; }, [reconnectDelayMs]);
  useEffect(() => { maxDelayRef.current  = maxReconnectDelayMs; }, [maxReconnectDelayMs]);

  // openSocket is defined inside the effect so it can safely reference itself
  // without creating a useCallback/useRef assignment outside an effect.
  useEffect(() => {
    unmountedRef.current   = false;
    currentDelay.current   = initDelayRef.current;

    function openSocket() {
      if (unmountedRef.current) return;

      // Clean up any existing socket first
      if (wsRef.current) {
        wsRef.current.onopen    = null;
        wsRef.current.onmessage = null;
        wsRef.current.onerror   = null;
        wsRef.current.onclose   = null;
        wsRef.current.close();
        wsRef.current = null;
      }

      setStatus('connecting');
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        if (unmountedRef.current) return;
        console.log('[WS] Connected to', WS_URL);
        setStatus('connected');
        currentDelay.current = initDelayRef.current; // reset back-off
      };

      ws.onmessage = (evt: MessageEvent<string>) => {
        if (unmountedRef.current) return;
        onMessageRef.current(evt.data);
      };

      ws.onerror = () => {
        // Always followed by onclose — handle retry there
      };

      ws.onclose = (evt) => {
        if (unmountedRef.current) return;

        if (evt.code === 1000) {
          // Intentional close (unmount / server clean shutdown)
          setStatus('disconnected');
          return;
        }

        console.warn(
          `[WS] Connection lost (code ${evt.code}). Retrying in ${currentDelay.current}ms…`,
        );
        setStatus('reconnecting');

        reconnectTimer.current = setTimeout(() => {
          currentDelay.current = Math.min(
            currentDelay.current * 1.5,
            maxDelayRef.current,
          );
          openSocket();
        }, currentDelay.current);
      };
    }

    openSocket();

    // Store openSocket in a ref so the manual reconnect callback can call it
    openSocketRef.current = openSocket;

    return () => {
      unmountedRef.current = true;
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      if (wsRef.current) {
        wsRef.current.onopen    = null;
        wsRef.current.onmessage = null;
        wsRef.current.onerror   = null;
        wsRef.current.onclose   = null;
        wsRef.current.close(1000, 'Component unmounted');
        wsRef.current = null;
      }
    };
  }, []);
  // ^ Intentionally empty: runs exactly once on mount.
  //   All values read inside are accessed via refs so they are always current.

  // Ref populated by the effect above so reconnect() can invoke openSocket
  const openSocketRef = useRef<() => void>(() => { /* populated by effect */ });

  const reconnect = useCallback(() => {
    if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
    currentDelay.current = initDelayRef.current;
    openSocketRef.current();
  }, []);

  return { status, reconnect };
}
