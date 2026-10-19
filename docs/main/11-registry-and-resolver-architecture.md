# DevOrbit — Registry & Resolver Architecture (M2.1 Approved Baseline)

## 1. Status and scope

**Architecture status:** Approved by the user.  
**Documentation closure:** Complete; read-only documentation validation passed.  
**Implementation status:** No M2 registry or resolver implementation is claimed.  
**Tests:** No M2 tests have been executed.  
**M2.2:** Not authorized.  
**M2.3–M2.5:** Not started.  
**CLI integration:** Deferred.

This document is the canonical Markdown reference for the approved M2.1 architecture. Approved design is not implementation evidence. APIs, diagnostic codes, and tests below are design contracts proposed for implementation, not existing exports or verified behavior.

Approved M2 scope is internal registry and resolver libraries only. Preserve M1 public contracts, manifest schema and semantics, error codes, and accepted tests. M2 does not include installation, project-file writes, a remote marketplace, network access, or CLI integration.

## 2. Architecture and package boundaries

| Package | Responsibility | Status |
| --- | --- | --- |
| `@devorbit/core` | Existing M1 manifest contracts, parsing, and errors. | Implemented and accepted for M1; preserve unchanged. |
| `@devorbit/registry` | Local source discovery, manifest ingestion, content integrity, detached provenance, source trust, immutable snapshots, and freshness checks. | Planned internal library; not implemented. |
| `@devorbit/resolver` | Deterministic dependency and compatibility planning over authenticated registry data. | Planned internal library; not implemented. |

Registry handles effectful local reads and trust verification. Resolver's solver is pure over an immutable registry view: no filesystem, Git, network, project writes, or content execution. A registry boundary validates snapshot issuance and policy freshness before invoking the pure solver and checks freshness again before returning success.

Neither package depends on the CLI. M2 does not include installer behavior, scaffolding, ownership records, marketplace/network access, or CLI commands. A read-only plan is informational and does not authorize installation or file modification.

### M1 contracts reused without change

The existing `@devorbit/core` API exports `Asset`, `AssetManifest`, `DependencyReference`, `Compatibility`, integrity/provenance types, manifest parsing/schema exports, and `AssetManifestError` and its existing error codes. M1 validates fields and formats; it does not verify file bytes, signatures, Git object identity, or source authorization.

The M1 manifest requires `manifestVersion: 1` and rejects duplicate asset IDs within one manifest. M2 represents each asset version as a separate one-asset manifest record so multiple versions can be indexed without changing M1. A new M2 diagnostic taxonomy does not replace or extend M1 error codes.

## 3. Canonical local content layout

Proposed local catalog layout:

```text
assets/
  skill.frontend.forms/
    1.2.0/
      manifest.json
      content/
        SKILL.md
        examples/basic.md
    2.0.0/
      manifest.json
      content/
        SKILL.md
  tool.testing.runner/
    3.1.0/
      manifest.json
      content/
        README.md
```

Each manifest envelope has `manifestVersion: 1` and exactly one asset. Its directory ID and exact version must match the parsed asset ID and version. `provenance.path` names the repository-relative version directory. The M1 manifest, schema, and parser are unchanged.

Records are keyed by exact `(asset id, version)`. Multiple versions of an ID are valid. If different records claim the same key, quarantine the key and report `REGISTRY_DUPLICATE_ID_VERSION`; never select by scan order. Only entries with valid manifest syntax, verified integrity, verified provenance, authorized source, and eligible lifecycle status can be resolver candidates.

## 4. Canonical asset-tree integrity

### Approved direction and unresolved encoding detail

The approved design direction is SHA-256 `devorbit-asset-tree-v1`, portable path restrictions, and comparison with the existing M1 `integrity.digest`. **The exact directory-record framing is disputed in the prior design reports: earlier text says empty directories do not affect the digest, while later text includes directory records and empty directories. The exact encoding rule requires confirmation before M2.2 implementation.**

Do not implement digest generation or publish golden digest values until this rule is resolved. The following lists the consistent rules and explicitly isolates the disputed part.

### Content and paths

- Include regular files below `content/`, including empty files. Exclude `manifest.json`, detached attestations, Git metadata, registry indexes, and content outside `content/`.
- File bytes are hashed exactly as stored; no decoding, newline conversion, or content normalization.
- Portable v1 paths use `/` separators and ASCII path segments. Reject absolute paths, empty/`.`/`..` segments, backslashes, colons, trailing dot/space, Windows reserved device names, and unsupported characters.
- Reject two paths colliding under ASCII lowercase comparison. No locale-dependent case folding or Unicode normalization is used. Non-ASCII path names are rejected; file contents may be arbitrary bytes.
- Symlinks, junctions, reparse points, devices, sockets, FIFOs, and other non-regular nodes are rejected and never followed.
- Sort included paths by unsigned bytewise lexicographic order of normalized UTF-8 path bytes.
- Exact file framing is:

```text
ASCII("DEVORBIT-ASSET-TREE\0v1\0")
For each sorted file:
  0x46
  uint32 big-endian path-byte length
  path UTF-8 bytes
  uint64 big-endian file-byte length
  exact file bytes
```

- Empty files contribute a file record with byte length zero.
- **Directory records and empty-directory behavior:** `Requires confirmation before M2.2 implementation`. If included, the exact record tag, path framing, ordering relative to files, and treatment of the `content/` root must be approved. Do not infer the earlier proposed directory tag as final.
- On confirmation, compute SHA-256 over the approved exact stream; render lowercase hex and compare byte-for-byte with M1 `integrity.digest`. A mismatch makes the record ineligible.

### Test vectors

Required input vectors include:

1. `hello.txt` with bytes `48 65 6c 6c 6f 0a`.
2. `empty.bin` with zero bytes.
3. `a.bin` with `00 ff` and `z.txt` with `41`, discovered in reverse input order.
4. Mutated content with the original declared digest (must mismatch).
5. Changed manifest bytes with unchanged `content/` (tree digest remains unchanged; attestation manifest digest changes).

Expected hash values remain pending; none are invented here. Implementation must generate them with two independent implementations, compare results, and pin the values only after the framing—including directory semantics—is approved.

## 5. Detached Ed25519 attestations

Attestations are stored outside the Git commit they reference. Embedding the commit's SHA in a signed statement stored in that commit would be circular because the commit hash depends on the tree containing the statement.

### Proposed envelope

```json
{
  "format": "devorbit-detached-attestation-v1",
  "payload": {
    "repositoryId": "placeholder/only",
    "revision": "0000000000000000000000000000000000000000",
    "assetPath": "assets/example/1.0.0",
    "assetId": "skill.example.asset",
    "assetVersion": "1.0.0",
    "manifestSha256": "0000000000000000000000000000000000000000000000000000000000000000",
    "contentTreeAlgorithm": "devorbit-asset-tree-v1",
    "contentTreeSha256": "0000000000000000000000000000000000000000000000000000000000000000",
    "signerKeyId": "sha256:0000000000000000000000000000000000000000000000000000000000000000000000"
  },
  "signature": "<unpadded-base64url-64-byte-signature>"
}
```

Values are placeholders only; no production identity, repository, key, or credential is implied.

### Signed bytes and binding

The signature covers these exact bytes:

```text
ASCII("DEVORBIT-DETACHED-ATTESTATION\0v1\0")
For each field, in fixed order:
  uint32 big-endian UTF-8 byte length
  UTF-8 bytes

1. normalized repositoryId
2. exact 40-lowercase-hex revision
3. validated assetPath using /
4. exact assetId
5. exact assetVersion
6. manifestSha256 (64 lowercase hex)
7. exact ASCII "devorbit-asset-tree-v1"
8. contentTreeSha256 (64 lowercase hex)
9. signerKeyId ("sha256:" plus 64 lowercase hex)
```

The Ed25519 signature must decode to exactly 64 bytes and use canonical unpadded base64url encoding; decode/re-encode must equal the supplied string. The signature binds repository, exact revision, asset path and identity/version, exact manifest-byte digest, and content-tree digest. The manifest is excluded from the content tree, avoiding circular content hashing; the detached statement binds both digests.

### Discovery and multiple attestations

Read attestations only from an explicitly configured local read-only store. Derive lookup identity from a length-framed `(normalized repositoryId, revision, assetPath)` tuple and hash it. The precise tuple domain separator and exact on-disk filename convention remain a confirmation prerequisite; a filename is never proof.

- Accept multiple valid, authorized attestations when substantive claims agree.
- Compare repository ID, revision, path, asset ID/version, manifest digest, content algorithm, and content digest. Exclude signer-specific `signerKeyId` from substantive comparison, but verify and authorize every signer independently.
- Reject conflicting valid authorized claims with `PROVENANCE_CONFLICTING_ATTESTATIONS`.
- Ignore invalid or unauthorized attestations for eligibility while recording safe diagnostics; they cannot override a valid authorized attestation.
- If no valid authorized attestation remains, the asset is ineligible.

## 6. Trust-policy administration

### Policy and update protocol

The policy is strict canonical JSON after duplicate/unknown-field rejection. **RFC 8785 JSON Canonicalization Scheme is the recommended encoding, but requires confirmation before M2.2 implementation.** Proposed policy fields are `formatVersion: 1`, monotonic `sequence`, `issuedAt`, `expiresAt`, `administratorKeyId`, repository authorization/revocation entries, and signer key/authorization/validity/revocation entries. Public keys are Ed25519; key IDs are SHA-256 fingerprints of the public-key bytes. Repository IDs are normalized lowercase ASCII `owner/repository`. No production values are specified.

The update envelope is:

```json
{
  "format": "devorbit-trust-policy-update-v1",
  "sequence": 1,
  "previousPolicyDigest": null,
  "policy": {},
  "policyDigest": "<64 lowercase hex>",
  "signerKeyId": "sha256:<64 lowercase hex>",
  "signature": "<unpadded-base64url-64-byte-signature>"
}
```

`policyDigest` is SHA-256 of canonical policy bytes. Signed update bytes:

```text
ASCII("DEVORBIT-TRUST-POLICY-UPDATE\0v1\0")
uint64 big-endian sequence
32 raw bytes previousPolicyDigest
  (all-zero bytes only for separately authenticated bootstrap)
32 raw bytes policyDigest
32 raw bytes administrator key fingerprint
```

The update signer must be the administrator key already trusted by the previously authenticated state. For normal updates, the new sequence is exactly the previous sequence plus one, and the previous digest must equal the authenticated external rollback state. A new key cannot authorize itself.

### Bootstrap, rotation, and revocation

- Bootstrap requires manual independent verification of the initial administrator public-key fingerprint. No trust-on-first-use.
- The current administrator key signs its replacement into a next policy. Only after the update is authenticated does the replacement become the trusted signer.
- Recovery after loss/compromise of the sole administrator key requires explicit out-of-band rebootstrap; no in-band recovery key is assumed.
- Administrator enrolls asset signers after independent fingerprint verification and explicitly authorizes signer-to-repository relationships.
- Signer rotation enrolls and verifies the replacement before revoking the old key. Revoked signers are rejected; signed-time claims do not grandfather them.
- Repository revocation is an authenticated policy update and makes its assets ineligible.

### 720-hour expiry and protected-state assurance

Policy lifetime is exactly **720 hours**, with `expiresAt = issuedAt + 720 hours`; no grace period. Policy is valid iff `issuedAt <= evaluationTime < expiresAt`. Signer validity uses the same half-open interval; revocation makes the signer ineligible.

The approved assurance is **standard local protected state**, not mandatory hardware-backed rollback-resistant storage. The external policy-administration workflow protects policy and rollback state using available local OS controls and records the highest accepted sequence/digest. Registry verifies signatures, policy sequence/digest, and state consistency, but remains read-only.

**Limitation:** a user with sufficient local privilege may restore both the policy file and protected state to an older consistent copy and evade local rollback detection. This is not claimed to be prevented. Missing, stale, contradictory, unauthenticated, or unreadable state fails closed. A caller-set `authenticated: true` field is not authentication; registry must verify the signed update against the previously trusted administrator key and the state source must be authenticated through its actual trust boundary.

Use a registry-controlled local UTC clock and in-process monotonic elapsed-time checks to prevent a backwards wall-clock adjustment from extending validity within a process. A manipulated clock across restarts remains a documented local trust limitation. Expired policy fails closed.

The external policy-administration workflow performs bootstrap, update verification, atomic durable bundle/state updates, rollback-anchor advancement, and local protection. These functions are outside M2 registry/resolver; M2 only reads and verifies them.

## 7. Local Git verification

The proposed `LocalGitObjectReader` adapter is the only M2 boundary that reads Git objects. It reads an exact pinned immutable local commit and its tree; it does not resolve branches, tags, or remote refs. It performs no fetch, checkout, remote/network operation, project write, or content execution.

Reject repositories using Git alternates, replace refs, unsupported object formats/layouts, or ambiguous object identity. Do not use hooks, filters, credential helpers, or user configuration. Bound output and enforce timeouts. Missing, corrupt, unsupported, or ambiguous objects make provenance unavailable and assets ineligible.

If a restricted Git CLI is used, invoke a fixed executable with argument arrays, no shell interpolation, sanitized environment/configuration, prompts/pagers disabled, optional locks disabled, and local object-read commands only. No Git binary or capability is assumed to exist. Windows tests must cover path/argument handling, ACL and junction behavior, containment, no writes, and no network calls.

## 8. Registry snapshot and freshness

Snapshots are ephemeral and immutable. Canonical content includes stable entries, normalized provenance, verification statuses, policy sequence/digest/expiry, and stable diagnostics. Operational timestamps, random IDs, duration, and local absolute paths are separate and excluded from canonical serialization and plans.

Snapshot handles and resolver views are opaque runtime-issued capabilities checked in a private registry issuance table; caller-forgeable `verified` or `authenticated` fields do not establish trust. Registry reads and authenticates current policy and protected state and checks freshness before issuing a resolver view.

Registry checks policy freshness both before and after the pure solve. If policy changes or expires during resolution, discard any computed result and return a stable failure; no successful plan may escape. A fixed canonical snapshot, policy state, request, context, algorithm version, and evaluation instant yield equivalent canonical plans and diagnostics. Different evaluation times may change eligibility.

No timestamps, random IDs, or local machine paths appear in canonical plan output, fingerprints, diagnostic messages, or ordering. Plan fingerprinting is not required for M2 acceptance.

## 9. Resolver algorithm

### Compatibility and eligibility

- Stable-only lifecycle eligibility by default. Non-stable statuses are not candidates.
- Empty `agents`, `stacks`, and `modes` lists mean unrestricted; non-empty lists are allowlists.
- Existing `capabilities` declarations are mandatory requirements; all must be available in the explicit target context.
- Missing/unknown target context is not unrestricted.
- Candidate versions are globally constrained across roots and required transitive dependencies. Select at most one version per ID by default.
- Prefer the highest compatible stable SemVer version. Prereleases are excluded by stable-only default.

### Required-first deterministic backtracking

Accumulate all root and required dependency ranges per ID. Use deterministic bounded backtracking rather than greedy selection. Choose the unresolved ID with the fewest candidates, tie-break by ordinal ID; try stable candidates in descending SemVer precedence, exact-version ties ordinal ascending. Propagate required dependencies and backtrack on unsatisfiable constraints or partial cycles. Do not fail on a cycle until alternatives are exhausted. A required assignment is valid only when complete and acyclic.

After the required solution is selected, freeze its assignments. Resolve optional edges in canonical order using isolated branch state. Optional solving cannot replace required versions or re-solve required choices. A failed optional branch is rolled back entirely and may be skipped with an explicit warning, even if a different required assignment could have admitted it. This is intentional deterministic behavior; it does not maximize optional dependencies.

Optional-only missing, incompatible, cyclic, transitive-failure, or trust-failure branches are skipped with warnings. If the same dependency is required through another path, it is required and failure to find an eligible trusted candidate blocks resolution.

Sort output dependency-first; among simultaneously ready nodes, order by ordinal `(asset id, version)`. Sort diagnostics by stable code and structured fields. Proposed initial limits are 100 roots, 500 IDs, 100 candidates per ID, 1,000 edges, and 10,000 search states; exact limits and implementation prereqs remain subject to confirmation. Limit exhaustion returns a blocking diagnostic, never a partial plan.

## 10. Proposed API boundaries

The following types are proposed, not existing exports. Exact filesystem and policy-provider interfaces remain implementation prerequisites.

```ts
type VerificationStatus =
  | "verified" | "failed" | "unknown" | "unavailable" | "not-checked";

interface TrustVerification {
  readonly manifestSyntax: VerificationStatus;
  readonly contentIntegrity: VerificationStatus;
  readonly provenance: VerificationStatus;
  readonly sourceAuthorization: VerificationStatus;
  readonly eligibility: "eligible" | "ineligible";
  readonly reasonCodes: readonly string[];
}

interface RegistryEntry {
  readonly key: string; // exact asset-id@version
  readonly asset: Readonly<Asset>;
  readonly source: Readonly<ProvenanceReference>;
  readonly manifestSha256: string;
  readonly contentTreeSha256: string;
  readonly trust: Readonly<TrustVerification>;
}

interface RegistryDiagnostic {
  readonly code: string;
  readonly severity: "error" | "warning";
  readonly assetId?: string;
  readonly version?: string;
  readonly repositoryId?: string;
  readonly safeRelativePath?: string;
  readonly detail?: Readonly<Record<string, string>>;
}

interface RegistrySnapshotHandle {
  readonly opaque: unique symbol;
}

interface FreshResolverView {
  readonly opaque: unique symbol;
}

interface RootRequest {
  readonly id: string;
  readonly versionRange: string;
}

interface ResolveContext {
  readonly agent: string;
  readonly stack: string;
  readonly mode: InstallMode;
  readonly availableCapabilities: readonly string[];
}

interface ResolveRequest {
  readonly roots: readonly RootRequest[];
  readonly context: ResolveContext;
}

interface ResolutionPlan {
  readonly planVersion: 1;
  readonly informationalOnly: true;
  readonly selected: readonly PlannedAsset[];
  readonly edges: readonly DependencyEdge[];
  readonly dependencyFirstOrder: readonly string[];
  readonly skippedOptional: readonly SkippedOptionalDependency[];
  readonly warnings: readonly ResolutionDiagnostic[];
}

type ResolutionResult =
  | { readonly ok: true; readonly plan: ResolutionPlan }
  | { readonly ok: false; readonly diagnostics: readonly ResolutionDiagnostic[] };
```

At runtime, symbols are private and handles are validated through registry-owned issuance state; these illustrative structural forms are not sufficient proof. Resolver exposes no filesystem, Git, network, or installation operations. Existing M1 core exports remain unchanged.

## 11. Proposed diagnostic taxonomy

Codes are proposed stable M2 codes, distinct from M1 manifest errors. Do not silently merge or rename them during implementation.

| Code | Trigger | Behavior |
| --- | --- | --- |
| `REGISTRY_INVALID_RECORD` | M1 parsing fails | Quarantine; blocks if needed by requested closure. |
| `REGISTRY_DUPLICATE_ID_VERSION` | More than one record claims exact key | Block key; no order-based winner. |
| `REGISTRY_UNSAFE_PATH` | Unsafe or escaping path | Reject record. |
| `REGISTRY_CASE_COLLISION` | Portable case-insensitive collision | Reject colliding records. |
| `REGISTRY_UNSAFE_NODE_TYPE` | Link, junction, reparse point, or special file | Reject without following. |
| `REGISTRY_SOURCE_CHANGED` | Source changes during indexing | Reject affected entry. |
| `INTEGRITY_MISMATCH` | Tree digest differs | Candidate ineligible; required use blocks. |
| `PROVENANCE_ATTESTATION_MISSING` | No valid authorized proof | Candidate ineligible. |
| `PROVENANCE_ATTESTATION_INVALID` | Malformed envelope/payload/encoding | Ignore for eligibility; safe diagnostic. |
| `PROVENANCE_SIGNATURE_INVALID` | Ed25519 verification fails | Ignore for eligibility; safe diagnostic. |
| `PROVENANCE_SIGNER_REVOKED` | Signer revoked/expired | Candidate ineligible. |
| `PROVENANCE_SOURCE_UNAUTHORIZED` | Repository or signer unauthorized | Candidate ineligible. |
| `PROVENANCE_CONFLICTING_ATTESTATIONS` | Valid authorized claims disagree | Candidate ineligible. |
| `PROVENANCE_BINDING_MISMATCH` | Revision/path/manifest/content does not match signed claims | Candidate ineligible. |
| `PROVENANCE_REVISION_UNAVAILABLE` | Pinned local object missing/corrupt/unsupported | Candidate ineligible. |
| `TRUST_POLICY_EXPIRED` | Policy outside 720-hour validity | Fail closed. |
| `TRUST_ROLLBACK_STATE_UNAVAILABLE` | State missing, stale, contradictory, or unauthenticated | Fail closed. |
| `REGISTRY_SNAPSHOT_POLICY_CHANGED` | Policy differs from snapshot | No successful plan. |
| `REGISTRY_SNAPSHOT_POLICY_EXPIRED` | Snapshot policy expired | No successful plan. |
| `ROOT_ASSET_MISSING` | No eligible root candidate | Blocking. |
| `REQUIRED_DEPENDENCY_MISSING` | No eligible required candidate | Blocking. |
| `VERSION_CONSTRAINT_CONFLICT` | Global range intersection unsatisfiable | Blocking. |
| `REQUIRED_DEPENDENCY_CYCLE` | All viable assignments cycle | Blocking. |
| `UNSUPPORTED_MANDATORY_CAPABILITY` | Required capability unavailable | Blocking. |
| `UNSUPPORTED_AGENT` | Target agent disallowed | Blocking for required candidate. |
| `UNSUPPORTED_STACK` | Target stack disallowed | Blocking for required candidate. |
| `UNSUPPORTED_MODE` | Target mode disallowed | Blocking for required candidate. |
| `OPTIONAL_NO_TRUSTED_CANDIDATE` | Optional-only dependency has no trusted eligible candidate | Skip with warning. |
| `OPTIONAL_REQUIRED_RANGE_MISMATCH` | Optional range conflicts with frozen required version | Skip optional edge with warning. |
| `OPTIONAL_BRANCH_UNSATISFIABLE` | Optional branch fails, cycles, or conflicts | Roll back branch; warn. |
| `RESOLUTION_SEARCH_LIMIT_EXCEEDED` | Deterministic search bound reached | Blocking; no partial result. |

Installer overwrite/ownership conflicts belong to M3, not M2.

## 12. M2 acceptance matrix — NOT EXECUTED

Every row is an approved acceptance requirement or a proposed test mapping; **all M2 tests are NOT EXECUTED**.

| Case | Required behavior | Evidence / status |
| --- | --- | --- |
| Invalid registry records | Quarantine; requested invalid record blocks | Unit/integration — **NOT EXECUTED** |
| Duplicate `(id, version)` | Stable blocking diagnostic, independent of enumeration order | Integration — **NOT EXECUTED** |
| Missing roots / required dependencies | Blocking diagnostics with dependency chain | Unit — **NOT EXECUTED** |
| Unsatisfiable SemVer constraints | Global conflict identified; no partial plan | Unit — **NOT EXECUTED** |
| Avoidable cycle | Backtrack to valid acyclic assignment | Graph fixture — **NOT EXECUTED** |
| Unavoidable cycle | Stable canonical cycle failure | Unit — **NOT EXECUTED** |
| Unsupported mandatory capability | Required resolution blocks | Unit — **NOT EXECUTED** |
| Agent/stack/mode incompatibility | Required candidate cannot be selected | Unit — **NOT EXECUTED** |
| Integrity mismatch | Entry ineligible | Unit/integration — **NOT EXECUTED** |
| Missing/invalid attestation | No unverified entry becomes eligible | Security/integration — **NOT EXECUTED** |
| Conflicting authorized attestations | Reject conflicting substantive claims | Security — **NOT EXECUTED** |
| Revoked/unauthorized attestation | Candidate ineligible; safe diagnostic | Security — **NOT EXECUTED** |
| Optional-only trust failure | Skip with warning; unrelated records do not block | Resolver integration — **NOT EXECUTED** |
| Required trust failure | Required closure blocks | Resolver integration — **NOT EXECUTED** |
| Required/optional overlap | In a fixture where a different required version could satisfy the optional edge, retain the already selected required assignment; optional resolution must not mutate it and skips an incompatible edge | Regression test — **NOT EXECUTED** |
| Unsafe paths, links, junctions, special files | Reject without traversal | Security, including Windows — **NOT EXECUTED** |
| Git object corrupt/unavailable | Provenance unavailable; fail closed | Integration — **NOT EXECUTED** |
| Source mutation | No verified inconsistent entry | Race/integration — **NOT EXECUTED** |
| Policy expiration/change | No successful stale-snapshot plan | Fixed-clock integration — **NOT EXECUTED** |
| Rollback-state inconsistency | Fail closed | Policy security test — **NOT EXECUTED** |
| Search limit exhaustion | Stable failure, no partial plan | Resolver unit — **NOT EXECUTED** |
| Input-order independence | Canonical snapshots, plans, and diagnostics equivalent | Determinism suite — **NOT EXECUTED** |
| Offline/read-only guarantee | No network, writes, deletes, renames, or content execution | Instrumented integration/security — **NOT EXECUTED** |

No test count, golden digest, or pass result is claimed.

## 13. Remaining implementation prerequisites

Approved architecture direction does not resolve every exact implementation value. Confirm before M2.2:

- Directory-record encoding, empty-directory treatment, and ordering in the tree hash: **Requires confirmation before M2.2 implementation**.
- Exact attestation lookup tuple domain separator and filesystem naming convention.
- Canonical policy JSON encoding: RFC 8785 is recommended but has not been explicitly approved.
- Exact initial traversal and resolver limits. Earlier proposed values were depth 16, 10,000 entries, 1 MiB manifest, 16 MiB per file, 256 MiB per asset, 240-byte path; resolver 100 roots, 500 IDs, 100 candidates/ID, 1,000 edges, 10,000 states. Treat these as proposed until explicitly confirmed.
- Final diagnostic-code mapping and API visibility.
- Supported Git CLI versions/platforms and Windows test environment; no binary is assumed present.
- Protected-state storage adapter and its privileged-restoration limitation. Standard local protected state is approved; hardware-backed storage is not mandatory.
- Independent generation and checking of golden digest values.

Deferred: CLI integration, installer/project writes, remote marketplace, network refresh, persistent cache, plan fingerprints, agent adapters, and external policy-administration tooling. Policy administration is an external workflow and is not part of registry/resolver implementation.

## 14. Implementation checkpoints

| Checkpoint | Scope and proposed files | Acceptance gate |
| --- | --- | --- |
| M2.1 — Architecture & Decision Baseline | This document and targeted status/decision records | Architecture approved; documentation closure validated. |
| M2.2 — Registry, Integrity & Provenance | Proposed `packages/registry/**`; registry fixtures/unit/integration/security tests | Exact hash and trust prerequisites confirmed; only fully verified entries eligible. |
| M2.3 — Dependency & Compatibility Resolver | Proposed `packages/resolver/**`; resolver fixtures and unit tests | Global deterministic constraints, cycle backtracking, compatibility, and bounds. |
| M2.4 — Plans & Diagnostics | Plan, optional-branch, and diagnostic modules/tests | Stable explainable plan; no partial success; optional rollback behavior verified. |
| M2.5 — Acceptance Testing | Full unit/integration/security matrix and authorized status records | Every approved mandatory case has observed evidence; no M2 test is treated as passed before execution. |

Every implementation checkpoint requires its own authorization. M2.2 is not authorized.
