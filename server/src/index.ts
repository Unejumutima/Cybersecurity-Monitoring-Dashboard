/**
 * index.ts — Backend entry point
 * --------------------------------
 * Wires together:
 *   1. Express HTTP server  (REST health check + serves CORS headers)
 *   2. WebSocket server     (real-time event streaming)
 *   3. Event generator      (periodic simulated security event production)
 *
 * Architecture:
 *
 *   setInterval  ──►  generateSecurityEvent()   [eventGenerator.ts]
 *                               │
 *                               ▼
 *                        broadcast(event)        [wsServer.ts]
 *                               │
 *                         JSON over WS
 *                               │
 *                        ┌──────┴──────┐
 *                      Client 1    Client 2 ...  [React dashboards]
 */

import http from 'http';
import express from 'express';
import cors from 'cors';
import { createWsServer } from './wsServer';
import { startEventGenerator } from './eventGenerator';
import vulnerabilitiesRouter from './routes/vulnerabilities';
import owaspRouter           from './routes/owasp';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 4000;

// ── Express app ───────────────────────────────────────────────────────────────
const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());

// ── REST routes ───────────────────────────────────────────────────────────────
app.use('/api/vulnerabilities', vulnerabilitiesRouter);
app.use('/api/owasp',           owaspRouter);

// Health check
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    message: 'Cybersecurity Dashboard backend is running',
  });
});

app.get('/info', (_req, res) => {
  res.json({
    name:    'Cybersecurity Monitoring Dashboard — Backend',
    version: '1.0.0',
    phase:   4,
    ws:      `ws://localhost:${PORT}`,
    rest: {
      vulnerabilities: `http://localhost:${PORT}/api/vulnerabilities`,
      owasp:           `http://localhost:${PORT}/api/owasp`,
      health:          `http://localhost:${PORT}/health`,
    },
    note: 'All data is SIMULATED/MOCK for demonstration purposes only.',
  });
});

// ── HTTP server (shared with WebSocket server) ────────────────────────────────
const server = http.createServer(app);

// ── WebSocket server ──────────────────────────────────────────────────────────
const { broadcast, clientCount } = createWsServer(server);

// ── Event generator ───────────────────────────────────────────────────────────
// Generates one event every 3 seconds and broadcasts it to all WS clients.
// Change the interval here if you want faster/slower events.
const stopGenerator = startEventGenerator((event) => {
  broadcast(event);
}, 3000);

// ── Start listening ───────────────────────────────────────────────────────────
server.listen(PORT, () => {
  console.log(`\n┌─────────────────────────────────────────────────┐`);
  console.log(`│  SecureOps Dashboard — Backend Server            │`);
  console.log(`│  HTTP  →  http://localhost:${PORT}/health           │`);
  console.log(`│  WS    →  ws://localhost:${PORT}                    │`);
  console.log(`│  NOTE: Events are SIMULATED, not real attacks     │`);
  console.log(`└─────────────────────────────────────────────────┘\n`);
});

// ── Graceful shutdown ─────────────────────────────────────────────────────────
function shutdown(signal: string) {
  console.log(`\n[Server] ${signal} received — shutting down...`);
  stopGenerator();
  server.close(() => {
    console.log('[Server] HTTP server closed.');
    process.exit(0);
  });
  // Force exit if server.close() stalls (e.g. open WS connections)
  setTimeout(() => process.exit(0), 3000);
}

process.on('SIGINT',  () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

// Suppress unhandled rejection noise in development
process.on('unhandledRejection', (reason) => {
  console.error('[Server] Unhandled rejection:', reason);
});

export { clientCount }; // exported for potential future use
