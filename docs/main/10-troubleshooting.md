# 10. Troubleshooting and safe escalation

## Scope

This is design guidance for future DevOrbit users and maintainers. No DevOrbit CLI, installer, or adapter is currently established as available by this documentation baseline. Do not interpret these scenarios as evidence of existing commands or behavior.

## General response

1. Stop before repeating an operation that may write, overwrite, delete, deploy, or migrate data.
2. Preserve the repository's current state and collect a redacted description of the environment, intended operation, and observed result.
3. Inspect the actual project and available logs; do not paste secrets, connection strings, tokens, or personal data into an issue.
4. Compare observed behavior with the planned contracts and report inconsistencies.
5. Ask for authorization before retrying a consequential operation. Record the outcome and unresolved issue.

## Planned installer/resolver scenarios

| Scenario | Expected design response |
| --- | --- |
| Missing required asset, dependency cycle, incompatible version, or trust failure | Block resolution and explain the specific conflict. |
| Optional capability unavailable | Omit only with explicit disclosure; never silently represent it as active. |
| Existing or modified target file conflicts | Preview the conflict and request an explicit decision; never silently overwrite. |
| Dry-run would write files | Treat as a safety failure; stop and report it. |
| Path or symlink escapes the target | Block the operation and preserve evidence safely. |
| Apply or recovery fails | Report the exact known state; do not claim successful rollback without verification. |
| Agent discovery or invocation fails | Mark that specific environment/capability Not Verified and use only a documented safe fallback. |

These are approved expected behaviors, not implemented responses.

## Reporting a bug

Capture reproducible steps, expected versus observed behavior, affected component/version if known, environment and tool versions, and redacted evidence. Classify severity and status in [KNOWN-ISSUES.md](../development/KNOWN-ISSUES.md). Do not claim a fix until verification evidence is recorded.
