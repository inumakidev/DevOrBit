# 1. DevOrbit overview

## Purpose

DevOrbit — AI Development Toolkit is a versioned, modular toolkit design for improving AI-assisted software development across projects, technology stacks, and supported agent environments. It is more than a prompt collection: the approved design combines reusable skills, policies, repeatable workflows, stack profiles, safe project installation, agent adapters, evaluation, governance, and continuity practices.

**Tagline:** One toolkit. Any stack. Smarter development.

Intended users include students, freelancers, independent developers, small teams, and maintainers. The design covers new and existing repositories, including GitHub Codespaces and local Windows/Linux development. It prioritizes practical, maintainable engineering rather than excessive optimization.

## Adaptive UI/UX design

For applicable generated interfaces, the approved accessibility target is **WCAG 2.2 AA**. Design guidance should support keyboard navigation and accessible interactive controls, respect reduced-motion preferences, and use accessible animations. Interfaces should adapt responsively across screen sizes and use reusable design tokens and components. Design direction should reflect each project's identity and context rather than defaulting to generic-looking UI.

These are approved design requirements, not claims that generated interfaces or accessibility checks have been implemented or verified.

## Approved Design

DevOrbit has two independently usable engines:

1. **AI Skills & Instructions Engine** — canonical skills, workflows, policies, packs, and agent-specific instruction/discovery integrations.
2. **Project Setup Automation Engine** — project inspection, controlled setup and configuration, and later scaffolding capabilities.

Shared contracts allow the engines to work together without conflating their responsibilities. The distribution model is a central canonical GitHub source with selectively installed, pinned assets in independent project repositories, with offline use of installed assets where feasible.

Three modes are designed: **AI Only**, **Project Only**, and **Combined**. V0.1 prioritizes AI Only. Full Project Only and Combined scaffolding are not current implementation claims and remain planned/deferred until implemented and verified.

## Approved scale and scope

- 17 skill domains and 84 candidate skills.
- 8 skill packs and 12 workflows.
- 7 governance systems.
- Initial official stack profiles: Next.js and Laravel; custom stacks are supported by design.
- Initial agent targets: OpenAI Codex and specific, separately validated GitHub Copilot environments.
- Later agent targets: Claude Code and Cursor, following their own compatibility validation.
- Release plan: V0.1, V0.2, V0.3, V0.4, V0.5, then V1.0.

## Status vocabulary

Use the following labels consistently:

- **Approved Design** — present in the authoritative approved specifications.
- **Planned** — intended for a future milestone but not yet implemented.
- **In Progress** — work is actively underway.
- **Implemented** — repository evidence confirms the functionality exists.
- **Verified** — relevant checks ran successfully in a stated environment.
- **Deferred** — intentionally postponed to a later scope.
- **Not Verified** — no sufficient test or compatibility evidence exists.

The current project status is documented in [CURRENT-STATUS.md](../development/CURRENT-STATUS.md). Phase 1/2/3 and Documentation Foundation are Approved. M1.2A Workspace Foundation is Accepted; M1.2B Core Contracts is Accepted with non-blocking issues; M1 Foundation & Contracts is Complete / Accepted. The implementation session reported 29 passing contract tests and successful local validation. User-provided GitHub screenshots show successful hosted Actions run #1 and its `validate` job; the run and job identifiers and evidence limits are recorded in [TESTING-LOG.md](../development/TESTING-LOG.md). M2 — Registry & Resolver is next, Planning Pending; no M2 implementation has started. Broader end-to-end/product application tests have not been run.

## Documentation navigation

- [Architecture](02-architecture.md)
- [Features and scope](03-features-and-scope.md)
- [Installation and CLI design](04-installation-and-cli.md)
- [Skills and workflows](05-skills-and-workflows.md)
- [Stack profiles](06-stack-profiles.md)
- [Agent integrations](07-agent-integrations.md)
- [Security and governance](08-security-and-governance.md)
- [Evaluation and releases](09-evaluation-and-releases.md)
- [Troubleshooting](10-troubleshooting.md)
