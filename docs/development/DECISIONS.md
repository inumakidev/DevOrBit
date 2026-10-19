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
| ADR-013 | M1.2B dependency pins include `@types/semver` 7.8.0. At the M1.2B audit checkpoint, M1 final closure and M1.3 status were still pending; that historical checkpoint was superseded by ADR-015 through ADR-017. | Historical checkpoint |
| ADR-014 | Deferred follow-up: directly test Ajv's semantic-boundary limitations; decouple core TypeScript tooling from CLI-specific tooling. The Vitest config-loader warning is non-blocking. | Deferred / non-blocking |
| ADR-015 | M1.2A Workspace Foundation is Accepted; M1.2B Core Contracts is Accepted with non-blocking issues; M1 Foundation & Contracts is Complete / Accepted. Acceptance uses implementation reports, prior audits, and user-provided GitHub Actions screenshots. | Accepted |
| ADR-016 | User confirms private `inumakidev/DevOrBit`, branch `master`, initial commit `6c2f9985031104d36e9a0949a3b3b2b4862b3a2d` (`chore: initialize DevOrbit foundation and core contracts`), and successful push to `origin/master`. User-provided screenshots show `Workspace validation` run #1 (ID `39215771440`) and `validate` job (ID `117939137329`) succeeded. One annotation warning and one notice remain uninspected. | Recorded; warning/notice deferred |
| ADR-017 | M2 — Registry & Resolver is next; planning pending, implementation not started. Its approved objectives and Definition of Done remain as specified in the roadmap and implementation blueprint. | Approved scope; planning pending |

## Open selections (not architecture changes)

- Keep the accepted Node.js/pnpm/tool pins recorded in [CURRENT-STATUS.md](CURRENT-STATUS.md); revisit only with explicit approval.
- The CLI parser and lint/format tooling were selected for M1; revisit only with explicit approval.
- Validate specific Codex and Copilot environments with real smoke tests.
- M2 planning must establish the implementation boundaries and measurable verification plan for the approved M2 requirements without expanding scope.

These are implementation and verification items, not permission to change approved architecture or begin M2 implementation. The M1.2B non-blocking findings remain open: explicit Ajv semantic-boundary tests and core TypeScript tooling decoupling. The Vitest config-loader warning and GitHub Actions annotation warning/notice remain uninspected or unresolved; none blocks M1 acceptance.
