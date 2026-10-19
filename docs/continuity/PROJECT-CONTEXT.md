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
- TypeScript, pinned Node.js LTS, pnpm workspaces, Zod/JSON Schema, Vitest, and GitHub Actions are approved technology direction. Exact tool versions and selected CLI/lint tools remain for M1.
- Six releases/milestones from V0.1 through V1.0 as described in [the roadmap](../development/ROADMAP.md).

## Current status

- Phase 1: Approved.
- Phase 2: Approved.
- Phase 3: Approved.
- Documentation Foundation: Approved.
- M1.1 Environment Inspection: Completed.
- M1.1A/M1.1B reconciliation and preflight: Completed.
- Phase 4 implementation: In Progress.
- M1.2A Workspace Foundation: Accepted.
- M1.2B Core Contracts: Accepted with non-blocking issues.
- M1 — Repository Foundation & Contracts: In Progress; not complete.
- M1.2B contract tests: 29 reported passing; not independently rerun during the acceptance audit.
- Hosted GitHub Actions: No result observed.
- M1.3: Not Started.

M1.2A established and accepted the workspace foundation and minimal `@devorbit/cli` entry point at version `0.0.0`. M1.2B Core Contracts was accepted with non-blocking issues. Its implementation session reported 29 passing Vitest contract tests and successful local install, workspace discovery, typecheck, lint, build, schema generation, CLI smoke checks, core import, and frozen-lockfile checks; the read-only acceptance audit did not rerun them. This does not establish hosted CI success, broader end-to-end/product test coverage, or implementation of either engine, an installer, skills, or adapters. M1 remains incomplete until the remaining GitHub readiness gates, hosted CI evidence, and final acceptance decision are recorded.

The read-only Git readiness audit observed branch `master`, zero commits, and a locally configured remote. Intended GitHub ownership, repository name/visibility, existence, and accessibility remain Not Verified. No staging, commit, push, fetch, or pull occurred during that audit or this documentation reconciliation. The two DOCX source documents remain local and unchanged and are proposed for exclusion from the first commit unless separately approved.

## Safety boundaries

Do not change approved decisions without explicit approval. M1.2B is accepted; do not begin M1.3 or later milestones without explicit authorization. Do not initialize frameworks, provision databases, deploy, contact GitHub, stage, commit, push, fetch, pull, or overwrite existing files without the required authorization. Keep secrets and personal data out of logs and evidence.

## Source precedence

Current explicit approvals and safety rules govern actions. Approved versioned specifications and decision records govern intended behavior. Actual repository files and test evidence govern implementation claims. Logs provide history; handoffs summarize but do not override evidence.

## Historical checkpoint

Earlier M1.1/M1.1A records correctly described a documentation and inspection state with Phase 4 not started and M1.2 awaiting authorization. Those records are historical evidence and are not rewritten by the later M1.2A acceptance. The older Git observations remain historical as recorded in the development and handoff logs.
