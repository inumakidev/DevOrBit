# AI agent onboarding and continuity

## Purpose

This protocol prevents reliance on chat memory and stale status claims. It applies to compatible AI agents working on DevOrbit. The existence of `AGENTS.md` does not mean every AI platform automatically discovers or enforces that file; verify environment-specific compatibility.

## Mandatory start-of-development-session sequence

Read these files in order:

1. Repository `AGENTS.md`.
2. `docs/continuity/AGENT-ONBOARDING.md`.
3. `docs/continuity/PROJECT-CONTEXT.md`.
4. `docs/continuity/HANDOFF.md`.
5. `docs/development/CURRENT-STATUS.md`.
6. `docs/development/NEXT-SESSION.md`.

Then inspect the actual repository: files, branch and working tree where available, recent history, scripts, tests, and relevant evidence. Compare it with the documentation. Report discrepancies, current verified state, scope, and required permissions. Confirm the exact next authorized task before writing.

If required references are missing, a required source document is unavailable, or a material conflict cannot be resolved from repository evidence and approved decisions, stop and ask the user. Do not invent an architecture or assume prior-chat context.

## During the session

- Work only within the approved task and file scope.
- Ask before destructive or security-sensitive operations.
- Preserve user-owned files, secrets, privacy, and deployment boundaries.
- Record actual decisions, unexpected findings, files changed, and tests run.
- Use Pass, Fail, Not Applicable (with reason), and Not Verified accurately.
- Do not claim that README prose or a plan proves a feature works.

## Required end-of-session updates

Before ending each development session:

1. Summarize actual files created or modified and why.
2. Record tests/checks actually run, observed outcomes, and tests not run.
3. Update current phase/milestone, issues, and decision records as appropriate.
4. Write a precise next-session task with prerequisites, scope boundaries, and acceptance criteria.
5. Update `docs/continuity/HANDOFF.md`, cross-check it against the actual repository, and report unresolved discrepancies.

Relevant records include `docs/development/CURRENT-STATUS.md`, `DEVELOPMENT-LOG.md`, `TESTING-LOG.md`, `DECISIONS.md`, `KNOWN-ISSUES.md`, and `NEXT-SESSION.md`.

## Status and authority

Approved specifications and decision records define intended behavior; actual files and test evidence define implementation status. Handoffs summarize but never override either. Do not change approved decisions without explicit user approval and a decision record.

At the current checkpoint: Phase 1/2/3 are Approved; Documentation Foundation is Approved; M1.1 Environment Inspection and M1.1A/M1.1B reconciliation and preflight are Completed; Phase 4 implementation is In Progress; M1.2A Workspace Foundation is Accepted; M1.2B Core Contracts is Accepted with non-blocking issues; M1 Foundation & Contracts is In Progress and not complete; M1.3 is Not Started. The M1.2B implementation session reported 29 passing contract tests and successful local validation, but these were not independently rerun during the read-only acceptance audit. No hosted GitHub Actions result has been observed; broader end-to-end/product application tests have not been run. The local readiness audit observed branch `master`, zero commits, and a configured remote whose intended owner/name/visibility and remote existence/accessibility remain Not Verified. Both DOCX source documents remain local and are proposed for exclusion from the first commit unless separately approved. No staging, commit, push, fetch, or pull occurred during the read-only audit or this documentation reconciliation. Reinspect the repository every session before asserting these remain current.
