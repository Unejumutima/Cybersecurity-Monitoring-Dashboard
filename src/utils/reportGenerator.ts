/**
 * reportGenerator.ts
 * ------------------
 * Generates professional PDF security reports using jsPDF.
 * Includes security events, vulnerabilities, and OWASP posture data.
 */

import { jsPDF } from 'jspdf';
import type { SecurityMetric, SeverityDistribution } from '../types/security';
import type { LiveSecurityEvent } from '../hooks/useSecurityEvents';
import type { ApiVulnerability, VulnSummary } from '../hooks/useVulnerabilities';
import type { OWASPCategory, PostureBand } from '../hooks/useOwasp';

export interface ReportData {
  // Security Events
  events: LiveSecurityEvent[];
  eventKpis: SecurityMetric[];
  severityDistribution: SeverityDistribution[];
  
  // Vulnerabilities
  vulnerabilities: ApiVulnerability[];
  vulnSummary: VulnSummary | null;
  
  // OWASP
  owaspCategories: OWASPCategory[];
  owaspOverallScore: number;
  owaspOverallBand: PostureBand;
  owaspBandCounts: Record<PostureBand, number>;
}

const PRIMARY_COLOR = [99, 102, 241] as [number, number, number];    // Indigo
const DANGER_COLOR = [239, 68, 68] as [number, number, number];      // Red
const WARNING_COLOR = [251, 146, 60] as [number, number, number];    // Orange
const SUCCESS_COLOR = [34, 197, 94] as [number, number, number];     // Green
const TEXT_DARK = [15, 23, 42] as [number, number, number];          // Slate-900
const TEXT_MUTED = [100, 116, 139] as [number, number, number];      // Slate-500

export function generateSecurityReport(data: ReportData): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let yPos = margin;

  // ─── Helper functions ───────────────────────────────────────────────────────

  function addText(text: string, size: number, color: [number, number, number], bold = false) {
    doc.setFontSize(size);
    doc.setTextColor(...color);
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.text(text, margin, yPos);
    yPos += size * 0.5;
  }

  function addLine() {
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 8;
  }

  function checkPageBreak(requiredSpace = 30) {
    if (yPos + requiredSpace > pageHeight - margin) {
      doc.addPage();
      yPos = margin;
    }
  }

  function addSection(title: string) {
    checkPageBreak(40);
    yPos += 5;
    addText(title, 14, PRIMARY_COLOR, true);
    addLine();
  }

  function addKpiRow(label: string, value: string | number, color: [number, number, number]) {
    doc.setFontSize(10);
    doc.setTextColor(...TEXT_DARK);
    doc.setFont('helvetica', 'normal');
    doc.text(label, margin + 5, yPos);
    
    doc.setTextColor(...color);
    doc.setFont('helvetica', 'bold');
    doc.text(String(value), pageWidth - margin - 5, yPos, { align: 'right' });
    
    yPos += 7;
  }

  // ─── Report Header ──────────────────────────────────────────────────────────

  doc.setFillColor(...PRIMARY_COLOR);
  doc.rect(0, 0, pageWidth, 45, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('Security Monitoring Report', margin, 20);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const reportDate = new Date().toLocaleString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZoneName: 'short',
  });
  doc.text(`Generated: ${reportDate}`, margin, 32);
  doc.text('SecureOps SOC Dashboard', pageWidth - margin, 32, { align: 'right' });

  yPos = 55;

  // ─── Executive Summary ──────────────────────────────────────────────────────

  addSection('Executive Summary');
  
  doc.setFontSize(10);
  doc.setTextColor(...TEXT_DARK);
  doc.setFont('helvetica', 'normal');
  const summary = `This report provides a comprehensive overview of the current security posture, including ` +
    `real-time security events, vulnerability assessments, and OWASP Top 10 compliance tracking. ` +
    `Data represents the current state of monitored systems.`;
  const splitSummary = doc.splitTextToSize(summary, pageWidth - 2 * margin);
  doc.text(splitSummary, margin, yPos);
  yPos += splitSummary.length * 6 + 10;

  // ─── Security Events Overview ───────────────────────────────────────────────

  addSection('Security Events Overview');
  
  const totalEvents = data.events.length;
  const criticalEvents = data.events.filter(e => e.severity === 'critical').length;
  const highEvents = data.events.filter(e => e.severity === 'high').length;
  const openEvents = data.events.filter(e => e.status === 'open').length;
  
  addKpiRow('Total Security Events', totalEvents, TEXT_DARK);
  addKpiRow('Critical Severity', criticalEvents, DANGER_COLOR);
  addKpiRow('High Severity', highEvents, WARNING_COLOR);
  addKpiRow('Open/Unresolved', openEvents, DANGER_COLOR);
  
  yPos += 5;

  // Severity breakdown
  doc.setFontSize(11);
  doc.setTextColor(...TEXT_DARK);
  doc.setFont('helvetica', 'bold');
  doc.text('Severity Distribution:', margin, yPos);
  yPos += 8;

  data.severityDistribution.forEach(dist => {
    if (dist.count === 0) return;
    doc.setFontSize(9);
    doc.setTextColor(...TEXT_MUTED);
    doc.setFont('helvetica', 'normal');
    doc.text(`• ${dist.severity.charAt(0).toUpperCase() + dist.severity.slice(1)}: ${dist.count} (${dist.percentage}%)`, margin + 5, yPos);
    yPos += 6;
  });

  yPos += 5;

  // ─── Critical Threat Summary ────────────────────────────────────────────────

  const criticalThreats = data.events
    .filter(e => (e.severity === 'critical' || e.severity === 'high') && e.status === 'open')
    .slice(0, 5);

  if (criticalThreats.length > 0) {
    addSection('Critical & High Threats (Top 5)');
    
    criticalThreats.forEach((event, idx) => {
      checkPageBreak(25);
      
      doc.setFontSize(10);
      doc.setTextColor(...TEXT_DARK);
      doc.setFont('helvetica', 'bold');
      doc.text(`${idx + 1}. ${event.eventType.replace(/_/g, ' ').toUpperCase()}`, margin + 5, yPos);
      yPos += 6;
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...TEXT_MUTED);
      
      const msgLines = doc.splitTextToSize(`   ${event.message}`, pageWidth - 2 * margin - 10);
      doc.text(msgLines, margin + 5, yPos);
      yPos += msgLines.length * 5 + 2;
      
      doc.text(`   Source: ${event.source}  •  Severity: ${event.severity}`, margin + 5, yPos);
      yPos += 8;
    });
  }

  // ─── Vulnerability Summary ──────────────────────────────────────────────────

  addSection('Vulnerability Assessment');
  
  if (data.vulnSummary) {
    addKpiRow('Total Vulnerabilities', data.vulnSummary.total, TEXT_DARK);
    addKpiRow('Critical', data.vulnSummary.bySeverity.critical, DANGER_COLOR);
    addKpiRow('High', data.vulnSummary.bySeverity.high, WARNING_COLOR);
    addKpiRow('Medium', data.vulnSummary.bySeverity.medium, [234, 179, 8]);
    addKpiRow('Low', data.vulnSummary.bySeverity.low, [59, 130, 246]);
    
    yPos += 5;
    
    // Calculate status counts from vulnerabilities
    const openCount = data.vulnerabilities.filter(v => v.status === 'open').length;
    const inRemCount = data.vulnerabilities.filter(v => v.status === 'in_remediation').length;
    const resolvedCount = data.vulnerabilities.filter(v => v.status === 'resolved').length;
    
    addKpiRow('Open Vulnerabilities', openCount, DANGER_COLOR);
    addKpiRow('In Remediation', inRemCount, WARNING_COLOR);
    addKpiRow('Resolved', resolvedCount, SUCCESS_COLOR);
  } else {
    doc.setFontSize(9);
    doc.setTextColor(...TEXT_MUTED);
    doc.text('No vulnerability data available.', margin + 5, yPos);
    yPos += 10;
  }

  // Top vulnerabilities
  const topVulns = data.vulnerabilities
    .filter(v => v.status === 'open' && (v.severity === 'critical' || v.severity === 'high'))
    .slice(0, 5);

  if (topVulns.length > 0) {
    yPos += 5;
    doc.setFontSize(11);
    doc.setTextColor(...TEXT_DARK);
    doc.setFont('helvetica', 'bold');
    doc.text('Top Open Vulnerabilities:', margin, yPos);
    yPos += 8;

    topVulns.forEach((vuln, idx) => {
      checkPageBreak(20);
      
      doc.setFontSize(9);
      doc.setTextColor(...TEXT_DARK);
      doc.setFont('helvetica', 'bold');
      doc.text(`${idx + 1}. ${vuln.title}`, margin + 5, yPos);
      yPos += 6;
      
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...TEXT_MUTED);
      doc.text(`   Severity: ${vuln.severity.toUpperCase()}  •  CVSS: ${vuln.cvssScore.toFixed(1)}  •  Asset: ${vuln.affectedAsset}`, margin + 5, yPos);
      yPos += 8;
    });
  }

  yPos += 5;

  // ─── OWASP Top 10 Posture ───────────────────────────────────────────────────

  addSection('OWASP Top 10 Security Posture');
  
  const bandColor = (band: PostureBand): [number, number, number] => {
    if (band === 'good') return SUCCESS_COLOR;
    if (band === 'needs_improvement') return WARNING_COLOR;
    return DANGER_COLOR;
  };

  addKpiRow('Overall Security Score', `${data.owaspOverallScore.toFixed(0)}/100`, bandColor(data.owaspOverallBand));
  addKpiRow('Overall Status', data.owaspOverallBand.replace(/_/g, ' ').toUpperCase(), bandColor(data.owaspOverallBand));
  
  yPos += 5;
  
  addKpiRow('Categories - Good', data.owaspBandCounts.good, SUCCESS_COLOR);
  addKpiRow('Categories - Needs Improvement', data.owaspBandCounts.needs_improvement, WARNING_COLOR);
  addKpiRow('Categories - High Risk', data.owaspBandCounts.high_risk, DANGER_COLOR);

  yPos += 10;

  // OWASP category breakdown
  doc.setFontSize(11);
  doc.setTextColor(...TEXT_DARK);
  doc.setFont('helvetica', 'bold');
  doc.text('Category Scores:', margin, yPos);
  yPos += 8;

  data.owaspCategories.forEach(cat => {
    checkPageBreak(12);
    
    doc.setFontSize(9);
    doc.setTextColor(...TEXT_DARK);
    doc.setFont('helvetica', 'normal');
    
    const scoreTxt = `${cat.score.toFixed(0)}/100`;
    const bandTxt = cat.postureBand.replace(/_/g, ' ');
    
    doc.text(`${cat.id}: ${cat.name}`, margin + 5, yPos);
    
    doc.setTextColor(...bandColor(cat.postureBand));
    doc.setFont('helvetica', 'bold');
    doc.text(`${scoreTxt} (${bandTxt})`, pageWidth - margin - 5, yPos, { align: 'right' });
    
    yPos += 6;
  });

  yPos += 10;

  // ─── Recommendations ────────────────────────────────────────────────────────

  addSection('Security Recommendations');
  
  const recommendations: string[] = [];

  if (criticalEvents > 0) {
    recommendations.push(`Address ${criticalEvents} critical security event${criticalEvents > 1 ? 's' : ''} immediately.`);
  }
  
  if (data.vulnSummary && data.vulnSummary.bySeverity.critical > 0) {
    recommendations.push(`Remediate ${data.vulnSummary.bySeverity.critical} critical vulnerabilit${data.vulnSummary.bySeverity.critical > 1 ? 'ies' : 'y'} with urgency.`);
  }
  
  const highRiskCategories = data.owaspCategories.filter(cat => cat.postureBand === 'high_risk');
  if (highRiskCategories.length > 0) {
    recommendations.push(`Improve ${highRiskCategories.length} high-risk OWASP categor${highRiskCategories.length > 1 ? 'ies' : 'y'}: ${highRiskCategories.map(c => c.id).join(', ')}.`);
  }
  
  if (data.owaspOverallScore < 70) {
    recommendations.push('Overall OWASP posture requires improvement. Prioritize security hardening initiatives.');
  }
  
  if (openEvents > totalEvents * 0.5) {
    recommendations.push('High percentage of open security events. Establish incident response procedures.');
  }

  if (recommendations.length === 0) {
    recommendations.push('Overall security posture is satisfactory. Continue monitoring and maintaining current security practices.');
  }

  recommendations.forEach((rec, idx) => {
    checkPageBreak(15);
    
    doc.setFontSize(10);
    doc.setTextColor(...TEXT_DARK);
    doc.setFont('helvetica', 'normal');
    
    const recLines = doc.splitTextToSize(`${idx + 1}. ${rec}`, pageWidth - 2 * margin - 10);
    doc.text(recLines, margin + 5, yPos);
    yPos += recLines.length * 6 + 3;
  });

  yPos += 10;

  // ─── Footer / Disclaimer ────────────────────────────────────────────────────

  checkPageBreak(30);
  
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 8;

  doc.setFontSize(8);
  doc.setTextColor(...TEXT_MUTED);
  doc.setFont('helvetica', 'italic');
  
  const disclaimer = 'IMPORTANT: This report is generated from a portfolio demonstration project. ' +
    'Security events and vulnerability data are simulated for educational purposes and do not represent ' +
    'actual security threats. This report should not be used for production security assessments.';
  
  const disclaimerLines = doc.splitTextToSize(disclaimer, pageWidth - 2 * margin);
  doc.text(disclaimerLines, margin, yPos);
  yPos += disclaimerLines.length * 5 + 5;

  doc.setFont('helvetica', 'normal');
  doc.text('© 2024 SecureOps Platform • Generated by Cybersecurity Monitoring Dashboard', pageWidth / 2, yPos, { align: 'center' });

  return doc;
}

export function downloadReport(doc: jsPDF, filename: string = 'security-report.pdf') {
  doc.save(filename);
}
