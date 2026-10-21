# DevOrbit project context

## Identity

DevOrbit — AI Development Toolkit. Tagline: **One toolkit. Any stack. Smarter development.**

The project is a versioned, modular AI development toolkit design for reusable skills, workflows, policies, stack profiles, safe selective installation, agent integrations, evaluation, governance, and continuity.

## Approved architecture and scope

- Two independent engines: AI Skills & Instructions and Project Setup Automation.
- Modes: AI Only (V0.1 priority), Project Only, Combined; full setup/scaffolding for latter modes is not a current implementation claim.
- 17 skill domains, 84 candidate skills, 8 packs, 12 workflows, 7 governance systems.
- Official initial stack profiles: Next.js and Laravel; custom stacks must be supported.
- Initial agent targets: Codex and specifically validated Copilot environments; Claude Code and Cursor later. Copilot VS Code, CLI, and cloud are distinct validation targets.
- TypeScript, pinned Node.js LTS, pnpm workspaces, Zod/JSON Schema, Vitest, and GitHub Actions are approved technology direction. M1 selected exact tool versions and CLI/lint tools; see [CURRENT-STATUS.md](../development/CURRENT-STATUS.md).
- Six releases/milestones from V0.1 through V1.0 as described in [the roadmap](../development/ROADMAP.md).

## Current status

- Phase 1: Approved.
- Phase 2: Approved.
- Phase 3: Approved.
- Documentation Foundation: Approved.
- M1.1 Environment Inspection: Completed.
- M1.1A/M1.1B reconciliation and preflight: Completed.
- Phase 4 implementation: In Progress; M2.2 Phase 1B asset-tree integrity, Phase 1C record binding, Phase 1D framing, Phase 1E envelope parsing, internal Ed25519 verification/context binding, internal RFC 8785 JCS canonicalization, and strict trust-policy parsing are implemented and accepted. Copilot reported parser-focused tests 25/25 and full suite 181/181, plus Biome/lint, typecheck, and build passing, before a test import issue was discovered during GitHub Actions validation. The user corrected that import and confirms validation now passes; no post-correction counts or run ID were supplied, and this was not independently verified in this documentation closure. M2.2 remains incomplete.
- M1.2A Workspace Foundation: Accepted.
- M1.2B Core Contracts: Accepted with non-blocking issues.
- M1 — Foundation & Contracts: COMPLETE / ACCEPTED / PUSHED.
- M1.2B contract tests: 29 reported passing; not independently rerun during the acceptance audit.
- GitHub initial commit and push: User-confirmed.
- Hosted GitHub Actions: Successful per user-provided screenshots; run #1 / ID `39215771440`, `validate` job ID `117939137329`.
- M2.1 — Registry & Resolver architecture and documentation: Accepted / Complete.
- M2.2 design and documentation: ACCEPTED / PUSHED per user report; baseline commit `21dbe8a` user-reported; seven exact-parameter groups synchronized; ADR-021 through ADR-024 approved and documented.
- M2.2 Registry Phase 1A read-only preflight: COMPLETED.
- M2.2 Phase 1B asset-tree integrity: COMPLETE / ACCEPTED / PUSHED / CI PASSED per user report.
- M2.2 Phase 1C manifest-to-content record binding: COMPLETE / ACCEPTED / PUSHED / CI PASSED per user report.
- M2.2 Phase 1D attestation framing: COMPLETE / ACCEPTED / PUSHED / CI PASSED per user confirmation.
- M2.2 Phase 1E strict detached-attestation envelope parsing: Implemented and accepted; focused tests 25/25 and focused Biome passed.
- M2.2 internal Ed25519 verification and contextual binding: Implemented and accepted; exact full-string validation for repository IDs, revisions, and digests fixed after audit. Focused tests 24/24, registry typecheck, and focused Biome passed.
- M2.2 internal RFC 8785 JCS canonicalizer: Implemented and accepted; internal-only API with caller-supplied resource budgets, iterative traversal, strict Unicode/string handling, and generic typed failures. Focused tests 21/21, Biome, and registry typecheck passed. No public export or caller integration is claimed.
- M2.2 strict trust-policy parsing: Implemented / Accepted; internal parser and focused vectors/tests are present. User confirms validation passed after correcting the test import; exact post-correction counts were not supplied.
- M2.2 signed policy-update envelope parsing, bootstrap/trust-chain verification, signer authorization, revocation enforcement, protected-state integration, and registry integration: Not started.
- M2.4 Plans/Diagnostics, M2.5 Testing/Acceptance, and M3: Not started.
- M2.2 push and GitHub Actions: User confirms push and green Actions; no commit hash or run ID provided. The last explicitly observed full-suite result is 135/135; the user separately reports successful full validation, without a newer test count.
- Earlier M1/Phase 1B/Phase 1C local checks: lint, typecheck, and build passed; 70/70 tests passed (M1 29, Phase 1B 22, Phase 1C 19), per user report. These results apply only to those milestones, not Phases 1D/1E.
- CI build-order remediation: core package build step added before root typecheck after a clean-checkout package-resolution failure; latest workflow passed per user report.
- M2.2 overall implementation: IN PROGRESS / INCOMPLETE.
- M2.3 resolver: NOT STARTED.
- Next implementation target: Signed trust-policy update-envelope parsing and verification under the approved architecture. The raw update-envelope cap is 2 MiB and envelope/framing requirements are specified; before implementation, settle any update-parser JSON-work budgets under that cap and define trusted verification inputs, including bootstrap's independent trust-anchor boundary. The full policy-chain retrieval adapter is not frozen. This does not authorize implementation or adjacent bootstrap/chain/state/integration work. M2.2 remains in progress; M2.3 remains not started.

**Approved design versus implementation status:** M2.2's nine specification groups are approved at design level and documented in the [canonical registry and resolver architecture](../main/11-registry-and-resolver-architecture.md). The seven exact-parameter groups and Clarification Amendments v1.0–v1.3 (ADR-021 through ADR-024) are synchronized and documented in [DECISIONS.md](../development/DECISIONS.md). The canonical comparator preserves ordinal string comparison for its first five logical fields; its sixth `message` field maps to `RegistryDiagnostic.detail` and uses the RFC 8785 JCS byte comparison specified by ADR-024. Phases 1B–1E, internal Ed25519 verification/context binding, the internal JCS canonicalizer, and strict trust-policy parsing are implemented and accepted. Copilot reported the trust-policy focused suite 25/25, full suite 181/181, Biome/lint, typecheck, and build passing before a test import defect was found; the user corrected it and confirms validation passes, without a post-correction count or run ID. The user-reported corrected validation was not independently checked in this documentation closure. The approved complete canonical-snapshot byte cap remains 64 MiB. Signed update-envelope parsing/verification, bootstrap and trust-chain verification, trust authorization, revocation enforcement, protected state, Git verification, registry discovery, and resolver behavior remain not started or incomplete. M2.2 remains IN PROGRESS / INCOMPLETE; M2.3 is NOT STARTED. The next target is signed update-envelope parsing and verification; update parser JSON-work budgets and verification trust inputs (including bootstrap) require resolution before implementation, and the full-chain retrieval adapter remains unfrozen. Windows/Git/OS security properties remain unverified.

**Historical audit context:** the earlier final audit listed these three clarification questions as unresolved at that time. The later approved ADR-021 resolves them; the historical finding is retained in [HANDOFF.md](HANDOFF.md) and is not a current blocker.

## Current checkpoint update — 2026-10-21

Strict trust-policy parsing is **IMPLEMENTED / ACCEPTED** and remains internal, with no public export. Copilot reported 25/25 focused tests, 181/181 full-suite tests, and passing Biome/lint, typecheck, and build before a test import issue was discovered during GitHub Actions validation. The user corrected the test import and confirms validation now passes; post-correction counts and CI identifiers were not supplied and were not independently verified here.

M2.2 remains **IN PROGRESS / INCOMPLETE**. Signed policy-update envelope parsing, bootstrap/trust-chain verification, signer authorization, revocation enforcement, and protected high-water state remain **NOT STARTED**. M2.3 Resolver, M2.4 Plans/Diagnostics, M2.5 Testing/Acceptance, and M3 remain **NOT STARTED**. The next implementation target is signed update-envelope parsing and verification according to the approved architecture. The 2 MiB raw envelope limit and framing/schema are approved. Before implementation, resolve any update-parser JSON complexity budgets under that cap and specify the trusted verification input contract, including bootstrap's independent trust-anchor boundary. Full policy-chain retrieval remains unfrozen. This checkpoint does not authorize implementation or change an approved design.

M1.2A established and accepted the workspace foundation and minimal `@devorbit/cli` entry point at version `0.0.0`. M1.2B Core Contracts was accepted with non-blocking issues. Its implementation session reported 29 passing Vitest contract tests and successful local install, workspace discovery, typecheck, lint, build, schema generation, CLI smoke checks, core import, and frozen-lockfile checks; the read-only acceptance audit did not rerun them. User-provided screenshots identify the initial commit/push to the private GitHub repository and show successful hosted workflow `Workspace validation` run #1 and `validate` job. All six M1 requirements are accepted; M1 is Complete / Accepted. The GitHub UI annotation warning and notice remain uninspected and unresolved, and are not M1 blockers. This does not establish broader end-to-end/product test coverage or implementation of either engine, an installer, skills, or adapters.

User-confirmed GitHub record: private repository `https://github.com/inumakidev/DevOrBit`, branch `master`, initial commit `6c2f9985031104d36e9a0949a3b3b2b4862b3a2d` (`chore: initialize DevOrbit foundation and core contracts`), pushed to `origin/master`. User-provided screenshots show run ID `39215771440`, job ID `117939137329`, 32-second workflow and 28-second job, with install/lint/typecheck/build/test passing; see [TESTING-LOG.md](../development/TESTING-LOG.md). The two DOCX source documents remain local and unchanged. This documentation-only reconciliation did not run Git commands or contact GitHub.

## Historical safety boundaries — superseded by the 2026-10-21 checkpoint above

Do not change approved decisions without explicit approval. M1 is COMPLETE / ACCEPTED / PUSHED; M2.1 architecture is COMPLETE / ACCEPTED / PUSHED; M2.2 design/specifications are COMPLETE / ACCEPTED. The implementation-status and next-task statements in this historical paragraph applied to the earlier checkpoint and are superseded above. Git/GitHub authority and all Git/GitHub operations remain exclusively user-managed. Do not initialize frameworks, provision databases, deploy, contact GitHub, stage, commit, push, fetch, pull, or overwrite existing files without required authorization. Keep secrets and personal data out of logs and evidence.

**Historical next-task clarification:** This paragraph records the 2026-10-20 checkpoint and is superseded by the 2026-10-21 update above.

## Source precedence

Current explicit approvals and safety rules govern actions. Approved versioned specifications and decision records govern intended behavior. Actual repository files and test evidence govern implementation claims. Logs provide history; handoffs summarize but do not override evidence.

## Historical checkpoint

Earlier M1.1/M1.1A records correctly described a documentation and inspection state with Phase 4 not started and M1.2 awaiting authorization. Those records are historical evidence and are not rewritten by the later M1.2A acceptance. The older Git observations remain historical as recorded in the development and handoff logs.
