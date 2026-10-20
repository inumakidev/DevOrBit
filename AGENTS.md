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

7. Inspect actual repository files, scripts, tests, and available evidence. Branch, working-tree, and history facts must come from user-provided evidence; do not run Git commands.
8. Compare the repository with the documentation. Report inconsistencies rather than silently reconciling them.
9. State the current verified status, proposed exact task, boundaries, and any required approvals. Wait for confirmation of the next authorized task before making changes.

If a required file is missing, or a material conflict cannot be resolved from the actual repository and approved decision records, stop and ask the user. Actual repository and test evidence determine implementation status; approved specifications determine intended design.

## Scope and safety

- The approved design is not evidence of implementation. Use **Approved Design**, **Planned**, **In Progress**, **Implemented**, **Verified**, **Deferred**, and **Not Verified** accurately.
- Current status: Phase 1, Phase 2, and Phase 3 **Approved**; Documentation Foundation **Approved**; M1.1 Environment Inspection and M1.1A/M1.1B reconciliation and preflight **Completed**; M1.2A Workspace Foundation **Accepted**; M1.2B Core Contracts **Accepted with non-blocking issues**; M1 Foundation & Contracts **Complete / Accepted / Pushed**; M2.1 architecture **Complete**; M2.2 design/specification **Accepted / Pushed** (baseline commit `21dbe8a`, user-reported); seven exact-parameter groups **Synchronized**; ADR-021 through ADR-024 **Approved and documented**. M2.2 Phase 1B asset-tree integrity, Phase 1C record binding, Phase 1D attestation framing, Phase 1E strict envelope parsing, internal Ed25519 verification/context binding, and the internal RFC 8785 JCS canonicalizer are **Implemented / Accepted**. User confirms full project validation, GitHub Actions success, and a clean working tree with `master` synchronized to `origin/master`; these facts were not independently checked. Do not invent commit hashes or CI run IDs. JCS focused tests passed 21/21, Biome passed, and registry typecheck passed. M2.2 remains **In Progress / Incomplete**; M2.3 remains **NOT STARTED**. Strict trust-policy parsing and subsequent trust, state, Git, and registry integration remain unimplemented. See [the canonical registry and resolver architecture](docs/main/11-registry-and-resolver-architecture.md) and [decision record](docs/development/DECISIONS.md).
- The M1.2B implementation session reported 29 passing contract tests and successful local install, workspace discovery, typecheck, lint, build, schema generation, CLI smoke checks, core import, and frozen-lockfile checks. These results were not independently rerun during the read-only acceptance audit. See `docs/development/TESTING-LOG.md` for evidence boundaries.
- User-provided screenshots show successful `Workspace validation` run #1 (ID `39215771440`) and `validate` job (ID `117939137329`), with frozen-lockfile install, lint, typecheck, build, and tests passing. The initial commit/push to private `inumakidev/DevOrBit` is user-confirmed. See `docs/development/TESTING-LOG.md`; screenshot evidence was not independently retrieved from GitHub.
- Deferred/non-blocking findings remain: additional Ajv semantic-boundary assertions, core TypeScript tooling coupling to the CLI workspace, the non-failing Vitest configuration-loader warning, and one uninspected GitHub Actions annotation warning and notice.
- M2.1 architecture and documentation closure are complete. M2.2 design and documentation are accepted/pushed per user report (baseline commit `21dbe8a`). Phase 1B through Phase 1E, internal Ed25519 verification/context binding, and the internal JCS canonicalizer are accepted. The user confirms full validation, GitHub Actions success, and a clean working tree with `master` synchronized to `origin/master`; no commit hash or CI run ID is asserted and none was independently checked. M2.2 remains in progress and incomplete; M2.3 Resolver is not started. Strict trust-policy parsing is the next implementation target, gated on explicit confirmation of the raw-input and collection limits, caller-specific JCS budgets, exact schema/timestamp validation, and duplicate-key/unknown-field rejection behavior. Do not assume a phase label or begin trust-policy implementation until that gate is satisfied. All Git/GitHub authority and operations are exclusively user-managed; do not run Git commands or contact GitHub. Authorization for one milestone does not authorize later milestones.
- M2.4 Plans/Diagnostics, M2.5 Testing/Acceptance, and M3 are **NOT STARTED**.
- No Git command or GitHub contact was performed during the M1 documentation closure.
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
