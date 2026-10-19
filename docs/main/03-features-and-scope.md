# 3. Features and scope

## Status and evidence

This page describes the **Approved Design** and planned releases. It does not claim that the features below are implemented. Implementation status must be supported by repository evidence and verification status by actual recorded checks.

## Designed capabilities

- Canonical versioned skill, workflow, policy, stack-profile, and pack content.
- Registry, resolver, compatibility handling, integrity/provenance checks, and deterministic explainable plans.
- Safe selective installation, updates, verification, ownership tracking, and recovery.
- Capability-aware agent adapters and explicit/automatic skill selection only where supported.
- Stack detection initially and controlled project setup/scaffolding in later releases.
- Objective skill, workflow, adapter, and generated-project evaluation.
- Governance across agent permissions, workflow continuity, asset trust, quality, business integrity, operations/recovery, and delivery.

## Modes

| Mode | Design intent | Current status |
| --- | --- | --- |
| AI Only | Install AI-facing assets/adapters without project scaffolding. | V0.1 priority; implementation not started. |
| Project Only | Perform project setup without the AI content engine. | Architectural mode; full scaffolding deferred. |
| Combined | Use AI assets and project setup together. | Architectural mode; full scaffolding deferred. |

## Release scope

| Release | Planned scope |
| --- | --- |
| V0.1 | Foundation, registry/resolver, safe installer, initial Codex/Copilot adapters, six starter skills, basic workflows, evaluation, and documentation. |
| V0.2 | Expand planning, architecture, debugging, and review. |
| V0.3 | Deeper Next.js/Laravel full-stack guidance and project setup. |
| V0.4 | Specialized security, authentication, authorization, and advanced QA. |
| V0.5 | CI/CD, operations, deployment readiness, documentation, and compliance expansion. |
| V1.0 | Stable supported capabilities with evidence-backed quality gates. |

No release in this table should be described as shipped until implementation and release evidence exist.

## V0.1 starter scope

Six starter skills: `requirements-discovery`, `implementation-planning`, `system-architecture`, `root-cause-analysis`, `code-review`, and `object-authorization`.

Initial workflow prototypes: `project-onboarding`, `code-review`, and `bug-fix`. Dependencies must be validated; absent skills must be explicitly optional or scoped for later implementation.

Mandatory baseline security applies from V0.1. Full Project Only/Combined scaffolding and unvalidated agent environments are not implied by the initial release scope.

## Deferred and explicitly bounded areas

- Full project scaffolding is later scope, not an assumed V0.1 capability.
- Claude Code and Cursor integrations are later targets.
- Copilot CLI and cloud-agent integrations require separate validation from Copilot VS Code.
- Automatic hosted database provisioning is not planned for V0.1.
- Custom stacks are a design requirement, but framework-specific compatibility must be labeled and validated honestly.
