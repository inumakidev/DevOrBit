# Decision record

This register records approved decisions from the authoritative project documents. It is not permission to change them. Any change requires explicit user approval and an updated decision record.

| ID | Decision | Status |
| --- | --- | --- |
| ADR-001 | DevOrbit is a versioned AI development toolkit, not merely a prompt collection. | Approved |
| ADR-002 | Two independently usable engines; AI Only, Project Only, and Combined architecture. | Approved |
| ADR-003 | Central GitHub canonical source; GitHub-first local CLI; pinned selective installs. | Approved |
| ADR-004 | TypeScript, Node.js LTS, pnpm, Zod, Vitest, and GitHub Actions. | Approved |
| ADR-005 | Modular monorepo with registry/resolver/installer/adapters/evaluation boundaries. | Approved |
| ADR-006 | Next.js and Laravel initial official profiles; custom stacks are extensible. | Approved |
| ADR-007 | PostgreSQL guidance includes Neon, Supabase, Railway, and custom providers; no V0.1 provisioning. | Approved |
| ADR-008 | Codex and Copilot are initial adapter targets; Claude Code/Cursor are phased later. | Approved |
| ADR-009 | Safe installer requires dry-run, approvals, ownership, integrity, and verified recovery. | Approved |
| ADR-010 | External project documents plus repository-local Markdown documentation and continuity protocol. | Approved |
| ADR-011 | Documentation precedes coding; explicit authorization is required to begin implementation. | Approved |
| ADR-012 | M1.2B Core Contracts baseline: Zod 4.6.7 is the canonical runtime schema; JSON Schema targets Draft 2020-12; SemVer uses semver 7.8.5; Ajv 8.20.0 is used for structural checks. Exact implementation decisions are recorded in the accepted M1.2B contract files and implementation report. | Accepted for M1.2B |
| ADR-013 | M1.2B dependency pins include `@types/semver` 7.8.0. The M1.2B implementation was accepted with non-blocking issues; M1 remains in progress and M1.3 has not started. | Accepted |
| ADR-014 | Deferred follow-up: directly test Ajv's semantic-boundary limitations; decouple core TypeScript tooling from CLI-specific tooling. The Vitest config-loader warning is non-blocking. | Deferred / non-blocking |

## Open selections (not architecture changes)

- Keep the accepted Node.js/pnpm/tool pins recorded in [CURRENT-STATUS.md](CURRENT-STATUS.md); revisit only with explicit approval.
- The CLI parser and lint/format tooling were selected for M1; revisit only with explicit approval.
- Validate specific Codex and Copilot environments with real smoke tests.
- Confirm the intended GitHub owner, repository name, visibility, existence, and accessibility before any authorized remote operation.

These are implementation and verification items, not permission to change approved architecture or begin M1.3.
