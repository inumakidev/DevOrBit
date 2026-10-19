# DevOrbit — AI Development Toolkit

**One toolkit. Any stack. Smarter development.**

DevOrbit is an approved design for a versioned, modular toolkit that combines reusable AI coding skills, policies, repeatable workflows, technology-stack profiles, safe project installation, agent adapters, quality evaluation, governance, and project continuity.

> **Project status:** Documentation Foundation is **Approved**. Phase 4 implementation is **In Progress**. M1.2A — Workspace Foundation is **Accepted**. M1.2B — Core Contracts is **Accepted with non-blocking issues**. M1 Foundation & Contracts is **In Progress**, not complete; M1.3 is **Not Started**. The M1.2B implementation session reported 29 passing contract tests and successful local validation; these results were not independently rerun during the read-only acceptance audit. No hosted GitHub Actions result is available. Broader end-to-end/product application tests have not been run.

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
| Phase 4 — Controlled Implementation | In Progress |
| M1.2A — Workspace Foundation | Accepted |
| M1.2B — Core Contracts | Accepted with non-blocking issues |
| M1 — Repository Foundation & Contracts | In Progress; not complete |
| M1.3 | Not Started |
| M1.2B contract tests | 29 reported passing; not rerun during acceptance audit |
| Hosted GitHub Actions | No result observed |

M1.2A acceptance covers the workspace foundation. M1.2B acceptance covers core contracts only. The CLI remains a minimal `@devorbit/cli` entry point at version `0.0.0`; neither milestone establishes that the toolkit engines, installer, skills, or adapters are implemented. The reported contract tests are not a broader end-to-end/product test result.

**Remaining M1 gates:** confirm intended GitHub owner, repository name, and visibility; separately authorize and verify remote existence/accessibility; review candidate first-commit contents for secrets; obtain explicit authorization before staging, committing, or pushing; observe a successful hosted GitHub Actions run; and record CI evidence and the final M1 acceptance decision.

## Documentation map

- `docs/main/` — product overview, architecture, features, CLI/installation design, skills, stacks, adapters, security, evaluation, and troubleshooting.
- `docs/development/` — roadmap, current status, development and test logs, decisions, known issues, and the next-session task.
- `docs/continuity/` — project context, handoff, and mandatory agent onboarding.
- [AGENTS.md](AGENTS.md) — repository-level instructions for compatible AI agents. Platform discovery and enforcement capabilities must be verified, not assumed.

## Development safety

M1.2A and M1.2B have been accepted within their respective scopes. M1 remains in progress; do not begin M1.3 or later work without explicit authorization. Do not perform Git staging, commits, pushes, fetches, or pulls, contact the remote, install additional dependencies, initialize frameworks, provision databases, or deploy without the required separate authorization. Follow [AGENTS.md](AGENTS.md) and the [agent onboarding guide](docs/continuity/AGENT-ONBOARDING.md) before development.

## Approved planning baseline

The design includes 17 skill domains and 84 candidate skills, 8 skill packs, 12 workflows, and 7 governance systems. It targets capability-aware agent integrations and custom technology stacks. See the [skills and workflows catalog](docs/main/05-skills-and-workflows.md), [stack profiles](docs/main/06-stack-profiles.md), and [agent integrations](docs/main/07-agent-integrations.md).
