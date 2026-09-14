# Cybersecurity Monitoring Dashboard

A modern, real-time security operations center (SOC) dashboard for monitoring security events, tracking vulnerabilities, and assessing OWASP Top 10 compliance posture.

![Dashboard Preview](./docs/screenshots/dashboard-preview.png)
> *Screenshot placeholder - Add your dashboard screenshots here*

## 📋 Project Overview

This is a full-stack portfolio demonstration project showcasing cybersecurity monitoring concepts, real-time data visualization, and security best practices. The dashboard provides SOC analysts with a comprehensive view of:

- **Real-time Security Events**: Live WebSocket stream of security incidents
- **Threat Analytics**: Visualizations of attack patterns, severity distribution, and trends
- **Vulnerability Management**: Tracking and assessment of security vulnerabilities
- **OWASP Top 10 Posture**: Compliance tracking across all OWASP 2021 categories
- **PDF Report Generation**: Exportable security reports for stakeholders

**Important**: This project uses simulated/demo data for educational purposes. It demonstrates security monitoring concepts and is not connected to real attack detection systems.

## ✨ Features

### Real-Time Security Event Streaming
- WebSocket-based live event feed with automatic reconnection
- Event filtering by severity (Critical, High, Medium, Low, Informational)
- Status tracking (Open, Investigating, Resolved)
- Connection status indicator with visual feedback

### Interactive Threat Analytics
- **Event Timeline Chart**: Security events over time
- **Severity Distribution**: Donut chart showing threat breakdown
- **Attack Type Analysis**: Bar chart of event types
- **Top Targeted Endpoints**: Horizontal bar chart
- **Top Source IPs**: Horizontal bar chart  
- All charts update in real-time as events arrive

### Vulnerability Monitoring
- Comprehensive vulnerability database with CVSS scores
- Filtering by severity and status
- Detailed vulnerability information (CVE IDs, affected components, remediation steps)
- OWASP category mapping
- Expandable rows with full descriptions

### OWASP Top 10 Security Posture
- Complete OWASP 2021 category tracking
- Radar chart visualization of all 10 categories
- Category-specific scoring based on linked vulnerabilities
- Interactive detail panels with security recommendations
- Overall security posture score and band indicators

### PDF Report Generation
- Comprehensive security reports with:
  - Executive summary
  - Security events overview and critical threat summary
  - Vulnerability assessment with severity breakdown
  - OWASP Top 10 posture analysis
  - Actionable security recommendations
- Professional formatting with charts and metrics
- Timestamped downloads

### Security Hardening
- Helmet.js security headers
- CORS with origin validation
- Rate limiting (100 requests per 15 minutes)
- Input validation on all API endpoints
- JSON payload size limits
- Environment-based configuration

## 🏗️ Architecture

### System Design

```
┌─────────────────────────────────────────────────────────────┐
│                     React Frontend (Vite)                   │
│  ┌───────────────┐  ┌──────────────┐  ┌─────────────────┐ │
│  │  Dashboard    │  │  Analytics   │  │  Vulnerabilities│ │
│  │  Page         │  │  Page        │  │  Page           │ │
│  └───────┬───────┘  └──────┬───────┘  └────────┬────────┘ │
│          │                 │                    │          │
│  ┌───────▼─────────────────▼────────────────────▼────────┐ │
│  │         useSecurityEvents (WebSocket Hook)            │ │
│  │         useVulnerabilities (REST API Hook)            │ │
│  │         useOwasp (REST API Hook)                      │ │
│  └───────┬─────────────────┬────────────────────┬────────┘ │
└──────────┼─────────────────┼────────────────────┼──────────┘
           │                 │                    │
           │ WebSocket       │ HTTP GET           │ HTTP GET
           │                 │                    │
┌──────────▼─────────────────▼────────────────────▼──────────┐
│                   Node.js Backend (Express)                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐ │
│  │  WebSocket   │  │  REST API    │  │  Event Generator │ │
│  │  Server      │  │  Endpoints   │  │  (Simulated)     │ │
│  │              │  │              │  │                  │ │
│  │  - Broadcast │  │  - /api/     │  │  - Generates     │ │
│  │  - Heartbeat │  │    vulns     │  │    security      │ │
│  │  - Reconnect │  │  - /api/     │  │    events        │ │
│  │              │  │    owasp     │  │  - Configurable  │ │
│  └──────────────┘  └──────────────┘  └──────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

**Frontend:**
- React 19 with TypeScript
- Vite (build tool)
- React Router (routing)
- Chart.js + react-chartjs-2 (data visualization)
- Tailwind CSS (styling)
- Heroicons (icons)
- jsPDF (PDF report generation)

**Backend:**
- Node.js with Express
- TypeScript
- WebSocket (ws library)
- CORS middleware
- Helmet (security headers)
- express-rate-limit (rate limiting)
- express-validator (input validation)
- dotenv (environment configuration)

**Development Tools:**
- ESLint (code linting)
- TypeScript compiler
- ts-node-dev (backend hot reload)

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Cybersecurity_Monitoring_Dashboard
   ```

2. **Install frontend dependencies**
   ```bash
   npm install
   ```

3. **Install backend dependencies**
   ```bash
   cd server
   npm install
   cd ..
   ```

### Configuration

#### Backend Configuration

Create a `.env` file in the `server` directory (use `server/.env.example` as template):

```env
PORT=4000
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
EVENT_GENERATION_INTERVAL=3000
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
NODE_ENV=development
```

**Environment Variables:**
- `PORT`: Backend server port (default: 4000)
- `ALLOWED_ORIGINS`: Comma-separated list of allowed CORS origins
- `EVENT_GENERATION_INTERVAL`: Time between generated events in milliseconds (default: 3000)
- `RATE_LIMIT_WINDOW_MS`: Rate limiting time window (default: 15 minutes)
- `RATE_LIMIT_MAX_REQUESTS`: Maximum requests per window (default: 100)

#### Frontend Configuration

Create a `.env` file in the project root (use `.env.example` as template):

```env
VITE_API_BASE_URL=http://localhost:4000
VITE_WS_URL=ws://localhost:4000
VITE_APP_NAME=SecureOps Dashboard
VITE_APP_ENV=development
```

### Running the Application

1. **Start the backend server**
   ```bash
   cd server
   npm run dev
   ```
   The backend will start on `http://localhost:4000`

2. **Start the frontend development server** (in a new terminal)
   ```bash
   npm run dev
   ```
   The frontend will start on `http://localhost:5173`

3. **Access the dashboard**
   Open your browser and navigate to `http://localhost:5173`

### Building for Production

**Frontend:**
```bash
npm run build
npm run preview  # Preview production build
```

**Backend:**
```bash
cd server
npm run build
npm start  # Run production build
```

## 📊 WebSocket Architecture

### Event Flow

1. **Event Generation**: Backend generates simulated security events at configurable intervals (default: 3 seconds)
2. **Broadcasting**: Events are broadcast to all connected WebSocket clients
3. **Frontend Processing**: React hook receives events and updates state
4. **UI Updates**: Components re-render with new data, charts animate

### WebSocket Features

- **Automatic Reconnection**: Exponential backoff strategy (2s → 30s max)
- **Heartbeat/Ping**: Keeps connections alive
- **Connection Status**: Visual indicator in UI (Connected/Connecting/Reconnecting/Disconnected)
- **Memory Management**: Events capped at 200, trend data at 30 days
- **Graceful Cleanup**: Proper socket closure on unmount

### Event Types

- `failed_auth`: Failed authentication attempts
- `brute_force`: Brute force attacks
- `sql_injection`: SQL injection attempts
- `xss_attempt`: Cross-site scripting attempts
- `suspicious_api`: Suspicious API calls
- `port_scan`: Network port scanning
- `unauthorized_access`: Unauthorized access attempts
- `malware_alert`: Malware detection
- `data_exfiltration`: Data exfiltration attempts
- `privilege_escalation`: Privilege escalation attempts

## 🔒 Security Considerations

### Implemented Security Measures

1. **HTTP Security Headers** (via Helmet.js)
   - Content Security Policy
   - X-Frame-Options
   - X-Content-Type-Options
   - Strict-Transport-Security

2. **CORS Configuration**
   - Origin validation against whitelist
   - Credentials support
   - Blocked origins logged

3. **Rate Limiting**
   - 100 requests per 15 minutes per IP
   - Applied to all API routes
   - Standard headers for client feedback

4. **Input Validation**
   - Query parameter validation
   - Path parameter validation
   - Format and type checking

5. **Payload Security**
   - JSON payload size limited to 1MB
   - Prevents large payload attacks

6. **Information Disclosure**
   - X-Powered-By header removed
   - Generic error messages
   - Server version hidden

### Security Notes

- **Demo Data**: All security events and vulnerabilities are simulated
- **Authentication**: Not implemented (portfolio project)
- **HTTPS**: Not configured (use reverse proxy in production)
- **Database**: No persistent storage (uses in-memory mock data)
- **Secrets Management**: Use environment variables, never commit `.env` files

## 🧪 Testing

### Linting
```bash
npm run lint
```

### Type Checking
```bash
npm run build  # Runs tsc before vite build
```

### Backend Type Checking
```bash
cd server
npm run build
```

## 📁 Project Structure

```
Cybersecurity_Monitoring_Dashboard/
├── src/                          # Frontend source code
│   ├── components/               # React components
│   │   ├── charts/              # Chart components (Chart.js)
│   │   ├── dashboard/           # Dashboard-specific components
│   │   └── layout/              # Layout components (Header, Sidebar, AppLayout)
│   ├── hooks/                   # Custom React hooks
│   │   ├── useSecurityEvents.ts # WebSocket event hook
│   │   ├── useVulnerabilities.ts# Vulnerability API hook
│   │   ├── useOwasp.ts          # OWASP API hook
│   │   └── useWebSocket.ts      # WebSocket connection hook
│   ├── pages/                   # Page components
│   │   ├── DashboardPage.tsx    # Main dashboard
│   │   ├── SecurityEventsPage.tsx
│   │   ├── AnalyticsPage.tsx
│   │   ├── VulnerabilitiesPage.tsx
│   │   ├── OWASPPage.tsx
│   │   └── ReportsPage.tsx
│   ├── routes/                  # Route wrappers
│   ├── types/                   # TypeScript type definitions
│   ├── utils/                   # Utility functions
│   │   ├── reportGenerator.ts   # PDF report generation
│   │   └── severity.ts          # Severity styling utilities
│   ├── App.tsx                  # Main app component
│   └── main.tsx                 # Application entry point
├── server/                       # Backend source code
│   ├── src/
│   │   ├── data/                # Mock data
│   │   │   ├── vulnerabilities.ts
│   │   │   └── owaspCategories.ts
│   │   ├── owasp/               # OWASP scoring logic
│   │   │   └── scoringEngine.ts
│   │   ├── routes/              # API route handlers
│   │   │   ├── vulnerabilities.ts
│   │   │   └── owasp.ts
│   │   ├── types/               # TypeScript types
│   │   ├── eventGenerator.ts    # Simulated event generator
│   │   ├── wsServer.ts          # WebSocket server
│   │   └── index.ts             # Server entry point
│   ├── .env.example             # Environment variable template
│   └── package.json
├── .env.example                 # Frontend env template
├── .gitignore                   # Git ignore rules
├── eslint.config.js             # ESLint configuration
├── tailwind.config.js           # Tailwind CSS configuration
├── tsconfig.json                # TypeScript configuration
├── vite.config.ts               # Vite configuration
└── package.json                 # Frontend dependencies
```

## 🎨 UI/UX Features

- **Responsive Design**: Works on desktop, tablet, and mobile
- **Dark Theme**: Professional dark theme optimized for SOC environments
- **Real-time Updates**: Charts and metrics update live
- **Loading States**: Skeleton screens and spinners
- **Error Handling**: User-friendly error messages
- **Empty States**: Helpful messages when no data available
- **Accessibility**: ARIA labels, semantic HTML, keyboard navigation

## 📈 Future Improvements

### Potential Enhancements

- [ ] User authentication and authorization (JWT, OAuth)
- [ ] Role-based access control (Admin, Analyst, Viewer)
- [ ] Persistent data storage (PostgreSQL, MongoDB)
- [ ] Integration with real SIEM systems
- [ ] Machine learning threat detection
- [ ] Email/Slack notification system
- [ ] Scheduled report delivery
- [ ] Event search and filtering
- [ ] Custom dashboard layouts
- [ ] Dark/light theme toggle
- [ ] Export data to CSV
- [ ] Advanced analytics and ML predictions
- [ ] Incident response workflow
- [ ] Audit log tracking
- [ ] Multi-tenancy support
- [ ] GraphQL API
- [ ] Docker containerization
- [ ] Kubernetes deployment
- [ ] CI/CD pipeline
- [ ] Comprehensive unit and integration tests

### Production Considerations

- [ ] HTTPS/TLS configuration
- [ ] Load balancing
- [ ] Horizontal scaling
- [ ] Database connection pooling
- [ ] Caching layer (Redis)
- [ ] Log aggregation (ELK stack)
- [ ] Monitoring and alerting (Prometheus, Grafana)
- [ ] Backup and disaster recovery
- [ ] Security audit and penetration testing

## 📝 License

This is a portfolio demonstration project. Feel free to use it as reference for your own projects.

## 🤝 Contributing

This is a portfolio project, but suggestions and feedback are welcome! Please open an issue or submit a pull request.

## 👤 Author

**Your Name**
- Portfolio: [your-portfolio-url]
- LinkedIn: [your-linkedin-url]
- GitHub: [@your-github-username]

## 🙏 Acknowledgments

- OWASP Foundation for the OWASP Top 10 categories and descriptions
- Chart.js for the visualization library
- Tailwind CSS for the styling framework
- React and Node.js communities

---

**Disclaimer**: This project is for educational and demonstration purposes only. All security events and vulnerability data are simulated. Do not use this for actual production security monitoring without integrating with real security data sources and conducting proper security assessments.
