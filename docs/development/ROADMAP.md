# Development roadmap

## Phase and milestone status

| Phase/milestone | Status | Summary |
| --- | --- | --- |
| Phase 1 — Architecture v1.4 | Approved | Mission, two engines, distribution, security, governance, and releases. |
| Phase 2 — Detailed Design v1.2 | Approved | Skill contract, 84 candidates/17 domains, 8 packs, 12 workflows, contracts, evaluation. |
| Phase 3 — Implementation Planning v1.3 | Approved | TypeScript stack, monorepo, CLI, installer, custom stacks, hosted database guidance, phased adapters. |
| Documentation Foundation | Approved | User approval received; the 25-file Markdown baseline is preserved. |
| M1.1 — Environment Inspection | Completed | Read-only Windows, tooling, Git, workspace, and Copilot-profile inspection. |
| M1.1A — Pre-implementation reconciliation | Completed | Checkpoint recorded; M1.2 proposal prepared without creating files. |
| M1.2A — Workspace Foundation | Accepted | Workspace foundation and local validation were accepted. |
| M1.2B — Core Contracts | Accepted with non-blocking issues | 14 files added and four configuration files modified; 29 contract tests and local validation were reported successful. |
| M1 — Foundation & Contracts | Complete / Accepted | All six M1 requirements and Definition of Done accepted; details and evidence provenance are recorded in `TESTING-LOG.md`. |
| M2 — Registry & Resolver | M2.1 complete and accepted; M2.2 design/specifications complete and accepted; Phases 1B–1E, internal Ed25519 verification/context binding, internal RFC 8785 JCS canonicalizer, and strict trust-policy parser implemented and accepted | Copilot reported 25/25 focused parser tests, 181/181 full-suite tests, and passing Biome/lint, typecheck, and build before a test import defect was found. User corrected the import and confirms validation passed; no post-correction count or run ID is asserted and the result was not independently checked. M2.2 remains IN PROGRESS / INCOMPLETE; next target is signed trust-policy update-envelope parsing and verification, after resolving update-parser JSON-work budgets and trusted verification inputs; M2.3 NOT STARTED. |
| M2.3 — Resolver | Not started | No resolver implementation is claimed. |
| M2.4 — Plans/Diagnostics | Not started | JCS diagnostic comparison is approved design; diagnostic integration is not implemented. |
| M2.5 — Testing/Acceptance | Not started | Overall M2.2 acceptance remains incomplete. |
| Phase 4 — Controlled Implementation | In progress | M1 is complete; M2.2 Phase 1B–1E, internal Ed25519 verification/context binding, internal JCS canonicalization, and strict trust-policy parsing are accepted. Overall M2.2 remains incomplete. |
| Phase 5 — Real Project Validation | Not started | Disposable sample repositories first; personal project use only after safeguards. |

## Phase 4 milestones

### M1 — Foundation & Contracts

M1.2A — Workspace Foundation is accepted: pinned Node.js/pnpm workspace tooling, CLI package foundation, lint/typecheck/build scripts, CI, and generated lockfile. Its local install, workspace discovery, lint, typecheck, build, CLI smoke checks, and frozen-lockfile checks were reported PASS in the implementation session.

M1.2B — Core Contracts is accepted with non-blocking issues. The implementation added the `@devorbit/core` API, asset manifest contract, typed errors, generated Draft 2020-12 JSON Schema, valid/invalid fixtures, and Vitest contract tests. Four existing configuration files were modified: root `package.json`, `biome.json`, `.github/workflows/ci.yml`, and `pnpm-lock.yaml`. Exact added-file inventory and dependency versions are recorded in [CURRENT-STATUS.md](CURRENT-STATUS.md) and [DEVELOPMENT-LOG.md](DEVELOPMENT-LOG.md). The implementation session reported 29 passing tests and successful install, workspace discovery, typecheck, lint, build, schema generation consistency, CLI help/version, core import, and frozen-lockfile checks. These local command results were not rerun during the acceptance audit. The user-provided GitHub screenshots show successful hosted workflow `Workspace validation` run #1, run ID `39215771440`, and successful `validate` job ID `117939137329`; evidence links and limits are recorded in [TESTING-LOG.md](TESTING-LOG.md).

M1 is **Complete / Accepted**. Deferred non-blocking follow-up includes more explicit Ajv semantic-boundary assertions, decoupling core TypeScript tooling from CLI-specific tooling, the non-failing Vitest configuration-loader warning, and the GitHub Actions annotation warning and notice whose contents have not been reviewed. These items are not marked resolved and do not block M1 acceptance.

### M2 — Registry & Resolver

**Status:** M1 is **COMPLETE / ACCEPTED / PUSHED**. M2.1 architecture is **COMPLETE / ACCEPTED / PUSHED**. M2.2 design/specifications are **COMPLETE / ACCEPTED**. The seven exact-parameter groups are synchronized; ADR-021 through ADR-024 are approved and documented. Registry Phase 1A read-only preflight is **COMPLETED**. Phase 1B asset-tree integrity, Phase 1C manifest-to-content record binding, Phase 1D pure attestation framing, Phase 1E strict detached-attestation envelope parsing, internal Ed25519 verification/context binding, internal RFC 8785 JCS canonicalization, and strict trust-policy parsing are **IMPLEMENTED / ACCEPTED**. Copilot reported 25/25 parser-focused tests and 181/181 full-suite tests, and passing Biome/lint, typecheck, and build before a test import defect was identified. The user corrected the test import and confirms validation now passes; no post-correction count or CI run ID is asserted, and the result was not independently checked. Overall M2.2 implementation is **IN PROGRESS / INCOMPLETE**; M2.3 is **NOT STARTED**. No M2.2 deployment or release is claimed.

**Phase 1C boundary:** Internal pure manifest-to-content record binding using exact raw manifest SHA-256 separately from the content-tree digest; strict UTF-8 and BOM rejection; one-asset enforcement; exact identity/version/provenance-directory matching; reuse of Phase 1B integrity computation; internal M2 failure classifications; and unchanged M1 validation. No public registry API, filesystem discovery, trust verification, Git-object access, or resolver implementation.

**Phase 1D boundary:** Pure deterministic attestation lookup-ID and signed-payload framing, strict runtime validation, internal generic failures, and independent fixed-byte vectors. It does not parse envelopes, sign or verify Ed25519 signatures, establish authenticity or trust, access the filesystem or Git, or integrate the resolver/CLI. The implementation audit accepted the slice; the user confirmed Phase 1D push and remote CI acceptance.

**Phase 1E boundary:** Pure strict detached-attestation envelope parsing; exact raw-byte SHA-256; duplicate decoded-key detection; strict UTF-8 and BOM handling; canonical unpadded base64url decoding to exactly 64 bytes; field validation; and bounded parsing (64 KiB input, depth 8, 128 parsed nodes). Focused validation passed 25/25 tests and focused Biome. The parser itself does not verify signatures, authorize signers, establish trust, bind claims to caller-selected context or an AssetRecord, access filesystem/Git/network, make assets eligible, or implement resolver behavior. The separately implemented verifier now performs cryptographic validation and contextual binding.

**Internal verification and contextual-binding capability:** The internal verifier consumes a parsed Phase 1E envelope, caller-selected repository/revision, a validated Phase 1C `AssetRecord`, and an external raw 32-byte Ed25519 public key. It binds all nine claims, derives the signer key ID from SHA-256 of exactly the raw public-key bytes, reuses Phase 1D framing, and verifies Ed25519 over those bytes with Node built-in crypto. The final audit fix enforces exact full-string validation for repository IDs, revisions, and digests, rejecting terminal LF/CR/CRLF without trimming or repair. Focused tests passed 24/24; registry typecheck and focused Biome passed. Success means signature validity and contextual consistency only. This capability does not authorize signers, evaluate trust policy, handle revocation or aggregation/conflicts, maintain protected state, verify Git objects, discover registry assets, or make assets eligible. The user confirms push and green GitHub Actions; no CI run ID or commit hash is asserted.

**Internal JCS canonicalizer:** Implemented in `packages/registry/src/provenance/jcs.ts`, with focused tests in `tests/unit/registry/provenance/jcs.test.ts` and fixed RFC 8785 vectors in `tests/fixtures/registry/jcs-vectors.json`. It emits canonical UTF-8 bytes with UTF-16 property ordering and ECMAScript number serialization, validates Unicode and string escaping, uses iterative traversal, accepts explicit caller-supplied budgets, and returns typed generic failures. The API is internal and has no public barrel export. Focused tests passed 21/21; Biome and registry typecheck passed. This slice does not implement strict policy parsing, diagnostic ordering, snapshot accounting, or caller-specific budget choices.

**Strict trust-policy parser:** Implemented and accepted as an internal parser in `packages/registry/src/provenance/trust-policy.ts`, with tests in `tests/unit/registry/provenance/trust-policy.test.ts` and fixed digest vectors in `tests/fixtures/registry/trust-policy-vectors.json`. It enforces the approved raw input, schema, duplicate-key, identifier/key, ordering/scope, timestamp/interval, and policy JCS digest requirements; it is not publicly exported. Copilot reported 25/25 focused tests, 181/181 full-suite tests, Biome/lint, typecheck, and build passing before a test import defect was found. The user corrected the import and confirms validation passed; no post-correction count or CI identifier is asserted. The parser does not parse or verify signed updates, authenticate bootstrap, verify trust chains, authorize signers, enforce revocations, or integrate protected state.

**Next implementation target:** Signed trust-policy update-envelope parsing and verification according to the approved architecture. The envelope shape, signed-byte framing, semantic relationships, and 2 MiB raw input ceiling are already specified. Before implementation, settle bounded update-parser JSON-work limits under that ceiling and define trusted verification inputs, including the independently authenticated bootstrap trust-anchor boundary. The full policy-chain retrieval adapter remains unfrozen. Obtain separate authorization before starting; do not assign a phase label.

**Historical resource-decision boundary — superseded:** This paragraph predates approval of policy-caller-specific limits and implementation of the trust-policy parser. The approved 64 MiB complete canonical-snapshot byte cap remains unchanged; diagnostic-detail budgets remain outside the policy-caller approval. See the current task status above.

**Approved objective and deliverables:** implement local canonical content indexing and integrity/provenance validation; expand required and optional dependencies with deterministic ordering; reject dependency cycles, incompatible versions, missing required assets, unsupported mandatory capabilities, conflicts, and trust failures; produce explainable plans; and add negative tests for conflict and trust failures. This scope derives from the approved architecture and implementation/continuity blueprint; the prior Phase 1B authorization does not authorize any subsequent implementation slice.

**Dependency and boundary:** M1 Foundation & Contracts is Complete / Accepted. M2 consumes existing M1 contracts without changing their public API, schema semantics, or error codes. The approved boundary is internal registry and resolver libraries only; CLI integration is deferred. The approved M2.2 design is frozen. The user confirms validation passed after correcting the trust-policy test import; no post-correction count or CI run ID is asserted. M2.2 remains incomplete. The next target is signed trust-policy update-envelope parsing and verification, subject to separate implementation authorization and resolution of update-parser JSON-work budgets and trusted verification inputs. See the [canonical registry and resolver architecture](../main/11-registry-and-resolver-architecture.md). Do not infer implementation or expand scope.

**Definition of Done:** deterministic plans and verified failure behavior for all mandatory conflict cases. The detailed matrix is in the canonical specification. It is approved acceptance design, not evidence of tests passing. The seven exact-parameter groups and Clarification Amendments v1.0–v1.3 (ADR-021 through ADR-024) are documented in the canonical specification. Documentation was accepted and pushed according to the user; the historical audits and clarifications remain recorded. The earlier audit's clarification items were resolved by ADR-021; ADR-022 further specifies the diagnostic property mapping and attestation aggregate-byte scope, while ADR-023/ADR-024 clarify the `detail` comparison representation, without changing M1 contracts or the approved comparator.

See the approved [master documentation (architecture and detailed design)](../../DevOrbit_Master_Documentation.docx), [Architecture](../main/02-architecture.md), [Features and scope](../main/03-features-and-scope.md), [Evaluation and releases](../main/09-evaluation-and-releases.md), and the [implementation and continuity blueprint](../../DevOrbit_Development_and_Continuity.docx).

**Roadmap-label note:** M1.1, M1.1A/M1.1B, and M1.2A/M1.2B are historical inspection, reconciliation, and implementation substep labels used to organize M1 work. The approved roadmap defines six implementation milestones, M1–M6; the substep labels do not add separate top-level milestones or change the approved M1/M2 scope.

### M3 — Safe Installer & Recovery

Implement inspection, zero-write dry-run, exact path previews, ownership lock records, path/symlink containment, modified-file conflict detection, secret redaction, staged apply, hash verification, tested recovery, and safe update/remove.

### M4 — Agent Adapters

Validate current Codex and Copilot VS Code mechanisms in actual environments. Test integration without overwriting existing instructions, discovery, explicit invocation, policy precedence, unsupported capabilities, and safety. Document Copilot CLI/cloud, Claude Code, and Cursor separately.

### M5 — Starter Skills & Workflows

Implement six approved starter skills and three workflow prototypes; resolve dependencies explicitly; validate contracts, risk-based approval, negative authorization review, and reporting.

### M6 — Evaluation & Release Candidate

Run skill, workflow, adapter, generated-application, release, platform, installer-failure/recovery, path, modified-file, and secret-redaction checks. Finalize limitations, versioning, gates, and rollback instructions.

## Acceptance principle

Milestone completion requires actual repository changes and evidence meeting its definition of done. A plan or documentation entry alone does not change an implementation status. See [EVALUATION-AND-RELEASES](../main/09-evaluation-and-releases.md), [CURRENT-STATUS.md](CURRENT-STATUS.md), and [NEXT-SESSION.md](NEXT-SESSION.md).
