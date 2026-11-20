# SupportDesk Day 10 — OWASP Security Review

## 1. Broken Access Control (A01)

Finding:
Customers must not access tickets belonging to other customers.

Implementation:
- JWT authentication protects ticket routes.
- Customer ticket queries are restricted by userId.
- Agents can access all tickets.

Verification:
- Unauthenticated access returns HTTP 401.
- Customer access to another customer's ticket returns HTTP 404.

Status: Implemented and tested.

## 2. Authentication Failures (A07)

Finding:
Weak authentication controls can expose user accounts.

Implementation:
- Passwords are hashed using bcrypt with 12 salt rounds.
- JWT tokens expire after 1 hour.
- Invalid credentials return HTTP 401.
- Login rate limiting allows 5 requests per 15 minutes.

Verification:
- Invalid password returns HTTP 401.
- Excessive login attempts return HTTP 429.

Status: Implemented and tested.

## 3. Security Misconfiguration (A05)

Finding:
Missing security headers, unrestricted CORS, and exposed
internal errors can increase security risks.

Implementation:
- Helmet adds HTTP security headers.
- CORS allows the configured frontend origin.
- Unexpected errors return generic messages.

Verification:
- Helmet security headers verified.
- Allowed CORS origin returns HTTP 200.
- Blocked CORS origin returns HTTP 403.
- Error handler reviewed for stack trace exposure.

Status: Implemented and reviewed.

## Conclusion

Three OWASP-related security areas were reviewed.
The documented controls have been implemented and
the listed tests completed.

This review does not represent a full security audit.
## Dependency Security Audit

Command: npm audit --omit=dev

Findings:
- 4 high-severity vulnerabilities reported.
- Affected dependencies include deepmerge-ts and effect.
- These are associated with the Prisma dependency tree.

Action:
- npm audit fix --force was not executed because it would
  upgrade Prisma 6 to Prisma 7, introducing breaking changes.
- Dependency vulnerabilities remain unresolved and require
  a separately tested upgrade.

Status: Identified and documented; remediation pending.
