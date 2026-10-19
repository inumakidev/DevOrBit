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
- Phase 4 implementation: Not Started; M2.1 documentation closure is complete, but no M2 implementation has started.
- M1.2A Workspace Foundation: Accepted.
- M1.2B Core Contracts: Accepted with non-blocking issues.
- M1 — Foundation & Contracts: Complete / Accepted.
- M1.2B contract tests: 29 reported passing; not independently rerun during the acceptance audit.
- GitHub initial commit and push: User-confirmed.
- Hosted GitHub Actions: Successful per user-provided screenshots; run #1 / ID `39215771440`, `validate` job ID `117939137329`.
- M2.1 — Registry & Resolver architecture: Approved; documentation closure complete.
- M2.2: Not Authorized. M2.3–M2.5: Not Started. M2 tests: Not Executed.

M1.2A established and accepted the workspace foundation and minimal `@devorbit/cli` entry point at version `0.0.0`. M1.2B Core Contracts was accepted with non-blocking issues. Its implementation session reported 29 passing Vitest contract tests and successful local install, workspace discovery, typecheck, lint, build, schema generation, CLI smoke checks, core import, and frozen-lockfile checks; the read-only acceptance audit did not rerun them. User-provided screenshots identify the initial commit/push to the private GitHub repository and show successful hosted workflow `Workspace validation` run #1 and `validate` job. All six M1 requirements are accepted; M1 is Complete / Accepted. The GitHub UI annotation warning and notice remain uninspected and unresolved, and are not M1 blockers. This does not establish broader end-to-end/product test coverage or implementation of either engine, an installer, skills, or adapters.

User-confirmed GitHub record: private repository `https://github.com/inumakidev/DevOrBit`, branch `master`, initial commit `6c2f9985031104d36e9a0949a3b3b2b4862b3a2d` (`chore: initialize DevOrbit foundation and core contracts`), pushed to `origin/master`. User-provided screenshots show run ID `39215771440`, job ID `117939137329`, 32-second workflow and 28-second job, with install/lint/typecheck/build/test passing; see [TESTING-LOG.md](../development/TESTING-LOG.md). The two DOCX source documents remain local and unchanged. This documentation-only reconciliation did not run Git commands or contact GitHub.

## Safety boundaries

Do not change approved decisions without explicit approval. M1 is complete; M2.1 architecture is approved and documentation closure is complete. M2.2 is not authorized. Do not begin implementation without separate explicit authorization. See the [canonical M2.1 architecture](../main/11-registry-and-resolver-architecture.md). Do not initialize frameworks, provision databases, deploy, contact GitHub, stage, commit, push, fetch, pull, or overwrite existing files without required authorization. Keep secrets and personal data out of logs and evidence.

## Source precedence

Current explicit approvals and safety rules govern actions. Approved versioned specifications and decision records govern intended behavior. Actual repository files and test evidence govern implementation claims. Logs provide history; handoffs summarize but do not override evidence.

## Historical checkpoint

Earlier M1.1/M1.1A records correctly described a documentation and inspection state with Phase 4 not started and M1.2 awaiting authorization. Those records are historical evidence and are not rewritten by the later M1.2A acceptance. The older Git observations remain historical as recorded in the development and handoff logs.
