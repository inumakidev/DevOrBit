# DevOrbit — AI Development Toolkit

**One toolkit. Any stack. Smarter development.**

DevOrbit is an approved design for a versioned, modular toolkit that combines reusable AI coding skills, policies, repeatable workflows, technology-stack profiles, safe project installation, agent adapters, quality evaluation, governance, and project continuity.

> **Project status:** Documentation Foundation is **Approved**. M1.2A — Workspace Foundation is **Accepted**. M1.2B — Core Contracts is **Accepted with non-blocking issues**. M1 — Foundation & Contracts is **Complete / Accepted**. The user-provided screenshots show successful hosted GitHub Actions validation; see [TESTING-LOG.md](docs/development/TESTING-LOG.md). M2.1 architecture and documentation are **Accepted / Complete**. M2.2 design freeze is **Approved**; the seven exact-parameter groups and Clarification Amendments v1.0–v1.3 (ADR-021 through ADR-024) are synchronized, approved, and documented; final M2.2 documentation acceptance is **Pending**. M2.2 implementation is **NOT AUTHORIZED**. M2.3 is **NOT STARTED**; M2.2 tests are **NOT EXECUTED**.

## What DevOrbit is intended to provide

- An **AI Skills & Instructions Engine** and an independently usable **Project Setup Automation Engine**.
- AI Only, Project Only, and Combined installation modes. AI Only is the V0.1 priority; full Project Only and Combined scaffolding remain future scope.
- A canonical, versioned source with selective, pinned installation into independent project repositories.
- Skills, workflows, policies, stack profiles, packs, and environment-specific agent adapters.
- Safe, explainable installation plans with dry-run, ownership awareness, approval, verification, and recovery.
- Support for official Next.js and Laravel profiles as well as custom technology stacks.

See the [approved overview](docs/main/01-overview.md), [architecture](docs/main/02-architecture.md), and [scope](docs/main/03-features-and-scope.md) for the design. The source authorities are `DevOrbit_Master_Documentation.docx` and `DevOrbit_Development_and_Continuity.docx`.

## Current development status

| Area | Status |
| --- | --- |
| Phase 1 — Architecture | Approved |
| Phase 2 — Detailed Design | Approved |
| Phase 3 — Implementation Planning | Approved |
| Documentation Foundation | Approved |
| M1.1 — Environment Inspection | Completed |
| M1.1A — Pre-implementation Reconciliation | Completed |
| Phase 4 — Controlled Implementation | Not Started |
| M1.2A — Workspace Foundation | Accepted |
| M1.2B — Core Contracts | Accepted with non-blocking issues |
| M1 — Foundation & Contracts | Complete / Accepted |
| M2.1 — Registry & Resolver architecture | Accepted; documentation closure complete |
| M2.2 design freeze | Approved; seven exact-parameter groups synchronized; ADR-021 through ADR-024 approved and documented; final documentation acceptance pending; implementation NOT AUTHORIZED |
| M2.3 | NOT STARTED; M2.2 tests NOT EXECUTED |
| M1.2B contract tests | 29 reported passing; not rerun during acceptance audit |
| Initial commit / push | User-confirmed; commit `6c2f9985031104d36e9a0949a3b3b2b4862b3a2d` pushed to `origin/master` |
| Hosted GitHub Actions | Successful per user-provided screenshots; run #1 and job details in [TESTING-LOG.md](docs/development/TESTING-LOG.md) |

M1.2A acceptance covers the workspace foundation. M1.2B acceptance covers core contracts only. The CLI remains a minimal `@devorbit/cli` entry point at version `0.0.0`; neither milestone establishes that the toolkit engines, installer, skills, or adapters are implemented. The reported contract tests are not a broader end-to-end/product test result.

**M1 deferred, non-blocking items:** additional Ajv semantic-boundary assertions; core TypeScript tooling coupling to the CLI workspace; a non-failing Vitest configuration-loader warning; and one GitHub Actions annotation warning plus one notice whose contents have not been reviewed. These remain documented and are not M1 acceptance blockers.

## Documentation map

- `docs/main/` — product overview, architecture, features, CLI/installation design, skills, stacks, adapters, security, evaluation, and troubleshooting.
- [Registry & Resolver architecture](docs/main/11-registry-and-resolver-architecture.md) — canonical M2.1 architecture and M2.2 frozen design; approval is not implementation evidence.
- `docs/development/` — roadmap, current status, development and test logs, decisions, known issues, and the next-session task.
- `docs/continuity/` — project context, handoff, and mandatory agent onboarding.
- [AGENTS.md](AGENTS.md) — repository-level instructions for compatible AI agents. Platform discovery and enforcement capabilities must be verified, not assumed.

## Development safety

M1 is Complete / Accepted. M2.1 architecture and documentation are accepted. M2.2 design is approved; the seven exact-parameter groups and Clarification Amendments v1.0–v1.3 (ADR-021 through ADR-024) are synchronized and documented, but final user acceptance remains pending and implementation is NOT AUTHORIZED. Do not imply that M2.2 functionality is implemented or available. M2.3 is NOT STARTED; M2.2 tests are **NOT EXECUTED**. Git/GitHub operations remain exclusively user-managed. Follow [AGENTS.md](AGENTS.md) and the [agent onboarding guide](docs/continuity/AGENT-ONBOARDING.md) before development.

## Approved planning baseline

The design includes 17 skill domains and 84 candidate skills, 8 skill packs, 12 workflows, and 7 governance systems. It targets capability-aware agent integrations and custom technology stacks. See the [skills and workflows catalog](docs/main/05-skills-and-workflows.md), [stack profiles](docs/main/06-stack-profiles.md), and [agent integrations](docs/main/07-agent-integrations.md).
