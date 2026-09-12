/**
 * wsServer.ts
 * -----------
 * Manages the WebSocket server and the set of connected clients.
 * Responsibilities:
 *   - Accept incoming WebSocket connections
 *   - Broadcast events to all connected clients
 *   - Handle disconnections and errors cleanly
 *
 * This module has NO knowledge of event generation — it only handles
 * the transport layer.
 */

import { WebSocketServer, WebSocket } from 'ws';
import type { Server } from 'http';
import type { LiveSecurityEvent } from './types/liveEvent';
import type { WsMessage } from './types/liveEvent';

// Keep ping interval reference so we can clean it up
let pingInterval: ReturnType<typeof setInterval> | null = null;

/**
 * Attaches a WebSocket server to an existing HTTP server.
 * Returns a `broadcast` function that the caller uses to push events.
 */
export function createWsServer(httpServer: Server): {
  broadcast: (event: LiveSecurityEvent) => void;
  clientCount: () => number;
} {
  const wss = new WebSocketServer({ server: httpServer });

  wss.on('connection', (ws: WebSocket, req) => {
    const ip = req.socket.remoteAddress ?? 'unknown';
    console.log(`[WS] Client connected from ${ip}. Total clients: ${wss.clients.size}`);

    ws.on('message', (data) => {
      // We don't expect messages from the client in this phase,
      // but log them for debugging rather than silently ignoring.
      console.log(`[WS] Message from client: ${data.toString().slice(0, 100)}`);
    });

    ws.on('close', () => {
      console.log(`[WS] Client disconnected. Remaining clients: ${wss.clients.size}`);
    });

    ws.on('error', (err) => {
      console.error(`[WS] Client error: ${err.message}`);
    });
  });

  wss.on('error', (err) => {
    console.error(`[WS] Server error: ${err.message}`);
  });

  // ── Keep-alive pings ──────────────────────────────────────────────────────
  // Send a ping every 25 seconds so the browser doesn't close idle connections.
  pingInterval = setInterval(() => {
    const ping: WsMessage = { type: 'ping', payload: { ts: Date.now() } };
    const raw = JSON.stringify(ping);
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(raw);
      }
    });
  }, 25_000);

  // ── Broadcast ─────────────────────────────────────────────────────────────
  function broadcast(event: LiveSecurityEvent): void {
    const msg: WsMessage<LiveSecurityEvent> = {
      type:    'security_event',
      payload: event,
    };
    const raw = JSON.stringify(msg);

    let sent = 0;
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(raw);
        sent++;
      }
    });

    // Only log critical/high events to avoid log spam
    if (event.severity === 'critical' || event.severity === 'high') {
      console.log(
        `[WS] Broadcast [${event.severity.toUpperCase()}] "${event.message.slice(0, 60)}…" → ${sent} client(s)`,
      );
    }
  }

  return {
    broadcast,
    clientCount: () => wss.clients.size,
  };
}

export function stopPingInterval(): void {
  if (pingInterval) { clearInterval(pingInterval); pingInterval = null; }
}
