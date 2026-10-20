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
- Phase 4 implementation: In Progress; M2.2 Phase 1B/1C are complete, accepted, pushed, and CI passed per user report. Phase 1D remote CI acceptance is user-confirmed. Phase 1E strict envelope parsing is complete and locally validated; push/CI acceptance awaits confirmation. Overall M2.2 remains incomplete.
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
- M2.2 Phase 1E strict detached-attestation envelope parsing: COMPLETE / LOCALLY VALIDATED; focused tests 25/25, focused Biome passed, final read-only security audit ACCEPT WITH FOLLOW-UP.
- Phase 1E push/remote CI acceptance: AWAITING CONFIRMATION / NOT VERIFIED; no workflow run number or commit hash recorded.
- Earlier M1/Phase 1B/Phase 1C local checks: lint, typecheck, and build passed; 70/70 tests passed (M1 29, Phase 1B 22, Phase 1C 19), per user report. These results apply only to those milestones, not Phases 1D/1E.
- CI build-order remediation: core package build step added before root typecheck after a clean-checkout package-resolution failure; latest workflow passed per user report.
- M2.2 overall implementation: IN PROGRESS / INCOMPLETE.
- M2.3 resolver: NOT STARTED.
- Next: Read-only discovery of the next incomplete M2.2 capability; derive its scope from the approved architecture and actual implementation, and do not assume Phase 1F's scope.

**Approved design versus implementation status:** M2.2's nine specification groups are approved at design level and documented in the [canonical registry and resolver architecture](../main/11-registry-and-resolver-architecture.md). The seven exact-parameter groups and Clarification Amendments v1.0–v1.3 (ADR-021 through ADR-024) are synchronized and documented in [DECISIONS.md](../development/DECISIONS.md), though stale implementation-status text in those files requires separate reconciliation. The canonical comparator preserves ordinal string comparison for its first five logical fields; its sixth `message` field maps to `RegistryDiagnostic.detail` and uses the RFC 8785 JCS byte comparison specified by ADR-024. Phase 1B and Phase 1C are complete, accepted, pushed, and CI passed per user report. Phase 1D remote CI acceptance is user-confirmed. Phase 1E strict envelope parsing is complete locally: focused tests 25/25 and focused Biome passed; the final read-only security audit returned ACCEPT WITH FOLLOW-UP. Phase 1E push and remote CI acceptance await confirmation. No Phase 1E commit hash or workflow run number is asserted. The parser does not verify signatures, establish trust, or bind contextual provenance. Overall M2.2 remains IN PROGRESS / INCOMPLETE; M2.3 is NOT STARTED. Next is read-only discovery of the next incomplete M2.2 capability, without assuming Phase 1F scope. Windows/Git/OS security properties remain unverified.

**Historical audit context:** the earlier final audit listed these three clarification questions as unresolved at that time. The later approved ADR-021 resolves them; the historical finding is retained in [HANDOFF.md](HANDOFF.md) and is not a current blocker.

M1.2A established and accepted the workspace foundation and minimal `@devorbit/cli` entry point at version `0.0.0`. M1.2B Core Contracts was accepted with non-blocking issues. Its implementation session reported 29 passing Vitest contract tests and successful local install, workspace discovery, typecheck, lint, build, schema generation, CLI smoke checks, core import, and frozen-lockfile checks; the read-only acceptance audit did not rerun them. User-provided screenshots identify the initial commit/push to the private GitHub repository and show successful hosted workflow `Workspace validation` run #1 and `validate` job. All six M1 requirements are accepted; M1 is Complete / Accepted. The GitHub UI annotation warning and notice remain uninspected and unresolved, and are not M1 blockers. This does not establish broader end-to-end/product test coverage or implementation of either engine, an installer, skills, or adapters.

User-confirmed GitHub record: private repository `https://github.com/inumakidev/DevOrBit`, branch `master`, initial commit `6c2f9985031104d36e9a0949a3b3b2b4862b3a2d` (`chore: initialize DevOrbit foundation and core contracts`), pushed to `origin/master`. User-provided screenshots show run ID `39215771440`, job ID `117939137329`, 32-second workflow and 28-second job, with install/lint/typecheck/build/test passing; see [TESTING-LOG.md](../development/TESTING-LOG.md). The two DOCX source documents remain local and unchanged. This documentation-only reconciliation did not run Git commands or contact GitHub.

## Safety boundaries

Do not change approved decisions without explicit approval. M1 is COMPLETE / ACCEPTED / PUSHED; M2.1 architecture is COMPLETE / ACCEPTED / PUSHED; M2.2 design/specifications are COMPLETE / ACCEPTED. Phase 1B and Phase 1C are COMPLETE / ACCEPTED / PUSHED with CI passed per user report. Phase 1D is COMPLETE / ACCEPTED / PUSHED / CI PASSED per user confirmation. Phase 1E strict envelope parsing is COMPLETE / LOCALLY VALIDATED; push/CI acceptance awaits confirmation. Parsing does not verify signatures, establish trust, or bind contextual provenance. The prior 70/70 test result applies to M1 and Phases 1B/1C only. Overall M2.2 implementation is IN PROGRESS / INCOMPLETE; M2.3 is NOT STARTED. Next is read-only discovery of the next incomplete M2.2 capability; do not assume Phase 1F scope. Stale status claims in [AGENTS.md](../../AGENTS.md), the [canonical registry and resolver architecture](../main/11-registry-and-resolver-architecture.md), and [DECISIONS.md](../development/DECISIONS.md) require separate reconciliation. Git/GitHub authority and all Git/GitHub operations remain exclusively user-managed. Do not initialize frameworks, provision databases, deploy, contact GitHub, stage, commit, push, fetch, pull, or overwrite existing files without required authorization. Keep secrets and personal data out of logs and evidence.

## Source precedence

Current explicit approvals and safety rules govern actions. Approved versioned specifications and decision records govern intended behavior. Actual repository files and test evidence govern implementation claims. Logs provide history; handoffs summarize but do not override evidence.

## Historical checkpoint

Earlier M1.1/M1.1A records correctly described a documentation and inspection state with Phase 4 not started and M1.2 awaiting authorization. Those records are historical evidence and are not rewritten by the later M1.2A acceptance. The older Git observations remain historical as recorded in the development and handoff logs.
