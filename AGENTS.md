# DevOrbit agent instructions

These instructions apply to compatible AI agents working in this repository. Do not assume that every AI product or environment automatically discovers or enforces `AGENTS.md`; verify the specific integration and its capabilities before relying on it.

## Required start-of-session sequence

At the beginning of every development session, read these files in order:

1. `AGENTS.md`
2. `docs/continuity/AGENT-ONBOARDING.md`
3. `docs/continuity/PROJECT-CONTEXT.md`
4. `docs/continuity/HANDOFF.md`
5. `docs/development/CURRENT-STATUS.md`
6. `docs/development/NEXT-SESSION.md`

Then:

7. Inspect the actual repository state, including files, working tree, scripts, tests, and available evidence.
8. Compare the repository with the documentation. Report inconsistencies rather than silently reconciling them.
9. State the current verified status, proposed exact task, boundaries, and any required approvals. Wait for confirmation of the next authorized task before making changes.

If a required file is missing, or a material conflict cannot be resolved from the actual repository and approved decision records, stop and ask the user. Actual repository and test evidence determine implementation status; approved specifications determine intended design.

## Scope and safety

- The approved design is not evidence of implementation. Use **Approved Design**, **Planned**, **In Progress**, **Implemented**, **Verified**, **Deferred**, and **Not Verified** accurately.
- Current status: Phase 1, Phase 2, and Phase 3 **Approved**; Documentation Foundation **Approved**; M1.1 Environment Inspection and M1.1A/M1.1B reconciliation and preflight **Completed**; Phase 4 implementation **In Progress**; M1.2A Workspace Foundation **Accepted**; M1.2B Core Contracts **Accepted with non-blocking issues**; M1 Foundation & Contracts **In Progress, not complete**; M1.3 **Not Started**.
- The M1.2B implementation session reported 29 passing contract tests and successful local install, workspace discovery, typecheck, lint, build, schema generation, CLI smoke checks, core import, and frozen-lockfile checks. These results were not independently rerun during the read-only acceptance audit. No hosted GitHub Actions result has been observed. See `docs/development/TESTING-LOG.md` for evidence boundaries.
- Deferred non-blocking items include a direct Ajv semantic-boundary test enhancement, decoupling core TypeScript tooling from CLI-specific tooling, and a Vitest config-loader warning.
- Do not begin M1.3 or later implementation without explicit authorization. Do not stage, commit, push, fetch, pull, or contact the configured remote without separate authorization. Authorization for one milestone does not authorize later milestones.
- Local Git readiness audit observed `master`, zero commits, and a locally configured remote; intended ownership/name/visibility and remote existence/accessibility remain Not Verified. Both DOCX source documents remain local and are proposed for exclusion from the first commit unless separately approved.
- Do not initialize frameworks, provision databases, deploy, contact GitHub, or perform Git operations without explicit authorization.
- Do not overwrite user-owned or existing files without approval. Do not expose secrets or personal data.
- Do not change an approved decision without explicit user approval and a corresponding decision record.
- Follow milestone scope and safety invariants in the documentation. Never invent test results, benchmark results, compatibility, or compliance claims.

## Required end-of-session records

Before ending every development session:

- Update the appropriate development and handoff records.
- Record actual files created or modified and the reason for each.
- Record commands/tests actually executed, observed outcomes, and checks not run.
- Record bugs, blockers, unresolved issues, and decisions.
- Update `docs/development/NEXT-SESSION.md` with a precise next task, prerequisites, boundaries, and acceptance criteria.
- Update `docs/continuity/HANDOFF.md` and cross-check all status claims against the repository.

The detailed process is in `docs/continuity/AGENT-ONBOARDING.md`.
