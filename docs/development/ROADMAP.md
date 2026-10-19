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
| M1 — Repository Foundation & Contracts | In progress; not complete | Both M1.2A and M1.2B are accepted; GitHub verification, hosted CI evidence, and final M1 acceptance remain. |
| M1.3 | Not started | No M1.3 work has started. |
| Phase 4 — Controlled Implementation | In progress | M1.2A and M1.2B only; no later milestone started. |
| Phase 5 — Real Project Validation | Not started | Disposable sample repositories first; personal project use only after safeguards. |

## Phase 4 milestones

### M1 — Repository Foundation & Contracts

M1.2A — Workspace Foundation is accepted: pinned Node.js/pnpm workspace tooling, CLI package foundation, lint/typecheck/build scripts, CI, and generated lockfile. Its local install, workspace discovery, lint, typecheck, build, CLI smoke checks, and frozen-lockfile checks were reported PASS in the implementation session.

M1.2B — Core Contracts is accepted with non-blocking issues. The implementation added the `@devorbit/core` API, asset manifest contract, typed errors, generated Draft 2020-12 JSON Schema, valid/invalid fixtures, and Vitest contract tests. Four existing configuration files were modified: root `package.json`, `biome.json`, `.github/workflows/ci.yml`, and `pnpm-lock.yaml`. Exact added-file inventory and dependency versions are recorded in [CURRENT-STATUS.md](CURRENT-STATUS.md) and [DEVELOPMENT-LOG.md](DEVELOPMENT-LOG.md). The implementation session reported 29 passing tests and successful install, workspace discovery, typecheck, lint, build, schema generation consistency, CLI help/version, core import, and frozen-lockfile checks. These results were not independently rerun during the acceptance audit. No hosted GitHub Actions run has been observed.

Deferred non-blocking follow-up includes a direct Ajv test demonstrating semantic constraints that JSON Schema does not fully express, decoupling core TypeScript tooling from CLI-specific tooling, and a non-blocking Vitest config-loader warning. M1 remains in progress until the GitHub readiness and M1 acceptance gates in [CURRENT-STATUS.md](CURRENT-STATUS.md) are met. M1.3 has not started.

### M2 — Registry & Resolver

Build canonical content indexing and integrity/provenance checks; expand required/optional dependencies deterministically; reject cycles, missing requirements, incompatible versions, and trust failures; test explainable plans and negative cases.

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
