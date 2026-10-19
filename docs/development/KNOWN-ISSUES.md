# Known issues and unresolved questions

No toolkit implementation has started, so no implementation defects have been confirmed. Track verified problems and unresolved project prerequisites here; update status as evidence changes.

| ID | Summary | Severity/status | Reproduction or evidence | Next action |
| --- | --- | --- | --- | --- |
| KI-001 | No dedicated private security-reporting contact/channel is specified. | Open / operational prerequisite | The approved source documents do not name a contact or configured reporting channel. | Repository maintainers configure and verify a private disclosure route before public development/release. |
| KI-002 | Git initialization state differed between inspections. | Open / historical discrepancy | An earlier inspection found no Git repository; M1.1A later found `.git`, branch `master`, zero commits, untracked documentation/DOCX files, and a configured local `origin`. The change's timing and origin configuration provenance are unknown; GitHub-side state is unverified. | Preserve the earlier observation; confirm repository ownership and remote details only after approval. Do not reinitialize Git or alter configuration. |
| KI-003 | Exact runtime/tool versions and CLI/lint selections are unresolved. | Open / M1 selection | Approved plan defers these choices until compatibility checks. | Select and record during an authorized M1. |
| KI-004 | Specific supported agent environments and capabilities are not validated. | Open / Not Verified | No adapter implementation or smoke tests. | Validate Codex and the specific Copilot VS Code environment during authorized M4. |
| KI-005 | Approved documentation checkpoint is not reflected in all status snapshots. | Open / documentation reconciliation | `README.md`, `AGENTS.md`, and `docs/main/01-overview.md` still say Documentation Foundation is In progress; the approved checkpoint is Documentation Foundation Approved. | Reconcile these files only under separate user approval; they were outside the M1.1A development/continuity update scope. |
No security vulnerability or implementation bug is asserted by these planning/environment items. Add reproduction steps, expected versus observed behavior, affected versions, owner, mitigation, and fix-verification evidence for future bugs.
