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

Then inspect actual repository files, scripts, tests, and available evidence. Compare them with the documentation and report discrepancies. Branch, working-tree, and history facts must come from user-provided evidence; Git/GitHub authority and operations are exclusively user-managed. Do not run Git commands or contact GitHub. Report current verified state, scope, and required permissions, and confirm the exact next authorized task before writing.

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

At the current checkpoint: Phase 1/2/3 are Approved; Documentation Foundation is Approved; M1.1 Environment Inspection and M1.1A/M1.1B reconciliation and preflight are Completed; M1.2A Workspace Foundation is Accepted; M1.2B Core Contracts is Accepted with non-blocking issues; M1 Foundation & Contracts is COMPLETE / ACCEPTED / PUSHED. M2.1 architecture is COMPLETE / ACCEPTED / PUSHED. M2.2 design/specifications are COMPLETE / ACCEPTED. The seven exact-parameter groups are synchronized and ADR-021 through ADR-024 are APPROVED / DOCUMENTED. M2.2 Phase 1B asset-tree integrity, Phase 1C manifest-to-content binding, Phase 1D attestation framing, Phase 1E strict envelope parsing, and internal Ed25519 verification/context binding are IMPLEMENTED / ACCEPTED. The user confirms push and green GitHub Actions; no commit hash or CI run ID is recorded. The verifier's terminal-line-ending issue was fixed with full-string validation. The last explicitly observed full suite was 135/135; the user separately reports successful full validation. The verifier-focused suite passed 24/24; registry typecheck and focused Biome passed. M2.2 remains IN PROGRESS / INCOMPLETE; M2.3 is NOT STARTED. Trust-policy authorization, revocation, aggregation/conflict reconciliation, protected state, Git verification, and registry discovery remain incomplete. Next is read-only discovery/design of the next incomplete M2.2 capability; do not assume a phase label or implementation scope. The architecture's status sections and the prior Phase 1E-only claims in this and related records were stale and are reconciled in this closure. Phase 1E parsing validates envelope structure and claims but does not itself verify signatures, establish trust, or bind contextual provenance; the internal verifier now performs cryptographic validity and contextual-consistency checks, not trust authorization. The canonical diagnostic comparator retains ordinal string comparison for its first five fields; ADR-024 specifies RFC 8785 JCS canonical UTF-8 unsigned-byte comparison for the sixth `message`/`detail` field. Earlier audit findings that preceded these amendments are historical. M1.2B's 29 tests and local checks remain prior implementation-session reports; user-provided screenshots show successful `Workspace validation` run #1 (ID `39215771440`) and `validate` job (ID `117939137329`). The GitHub annotation warning and notice remain uninspected. Broader end-to-end/product tests have not been run. Reinspect the repository every session before asserting current state; approved design is not implementation evidence.

Git/GitHub authority and operations are exclusively user-managed. Do not independently perform Git or GitHub operations; report any evidence needs to the user.

## Historical checkpoint update — 2026-10-20 (superseded)

This update supersedes the preceding checkpoint's next-task statement. The internal RFC 8785 JCS canonicalizer is IMPLEMENTED / ACCEPTED. Its focused tests passed 21/21, Biome passed, and registry typecheck passed. The user confirms full project validation, GitHub Actions success, and a clean working tree with `master` synchronized to `origin/master`; no commit hash or workflow run ID was provided, and these facts were not independently checked here.

This 2026-10-20 checkpoint recorded M2.2 as in progress/incomplete and strict trust-policy parsing as the next gated target before the policy contract approval. Its numeric-limit and next-task statements are historical and superseded by the 2026-10-21 checkpoint below. The approved 64 MiB complete-snapshot canonical-byte limit remains unchanged.

## Current checkpoint update — 2026-10-21

This update supersedes the preceding next-task statements. Strict trust-policy parsing is **IMPLEMENTED / ACCEPTED**. The implementation is internal in `packages/registry/src/provenance/trust-policy.ts`, with tests in `tests/unit/registry/provenance/trust-policy.test.ts` and fixed vectors in `tests/fixtures/registry/trust-policy-vectors.json`. It validates bounded raw `Uint8Array` input, strict UTF-8 JSON and duplicate decoded keys, exact schema and canonical identifiers/keys, timestamps and validity intervals, sorted/unique collections and scopes, and hashes the validated policy's RFC 8785 JCS bytes. It remains outside public exports and does not perform authorization, signature verification, trust-chain validation, or revocation enforcement.

Copilot reported 25/25 focused tests and 181/181 full-suite tests, plus Biome/lint, typecheck, and build passing. A command-prefix/import defect was later found during GitHub Actions validation; the user corrected the test import and confirms validation now passes. These post-correction results are user-confirmed and were not independently rerun in this documentation closure; no post-correction count, commit hash, or run ID is asserted.

M2.2 remains **IN PROGRESS / INCOMPLETE**. Signed policy-update envelope parsing, bootstrap and trust-chain verification, signer authorization, revocation enforcement, protected high-water state, and subsequent integration remain **NOT STARTED**. M2.3 Resolver, M2.4 Plans/Diagnostics, M2.5 Testing/Acceptance, and M3 remain **NOT STARTED**. The next implementation target is signed trust-policy update-envelope parsing and verification under the approved architecture; it requires separate authorization. The 2 MiB raw update-envelope ceiling and envelope/framing rules are approved. Before implementation, explicitly settle any update-parser JSON-work budgets under that raw cap and the trusted-input contract for verification, including bootstrap's independent trust-anchor input. The full policy-chain retrieval adapter remains unfrozen. Preserve the approved 64 MiB complete-snapshot cap; do not assign a phase label or infer authorization for adjacent capabilities.
