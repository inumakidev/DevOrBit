# Contributing to DevOrbit

Thank you for helping improve DevOrbit. The documentation foundation and M1 workspace/core contracts are present. M1.2A is accepted, M1.2B is accepted with non-blocking issues, and M1 Foundation & Contracts is Complete / Accepted. M2 — Registry & Resolver is next, planning pending; implementation has not started.

## Before contributing

1. Read [AGENTS.md](AGENTS.md).
2. Follow the required sequence in [AGENT-ONBOARDING.md](docs/continuity/AGENT-ONBOARDING.md).
3. Inspect the actual repository and compare it with [CURRENT-STATUS.md](docs/development/CURRENT-STATUS.md) and [HANDOFF.md](docs/continuity/HANDOFF.md).
4. Report discrepancies and obtain confirmation of the exact authorized task before making changes.

Do not change approved architecture or scope without explicit user approval and a recorded decision. Do not treat a planned capability as implemented or verified.

## Current contribution boundary

Do not begin M2 implementation or later milestone work without explicit authorization. Do not modify application source, install dependencies, initialize a framework, provision a database, deploy, or perform Git/GitHub operations unless explicitly authorized. The user handles GitHub operations manually. Preserve the distinction between implementation-session reports and user-provided hosted-CI screenshots; do not invent run details or job results.

## Documentation contributions

- Write clear, professional English and keep claims evidence-based.
- Label status explicitly: **Approved Design**, **Planned**, **In Progress**, **Implemented**, **Verified**, **Deferred**, or **Not Verified** as applicable.
- Keep the approved counts and catalogs intact; do not silently omit skills, packs, workflows, governance systems, stack support, or agent targets.
- Use relative links for repository documentation and verify every target exists.
- Update the relevant status, development, testing, decision, issue, next-session, and handoff records when the change affects them.
- Never record tests as passed unless they were actually run and their result is available.

## Development contributions

Implementation work must be explicitly authorized and scoped to a milestone in the [roadmap](docs/development/ROADMAP.md). Follow milestone acceptance criteria, safety invariants, and verification gates. Record actual files changed and commands/tests run in the relevant logs.

## Review and completion

Before ending a development session, summarize the actual changes, tests and their outcomes, unresolved issues, and next authorized task. Update [CURRENT-STATUS.md](docs/development/CURRENT-STATUS.md), [NEXT-SESSION.md](docs/development/NEXT-SESSION.md), and [HANDOFF.md](docs/continuity/HANDOFF.md) as appropriate. Do not claim a release or successful implementation without evidence.
