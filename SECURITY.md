# Security and responsible disclosure

Security is a design priority for DevOrbit. This document records intended project practices; it is not a claim that the toolkit has been implemented, independently audited, or certified.

## Reporting a security concern

Please report suspected vulnerabilities privately to the repository maintainer through the private reporting channel configured for the repository, if available. Do not include secrets, personal data, or exploit details in a public issue. **A dedicated contact address or repository security-advisory channel has not been specified in the approved project documents; repository maintainers should configure and verify a private reporting route before public development or release.**

Include a concise impact description, affected component or version if known, reproducible steps, and a proposed safe way to coordinate remediation. Avoid testing against systems or data you do not own or have permission to assess.

## Security design commitments

The approved design calls for:

- Least privilege, explicit tool permissions, and defenses against prompt injection and untrusted content.
- Server-side authorization, object ownership checks, tenant isolation, and negative authorization tests in generated applications.
- Input validation, secure sessions, CSRF/XSS/CORS/SSRF defenses, upload controls, rate limiting, and secret management.
- Trusted provenance and integrity checks for canonical assets and dependencies.
- Installer dry-run with zero writes, path and symlink containment, ownership-aware changes, no silent overwrites, no unapproved scripts, and verifiable recovery.
- No secret logging, automatic push, production deployment, or destructive migration.
- Privacy by design and consideration of applicable requirements, including Philippine Data Privacy Act RA 10173 where applicable. No blanket legal-compliance guarantee is made.

See [Security and Governance](docs/main/08-security-and-governance.md) and [the installer contracts](docs/main/02-architecture.md).

## Current security status

These controls are **Approved Design** and mostly **Planned**. There is no implementation or test evidence in this documentation baseline. Unsupported environments and capabilities must be labeled **Not Verified** until tested.
