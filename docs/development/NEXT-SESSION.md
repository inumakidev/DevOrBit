# Next session

## Current checkpoint

- Documentation Foundation: **Approved**.
- M1.1 Environment Inspection and M1.1A/M1.1B reconciliation/preflight: **Completed**.
- M1.2A — Workspace Foundation: **Accepted**.
- M1.2B — Core Contracts: **Accepted with non-blocking issues**.
- M1 — Foundation & Contracts: **COMPLETE / ACCEPTED / PUSHED**.
- M2.1 — Registry & Resolver architecture: **COMPLETE**.
- M2.2 design and specification: **ACCEPTED / PUSHED**; user reports baseline commit `21dbe8a`; seven exact-parameter groups synchronized; ADR-021 through ADR-024 **APPROVED / DOCUMENTED**.
- M2.2 Phase 1B asset-tree integrity: **COMPLETE / ACCEPTED / PUSHED / CI PASSED** per user report.
- M2.2 Phase 1C manifest-to-content record binding: **COMPLETE / ACCEPTED / PUSHED / CI PASSED** per user report.
- M2.2 Phase 1D pure attestation framing: **COMPLETE / ACCEPTED / PUSHED / CI PASSED** per user confirmation.
- M2.2 Phase 1E strict detached-attestation envelope parser: **IMPLEMENTED / ACCEPTED**; focused tests 25/25 and focused Biome passed.
- M2.2 internal Ed25519 verification and contextual binding: **IMPLEMENTED / ACCEPTED**; verifier-focused tests 24/24, registry package typecheck and focused Biome passed; exact full-string validation fix included.
- M2.2 internal RFC 8785 JCS canonicalizer: **IMPLEMENTED / ACCEPTED**; focused tests 21/21, Biome, and registry package typecheck passed. The API is internal-only and caller budgets are explicit; no trust-policy, diagnostic-ordering, or snapshot integration is claimed.
- M2.2 strict trust-policy parsing: **NOT STARTED**.
- M2.2 signed policy updates/chain verification, trust authorization, revocation, protected-state integration, and registry integration: **NOT STARTED**.
- M2.2 repository validation: user confirms full project validation and GitHub Actions success, with a clean working tree and `master` synchronized to `origin/master`; these facts were not independently checked. No commit hash or run ID is recorded.
- Full-suite evidence: last explicitly observed result **135/135**; user separately reports successful full validation without a newer count.
- Earlier M1/Phase 1B/Phase 1C local validation: lint, typecheck, and build passed; tests **70/70** (M1 29, Phase 1B 22, Phase 1C 19), all per user report. These figures apply only to those milestones, not Phases 1D or 1E.
- CI build-order issue: clean-checkout registry typecheck lacked built `@devorbit/core` declarations; a core build step was added immediately before root typecheck. User reports the latest workflow passed. No workflow run number or Phase 1B/1C commit hash is asserted.
- M2.2 overall implementation: **IN PROGRESS / INCOMPLETE**.
- M2.3 resolver: **NOT STARTED**.
- M2.4 Plans/Diagnostics: **NOT STARTED**.
- M2.5 Testing/Acceptance: **NOT STARTED**.
- M3: **NOT STARTED**.
- Contract tests: **29 reported passing** in the M1.2B implementation session; not rerun during the read-only acceptance audit.
- Hosted GitHub Actions: **Successful**, supported by user-provided screenshots; run/job identifiers recorded below.
- GitHub repository: **Private per user confirmation**, `inumakidev/DevOrBit`, branch `master`; initial commit and push confirmed.
- Completed: M2.2 Phase 1A read-only preflight; Phase 1B–1E implementation slices; internal Ed25519 verification/context binding; internal JCS canonicalizer; and the related documentation closures.
- Current task: Prepare for strict trust-policy parsing, the next implementation target within M2.2. M2.2 remains IN PROGRESS / INCOMPLETE; M2.3 remains NOT STARTED. Do not assign a phase label.
- Prerequisite gate: Before implementation, obtain explicit confirmation of (1) policy/update raw-input limits, (2) repository, signer, and revocation collection limits, (3) caller-specific JCS budgets, (4) exact schema and timestamp validation, and (5) duplicate-key and unknown-field rejection. The existing approved 64 MiB complete-snapshot canonical-byte cap remains unchanged; other proposed numeric budgets are not approved architecture constants.
- Acceptance criteria for the next authorized slice: preserve the approved policy/update protocol and M1/M2.2 contracts; define and test strict duplicate-aware parsing and exact value/schema validation within explicitly approved limits; fail closed with stable generic errors; add independent fixtures and inclusive-boundary tests for every approved limit; run focused tests, Biome, and registry typecheck; document unimplemented authorization, signature-chain, revocation, and protected-state boundaries. Do not implement policy updates, authorization, revocation, protected state, snapshots, registry integration, or M2.3 unless separately authorized.

Read the required continuity files in order as listed in [AGENTS.md](../../AGENTS.md), then inspect the actual repository before any future implementation.

## Accepted M1 closure

M1 — Foundation & Contracts is **Complete / Accepted**. M1.2A is **Accepted** and M1.2B is **Accepted with non-blocking issues**. The six-requirement acceptance matrix and evidence are in [TESTING-LOG.md](TESTING-LOG.md).

The user-provided GitHub screenshots show the successful `Workspace validation` workflow run #1 (ID `39215771440`) and successful `validate` job (ID `117939137329`) for `master`. The run and job URLs, durations, and screenshot-reported passing commands are recorded in the testing log. One annotation warning and one notice remain uninspected; they are not acceptance blockers. No GitHub contact or Git operation was performed for this closure.

## M2.1 architecture approval and documentation closure

The user approved the M2.1 architecture: internal registry and resolver libraries only, no CLI integration, and preservation of M1 contracts. Detached attestations, single-administrator authenticated policy updates, 720-hour validity, compatibility semantics, optional trust policy, stable-only default, and standard local protected-state limitations are recorded in the [canonical specification](../main/11-registry-and-resolver-architecture.md).

**Historical status:** M2.1 architecture Approved; documentation closure Complete. This historical checkpoint is superseded by the current M2.2 freeze checkpoint below.

The M2.2 freeze resolves file-only hashing with empty directories excluded, attestation lookup framing, RFC 8785 canonicalization, policy rotation and protected-state rules, commit parser compatibility, and the approved design-level diagnostics and limits. The complete full-chain retrieval adapter is not frozen. Windows/Git/OS security remains unverified implementation-time work.

## Current M2.2 documentation checkpoint

The M2.2 design/specifications are complete and accepted; the seven exact-parameter groups and Clarification Amendments v1.0–v1.3 (ADR-021 through ADR-024) are documented in [the canonical registry and resolver architecture](../main/11-registry-and-resolver-architecture.md). ADR-024 applies JCS canonicalization to the diagnostic `detail` comparison value and supersedes ADR-023 only for its detail key-ordering and serialization rule. Phases 1B–1E, internal Ed25519 verification/context binding, and the internal JCS canonicalizer are implemented and accepted. JCS-focused tests passed 21/21; Biome and registry typecheck passed. The user confirms full project validation, GitHub Actions success, and a clean working tree with `master` synchronized to `origin/master`; no commit hash or CI run ID is asserted and these facts were not independently checked. Overall M2.2 implementation remains **IN PROGRESS / INCOMPLETE**; M2.3 is **NOT STARTED**. The approved complete canonical-snapshot byte cap remains 64 MiB; distinct numeric policy/update, diagnostic-detail, and JCS traversal budgets still require explicit confirmation/decision.

Earlier local lint, typecheck, and build results and the 70/70 suite (M1 29, Phase 1B 22, Phase 1C 19) apply to those historical milestones only. CI initially failed on fixture formatting and clean-checkout core package resolution; a dedicated core build step was added before root typecheck, and the latest GitHub Actions green status is user-confirmed. The currently accepted verifier adds signature validity and contextual consistency only; signer trust/authorization, revocation, aggregation/conflict reconciliation, protected state, Git verification, and registry discovery remain incomplete. No M2.2 deployment or release is claimed.

The next implementation target is strict trust-policy parsing, subject to the prerequisite confirmations listed above. This target is not authority to implement adjacent policy updates, authorization, revocation, protected state, snapshots, registry integration, or resolver behavior. M2.2 remains **IN PROGRESS / INCOMPLETE** and M2.3 remains **NOT STARTED**. The user confirms full project validation, GitHub Actions success, and clean/synchronized working-tree state; these facts were not independently checked and no hash or run ID is asserted. Git/GitHub operations remain user-managed.

## Historical M2 planning handoff — Registry & Resolver

This section preserves the earlier planning checkpoint. It is superseded for current status by the M2.1 architecture approval above; its M2 scope and Definition of Done remain relevant.

**Approved objectives and deliverables:**

- Build a local canonical content index.
- Validate content integrity and provenance.
- Expand required and optional dependencies in deterministic order.
- Reject dependency cycles, incompatible versions, missing required assets, unsupported mandatory capabilities, conflicts, and trust failures.
- Produce explainable resolution plans.
- Add negative tests for conflicts and trust failures.

**Definition of Done:** deterministic plans and verified failure behavior for all mandatory conflict cases. Planning must map each required rejection case to concrete tests and evidence.

**Dependency and boundary:** M1 Foundation & Contracts is accepted. M2 is expected to consume the accepted manifest/core contracts and canonical content model. Exact package boundaries, APIs, file inventory, and implementation sequence must be proposed during M2 planning and approved before coding. Do not expand the M2 scope or implement registry/resolver behavior during planning.

**Approved references:** the [master documentation](../../DevOrbit_Master_Documentation.docx) (architecture and detailed design), [Architecture](../main/02-architecture.md) (layers and resolver contract), [Features and scope](../main/03-features-and-scope.md), [Evaluation and releases](../main/09-evaluation-and-releases.md) (M2 acceptance row), [Roadmap](ROADMAP.md), and the [implementation and continuity blueprint](../../DevOrbit_Development_and_Continuity.docx) (M2 objectives and Definition of Done).

The top-level roadmap/blueprint define six implementation milestones M1–M6. M1.1, M1.1A/M1.1B, and M1.2A/M1.2B are historical workstream/substep labels used during M1 execution; they do not create separate top-level approved milestones or change M2’s scope.

## Historical M1.2B — Core Contracts proposal (superseded)

The following proposal was written before M1.2B was authorized. It is preserved as historical planning context and is superseded by the implemented contract and acceptance records above. Its former authorization restrictions describe the state at the time, not the current checkpoint.

### Proposed files

| Path | Purpose |
| --- | --- |
| `packages/core/package.json` | Private `@devorbit/core` workspace package; add exact Zod dependency after version/engine verification. |
| `packages/core/tsconfig.json` | Strict package TypeScript configuration extending the root base. |
| `packages/core/src/index.ts` | Explicit public exports for manifest types/schema/validation and typed error classes/codes; no internal paths as public API. |
| `packages/core/src/contracts/asset-manifest.ts` | Canonical Zod schemas, inferred TypeScript types, and manifest validation. |
| `packages/core/src/errors.ts` | Stable discriminated error codes and typed contract/manifest errors. |
| `schemas/asset-manifest.schema.json` | JSON Schema generated from, or mechanically checked against, the canonical runtime schema. |
| `tests/fixtures/manifests/valid.json` | Complete valid manifest exercising all required fields, with empty dependency/permission arrays where valid. |
| `tests/fixtures/manifests/invalid/missing-required-metadata.json` | Negative fixture omitting a required metadata field. |
| `tests/fixtures/manifests/invalid/duplicate-id.json` | Negative fixture with two assets sharing an ID. |
| `tests/fixtures/manifests/invalid/unsupported-manifest-version.json` | Negative fixture with an unsupported manifest format version. |
| `tests/fixtures/manifests/invalid/malformed-version.json` | Negative fixture with a malformed asset or contract version. |
| `tests/unit/core/asset-manifest.test.ts` | Vitest contract, duplicate, version, fixture, and JSON Schema parity tests. |

Expected updates, subject to approval:

- `package.json`: add root `test` and recursive `typecheck` scripts so core checks are part of the workspace commands.
- `biome.json`: include `packages/**/*.ts` and core package JSON/TypeScript configuration.
- `.github/workflows/ci.yml`: run the contract test suite after dependencies are installed.
- `pnpm-lock.yaml`: regenerate only through pnpm after approved dependency manifest changes and installation.
- `apps/cli/package.json`: no change proposed unless approval is given to make the CLI consume the core package in this checkpoint.

The existing `pnpm-workspace.yaml` already includes `packages/*`; the existing Vitest include pattern covers `tests/**/*.test.ts`. These files need not change unless implementation evidence reveals a real configuration gap.

### Proposed schema and validation requirements

1. **Manifest envelope:** Require an object with a format-version field named `manifestVersion` and an `assets` array. Treat `manifestVersion` as the schema/format revision, separate from asset release versions and each asset’s `contractVersion`.
2. **Required asset metadata:** Require `id`, `kind`, `version`, `contractVersion`, `description`, `domain`, `dependencies`, `compatibility`, `permissions`, `integrity`, `provenance`, and `lifecycleStatus`, matching approved architecture. Dependency groups and permissions may be empty arrays but must be present. Reject missing, wrong-typed, or malformed required data with path-specific issues.
3. **Kinds/domains/status:** Constrain kinds and lifecycle states to explicit approved enumerations. Domain identifiers must resolve to the approved domain catalog; do not silently accept unknown values.
4. **Version handling:** Validate canonical SemVer 2.0.0 strings. Reject unsupported `manifestVersion` explicitly; do not coerce, silently default, or reinterpret versions. Treat asset `version` and `contractVersion` as distinct fields.
5. **Duplicate IDs:** Detect duplicates across the complete manifest before exposing validated output. Recommended initial rule is exact, case-sensitive duplicate comparison, with canonical lowercase IDs to avoid case aliases; the ID grammar and normalization policy require approval.
6. **Integrity/provenance/compatibility:** Require explicit fields with stable typed structures; represent integrity using an algorithm and digest, provenance using source identity, and compatibility using declared target identifiers/constraints. Exact subfield names, digest algorithms, and range semantics require approval.
7. **Errors:** Expose stable codes for malformed input, invalid manifest/metadata, unsupported manifest format version, invalid asset/contract version, and duplicate asset ID. Include structured issue paths and safe details; do not include secrets or raw unbounded input. Callers must be able to discriminate by code/class without parsing message text.
8. **JSON Schema parity:** The runtime Zod schema is the canonical source. Check in a deterministic JSON Schema representation using a declared supported draft, and test that the valid fixture is accepted and invalid fixtures rejected by both runtime validation and JSON Schema validation. No independently hand-maintained divergent schema.
9. **Contract tests:** Cover all required fields; enum/type/version failures; missing metadata; duplicate IDs; unsupported manifest version; valid/invalid fixtures; stable typed error codes; and JSON Schema parity. Do not report a test result until Vitest actually runs.

### Decisions requiring approval

- Manifest format field name and whether its value is a single SemVer or a separate `major`/`minor` schema identifier.
- SemVer policy for `contractVersion` (exact contract revision versus a compatibility range); asset `version` is a release version.
- Asset ID syntax, namespace rules, case normalization, and duplicate comparison scope.
- Exact required property shapes for dependency references, compatibility constraints, permissions, integrity, provenance, and lifecycle.
- Supported asset-kind values and domain/status enums, including behavior for future unknown values.
- Unknown-property policy (reject strictly or allow forward-compatible extensions).
- JSON Schema draft and generation/validation approach, including any required generator or validator dependency.
- Public error class/code names and whether aggregate validation reports all issues or stops at first failure.
- Exact Zod/JSON Schema tool versions after external compatibility verification, and whether the CLI should consume `@devorbit/core` in M1.2B.

### Dependency and verification boundary

Zod and a JSON Schema validator/generator are not installed as part of M1.2A. Do not add them or create any listed files until M1.2B is explicitly authorized. On authorization, verify exact package availability and engine compatibility before selecting pins; install only approved versions; then run workspace discovery, lint, recursive typecheck, build, Vitest contract tests, and lockfile consistency checks. Application tests remain **Not Run** until those tests are implemented and executed.

## Historical Git, privacy, and scope record

At the earlier M1.2A checkpoint, the working tree showed `master`, no commits, and untracked files. No staging, commit, push, fetch, pull, remote edit, or other Git write occurred in M1.2A or its acceptance review. Both DOCX documents were present and unchanged.

The later read-only Git readiness audit again observed `master`, zero commits, and untracked workspace files. A local `origin` was configured for `github.com` with repository path `inumakidev/DevOrBit.git`; remote-side state was not verified at that historical checkpoint. The user subsequently confirmed the private repository, initial commit, push, and successful Actions workflow as recorded above. No Git staging, commit, push, fetch, or pull was performed by this agent during this documentation reconciliation.

The earlier M1.2B proposal, dependency, and authorization sections above are historical and superseded by the accepted implementation. Follow the current M2 planning boundary above; no M2 implementation is authorized or started.
