/**
 * ReportsPage.tsx
 * ---------------
 * PDF security report generation page.
 * Fetches all security data and generates downloadable PDF reports.
 */

import { useState } from 'react';
import { useSecurityEvents } from '../hooks/useSecurityEvents';
import { useVulnerabilities } from '../hooks/useVulnerabilities';
import { useOwasp } from '../hooks/useOwasp';
import { generateSecurityReport, downloadReport, type ReportData } from '../utils/reportGenerator';
import {
  DocumentArrowDownIcon,
  DocumentChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

export default function ReportsPage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastGenerated, setLastGenerated] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch all data sources
  const eventsData = useSecurityEvents();
  const vulnData = useVulnerabilities();
  const owaspData = useOwasp();

  // Check if all data is loaded
  const isLoading = 
    eventsData.wsStatus === 'connecting' ||
    vulnData.loadState === 'loading' ||
    vulnData.loadState === 'idle' ||
    owaspData.loadState === 'loading' ||
    owaspData.loadState === 'idle';

  const hasError =
    vulnData.loadState === 'error' ||
    owaspData.loadState === 'error';

  const handleGenerateReport = () => {
    setError(null);
    setIsGenerating(true);

    try {
      // Compile all report data
      const reportData: ReportData = {
        events: eventsData.events,
        eventKpis: eventsData.kpis,
        severityDistribution: eventsData.distribution,
        vulnerabilities: vulnData.vulnerabilities,
        vulnSummary: vulnData.summary,
        owaspCategories: owaspData.categories,
        owaspOverallScore: owaspData.overallScore,
        owaspOverallBand: owaspData.overallBand,
        owaspBandCounts: owaspData.bandCounts,
      };

      // Generate PDF
      const doc = generateSecurityReport(reportData);
      
      // Download with timestamp
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      downloadReport(doc, `security-report-${timestamp}.pdf`);
      
      setLastGenerated(new Date());
    } catch (err) {
      console.error('Report generation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate report');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-5 p-5 lg:p-6">
      {/* Page heading */}
      <div>
        <h1 className="text-xl font-bold text-slate-100">Security Reports</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Generate comprehensive PDF security reports
        </p>
      </div>

      {/* Main report card */}
      <div className="rounded-xl bg-[#0d1424] border border-slate-800 p-6 lg:p-8">
        <div className="flex items-start gap-4">
          <div className="shrink-0 w-14 h-14 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
            <DocumentChartBarIcon className="w-7 h-7 text-cyan-400" />
          </div>
          
          <div className="flex-1">
            <h2 className="text-lg font-bold text-slate-100 mb-2">
              Comprehensive Security Monitoring Report
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              Generate a detailed PDF report including real-time security event analysis,
              vulnerability assessments, OWASP Top 10 compliance posture, and actionable
              security recommendations.
            </p>

            {/* Report contents preview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
              <div className="flex items-start gap-2 text-xs text-slate-400">
                <CheckCircleIcon className="w-4 h-4 text-cyan-500 shrink-0 mt-0.5" />
                <span>Security events overview and severity breakdown</span>
              </div>
              <div className="flex items-start gap-2 text-xs text-slate-400">
                <CheckCircleIcon className="w-4 h-4 text-cyan-500 shrink-0 mt-0.5" />
                <span>Critical and high threat summary</span>
              </div>
              <div className="flex items-start gap-2 text-xs text-slate-400">
                <CheckCircleIcon className="w-4 h-4 text-cyan-500 shrink-0 mt-0.5" />
                <span>Vulnerability assessment with severity analysis</span>
              </div>
              <div className="flex items-start gap-2 text-xs text-slate-400">
                <CheckCircleIcon className="w-4 h-4 text-cyan-500 shrink-0 mt-0.5" />
                <span>OWASP Top 10 security posture scores</span>
              </div>
              <div className="flex items-start gap-2 text-xs text-slate-400">
                <CheckCircleIcon className="w-4 h-4 text-cyan-500 shrink-0 mt-0.5" />
                <span>Security recommendations and action items</span>
              </div>
              <div className="flex items-start gap-2 text-xs text-slate-400">
                <CheckCircleIcon className="w-4 h-4 text-cyan-500 shrink-0 mt-0.5" />
                <span>Professional formatting with charts and metrics</span>
              </div>
            </div>

            {/* Status indicators */}
            {isLoading && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-xs text-yellow-400 mb-4">
                <ClockIcon className="w-4 h-4" />
                <span>Loading security data...</span>
              </div>
            )}

            {hasError && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400 mb-4">
                <ExclamationTriangleIcon className="w-4 h-4" />
                <span>Some data sources failed to load. Report may be incomplete.</span>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400 mb-4">
                <ExclamationTriangleIcon className="w-4 h-4" />
                <span>{error}</span>
              </div>
            )}

            {lastGenerated && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-400 mb-4">
                <CheckCircleIcon className="w-4 h-4" />
                <span>
                  Last generated: {lastGenerated.toLocaleString('en-US', {
                    month: 'short', day: 'numeric', year: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                  })}
                </span>
              </div>
            )}

            {/* Generate button */}
            <button
              onClick={handleGenerateReport}
              disabled={isGenerating || isLoading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-600 disabled:bg-slate-700 disabled:text-slate-500 text-white font-medium text-sm transition-colors"
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Generating Report...</span>
                </>
              ) : (
                <>
                  <DocumentArrowDownIcon className="w-4 h-4" />
                  <span>Generate PDF Report</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Information cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Data sources card */}
        <div className="rounded-xl bg-[#0d1424] border border-slate-800 p-5">
          <h3 className="text-sm font-semibold text-slate-200 mb-3">Report Data Sources</h3>
          <ul className="space-y-2 text-xs text-slate-400">
            <li className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${eventsData.wsStatus === 'connected' ? 'bg-emerald-500' : 'bg-slate-600'}`} />
              <span>Real-time security events ({eventsData.events.length} events)</span>
            </li>
            <li className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${vulnData.loadState === 'success' ? 'bg-emerald-500' : 'bg-slate-600'}`} />
              <span>Vulnerability database ({vulnData.vulnerabilities.length} vulnerabilities)</span>
            </li>
            <li className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${owaspData.loadState === 'success' ? 'bg-emerald-500' : 'bg-slate-600'}`} />
              <span>OWASP Top 10 posture (10 categories)</span>
            </li>
          </ul>
        </div>

        {/* Usage notes card */}
        <div className="rounded-xl bg-[#0d1424] border border-slate-800 p-5">
          <h3 className="text-sm font-semibold text-slate-200 mb-3">Usage Notes</h3>
          <ul className="space-y-2 text-xs text-slate-400 list-disc list-inside">
            <li>Reports reflect the current state of all monitored systems</li>
            <li>PDF includes executive summary and detailed analysis</li>
            <li>Suitable for stakeholder briefings and compliance documentation</li>
            <li className="text-amber-500">Demo data - not for production security assessments</li>
          </ul>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="rounded-lg bg-slate-900/40 border border-slate-800/50 p-4">
        <p className="text-xs text-slate-600 leading-relaxed">
          <span className="font-semibold text-slate-500">Disclaimer:</span> This reporting feature is part of a
          portfolio demonstration project. Security events and vulnerability data are simulated for educational
          purposes. Generated reports should not be used for actual production security assessments or compliance
          audits. For enterprise security monitoring, integrate with real security information and event management
          (SIEM) systems and validated vulnerability scanners.
        </p>
      </div>
    </div>
  );
}
