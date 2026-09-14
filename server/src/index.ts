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

import 'dotenv/config';
import http from 'http';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createWsServer } from './wsServer';
import { startEventGenerator } from './eventGenerator';
import vulnerabilitiesRouter from './routes/vulnerabilities';
import owaspRouter           from './routes/owasp';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 4000;
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173', 'http://localhost:3000'];
const RATE_LIMIT_WINDOW_MS = process.env.RATE_LIMIT_WINDOW_MS ? parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) : 15 * 60 * 1000;
const RATE_LIMIT_MAX = process.env.RATE_LIMIT_MAX_REQUESTS ? parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) : 100;
const EVENT_INTERVAL = process.env.EVENT_GENERATION_INTERVAL ? parseInt(process.env.EVENT_GENERATION_INTERVAL, 10) : 3000;

// ── Express app ───────────────────────────────────────────────────────────────
const app = express();

// ── Security middleware ───────────────────────────────────────────────────────

// Helmet: Sets various HTTP headers for security
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP to avoid conflicts with dev tools
  crossOriginEmbedderPolicy: false,
}));

// Remove X-Powered-By header to avoid exposing Express
app.disable('x-powered-by');

// CORS: Restrict origins in production
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    
    if (ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`[CORS] Blocked request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

// Rate limiting: Prevent abuse
const limiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: RATE_LIMIT_MAX,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

app.use(express.json({ limit: '1mb' })); // Limit payload size

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
// Generates one event at configured interval and broadcasts it to all WS clients.
const stopGenerator = startEventGenerator((event) => {
  broadcast(event);
}, EVENT_INTERVAL);

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
