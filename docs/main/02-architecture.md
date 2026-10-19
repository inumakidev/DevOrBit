# 2. Architecture

## Architectural principles

The approved architecture is modular, versioned, multi-agent, and multi-stack. The AI Skills & Instructions Engine and Project Setup Automation Engine are independently usable and share explicit contracts. The central GitHub repository is the canonical source; projects selectively install pinned assets. Installed assets should remain usable offline where feasible.

## Adaptive UI/UX design

For applicable generated interfaces, use **WCAG 2.2 AA** as the accessibility target. Design for keyboard navigation and accessible interactive controls; respect reduced-motion preferences and provide accessible animations. Support responsive layouts with reusable design tokens and components. Adapt design direction to the identity and context of each project rather than producing generic-looking UI. These are design requirements, not implementation or conformance claims.

## Layers

| Layer | Responsibility |
| --- | --- |
| Canonical content | Skills, workflows, policies, stack profiles, packs, and manifest metadata. |
| Registry and resolver | Provenance, integrity, compatibility, dependencies, conflicts, and deterministic plans. |
| Installer and recovery | Dry-run, ownership-aware changes, staging, approval, verification, and recovery reporting. |
| Agent adapters | Environment-specific instruction files, discovery, invocation, capability tests, and fallbacks. |
| Project setup | Initially stack detection; controlled scaffolding and configuration in later releases. |
| Evaluation | Fixtures, benchmark results, adapter compatibility, and release evidence. |
| CLI | User-facing inspect/list/plan/install/verify/update/remove/doctor operations. |

## Content taxonomy and lifecycle

- **Skill:** specialized procedure.
- **Workflow:** orchestrated stages.
- **Policy:** always-on baseline.
- **Tool:** executable action.
- **Stack profile:** framework and technology conventions.
- **Adapter:** agent/environment integration.

The canonical skill contract has eight parts: Identity & Metadata; Activation Rules; Required Context; Instructions; Outputs; Safety Boundaries; Verification; Failure & Escalation. Assets progress through Discover → Applicability → Context → Plan → Execute → Verify → Report. Skill lifecycle states are Draft → Review → Validated → Stable, with deprecation when needed.

## Source and installation records

A source manifest is designed to record asset ID, kind, version, contract version, description, domain, required and optional dependencies, compatibility, permissions, integrity, provenance, and lifecycle status.

A target installation lock is designed to record the toolkit version, exact asset versions, installed paths, hashes, ownership, adapter targets, mode, and transaction/recovery metadata. It must never contain secrets.

## Resolver contract

Resolution must be deterministic and explainable. Missing required dependencies, dependency cycles, incompatible versions, and trust failures block a plan. Optional features may be omitted only with explicit disclosure. Unsupported mandatory capabilities must not be silently treated as available.

**M2 boundary:** the approved M2 design uses internal `@devorbit/registry` and `@devorbit/resolver` libraries only; CLI integration is deferred. The registry owns local discovery and trust verification; the resolver plans over immutable verified data and performs no filesystem or network operations. No M2 implementation is claimed. See the [canonical M2.1 registry and resolver architecture](11-registry-and-resolver-architecture.md) for the approved baseline, unresolved exact implementation prerequisites, and acceptance matrix.

## Installer transaction

The approved transaction is:

**Inspect → Resolve → Plan → Preview → Approve → Apply → Verify → Commit or Recover**

Hard invariants:

- Dry-run causes zero writes.
- Paths and symlinks remain contained within the intended project.
- Unowned files are never deleted; modified assets are detected.
- No silent overwrite or unapproved script execution.
- Secrets are not logged.
- No automatic push, production deployment, or destructive migration.
- Recovery is verified or its incomplete state is explicitly reported.

## Agent adapters

Adapters perform capability discovery, environment detection, instruction generation, explicit or automatic skill selection only where supported, conflict handling, and smoke testing. Markdown instructions do not create a security sandbox. Copilot VS Code, CLI, and cloud agent environments are separate capability targets; success in one does not imply parity in another.

## Planned logical repository

The implementation plan proposes `apps/cli`; packages for core, registry, resolver, installer, Codex/Copilot adapters, project setup, and evaluation; canonical content directories; schemas; fixtures and tests; documentation; examples; and GitHub configuration. These are logical future boundaries, not evidence that these source directories or packages currently exist.

## Technology decisions

Approved choices are TypeScript, pinned Node.js LTS, pnpm workspaces, Zod and interoperable JSON Schema, Vitest, GitHub Actions, and GitHub-first local CLI distribution. Commander.js or an equivalent CLI parser and Biome or ESLint/Prettier are candidates for selection during M1. The toolkit itself has no required database in V0.1; content and installation records are file-based.
