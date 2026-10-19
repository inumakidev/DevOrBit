# 7. Agent integrations

## Capability-aware approach

Agent integrations are environment-specific adapters, not a single universal instruction file. An adapter should support capability discovery, environment detection, instruction generation, explicit invocation and automatic discovery only when supported, conflict handling, and smoke tests.

Markdown instructions do not enforce a security sandbox. Tool permissions and execution boundaries depend on the actual agent environment and must be assessed separately.

## Approved target matrix

| Target | Phase | Required evidence |
| --- | --- | --- |
| OpenAI Codex | V0.1 initial target | Actual skill discovery, instruction use, safety, and invocation tests. |
| GitHub Copilot in VS Code | V0.1 initial target | Tests in the specific supported VS Code/Copilot environment. |
| GitHub Copilot CLI | Separate phased validation | Validate this environment independently; do not infer VS Code parity. |
| GitHub Copilot cloud agent | Separate phased validation | Validate environment behavior and permission boundaries independently. |
| Claude Code | Later | Adapter and compatibility tests. |
| Cursor | Later | Adapter and compatibility tests. |

The VS Code, CLI, and cloud variants of Copilot are separate capability targets. Passing one target's tests is not evidence for another.

## Activation

Hybrid activation is approved: explicit invocation plus automatic discovery only in environments that support it. If an agent cannot discover or invoke a skill as designed, report the limitation and provide only a documented, safe fallback. Do not claim parity from shared Markdown files alone.

## Repository instructions and onboarding

This repository includes `AGENTS.md` to direct compatible agents to the documentation-first continuity protocol. Do not assume every platform discovers or enforces it. Verify the actual mechanism for each environment before relying on it. The mandatory start/end sequence is in [AGENT-ONBOARDING.md](../continuity/AGENT-ONBOARDING.md).

## Compatibility evidence

Record the agent product, environment, version where available, supported capabilities, test fixture, expected and observed behavior, limitations, outcome, and reviewer. Unsupported capability or absent test evidence is **Not Verified**, not a pass.
