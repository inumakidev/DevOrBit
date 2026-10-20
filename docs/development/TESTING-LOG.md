# Testing and verification log

Record only checks actually executed. A planned check is not a result.

## Baseline — 2026-10-19

| Check | Expected | Observed | Outcome |
| --- | --- | --- | --- |
| Application tests | Not applicable to documentation-only setup; no application implementation exists. | Not run. | Not Executed |
| Build/typecheck/lint | No application implementation or tooling setup was requested. | Not run. | Not Executed |
| Documentation inventory, relative links, and approved catalog counts | Exactly the 25 approved files; all relative Markdown links resolve; totals match approved design. | 25 expected files; zero broken relative links; 17 domains, 84 skills, 8 packs, 12 workflows, and 7 governance systems. | Pass |

## Post-correction documentation audit — 2026-10-19

| Check | Expected | Observed | Outcome |
| --- | --- | --- | --- |
| 1. Required Markdown inventory | Exactly the 25 approved documentation paths. | 25 expected files present; no missing or unexpected Markdown files. | Pass |
| 2. Approved specification coverage | Approved architecture, technology, UX, governance, security, evaluation, and phased release design retained without changing decisions. | Reviewed against the two authoritative DOCX documents; corrections add omitted approved UI/UX requirements and stack examples without changing architecture. | Pass |
| 3. Catalog completeness | 17 domains, 84 unique skill IDs, 8 packs, 12 workflows, 7 governance systems; skill IDs match the approved source. | All counts and the complete skill ID set match. | Pass |
| 4. Independent engines | AI Skills & Instructions Engine and Project Setup Automation Engine remain independently usable. | Independence and shared-contract boundary retained in `docs/main/01-overview.md` and `docs/main/02-architecture.md`. | Pass |
| 5. Stack/database guidance | Next.js/Laravel initial official profiles; required custom-stack examples and PostgreSQL hosting providers represented without unsupported compatibility claims. | React + Vite, Node.js + Express, Python + Django, Python + FastAPI, mixed/custom stacks, Neon, Supabase, Railway, and custom providers documented. | Pass |
| 6. Agent integration phases | Codex, Copilot VS Code, Copilot CLI/cloud, Claude Code, and Cursor have accurate distinct phases and evidence requirements. | Initial targets, separate Copilot validations, and later targets remain distinct in `docs/main/07-agent-integrations.md`. | Pass |
| 7. V0.1 and deferred scope | V0.1 scope is distinct from deferred capabilities. | AI Only is the V0.1 priority; full Project Only/Combined scaffolding and later integrations remain deferred or phased. | Pass |
| 8. Installer and resolver safeguards | Deterministic dependencies, trust/conflict handling, ownership protection, safe dry-run, and verified recovery are required. | Requirements remain documented in `docs/main/02-architecture.md`, `docs/main/04-installation-and-cli.md`, and `docs/main/08-security-and-governance.md`. | Pass |
| 9. Evidence-based claims | No unsupported implementation, compatibility, security, or test success claims. | Planned design is distinguished from implementation; application tests remain Not Executed. | Pass |
| 10. Continuity consistency | Agent instructions and continuity records agree on onboarding, current status, immediate task, and authorization boundary. | `AGENTS.md`, `AGENT-ONBOARDING.md`, `PROJECT-CONTEXT.md`, `HANDOFF.md`, `CURRENT-STATUS.md`, and `NEXT-SESSION.md` are consistent. | Pass |
| 11. Links and duplicated status | Relative links resolve; repeated status/milestone information is not contradictory. | Zero broken relative Markdown links; repeated immediate-task, M1, development, and test status statements agree. | Pass |
| 12. Next development milestone | Immediate task is Documentation Foundation — Final Review and User Acceptance; next development milestone is Phase 4 / M1 — Repository Foundation & Contracts. | Roadmap, evaluation, status, next-session, and handoff distinguish the immediate review from M1; development remains Not Started. | Pass |
| Application tests/build/typecheck/lint (outside the 12 documentation checks) | Do not claim results unless run. | Not run; application tests remain Not Executed. | Not Executed |

## M1.1 read-only environment inspection and M1.1A recheck — 2026-10-19

| Check | Observed result | Outcome |
|---|---|---|
| Workspace documentation baseline | Exactly the expected 25 Markdown files were present; both authoritative DOCX inputs remained present. | Pass |
| Source/config inventory | No application source, package manifest, pnpm workspace file, or lockfile was found outside `.git`; no files were created. | Pass |
| Git repository | `.git` present; `master`; zero commits; documentation and DOCX files untracked. An earlier inspection had found no Git repository and remains preserved in the historical record. | Pass |
| GitHub remote | The M1.1 report recorded no verified remote. A later M1.1A local check found an `origin` configuration; when it was configured is unknown. GitHub reachability, ownership, privacy, and remote-side state were not checked. | Not Verified |
| Environment versions | Windows 11 Home Single Language 10.0.26200 x64; PowerShell 5.1.26100.9711; VS Code 1.142.0; Node.js 22.14.0; npm 11.19.1; pnpm 10.16.0 (package metadata); Corepack 0.31.0; Git 2.55.0.windows.5; TypeScript 5.8.2. | Pass |
| GitHub CLI | Not found in PATH. | Not Installed |
| GitHub Copilot extension | Not listed in the inspected VS Code CLI extension profile. | Not Detected in inspected profile |
| Active Copilot session and other profiles | Not inspectable from these read-only workspace/CLI checks. | Not Verified |
| Application tests and package scripts | Not run. No package manifest/scripts were found. | Not Executed |

## M1.1A documentation reconciliation validation — 2026-10-19

| Check | Expected | Observed | Outcome |
|---|---|---|---|
| Current checkpoint agreement | Status and handoff agree on Documentation Foundation Approved; M1.1 Completed; M1.1A reconciliation Completed; M1 implementation Not Started; application tests Not Executed; M1.2 pending approval. | Reconciled entries agree. | Pass |
| Documentation baseline | 25 expected Markdown files remain. | 25 files present; no documentation files removed or replaced. | Pass |
| Relative links | Changed documentation links resolve. | Zero broken relative links in the changed documentation set. | Pass |
| M1.2 proposal | Proposed paths are distinguished from existing files and no proposal file is created. | File inventory in `NEXT-SESSION.md` is proposal only; inspected target paths did not exist. | Pass |

## M1.2A implementation and acceptance review — 2026-10-19

Implementation-session results below were reported from the authorized M1.2A implementation. The acceptance review did not reinstall dependencies or rebuild.

| Check | Observed result | Outcome |
|---|---|---|
| Dependency installation | `pnpm install` completed using pnpm 10.16.0; exact requested dependencies were resolved. | Reported PASS |
| Workspace discovery | Root and `@devorbit/cli` workspace packages were discovered. | Reported PASS |
| Biome lint/format | `pnpm lint` passed after correcting the Biome schema URL/preset and formatting the authorized files. | Reported PASS |
| TypeScript | `pnpm typecheck` succeeded. | Reported PASS |
| CLI build | `pnpm build` succeeded. | Reported PASS |
| CLI smoke checks | `--help` displayed usage/options; `--version` returned `0.0.0`. | Reported PASS |
| Frozen lockfile | `pnpm install --frozen-lockfile` completed with the lockfile up to date. | Reported PASS |
| Application tests | No placeholder tests were created; no application test suite was run. | Not Run |
| M1.2A file inventory | All 11 authorized paths, including `.github/workflows/ci.yml` and generated `pnpm-lock.yaml`, were present. | Pass |
| Package/workspace scripts | Root scripts invoke Biome and filter typecheck/build to `@devorbit/cli`; workspace globs include `apps/*` and `packages/*`. | Pass |
| Lockfile and installed versions | Lockfile/listing showed Biome 2.5.15, Vitest 4.1.5, Commander 14.0.3, `@types/node` 22.20.5, and TypeScript 5.9.3. Runtime/pnpm pins are Node.js 22.14.0 and pnpm 10.16.0. | Pass |
| Existing CLI smoke check during acceptance | Ran the already-built `node apps/cli/dist/index.js --help` and `--version`; help was displayed and version was `0.0.0`. No rebuild. | Pass |
| Documentation/source preservation | Exactly 25 Markdown files and both authoritative DOCX documents were present. | Pass |
| Git state | Read-only status showed branch `master`, no commits, and untracked files; no staging/commit/push/remote change was performed. | Pass |

At the M1.2A checkpoint, M1.2A was implemented and M1 remained incomplete because M1.2B Core Contracts and its tests were pending explicit authorization. No M1.2B tests or implementation had yet been performed at that checkpoint.

## M1.2B implementation results and acceptance audit — 2026-10-19

The implementation-session outcomes below were reported as successful. The subsequent M1.2B acceptance audit was read-only and did not rerun commands, reinstall dependencies, or regenerate the schema. Do not treat reported results as independent acceptance-audit executions. The hosted Actions row reflects evidence available at that earlier audit checkpoint; later user confirmation is recorded in the final closure section.

| Check | Observed result | Outcome |
|---|---|---|
| Dependency installation | `pnpm install` completed with the approved exact dependencies: Zod 4.6.7, semver 7.8.5, `@types/semver` 7.8.0, Ajv 8.20.0. | Reported PASS |
| Workspace discovery | Workspace package discovery completed. | Reported PASS |
| Typecheck | `pnpm typecheck` succeeded. | Reported PASS |
| Lint | `pnpm lint` succeeded. | Reported PASS |
| Build | `pnpm build` succeeded. | Reported PASS |
| Contract tests | `pnpm test` reported 29 passing Vitest tests. | Reported PASS (29) |
| JSON Schema generation consistency | `pnpm schema` completed and the generated schema was reported consistent with the checked-in schema. | Reported PASS |
| CLI smoke checks | CLI `--help` and `--version` checks succeeded; the CLI version is `0.0.0`. | Reported PASS |
| Core package import | `@devorbit/core` import smoke check succeeded. | Reported PASS |
| Frozen lockfile | `pnpm install --frozen-lockfile` completed successfully. | Reported PASS |
| Hosted GitHub Actions at the M1.2B audit checkpoint | No hosted workflow run had yet been observed. | Not Verified at that historical checkpoint |
| M1.2B acceptance audit command reruns | Audit was read-only; the command results above were not rerun. | Not Run |
| JSON Schema semantic-boundary coverage | Audit identified a deferred opportunity for direct Ajv examples showing custom semantic constraints (including duplicate IDs and kind/ID prefix agreement) that JSON Schema does not fully express. | Deferred; non-blocking |
| Vitest config-loader warning | A warning was observed/reported, without a failed test outcome. | Non-blocking |

At the M1.2B acceptance-audit checkpoint, M1.2B was accepted with non-blocking issues. The 29 tests are contract tests; no broader end-to-end/product application test result is claimed. At that time, M1 remained in progress pending GitHub verification, explicit authorization for Git operations, an actual successful hosted Actions run, and the final M1 acceptance decision. The later user-confirmed repository and workflow status is recorded in the M1 final closure review below.

## M1 final closure review — 2026-10-19

The repository, push, visibility, and hosted workflow results in this section are **user-confirmed**. No GitHub remote was contacted and no Git operation was performed during this documentation-only review. The prior M1.2B implementation command results remain implementation-session reports; they were not independently rerun here.

Documentation validation for this task: relative Markdown links in the 14 authorized files were checked; no broken targets were found. No package, build, or application test command was run.

| # | M1 requirement | Outcome | Supporting evidence and limitations |
|---|---|---|---|
| 1 | Development environment and GitHub repository readiness | **PASS** | Tool versions are recorded in `CURRENT-STATUS.md` and were previously inspected/reported. User confirms private `inumakidev/DevOrBit`, branch `master`, initial commit and push to `origin/master`. Repository state and privacy were not independently inspected during this review. |
| 2 | Pinned toolchain and dependency versions | **PASS** | Exact versions are recorded: Node.js 22.14.0, pnpm 10.16.0, TypeScript 5.9.3, Vitest 4.1.5, Biome 2.5.15, Commander.js 14.0.3, Zod 4.6.7, semver 7.8.5, `@types/semver` 7.8.0, and Ajv 8.20.0. Prior implementation/acceptance records report the lockfile and installed versions; they were not rechecked in this closure review. |
| 3 | Monorepo and GitHub Actions baseline | **PASS** | The workspace/CI baseline was implemented and previously inspected/reported. User-provided screenshots show successful `Workspace validation` run #1 (ID `39215771440`) and successful `validate` job (ID `117939137329`) on `master`. The screenshots, not an independently fetched GitHub record, are the hosted evidence. |
| 4 | Core contracts, canonical schema, validation, and errors | **PASS** | M1.2B was accepted with non-blocking issues. Its implementation report and read-only acceptance audit document the core API, canonical Zod schema, generated Draft 2020-12 JSON Schema, typed errors, and contract validation. Deferred semantic-boundary coverage remains documented. |
| 5 | Actual manifest contract tests | **PASS** | Prior M1.2B implementation-session report: 29 Vitest tests passed. This result was not rerun during the acceptance audit or this closure review; no broader end-to-end/product application test result is claimed. |
| 6 | Reproducible install/build/typecheck/lint/test evidence and updated handoff | **PASS** | Prior implementation-session reports record successful local install, frozen-lockfile install, build, typecheck, lint, schema generation, CLI smoke checks, core import, and 29 tests. User-provided GitHub screenshots identify the successful hosted run and job and show install, lint, typecheck, build, and tests passing. Status and handoff records are reconciled. Screenshots were not independently retrieved from GitHub; annotation details remain uninspected. |

### M1 closure decision

**Final decision: ACCEPT M1 — Foundation & Contracts.** All six requirements are accepted based on the implementation reports, prior acceptance audits, and user-provided GitHub Actions screenshots. The evidence source and limits are explicit; no additional hosted CI details are inferred. M2 — Registry & Resolver is next, planning pending; no M2 implementation has started.

### GitHub Actions run evidence

- Repository: `inumakidev/DevOrBit`; Private visibility is user-confirmed.
- Branch: `master`.
- Initial commit: `6c2f9985031104d36e9a0949a3b3b2b4862b3a2d`, `chore: initialize DevOrbit foundation and core contracts`; successful push to `origin/master` is user-confirmed.
- Workflow: `Workspace validation`, run **#1**, run ID `39215771440`, [run URL](https://github.com/inumakidev/DevOrBit/actions/runs/39215771440).
- Job: `validate`, job ID `117939137329`, [job URL](https://github.com/inumakidev/DevOrBit/actions/runs/39215771440/job/117939137329).
- User-provided screenshots show overall workflow **SUCCESS**, job **SUCCESS**, duration **32 seconds** overall and **28 seconds** for the job.
- The screenshots show `pnpm install --frozen-lockfile`, `pnpm lint`, `pnpm typecheck`, `pnpm build`, and `pnpm test` as **PASS**.
- Evidence is from screenshots supplied by the user, not an independently fetched GitHub record. No further jobs, checks, or results are asserted.
- The GitHub UI also displayed **one warning and one notice** under Annotations. Their contents have not been reviewed; they remain **uninspected and unresolved**, but are not blockers to M1 acceptance.

The implementation-session report separately records 29 passing Vitest contract tests and successful local install, typecheck, lint, build, schema generation consistency, CLI smoke checks, core package import, and frozen-lockfile installation. These local results were not independently rerun during this final documentation closure.

### Deferred, non-blocking findings

- Add explicit Ajv tests that demonstrate semantic-boundary limitations, especially duplicate-ID and kind/ID-prefix rules.
- Decouple core TypeScript tooling from CLI workspace coupling.
- The Vitest configuration-loader warning was non-failing and remains a non-blocking issue.
- The hosted GitHub Actions annotation warning and notice have not been inspected and remain unresolved; they are not blockers to M1 acceptance.

## Recording template

For each later check, record:

- Test/check ID and objective.
- Fixture or target documentation/component.
- Environment, runtime, and tool versions.
- Expected result and observed result.
- Outcome: Pass, Fail, Not Applicable (with reason), or Not Verified.
- Evidence reference and reviewer.
- Follow-up or issue ID.

Never convert a planned test into a pass or invent benchmark results. Mandatory Not Verified checks block the relevant milestone/release gate.

## M2 — Registry & Resolver acceptance criteria

The M2 acceptance matrix is an approved design requirement, not a report of executed tests. The original M2.2 and M2.3 rows below record their earlier not-executed checkpoint and are superseded for M2.2 Phase 1B/1C by the dated evidence that follows this matrix. See the [canonical registry and resolver specification](../main/11-registry-and-resolver-architecture.md) for the exact frozen protocol, mandatory acceptance cases, limits, and implementation-time security gates.

| Check group | Expected evidence | Observed result | Outcome |
|---|---|---|---|
| M2.2 registry, file-only integrity, attestation, trust-policy, protected-state, Git-object, binding, snapshot, diagnostics, and resource-boundary matrix | Exact positive/negative evidence for every approved requirement; boundary behavior is inclusive and overflow fails closed. | At the original matrix checkpoint, M2.2 implementation had not started and no M2.2 tests had been executed. Phase 1B/1C results are recorded below. | **NOT EXECUTED at original checkpoint** |
| M2.2 independent fixed-byte vectors | Independently generated and verified raw-byte/hex fixtures with manual byte-level review; no fabricated outputs. | No vectors generated or claimed. | **NOT EXECUTED** |
| M2.2 Windows/Git/OS security validation | Evidence for ACLs, protected keys, reparse points, executable substitution, config isolation, offline/read-only behavior, process-tree termination, races, and supported baseline. | No M2.2 adapter or Windows security result is claimed. | **NOT EXECUTED** |
| M2.3 resolver and plan matrix | Deterministic dependency/compatibility solving, rollback semantics, diagnostics, and bounded failure behavior. | M2.3 has not started. | **NOT EXECUTED** |

The matrix is not a passing test result for the historical checkpoint it records. It does not supersede the later Phase 1B/1C evidence below. Windows security testing has not been completed.

## M2.2 Phase 1B/1C local and CI evidence — 2026-10-20

The following results are user-reported. They were not independently rerun for this documentation closure.

| Check | Observed result | Outcome |
|---|---|---|
| `pnpm lint` | Passed locally. | Reported PASS |
| `pnpm typecheck` | Passed locally. | Reported PASS |
| `pnpm build` | Passed locally. | Reported PASS |
| `pnpm test` | 70/70 tests passed: M1 29, Phase 1B 22, Phase 1C 19. | Reported PASS |
| Phase 1B CI | Accepted and pushed; CI passed per user report. | Reported PASS |
| Phase 1C CI | Initial validation encountered fixture-formatting and clean-checkout `@devorbit/core` resolution failures. A dedicated core build step was added before root typecheck; the user reports the latest workflow passed. | Reported PASS after remediation |

The workflow remediation changes build order only: core is built before root typecheck so its declared `dist` type exports exist on a clean checkout. No workflow run number, commit hash, or CI test count is asserted. The CI evidence is user-reported and was not independently retrieved. M2.2 overall remains **IN PROGRESS / INCOMPLETE**; these results do not indicate full M2.2 completion, deployment, or release.

### Phase 1C scope and verification boundary

Phase 1C implements an internal pure manifest-to-content record-binding helper. It hashes exact raw manifest bytes separately from the content-tree digest; strictly decodes UTF-8 and rejects a BOM; requires one asset; binds exact identity, version, and provenance directory; reuses Phase 1B asset-tree integrity computation; uses internal M2 failure classifications; and preserves existing M1 validation behavior. It adds no public registry API and does not implement filesystem discovery, trust verification, Git-object access, or resolver behavior.

## M2.2 Phase 1D focused verification — 2026-10-20

The following focused results were observed during the Phase 1D implementation session. They do not establish a full-suite, root lint, typecheck, build, remote CI, push, or release result.

| Check | Observed result | Outcome |
|---|---|---|
| `pnpm exec vitest run tests/unit/registry/provenance/attestation-framing.test.ts` | One test file passed; 16/16 tests passed. | PASS |
| `pnpm exec biome check packages/registry/package.json packages/registry/src/provenance/attestation-framing.ts tests/unit/registry/provenance/attestation-framing.test.ts tests/fixtures/registry/attestation-framing-vectors.json` | Four files checked; no fixes applied. | PASS |
| Read-only Phase 1D implementation audit | Review against canonical architecture §5, Phase 1D scope, and M1/Phase 1C contracts concluded ACCEPT. | ACCEPT |
| Full suite, root lint/typecheck/build, Phase 1D push, and remote CI | Not evidenced for Phase 1D in this record. | NOT VERIFIED |

The fixture contains independently assembled fixed-byte vectors and recorded SHA-256 values. The inconsistent version/path vector is a negative case; the canonical version/path mutation is separately tested as a valid binding. These tests verify framing only, not signature validity, source authenticity, or trust.

## M2.2 Phase 1E focused verification — 2026-10-20

Local results were observed during the Phase 1E implementation session. The user also reports successful validation. This evidence does not establish a full-suite, root lint/typecheck/build, push, or remote CI result.

| Check | Observed result | Outcome |
|---|---|---|
| `pnpm exec vitest run tests/unit/registry/provenance/attestation-envelope.test.ts` | One focused test file passed; 25/25 tests passed. | PASS |
| `pnpm exec biome check packages/registry/src/provenance/attestation-envelope.ts tests/unit/registry/provenance/attestation-envelope.test.ts tests/fixtures/registry/attestation-envelope-vectors.json` | Three authorized files checked; no fixes applied. | PASS |
| Final read-only security and correctness audit | Audit recommendation: ACCEPT WITH FOLLOW-UP. No code blocker identified; stale continuity/status records were identified for documentation reconciliation. | ACCEPT WITH FOLLOW-UP |
| Independent fixture digest check | PowerShell/.NET SHA-256 over the exact UTF-8 `rawEnvelope` yielded `e7198e5152556d2c0f90e97b9860a935a5d6b8c30b48596bb91f3207eaec2506`, matching the fixture. | PASS |
| Full suite, root lint/typecheck/build, Phase 1E push, and remote CI | Not evidenced. Phase 1D remote CI was confirmed green by the user; that does not establish Phase 1E remote acceptance. | NOT VERIFIED |

The parser computes SHA-256 over exact original envelope bytes; rejects malformed UTF-8, BOM, duplicate decoded JSON keys, invalid schema/claims, and noncanonical signatures; and enforces inclusive 64 KiB input, maximum container depth 8 (root counts as depth 1), and 128 parsed nodes (each JSON value and each object key counts). Parsing does not verify Ed25519 signatures, authorize or trust signers, bind claims to selected context or an `AssetRecord`, or make assets eligible.

## M2.2 Ed25519 verification and contextual binding — 2026-10-20

The implementation and remote acceptance status in this entry are based on user confirmation where specified. No GitHub run ID or commit hash was provided. The last explicitly observed full-suite result is 135/135; the user separately reports successful full validation, but no newer full-suite count is asserted.

| Check | Observed result | Outcome |
|---|---|---|
| `pnpm exec vitest run tests/unit/registry/provenance/attestation-verification.test.ts` | Focused verifier suite passed 24/24, including full-string validation regression cases. | PASS |
| `pnpm --filter @devorbit/registry typecheck` | Registry package typecheck passed after the local `assetValue` runtime guard was narrowed explicitly. | PASS |
| `pnpm exec biome check packages/registry/src/provenance/attestation-verification.ts` | Focused Biome check passed. | PASS |
| Full validation | User reports successful full validation. Exact individual commands and a newer full-suite count were not provided here. | User-reported PASS; details not independently verified in this documentation closure |
| Push and GitHub Actions | User confirms implementation was pushed and GitHub Actions passed. | User-confirmed PASS; no commit hash or run ID asserted |

The verifier consumes a parsed Phase 1E envelope, caller-selected repository and pinned revision, a validated Phase 1C `AssetRecord`, and an externally supplied raw 32-byte Ed25519 key. It derives `sha256:` plus lowercase SHA-256 of only the raw public-key bytes, calls Phase 1D `frameAttestation`, checks all nine claims, and verifies the signature over the framed bytes using Node built-in Ed25519 verification. Runtime input checks reject terminal LF, CR, and CRLF in exact repository, revision, and digest values without trimming or repairing them. Typed failures distinguish invalid input, binding mismatch, key mismatch, and invalid signature with one generic message.

Acceptance establishes cryptographic signature validity and contextual consistency only. It does not authorize signers, evaluate trust policy, handle revocation or aggregation/conflicts, maintain protected state, verify Git objects, discover registry assets, or make assets eligible. M2.2 remains **IN PROGRESS / INCOMPLETE**; M2.3 remains **NOT STARTED**.

## Historical next verification task at Phase 1E checkpoint

At that earlier checkpoint, the next task was read-only discovery of the next incomplete M2.2 capability and Phase 1E push/remote acceptance was awaiting confirmation. Those statements are superseded by the verification/binding implementation and user-confirmed push/green Actions recorded above.

## M2.2 internal RFC 8785 JCS canonicalizer — 2026-10-20

The JCS implementation-session checks below are observed results. The user separately confirms full project validation and GitHub Actions success; these broader results and working-tree synchronization were not independently checked in this documentation update.

| Check | Observed result | Outcome |
|---|---|---|
| `pnpm exec vitest run tests/unit/registry/provenance/jcs.test.ts --pool=threads --maxWorkers=1` | One focused file passed; 21/21 tests passed. | PASS |
| `pnpm exec biome check packages/registry/src/provenance/jcs.ts tests/unit/registry/provenance/jcs.test.ts tests/fixtures/registry/jcs-vectors.json` | All three authorized JCS files checked; no fixes applied in the passing run. | PASS |
| `$env:NODE_OPTIONS='--max-old-space-size=256'; pnpm --filter @devorbit/registry typecheck` | Registry package typecheck passed with the bounded Node heap. | PASS |
| Full project validation | User confirms successful full project validation; exact command-by-command output and a new test count were not supplied. | User-reported PASS; not independently verified here |
| GitHub Actions | User confirms GitHub Actions validation passed; no run ID supplied. | User-reported PASS; not independently retrieved |
| Working tree / branch sync | User confirms a clean working tree and `master` synchronized with `origin/master`. No Git commands were run to independently check this. | User-reported; not independently verified |

One attempted Vitest invocation included unsupported `--minWorkers`; Vitest rejected the option before running tests. The focused test command above was then run successfully without that option. A first Biome run identified test formatting; the test file was formatted and the final Biome check passed.

The fixture expected values are transcribed from RFC 8785 Appendix B and the Section 3.2.3 canonicalization example; they were not generated by the implementation under test. No separate external verification was performed for the fixture during this implementation session.

## Current next verification task

Before implementing strict trust-policy parsing, obtain explicit confirmation of policy/update raw-input limits; repository, signer, and revocation collection limits; caller-specific JCS budgets; exact schema/timestamp validation; and duplicate-key/unknown-field rejection. The approved 64 MiB complete-snapshot canonical-byte cap remains unchanged; proposed policy, diagnostic, and JCS traversal budgets are not approved architecture constants. M2.2 remains **IN PROGRESS / INCOMPLETE**; M2.3 remains **NOT STARTED**.

## M2.2 JCS documentation closure checks — 2026-10-20

| Check | Observed result | Outcome |
|---|---|---|
| Markdown review of authorized documentation set | Statuses, scope, next-task prerequisites, and 64 MiB approved snapshot cap were reviewed for consistency. | PASS |
| UTF-8/BOM and known mojibake scan | All 10 edited Markdown files were valid UTF-8 without BOM; no configured mojibake markers were found. | PASS |
| Trailing-whitespace scan | No trailing-whitespace lines found in the 10 edited Markdown files. | PASS |
| Relative-link scan | No missing Markdown-file links found. Five existing links to the two root DOCX source documents did not resolve in the local scan; the DOCX files were not opened or inspected, and these links were not changed. | Follow-up / Not Verified |
| Application tests, builds, and source lint | Not run; this closure authorized documentation changes only. | Not Run |
| Git/GitHub, network, DOCX access | Not performed. | Not Applicable / Not Run |

The initial PowerShell link-check script did not parse, and the Python launcher was unavailable. An equivalent local Node.js check completed the encoding, whitespace, mojibake, and link scan summarized above.
