# 6. Stack profiles

## Design goals

DevOrbit must support custom technology stacks and preserve existing repository choices. Official profiles provide validated, version-bounded guidance when available; generic skills remain useful when no official profile applies. Compatibility claims must be explicit and evidence-based.

## Initial official profiles

**Next.js and Laravel are the initial official stack profiles.** Their initial official status does not imply that every version or framework capability is already implemented or verified.

### Next.js

The profile is intended to cover pinned supported versions, TypeScript, App Router where suitable, Tailwind, optional shadcn/Radix, PostgreSQL/Neon when selected, ORM choice by project, secure authentication, validation, and Playwright.

### Laravel

The profile is intended to cover pinned supported PHP/Laravel versions, Eloquent, PostgreSQL/MySQL, Form Requests, policies/gates, Blade/Livewire/Inertia/API-only modes, PHPUnit/Pest, transactions, and migration safety.

These profiles are approved design targets, not proof that any framework version has been implemented or validated.

## Custom technology stacks

Custom profiles should let teams define framework and tool combinations while retaining existing repository conventions. Examples include:

- React + Vite
- Node.js + Express
- Python + Django
- Python + FastAPI
- Mixed or otherwise user-defined technology stacks

These are examples of intended custom-stack support, not additional initial official profiles. Generic skills should continue to work without an official profile. A profile must not overwrite existing project choices by default, and unsupported or untested combinations must be labeled **Not Verified** rather than presented as compatible. Custom-stack support does not imply that every framework-specific capability has been implemented or verified.

## Databases and hosting

Initial database guidance covers PostgreSQL, MySQL, and SQLite, with extensibility to other engines. PostgreSQL hosting profiles include Neon initially, with Supabase, Railway, and custom providers as provider-aware options.

Guidance should cover connection strings, TLS, pooling, migrations, access controls, backup and recovery, secret redaction, and provider-specific operational constraints. The toolkit does not require PostgreSQL or any database in V0.1; manifests and installation records are file-based. Automatic database provisioning is not planned for V0.1.

## Profile lifecycle and validation

Profiles should state supported versions, assumptions, compatibility, optional features, and verification requirements. Stack detection is the initial project-setup scope. Controlled scaffolding and deeper full-stack guidance are later release work. Preserve a project's selected database, ORM, authentication, and framework unless the user explicitly authorizes a change.
