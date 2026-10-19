# 4. Installation and CLI

## Status

The CLI and installer are **Planned**. This document specifies intended behavior; it is not an installation guide for an available executable. No dependencies or runtime have been installed as part of the documentation foundation.

## Distribution model

The approved model uses a central GitHub repository as the canonical source. Users selectively install pinned assets into independent project repositories. Installed assets should remain available offline where feasible. V0.1 distribution is GitHub-first through a local CLI; npm publication is not mandatory.

## Modes

- **AI Only** — the V0.1 priority; installs supported AI-facing assets and adapters.
- **Project Only** — architecturally supported; full scaffolding is deferred until implemented.
- **Combined** — combines the engines; full scaffolding is deferred until implemented.

Never advertise deferred modes as usable functionality without implementation and verification evidence.

## Planned CLI operations

`inspect`, `list`, `plan`, `install`, `verify`, `update`, `remove`, and `doctor`.

Planning and diagnosis should default to read-only behavior. Non-interactive CI use must require explicit authorization and deterministic exit codes.

## Safe installation flow

The planned flow is **Inspect → Resolve → Plan → Preview → Approve → Apply → Verify → Commit or Recover**. A user should be able to review exact asset versions and paths before changes are applied.

Required invariants include zero writes during dry-run, path/symlink containment, ownership-aware changes, no unowned deletion, conflict detection for modified assets, no silent overwrite, no unapproved scripts, secret redaction, and clear recovery reporting. The installer must not automatically push, deploy to production, or run destructive migrations.

## Runtime and environment decisions

The approved implementation direction is TypeScript, pinned Node.js LTS, and pnpm workspaces. Exact versions and CLI/lint tooling remain M1 selections pending compatibility checks. Development targets GitHub Codespaces and Windows/Linux initially; macOS is later scope.

## Before real installation is supported

Implementation must provide deterministic resolution, explicit trust/provenance, reviewable plans, authorization, verification, and tested recovery. Acceptance requires evidence for dry-run zero writes, protection of user-owned files, path/symlink escape prevention, modified-file detection, and recovery. Until then, installation capability is **Not Verified**.
