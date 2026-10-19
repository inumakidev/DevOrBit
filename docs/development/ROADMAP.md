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
| M2 — Registry & Resolver | Planning pending | Approved scope is summarized below; no M2 implementation has started. |
| Phase 4 — Controlled Implementation | In progress | M1 is complete; M2 planning is pending and no M2 implementation has started. |
| Phase 5 — Real Project Validation | Not started | Disposable sample repositories first; personal project use only after safeguards. |

## Phase 4 milestones

### M1 — Foundation & Contracts

M1.2A — Workspace Foundation is accepted: pinned Node.js/pnpm workspace tooling, CLI package foundation, lint/typecheck/build scripts, CI, and generated lockfile. Its local install, workspace discovery, lint, typecheck, build, CLI smoke checks, and frozen-lockfile checks were reported PASS in the implementation session.

M1.2B — Core Contracts is accepted with non-blocking issues. The implementation added the `@devorbit/core` API, asset manifest contract, typed errors, generated Draft 2020-12 JSON Schema, valid/invalid fixtures, and Vitest contract tests. Four existing configuration files were modified: root `package.json`, `biome.json`, `.github/workflows/ci.yml`, and `pnpm-lock.yaml`. Exact added-file inventory and dependency versions are recorded in [CURRENT-STATUS.md](CURRENT-STATUS.md) and [DEVELOPMENT-LOG.md](DEVELOPMENT-LOG.md). The implementation session reported 29 passing tests and successful install, workspace discovery, typecheck, lint, build, schema generation consistency, CLI help/version, core import, and frozen-lockfile checks. These local command results were not rerun during the acceptance audit. The user-provided GitHub screenshots show successful hosted workflow `Workspace validation` run #1, run ID `39215771440`, and successful `validate` job ID `117939137329`; evidence links and limits are recorded in [TESTING-LOG.md](TESTING-LOG.md).

M1 is **Complete / Accepted**. Deferred non-blocking follow-up includes more explicit Ajv semantic-boundary assertions, decoupling core TypeScript tooling from CLI-specific tooling, the non-failing Vitest configuration-loader warning, and the GitHub Actions annotation warning and notice whose contents have not been reviewed. These items are not marked resolved and do not block M1 acceptance.

### M2 — Registry & Resolver

**Status: Planning pending; implementation not started.**

**Approved objective and deliverables:** implement local canonical content indexing and integrity/provenance validation; expand required and optional dependencies with deterministic ordering; reject dependency cycles, incompatible versions, missing required assets, unsupported mandatory capabilities, conflicts, and trust failures; produce explainable plans; and add negative tests for conflict and trust failures. This scope derives from the approved architecture and implementation/continuity blueprint; it is not permission to begin implementation.

**Dependency:** M1 Foundation & Contracts is Complete / Accepted. M2 is expected to consume the established asset manifest/core contracts and canonical content model; exact package/file boundaries, interfaces, and implementation sequence must be settled in M2 planning against the approved architecture and blueprint. Do not infer extra scope.

**Definition of Done:** deterministic plans and verified failure behavior for all mandatory conflict cases, including the blueprint’s required rejection cases. Planning must define measurable coverage for these requirements before implementation authorization.

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
