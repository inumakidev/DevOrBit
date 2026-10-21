# Development handoff

**Updated:** 2026-10-21 — M2.2 trust-policy parser documentation closure

## Current checkpoint

| Field | Current value |
| --- | --- |
| Project | DevOrbit — AI Development Toolkit |
| Approved architecture/design/plan | Phase 1 v1.4, Phase 2 v1.2, Phase 3 v1.3 — Approved |
| Documentation Foundation | **Approved**; all 25 expected Markdown files remain present. |
| M1.1 Environment Inspection | **Completed**. |
| M1.1A/M1.1B reconciliation and preflight | **Completed**. |
| M1.2A Workspace Foundation | **Accepted**. |
| M1.2B Core Contracts | **Accepted with non-blocking issues**. |
| M1 — Foundation & Contracts | **Complete / Accepted / Pushed**. |
| M2.1 — Registry & Resolver architecture | **Complete**. |
| M2.2 design and documentation | **ACCEPTED / PUSHED** per user report; baseline commit `21dbe8a` user-reported; seven exact-parameter groups synchronized; ADR-021 through ADR-024 approved and documented. |
| M2.2 Registry Phase 1A read-only preflight | **COMPLETED**; inspection and planning only. |
| M2.2 Phase 1B asset-tree integrity | **COMPLETE / ACCEPTED / PUSHED / CI PASSED** per user report. |
| M2.2 Phase 1C manifest-to-content record binding | **COMPLETE / ACCEPTED / PUSHED / CI PASSED** per user report. |
| M2.2 Phase 1D attestation framing | **COMPLETE / ACCEPTED / PUSHED / CI PASSED** per user confirmation. |
| M2.2 Phase 1E strict envelope parser | **Implemented / Accepted**; focused tests 25/25 and focused Biome passed. |
| M2.2 Ed25519 verification and contextual binding | **Implemented / Accepted**; focused verifier tests 24/24, registry typecheck and focused Biome passed; exact full-string validation fix included. |
| M2.2 internal RFC 8785 JCS canonicalizer | **Implemented / Accepted**; focused tests 21/21, Biome, and registry typecheck passed. Internal-only, with explicit caller budgets; no caller integration is claimed. |
| M2.2 strict trust-policy parsing | **IMPLEMENTED / ACCEPTED**; internal parser, focused tests, and fixed digest vectors are present. User confirms validation passed after correcting the test import. |
| M2.2 signed update-envelope parsing/verification, bootstrap/trust-chain verification, authorization, revocation enforcement, protected state, and registry integration | **NOT STARTED**. |
| Trust-policy validation evidence | Copilot reported 25/25 focused tests, 181/181 full-suite tests, and passing Biome/lint, typecheck, and build before the test import correction. User confirms corrected validation passed; post-correction counts and CI identifiers were not supplied or independently checked. |
| M2.2 user-reported project validation | User confirms validation passed after correcting the trust-policy test import. No post-correction count or CI run ID was provided; not independently checked. Earlier user-reported clean/synchronized working-tree state is not reasserted for this checkpoint. |
| Full-suite evidence | Copilot-reported **181/181** preceded the import correction; user confirms corrected validation passed, with no post-correction count asserted. |
| Earlier M1/Phase 1B/Phase 1C local validation | `pnpm lint`, `pnpm typecheck`, `pnpm build` passed; `pnpm test` 70/70 (M1 29, Phase 1B 22, Phase 1C 19), all per user report; these results apply only to those milestones, not Phases 1D/1E. |
| CI build-order remediation | Dedicated core build step added before root typecheck after clean-checkout package-resolution failure; latest workflow passed per user report. |
| M2.2 overall implementation | **IN PROGRESS / INCOMPLETE**. |
| M2.3 resolver | **NOT STARTED**. |
| M2.4 Plans/Diagnostics | **NOT STARTED**. |
| M2.5 Testing/Acceptance | **NOT STARTED**. |
| M3 — Safe Installer & Recovery | **NOT STARTED**. |
| Phase 4 — Controlled Implementation | **In progress**; overall M2.2 implementation is incomplete; no deployment or release is claimed. |
| M1.2B contract tests | **29 reported passing**; not rerun during the read-only acceptance audit. |
| GitHub repository | User confirms private `inumakidev/DevOrBit`, branch `master`; initial commit pushed to `origin/master`. |
| Hosted GitHub Actions | Successful per user-provided screenshots: `Workspace validation` run #1 / ID `39215771440`; `validate` job ID `117939137329`. |
| Completed this session | Recorded the implemented/accepted strict trust-policy parser and implementation-session/user-confirmed validation evidence in authorized documentation only. No implementation validation was run in this documentation closure. |
| Next task | Signed trust-policy update-envelope parsing and verification, subject to resolving update-parser JSON-work budgets and trusted verification inputs (including bootstrap); the full policy-chain retrieval adapter remains unfrozen. Obtain separate implementation authorization. |

At the 2026-10-20 trust-policy contract approval checkpoint, M1 was **Complete / Accepted / Pushed**; M2.1 architecture and M2.2 design/specifications were **Complete / Accepted**; Phases 1B–1E and internal Ed25519 verification/context binding were **Implemented / Accepted**. The user confirmed push and green GitHub Actions; no commit hash or workflow run ID was asserted. The verifier binds all nine claims to the caller-selected repository/revision, validated record, and supplied raw public key, reuses Phase 1D framing and verifies Ed25519, but does not authorize signers or establish trust. Its terminal-line-ending validation finding was fixed with exact full-string checks. Focused verifier tests passed 24/24; registry typecheck and focused Biome passed. Last explicitly observed full suite was 135/135; the user separately reported successful full validation without a new count. The earlier 70/70 evidence applies only to M1 and Phases 1B/1C. The parser status and next-task statements from this checkpoint are superseded by the 2026-10-21 update below.

**Historical audit finding, superseded by approved ADR-021:** the final documentation audit identified the `authorizedSigners` ordering comparator, diagnostic comparator, and 256-attestation count scope as clarification items. ADR-021 and the canonical specification now resolve these items: sort `authorizedSigners` by ascending ordinal ASCII `keyId` and reject duplicates; order diagnostics by `(code, severity, assetId, assetVersion, path, message)` using ordinal comparison and empty strings for absent optional fields; cap detached attestation envelopes at 256 per asset-version lookup, counted before cryptographic validation.

This preserves the audit-time record of the ADR-021 clarification. ADR-024 later specified the RFC 8785 JCS byte comparison for the sixth `message`/`detail` field; the current comparator is defined in §8 of the canonical architecture.

## M2.2 approved design and boundaries

All nine specification groups are approved at design level: (1) registry layout and file-only integrity; (2) detached Ed25519 attestations; (3) trust-policy protocol; (4) protected high-water state; (5) restricted Git object verification; (6) commit/tree parsing; (7) pinned asset binding; (8) bounded resources, diagnostics, and snapshots; and (9) independent test vectors. The Final Protocol Amendment supersedes conflicting earlier proposals, including the administrator rotation rule and commit parser compatibility. Detailed normative requirements are kept in the canonical architecture document rather than duplicated here.

### Approved strict trust-policy parsing contract

The user has approved the exact policy schema, strict input validation, and caller-specific limits recorded in [the canonical architecture](../main/11-registry-and-resolver-architecture.md) §6. Limits are inclusive: raw policy and canonical JCS output are each 1 MiB; future raw signed-update envelopes are capped at 2 MiB; repositories, authorized signers, repository IDs per signer, revoked signer IDs, and revoked repository IDs are each capped at 10,000. The policy JCS caller budget is depth 64, 1,000,000 JSON values, 10,000 properties/object, and 1 MiB each for individual strings, cumulative strings, and output. Collections are additionally constrained by raw input bytes. These policy-specific budgets do not alter global JCS behavior; the approved complete-snapshot canonical-byte cap remains 64 MiB. Diagnostic-detail JCS budgets are not covered by this approval.

The contract requires raw `Uint8Array` input; raw-size rejection before decode; strict UTF-8 without BOM; duplicate decoded-key, unknown/missing-field, and type/value rejection; exact positive safe-integer sequence semantics; canonical lowercase repository IDs without changing M1 validation; canonical unpadded base64url 32-byte Ed25519 keys with matching SHA-256 key IDs; sorted unique arrays and in-policy signer scopes; exact valid UTC Gregorian timestamps and required interval relationships; and policy digest from RFC 8785 canonical UTF-8 bytes. Valid JSON whitespace and object-property order variations are accepted. Parser-specific decoded-key accounting, if used, must be separately documented and cannot silently conflict with valid-policy limits. The parser does not authenticate or authorize, verify signed updates or chain continuity, apply revocations, inspect protected state, or access filesystem/Git/network; it remains internal. Parsing and digest calculation must not reject a structurally valid policy solely because it is expired at the current clock.

The parser contract in this section is approved. The separate implementation status is **IMPLEMENTED / ACCEPTED** as recorded in the current checkpoint update below; this contract text records the approved requirements.

**Implementation boundary:** This paragraph records the earlier M2.2 implementation checkpoint; the current parser status is updated below. Phase 1B asset-tree integrity, Phase 1C manifest-to-content record binding, Phase 1D pure attestation framing, Phase 1E strict detached-attestation envelope parsing, internal Ed25519 verification/context binding, and internal RFC 8785 JCS canonicalization were implemented and accepted at that checkpoint. A signature-valid/context-consistent result is not trust authorization or asset eligibility. M2.2 remains incomplete; M2.3 is **NOT STARTED**.

## Current checkpoint update — 2026-10-21

Strict trust-policy parsing is **IMPLEMENTED / ACCEPTED**, internal-only, and not exported through the registry package barrel. The implementation is in `packages/registry/src/provenance/trust-policy.ts`, with focused tests in `tests/unit/registry/provenance/trust-policy.test.ts` and fixed digest vectors in `tests/fixtures/registry/trust-policy-vectors.json`. It parses raw bounded `Uint8Array` input, strictly validates JSON and the approved schema, detects duplicate decoded keys, validates canonical IDs/keys and timestamps/intervals, and computes SHA-256 over RFC 8785 JCS policy bytes. It does not verify signatures, authenticate bootstrap, verify policy chains, authorize signers, enforce revocations, or update protected state.

Copilot reported 25/25 focused tests and 181/181 full-suite tests, plus passing Biome/lint, typecheck, and build. A test import defect was found later during GitHub Actions validation; the user corrected the test import and confirms validation now passes. No post-correction count, CI run ID, or commit hash was supplied; the corrected validation result was not independently verified in this documentation closure.

M2.2 remains **IN PROGRESS / INCOMPLETE**. Signed update-envelope parsing/verification, bootstrap and trust-chain verification, signer authorization, revocation enforcement, protected high-water state, and registry integration remain **NOT STARTED**. M2.3 Resolver, M2.4 Plans/Diagnostics, M2.5 Testing/Acceptance, and M3 remain **NOT STARTED**. The next implementation target is signed trust-policy update-envelope parsing and verification according to the approved architecture. Envelope fields/framing and the 2 MiB raw cap are specified; settle update-parser JSON-work budgets and trusted verification inputs, including bootstrap's independent trust-anchor boundary, before implementation. The full policy-chain retrieval adapter is not frozen. Obtain separate authorization; do not assign a phase label.

**Outstanding implementation-time Windows/Git/OS validation gates:** ACL enforcement; OS-protected key behavior and provider integrity; reparse-point and executable-substitution defenses; Git configuration isolation; actual no-network/no-write behavior; process-tree termination; source mutation/filesystem-race handling; crash consistency; and the supported Windows/Git compatibility baseline. No Windows security testing has been completed or claimed. Privileged rollback by restoring both policy and protected state remains an explicit limitation.

## Historical checkpoint update — trust-policy contract approval (superseded)

This latest checkpoint supersedes earlier handoff text that named read-only discovery as the next task. Its resource-decision status is further superseded by the approved trust-policy contract recorded above.

The internal RFC 8785 JCS canonicalizer is **Implemented / Accepted**. Its focused tests passed 21/21; Biome and registry typecheck passed. The module is internal-only and caller-budgeted; trust-policy parsing, diagnostic ordering, and snapshot accounting are not implemented by this slice. The user confirms full project validation and GitHub Actions success, plus a clean working tree with `master` synchronized to `origin/master`; these facts were not independently checked, and no commit hash or workflow run ID was provided.

This 2026-10-20 checkpoint preceded the parser implementation and is retained as historical record. At that time, policy-specific input, collection, and JCS limits had been approved, and the next target was the still-unimplemented parser. Its implementation and the current next task are superseded by the 2026-10-21 checkpoint above. The approved complete canonical-snapshot byte cap remains 64 MiB; diagnostic-detail budgets remain unspecified.

## M1.2A implementation

The 11 authorized paths are present:

- `.gitignore`
- `package.json`
- `pnpm-workspace.yaml`
- `pnpm-lock.yaml` (pnpm-generated)
- `tsconfig.base.json`
- `biome.json`
- `vitest.config.ts`
- `.github/workflows/ci.yml`
- `apps/cli/package.json`
- `apps/cli/tsconfig.json`
- `apps/cli/src/index.ts`

The CLI is a minimal ESM Commander foundation package, `@devorbit/cli`, version `0.0.0`; it supports `--help` and `--version`. This does not implement the toolkit engines, contracts, or workflows. Vitest is configured without fabricated placeholder tests.

### Tool versions

Node.js 22.14.0; pnpm 10.16.0; TypeScript 5.9.3; Commander.js 14.0.3; Biome 2.5.15; Vitest 4.1.5; `@types/node` 22.20.5.

### Validation

The implementation session reported PASS for dependency installation, workspace discovery, lint, typecheck, build, CLI help/version, and frozen-lockfile consistency. During acceptance, files/scripts/lockfile and installed package versions were inspected and the existing built CLI was run for help/version; no reinstall or rebuild occurred. Application tests were not run. Detailed evidence is in [TESTING-LOG.md](../development/TESTING-LOG.md).

## M1.2B accepted implementation

M1.2B was accepted with non-blocking issues. It added 14 files: the `@devorbit/core` package, manifest/error contract sources, generated asset-manifest JSON Schema, seven valid/invalid fixtures, and the Vitest contract test file. Four configuration files were modified: root `package.json`, `biome.json`, `.github/workflows/ci.yml`, and `pnpm-lock.yaml`.

Exact dependencies: Zod 4.6.7, semver 7.8.5, `@types/semver` 7.8.0, and Ajv 8.20.0. The implementation session reported 29 passing Vitest tests and successful local install, workspace discovery, typecheck, lint, build, schema generation consistency, CLI help/version, core package import, and frozen-lockfile installation. These results were not independently rerun during the acceptance audit. User-provided screenshots show the successful GitHub Actions run and job; details and evidence boundaries are in [TESTING-LOG.md](../development/TESTING-LOG.md).

Deferred non-blocking issues: add a direct Ajv semantic-boundary test enhancement; decouple core TypeScript tooling from CLI-specific tooling. The Vitest config-loader warning is non-blocking.

## Git, docs, and source preservation

- User confirms private repository `https://github.com/inumakidev/DevOrBit`, branch `master`, initial commit `6c2f9985031104d36e9a0949a3b3b2b4862b3a2d` (`chore: initialize DevOrbit foundation and core contracts`), and push to `origin/master`.
- User-provided screenshots show workflow `Workspace validation` run #1, run ID `39215771440`, [run URL](https://github.com/inumakidev/DevOrBit/actions/runs/39215771440), and successful `validate` job ID `117939137329`, [job URL](https://github.com/inumakidev/DevOrBit/actions/runs/39215771440/job/117939137329). The screenshots show 32-second workflow duration, 28-second job duration, and PASS for frozen-lockfile install, lint, typecheck, build, and tests. This agent did not independently fetch or inspect GitHub.
- The UI showed one annotation warning and one notice; their contents remain uninspected and unresolved, but do not block M1 acceptance.
- This documentation reconciliation did not run Git commands or contact the remote.
- The 25 expected Markdown documents and both authoritative DOCX source documents remain present. DOCX files were not modified.
- Historical M2.1 documentation-closure file inventory: [README.md](../../README.md), [AGENTS.md](../../AGENTS.md), [CHANGELOG.md](../../CHANGELOG.md), [CONTRIBUTING.md](../../CONTRIBUTING.md), [01-overview.md](../main/01-overview.md), [CURRENT-STATUS.md](../development/CURRENT-STATUS.md), [ROADMAP.md](../development/ROADMAP.md), [DEVELOPMENT-LOG.md](../development/DEVELOPMENT-LOG.md), [TESTING-LOG.md](../development/TESTING-LOG.md), [DECISIONS.md](../development/DECISIONS.md), [NEXT-SESSION.md](../development/NEXT-SESSION.md), [HANDOFF.md](HANDOFF.md), [PROJECT-CONTEXT.md](PROJECT-CONTEXT.md), and [AGENT-ONBOARDING.md](AGENT-ONBOARDING.md). This list does not describe the current M2.2 allowlist.

## Historical evidence and unresolved items

An earlier workspace inspection reported no Git repository; the subsequent M1.1 inspection found `.git`, branch `master`, and zero commits. Preserve both observations as historical rather than rewriting the earlier report. M1.1 found no verified GitHub remote; a later local-only inspection observed an `origin` configuration. The user has since confirmed the repository, push, and workflow success as recorded above.

Security disclosure contact and live agent-adapter capability remain unresolved or Not Verified. M1 — Foundation & Contracts is **Complete / Accepted**; all six requirements are accepted based on implementation reports, prior acceptance audits, and the user-provided CI screenshots. Deferred non-blocking findings remain open: additional Ajv semantic-boundary assertions, core TypeScript tooling coupling to the CLI workspace, the Vitest configuration-loader warning, and the uninspected GitHub Actions annotation warning/notice. **Historical checkpoint:** M2 planning was pending and no M2 implementation had started. The current M2.2 status is recorded at the top of this handoff and in [CURRENT-STATUS.md](../development/CURRENT-STATUS.md). See [TESTING-LOG.md](../development/TESTING-LOG.md) and [ROADMAP.md](../development/ROADMAP.md).
