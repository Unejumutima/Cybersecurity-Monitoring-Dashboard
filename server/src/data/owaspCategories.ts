/**
 * owaspCategories.ts — Static OWASP Top 10 2021 category definitions
 * -------------------------------------------------------------------
 * Contains the fixed, non-computed fields for each category:
 *   - Official OWASP identifier and name (verified from owasp.org)
 *   - Plain-English and full descriptions
 *   - Linked live-event types (for mapping WS events to categories)
 *   - Actionable improvement recommendations
 *
 * Computed fields (score, postureBand, vuln counts) are added at
 * request time by scoringEngine.ts — they are NOT stored here.
 */

import type { OWASPId } from '../types/owasp';

export interface CategoryDefinition {
  id:               OWASPId;
  name:             string;
  description:      string;
  fullDescription:  string;
  /**
   * Live event types (from liveEvent.ts LiveEventType) that contribute
   * negative signal to this category's score.
   */
  linkedEventTypes: string[];
  improvements:     string[];
}

export const OWASP_CATEGORY_DEFINITIONS: CategoryDefinition[] = [
  {
    id:   'A01:2021',
    name: 'Broken Access Control',
    description:
      'Users can act outside of their intended permissions — accessing other accounts, viewing sensitive files, or performing privileged actions.',
    fullDescription:
      'Access control enforces policies so that users cannot act outside of their intended permissions. Failures typically lead to unauthorised information disclosure, modification, or destruction of data, or performing business functions outside the limits of the user. Common weaknesses include bypassing access control checks, elevation of privilege, CORS misconfiguration, and insecure direct object references.',
    linkedEventTypes: ['unauthorized_access', 'privilege_escalation'],
    improvements: [
      'Deny access by default — explicitly grant required permissions rather than blocking exceptions.',
      'Enforce record ownership checks on the server; do not rely on client-supplied identifiers.',
      'Log access-control failures and alert on repeated failures from a single identity.',
      'Invalidate sessions server-side after logout; do not rely solely on client-side token deletion.',
      'Rate-limit API and controller access to minimise the impact of automated exploitation tools.',
    ],
  },
  {
    id:   'A02:2021',
    name: 'Cryptographic Failures',
    description:
      'Sensitive data — passwords, credit-card numbers, health records — is exposed because of weak or missing encryption.',
    fullDescription:
      'Previously known as "Sensitive Data Exposure," this category focuses on failures related to cryptography that often lead to sensitive data exposure or system compromise. Common issues include transmitting data in clear text, using weak or outdated algorithms (MD5, SHA-1, DES), hard-coded keys, inadequate key management, and missing HSTS headers that allow protocol downgrade attacks.',
    linkedEventTypes: ['data_exfiltration'],
    improvements: [
      'Classify data processed, stored, or transmitted and apply appropriate protections based on sensitivity.',
      'Enforce HTTPS everywhere with HSTS headers; do not offer HTTP fallback for authenticated endpoints.',
      'Use strong, modern algorithms: AES-256-GCM for symmetric encryption, RSA-2048+ or ECDSA for asymmetric.',
      'Never store passwords — use strong adaptive hashing (bcrypt, Argon2, scrypt) with appropriate cost factors.',
      'Disable caching for responses that contain sensitive data.',
    ],
  },
  {
    id:   'A03:2021',
    name: 'Injection',
    description:
      'Hostile data is sent to an interpreter — SQL, OS commands, LDAP — tricking it into executing unintended instructions.',
    fullDescription:
      'An application is vulnerable to injection when user-supplied data is not validated, filtered, or sanitised before being used in queries or commands. SQL injection, NoSQL injection, OS command injection, LDAP injection, and cross-site scripting (XSS) all fall under this category. Injection can result in data loss, corruption, disclosure, denial of service, and full host takeover.',
    linkedEventTypes: ['sql_injection', 'xss_attempt'],
    improvements: [
      'Use parameterised queries (prepared statements) for all database interactions — never concatenate user input into SQL.',
      'Apply input validation against an allowlist on both client and server side.',
      'Use a context-aware output encoding library to prevent XSS in HTML, JavaScript, CSS, and URL contexts.',
      'Prefer ORMs that use parameterised queries by default, but audit ORM-generated SQL for edge cases.',
      'Run the application with minimal database privileges so successful injection has limited impact.',
    ],
  },
  {
    id:   'A04:2021',
    name: 'Insecure Design',
    description:
      'Security risks introduced at design time — missing threat modelling, absent security controls — that cannot be patched away.',
    fullDescription:
      'Insecure design is a broad category representing different weaknesses, expressed as "missing or ineffective control design." It is distinct from insecure implementation: a securely implemented insecure design cannot be fixed by perfect code. Secure design requires threat modelling during requirements and design phases, use-case and misuse-case documentation, and security reference architectures.',
    linkedEventTypes: ['suspicious_api', 'data_exfiltration'],
    improvements: [
      'Integrate threat modelling into the design phase — identify assets, entry points, trust boundaries, and threats.',
      'Establish and use a library of secure design patterns and reference architectures.',
      'Write security user stories including misuse and abuse cases alongside functional requirements.',
      'Apply the principle of least privilege at every architectural boundary.',
      'Review designs with security champions before implementation begins.',
    ],
  },
  {
    id:   'A05:2021',
    name: 'Security Misconfiguration',
    description:
      'Default credentials, unnecessary features, verbose errors, or missing hardening leave systems unnecessarily exposed.',
    fullDescription:
      'Security misconfiguration is the most commonly observed vulnerability. It results from insecure default configurations, incomplete or ad-hoc configurations, open cloud storage, misconfigured HTTP headers, verbose error messages exposing sensitive information, and missing or outdated security patches. Without a concerted, repeatable hardening process, systems are at higher risk.',
    linkedEventTypes: ['suspicious_api', 'port_scan'],
    improvements: [
      'Implement a hardening process: remove default accounts, disable unused features, apply minimal permissions.',
      'Build deployment pipelines that automatically apply and verify security configurations.',
      'Enable only required HTTP methods, ports, and protocols; block everything else at the perimeter.',
      'Send security-relevant response headers (CSP, X-Frame-Options, Referrer-Policy) on all responses.',
      'Automate configuration drift detection and alert on unexpected changes.',
    ],
  },
  {
    id:   'A06:2021',
    name: 'Vulnerable and Outdated Components',
    description:
      'Using libraries, frameworks, or other software with known unpatched vulnerabilities puts the entire application at risk.',
    fullDescription:
      'Components such as libraries, frameworks, and other software modules run with the same privileges as the application. If a vulnerable component is exploited, an attack can cause serious data loss or server takeover. Common issues include not knowing the versions of all components, not scanning for known vulnerabilities (CVEs), not patching in a timely manner, and software developers not testing the compatibility of updated libraries.',
    linkedEventTypes: ['malware_alert'],
    improvements: [
      'Maintain a software bill of materials (SBOM) — inventory all components and their versions.',
      'Continuously monitor for CVEs using tools like OWASP Dependency-Check, Snyk, or GitHub Dependabot.',
      'Establish an SLA for patching: critical CVEs within 24–48 hours, high within 7 days.',
      'Remove unused dependencies, unnecessary features, components, files, and documentation.',
      'Obtain components from official sources over secure links; prefer signed packages.',
    ],
  },
  {
    id:   'A07:2021',
    name: 'Identification and Authentication Failures',
    description:
      'Weak login controls — brute-forceable passwords, missing MFA, poor session management — allow attackers to impersonate users.',
    fullDescription:
      'Previously known as "Broken Authentication." Confirmation of user identity, authentication, and session management is critical to guard against authentication-related attacks. Weaknesses exist when applications permit automated attacks like credential stuffing and brute force, allow weak or default passwords, lack MFA, expose session identifiers in URLs, or fail to properly invalidate sessions after logout.',
    linkedEventTypes: ['failed_auth', 'brute_force'],
    improvements: [
      'Enforce multi-factor authentication (MFA) on all accounts, prioritising administrator and privileged accounts.',
      'Implement account lockout or exponential back-off after repeated authentication failures.',
      'Use a modern password policy: length over complexity, check against known-breached password lists (HIBP).',
      'Generate new session IDs with sufficient randomness after successful login; invalidate on logout.',
      'Avoid shipping default credentials in any component; force credential change on first use.',
    ],
  },
  {
    id:   'A08:2021',
    name: 'Software and Data Integrity Failures',
    description:
      'Code or data from untrusted sources is used without integrity verification, enabling supply-chain attacks and unsafe deserialisation.',
    fullDescription:
      'Software and data integrity failures relate to code and infrastructure that does not protect against integrity violations. This includes insecure deserialisation, using plugins or libraries from untrusted sources, CI/CD pipelines that do not verify code integrity, and auto-update mechanisms that apply updates without sufficient integrity checks. Attackers can exploit these to upload malicious code or data.',
    linkedEventTypes: ['malware_alert', 'data_exfiltration'],
    improvements: [
      'Use digital signatures to verify software and data from all external sources before using them.',
      'Ensure CI/CD pipelines use signed commits, protected branches, and automated security testing.',
      'Audit third-party library integrity: verify checksums and prefer packages with reproducible builds.',
      'Avoid deserialisation of untrusted data; if necessary, enforce strict type-checking and input validation.',
      'Review and restrict which plugins, libraries, or extensions can be installed in your supply chain.',
    ],
  },
  {
    id:   'A09:2021',
    name: 'Security Logging and Monitoring Failures',
    description:
      'Without adequate logging and alerting, breaches go undetected — attackers can dwell for months before discovery.',
    fullDescription:
      'Insufficient logging, monitoring, detection, and active response enables attackers to further attack systems, maintain persistence, pivot to other systems, and tamper with or extract data. Most breach studies show time to detect a breach exceeds 200 days, typically by external parties rather than internal processes or monitoring. Auditable events should be logged with sufficient context, monitored, and acted upon in a timely fashion.',
    linkedEventTypes: ['suspicious_api', 'port_scan', 'reconnaissance'],
    improvements: [
      'Log all authentication events, access-control failures, and server-side input validation failures.',
      'Ensure logs are formatted to be consumable by centralised log management solutions (SIEM).',
      'Establish alerting thresholds and escalation procedures for high-severity events.',
      'Protect logs from tampering and deletion — store in append-only or external write-once storage.',
      'Test monitoring effectiveness through regular detection exercises and red-team simulations.',
    ],
  },
  {
    id:   'A10:2021',
    name: 'Server-Side Request Forgery (SSRF)',
    description:
      'The server is tricked into making requests to unintended destinations, potentially reaching internal services or cloud metadata APIs.',
    fullDescription:
      'SSRF flaws occur when a web application fetches a remote resource without validating the user-supplied URL. An attacker can coerce the application to send crafted requests to unexpected destinations, even when protected by a firewall, VPN, or other network access control list (ACL). SSRF can be used to enumerate internal services, access cloud provider metadata endpoints, or pivot deeper into a network.',
    linkedEventTypes: ['suspicious_api', 'unauthorized_access'],
    improvements: [
      'Sanitise and validate all client-supplied input URLs; reject private/loopback/link-local address ranges.',
      'Use an allowlist of permitted URL schemes, ports, and destination hosts for all outbound server requests.',
      'Disable HTTP redirections for server-initiated requests, or re-validate the destination after each redirect.',
      'Enforce network segmentation so that internal services are not reachable from application servers directly.',
      'Log all outbound requests from server-side components and alert on connections to unexpected destinations.',
    ],
  },
];
