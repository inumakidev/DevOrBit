# 9. Evaluation and releases

## Evaluation design

Quality evaluation is intended to cover:

- Skill contract validity and effectiveness against a baseline.
- Workflow integration and correct dependency/approval behavior.
- Agent compatibility and actual discovery/invocation.
- Generated application quality.
- Installer safety, failure handling, and recovery.
- Release readiness and regressions.

Record fixtures, expected and observed behavior, environment/runtime/agent versions, reviewer decisions, and redacted evidence. Never invent benchmark percentages or report tests as passed without observed results.

## Verification outcomes

Use **Pass**, **Fail**, **Not Applicable** (with reason), or **Not Verified**. Not Verified blocks mandatory checks. Unsupported capabilities must remain clearly labeled.

## Six implementation milestones

| Milestone | Scope | Core completion evidence |
| --- | --- | --- |
| M1 — Repository Foundation & Contracts | Reproducible workspace, contracts, canonical asset schema, manifest validation, error taxonomy, baseline CI. | Valid/invalid fixture tests, duplicates and required fields covered; install/build/typecheck/lint/tests recorded. |
| M2 — Registry & Resolver | Local content index, integrity/provenance, dependency expansion and deterministic ordering. | Deterministic plans and verified rejection of cycles, missing requirements, incompatibility, and trust failures. |
| M3 — Safe Installer & Recovery | Read-only inspection, dry-run, ownership records, path containment, staging, verification, update/remove. | Zero-write dry-run, protected user files, tested recovery, no unsafe path writes. |
| M4 — Agent Adapters | Initial Codex and supported Copilot VS Code adapters and smoke tests. | Evidence of discovery, invocation, safety, precedence, and unsupported-capability reporting. |
| M5 — Starter Skills & Workflows | Six starter skills and three workflow prototypes. | Contract-valid assets, explicit dependencies, risk-based approvals, authorization tests, workflow fixtures. |
| M6 — Evaluation & Release Candidate | Full evaluation, platform compatibility, release and recovery checks. | Mandatory gates Pass or justified Not Applicable; critical failures block release. |

Each milestone requires its scope and acceptance criteria to be authorized before implementation. The immediate task is **Documentation Foundation — Final Review and User Acceptance**. The next development milestone is **Phase 4 / M1 — Repository Foundation & Contracts**; development has **Not Started**.

## Release roadmap

| Release | Planned focus |
| --- | --- |
| V0.1 | Foundation, registry/resolver, safe installer, initial Codex/Copilot adapters, six starter skills, basic workflows, evaluation, docs. |
| V0.2 | Planning, architecture, debugging, and review expansion. |
| V0.3 | Deeper Next.js/Laravel full-stack guidance and project setup. |
| V0.4 | Specialized security, auth, authorization, and advanced QA. |
| V0.5 | CI/CD, operations, deployment readiness, docs, compliance expansion. |
| V1.0 | Stable supported capabilities with evidence-backed quality gates. |

No release is currently shipped. Release gates include no critical security failures, no missing mandatory verification, safe overwrite/delete behavior, real supported-environment adapter tests, recorded unit/integration and Windows/Linux evidence, and truthful capability claims.

## Current evaluation status

Tests have **Not been executed** for the documentation setup. No benchmark or implementation result is asserted. See [TESTING-LOG.md](../development/TESTING-LOG.md).
