# 8. Security and governance

## Security posture

Security and privacy are approved design priorities. This documentation does not assert implemented controls, a completed security audit, or blanket legal compliance. Markdown agent guidance is not a sandbox; actual environment permissions must be validated.

## Seven governance systems

| System | Primary responsibility |
| --- | --- |
| Agent Governance | Core policies and adapters; permissions, untrusted content, and prompt injection. |
| Context & Task Management | Workflow state, plans, approvals, handoffs, and interrupted sessions. |
| Skill Registry & Trust | Registry, provenance, versioning, integrity, and compatibility. |
| Quality Evaluation | Benchmark fixtures, objective checks, review, and regression control. |
| Business Integrity | Engineering policies, idempotency, transactions, and concurrency. |
| Operations & Recovery | Operations skills, backups, monitoring, and incident response. |
| Delivery Governance | Release management, staging, CI/CD, and rollback. |

## Required application security guidance

The approved design requires server-side authorization and object ownership checks (including IDOR/BOLA), RBAC and tenant isolation, with negative tests for unauthorized access. It also calls for secure authentication/session handling, MFA where needed, input validation, CSRF/XSS/CORS/SSRF defenses, upload controls, rate limiting, abuse prevention, secret management, dependency/supply-chain trust, least privilege, and explicit tool permissions.

## Installer and operational invariants

- Dry-run performs zero writes.
- Paths and symlinks cannot escape the target.
- User-owned or unowned files are not silently overwritten or deleted.
- Modified assets are detected; integrity/provenance failures block.
- No unapproved scripts, secret logging, automatic push, production deployment, or destructive migrations.
- Recovery is verified or reported explicitly.

## Business integrity and privacy

Use transactions, idempotency, concurrency controls, and migration safety for consequential workflows. Apply privacy by design, data minimization, rights workflows, retention practices, truthful policies, and legal review where appropriate. Consider Philippine Data Privacy Act RA 10173 where applicable; do not promise universal compliance.

## Security verification and release blocking

Security checks should use reproducible fixtures and record expected versus observed behavior, environment/tool versions, reviewer decisions, and redacted evidence. Critical security failures, missing mandatory verification, unsafe overwrite/delete behavior, or false success claims block release. See [Evaluation and releases](09-evaluation-and-releases.md) for quality gates.

Current status: requirements above are **Approved Design** and planned for implementation. Security implementation and tests are **Not Verified**.
