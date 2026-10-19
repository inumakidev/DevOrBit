# DevOrbit — Registry & Resolver Architecture (M2.1 / M2.2 Approved Design Baseline)

## 1. Status and scope

**Architecture status:** Approved by the user.  
**M2.1 documentation closure:** Complete.  
**M2.2 design freeze:** Approved; seven exact-parameter groups and Clarification Amendments v1.0–v1.3 (ADR-021–ADR-024) are synchronized; final user acceptance is pending.  
**Implementation status:** No M2.2 registry implementation is claimed.  
**Tests:** No M2.2 tests have been executed.  
**M2.2 implementation:** Not authorized.  
**M2.3–M2.5:** Not started.  
**CLI integration:** Deferred.

This document is the canonical Markdown reference for the approved M2.1 architecture and M2.2 design freeze. Approved design is not implementation evidence. Proposed APIs and diagnostics are design contracts, not existing exports or verified behavior. Windows/Git/OS security capabilities remain unverified until implementation-time validation.

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

### Approved file-only format

The approved `devorbit-asset-tree-v1` algorithm hashes regular files only using SHA-256. Directory records are not included; empty directories, including the `content/` root, do not affect the digest. This supersedes earlier directory-record proposals.

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
- Directories contribute no records. Exact relative file paths and bytes determine the tree digest.
- Compute SHA-256 over the exact stream; render lowercase hex and compare byte-for-byte with M1 `integrity.digest`. A mismatch makes the record ineligible.

### Test vectors

Required input vectors include:

1. `hello.txt` with bytes `48 65 6c 6c 6f 0a`.
2. `empty.bin` with zero bytes.
3. `a.bin` with `00 ff` and `z.txt` with `41`, discovered in reverse input order.
4. Mutated content with the original declared digest (must mismatch).
5. Changed manifest bytes with unchanged `content/` (tree digest remains unchanged; attestation manifest digest changes).

Expected hash values have not been generated or verified. Before use, generate vectors with independent implementations, compare results, and pin reviewed values. No digest or test result is claimed here.

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

Read attestations only from an explicitly configured local read-only store, outside the referenced Git commit.

The approved lookup framing is:

```text
ASCII("DEVORBIT-ATTESTATION-LOOKUP\0v1\0")
For each field, in order:
  uint32 big-endian UTF-8 byte length
  UTF-8 bytes
1. normalized repositoryId
2. exact pinned revision
3. validated assetPath
```

`lookupId` is lowercase hexadecimal SHA-256 of the complete framed tuple. Normalize repository ID to lowercase ASCII `owner/repository` after validation; do not trim or repair invalid values. Revision is exactly 40 lowercase hexadecimal characters. Preserve validated portable ASCII asset-path case and bytes; do not Unicode-normalize or lowercase it.

Attestations are stored content-addressably outside the pinned Git commit:

```text
attestations/v1/<first2>/<lookupId>/<envelopeSha256>.json
```

`first2` is the first two lowercase hexadecimal characters of `lookupId`. `lookupId` is lowercase hexadecimal SHA-256 of the exact lookup byte stream shown above, including its domain separator and the three ordered uint32-big-endian-length-prefixed UTF-8 fields. `envelopeSha256` is lowercase hexadecimal SHA-256 of the exact stored envelope bytes (not parsed or reserialized JSON). Verify both computed values against the path; a filename alone is not proof.

Use raw 32-byte Ed25519 public keys. `keyId` is `sha256:` followed by lowercase hex SHA-256 of those raw bytes. Encode signatures as canonical unpadded base64url; require exactly 64 decoded bytes and decode/re-encode equality. Strict envelope parsing rejects invalid UTF-8, BOM, duplicate keys, unknown fields, invalid types, and malformed encodings. JSON serialization order/whitespace is not signed; the specified binary payload framing is.

- Accept multiple valid, authorized attestations when substantive claims agree.
- Compare repository ID, revision, path, asset ID/version, manifest digest, content algorithm, and content digest. Exclude signer-specific `signerKeyId` from substantive comparison, but verify and authorize every signer independently.
- Invalid, unauthorized, or revoked individual attestations generate per-attestation warnings and cannot override a valid authorized claim.
- One valid authorized attestation plus any invalid/revoked attestations leaves the asset eligible if all other checks pass; retain the warnings.
- Multiple valid matching authorized attestations are accepted.
- Conflicting valid authorized substantive claims generate blocking `PROVENANCE_CONFLICTING_ATTESTATIONS` and make the asset ineligible.
- If no valid authorized attestation remains, generate blocking `PROVENANCE_ATTESTATION_MISSING`; per-attestation warnings may also be retained.
- For each asset-version lookup, allow at most 256 detached attestation envelopes, count exact raw envelope bytes (including invalid envelopes) before cryptographic validation, and allow at most 64 KiB per envelope and 16 MiB aggregate raw envelope bytes. All three caps are inclusive; exceeding any cap fails closed under the registry resource-limit rules.
- Sort diagnostics using the canonical comparator in §8. Never include absolute paths, raw attacker-controlled JSON, signatures, secrets, or timestamps.

## 6. Trust-policy administration

### Policy and update protocol

The approved policy format is strict UTF-8 JSON canonicalized with RFC 8785 JCS. Reject BOM, malformed UTF-8, duplicate keys, unknown fields, invalid types, and unsupported formats before canonicalization. `policyDigest` is SHA-256 of canonical UTF-8 policy bytes, encoded as 64 lowercase hexadecimal characters.

The required policy JSON structure is:

```json
{
  "format": "devorbit-trust-policy-v1",
  "sequence": 1,
  "issuedAt": "2026-01-01T00:00:00.000Z",
  "expiresAt": "2026-01-31T00:00:00.000Z",
  "administrator": {
    "keyId": "sha256:<64 lowercase hex>",
    "publicKey": "<canonical unpadded base64url of 32 raw bytes>"
  },
  "nextAdministrator": null,
  "repositories": ["owner/repository"],
  "authorizedSigners": [{
    "keyId": "sha256:<64 lowercase hex>",
    "publicKey": "<canonical unpadded base64url of 32 raw bytes>",
    "repositoryIds": ["owner/repository"],
    "validFrom": "2026-01-01T00:00:00.000Z",
    "expiresAt": "2026-01-31T00:00:00.000Z"
  }],
  "revocations": {
    "signerKeyIds": [],
    "repositoryIds": []
  }
}
```

Every listed top-level and nested property is required, including nullable `nextAdministrator`; reject additional properties at every object level.

| Object | Field | Required type and constraint |
| --- | --- | --- |
| Policy | `format` | String exactly `devorbit-trust-policy-v1`. |
| Policy | `sequence` | Positive integer, maximum `2^53-1`. |
| Policy | `issuedAt`, `expiresAt` | Timestamp strings in the exact UTC form below. |
| Policy | `administrator` | Object containing required string fields `keyId` and `publicKey`. |
| Policy | `nextAdministrator` | Required nullable field; null or object with the same required string fields as `administrator`. |
| Policy | `repositories` | Required array of repository-ID strings. |
| Policy | `authorizedSigners` | Required array of signer objects. |
| Signer | `keyId`, `publicKey` | Required strings with the key constraints below. |
| Signer | `repositoryIds` | Required array of repository-ID strings. |
| Signer | `validFrom`, `expiresAt` | Required timestamp strings in the exact UTC form below. |
| Policy | `revocations` | Object containing required `signerKeyIds` and `repositoryIds` arrays of strings. |

`format` is exactly `devorbit-trust-policy-v1`. `sequence` is an integer in `1..2^53-1`. Timestamps use exactly `YYYY-MM-DDTHH:mm:ss.sssZ`, are valid Gregorian UTC values, and have no offsets or leap seconds. `expiresAt` is exactly 720 hours after `issuedAt`; policy validity is half-open, `issuedAt <= evaluationTime < expiresAt`. Each signer's repository IDs must be a subset of `repositories`, and its validity interval must fall within the policy validity interval. Repository IDs are normalized lowercase ASCII `owner/repository`; reject invalid values rather than trimming or repairing them.

All string arrays are unique and sorted by ordinal ASCII comparison, including `repositories`, each signer's `repositoryIds`, and both revocation arrays. Sort the `authorizedSigners` array in ascending ordinal ASCII order by each object's `keyId`; reject duplicate `keyId` values. Ed25519 public keys are raw 32-byte values encoded as canonical unpadded base64url; decoding then re-encoding must reproduce the input. `keyId` is `sha256:` followed by lowercase hexadecimal SHA-256 of the 32 raw public-key bytes, and must match the supplied key. A revoked signer or repository cannot authorize an asset, even if an attestation claims an earlier signing time.

Strict policy parsing decodes UTF-8 without BOM and rejects malformed UTF-8, duplicate keys, unknown properties, invalid types/values, unsupported format versions, unsorted or duplicate array members, invalid key encodings, and key-ID/fingerprint mismatches before RFC 8785 JCS canonicalization. `policyDigest` is lowercase hexadecimal SHA-256 of the canonical UTF-8 policy bytes.

The required signed-update envelope structure is:

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

All envelope fields are required and additional properties are rejected. `format` is exactly `devorbit-trust-policy-update-v1`; `sequence` is a positive integer equal to `policy.sequence`; `previousPolicyDigest` is null only for separately authenticated bootstrap and otherwise is 64 lowercase hexadecimal characters; `policy` is the complete policy object above; `policyDigest` and `signerKeyId` are lowercase hexadecimal digests/key IDs of the forms specified here; and `signature` is canonical unpadded base64url encoding of exactly 64 bytes. Reject malformed UTF-8, BOM, duplicate/unknown fields, wrong types, noncanonical encodings, and invalid values. `policyDigest` is SHA-256 of RFC 8785 canonical policy bytes.

Signed update bytes:

```text
ASCII("DEVORBIT-TRUST-POLICY-UPDATE\0v1\0")
uint64 big-endian sequence
32 raw bytes previousPolicyDigest
  (all-zero bytes only for separately authenticated bootstrap)
32 raw bytes policyDigest
32 raw bytes administrator key fingerprint
```

The update signer must be the administrator key in the immediately preceding authenticated policy. For non-bootstrap updates, sequence is exactly the previous sequence plus one and `previousPolicyDigest` equals the preceding policy digest. Bootstrap alone uses the separately authenticated bootstrap rule above; its null JSON previous digest is represented by 32 zero bytes in the signed framing.

### Bootstrap, rotation, and revocation

- Bootstrap requires manual independent verification of the initial administrator public-key fingerprint. No trust-on-first-use.
- Policy N+1 is signed by Policy N's `administrator`. If Policy N nominates `nextAdministrator`, Policy N+1 must set its `administrator` to exactly that key (key ID and public key); otherwise Policy N+1 must retain the same administrator. The successor cannot sign its own promotion. Policy N+1 may nominate a later successor or set `nextAdministrator` to null.
- Recovery after loss/compromise of the sole administrator key requires explicit out-of-band rebootstrap; no in-band recovery key is assumed.
- Administrator enrolls asset signers after independent fingerprint verification and explicitly authorizes signer-to-repository relationships.
- Signer rotation enrolls and verifies the replacement before revoking the old key. Revoked signers are rejected; signed-time claims do not grandfather them.
- Repository revocation is an authenticated policy update and makes its assets ineligible.

### 720-hour expiry and protected-state assurance

Policy lifetime is exactly **720 hours**, with `expiresAt = issuedAt + 720 hours`; no grace period. Policy is valid iff `issuedAt <= evaluationTime < expiresAt`. Signer validity uses the same half-open interval; revocation makes the signer ineligible.

The approved state record is domain-separated binary data:

```text
ASCII("DEVORBIT-POLICY-HIGH-WATER\0v1\0")
uint32 big-endian recordVersion (= 1)
uint64 big-endian highWaterSequence
32 raw bytes highWaterPolicyDigest
uint16 big-endian keyIdByteLength
ASCII keyId bytes ("hmac-sha256:" + lowercase hex key identifier)
32 raw bytes HMAC-SHA-256 authenticator
```

The HMAC covers every preceding byte, including the domain separator and key identifier. The registry parses the record and verifies the authenticator through the trusted provider boundary, then verifies the full signed policy-update chain from the independently provisioned bootstrap anchor. The chain tip's sequence and digest must exactly equal the authenticated high-water values. A caller-supplied authentication flag is not proof.

The minimal read-only provider contract is:

```ts
interface PolicyStateProvider {
  readRecord(): Promise<Uint8Array>;
  verifyRecordAuthenticator(
    keyId: string,
    authenticatedBytes: Uint8Array,
    tag: Uint8Array,
  ): Promise<boolean>;
}
```

The provider must use a protected key selected through trusted host configuration, not a key selected solely by untrusted record contents. The bootstrap public key and independently verified fingerprint are provisioned separately through a trusted host boundary; the registry recomputes and checks the fingerprint. The external policy-administration component alone may advance durable policy and high-water state. Full policy-chain retrieval is required, but its adapter interface is not frozen here.

Treat policy and high-water state as one logical generation. Missing, malformed, unauthenticated, stale, contradictory, tampered, incomplete, or crash-inconsistent state fails closed; the registry neither repairs nor chooses one side. Recovery after loss or compromise of the administrator key requires explicit out-of-band rebootstrap and fresh independent fingerprint verification. Policy administration and durable writes remain outside M2.2.

The approved assurance is **standard local protected state**, not mandatory hardware-backed rollback-resistant storage. Windows key protection, ACLs, provider integrity, and crash-consistency behavior require implementation-time validation; they are not asserted as verified capabilities.

**Limitation:** a user with sufficient local privilege may restore both the policy file and protected state to an older consistent copy and evade local rollback detection. This is not claimed to be prevented.

Use a registry-controlled local UTC clock and in-process monotonic elapsed-time checks to prevent a backwards wall-clock adjustment from extending validity within a process. A manipulated clock across restarts remains a documented local trust limitation. Expired policy fails closed.

The external policy-administration workflow performs bootstrap, update verification, durable bundle/state updates, rollback-anchor advancement, and local protection. These functions are outside M2 registry/resolver; M2 only reads and verifies them.

## 7. Local Git verification

The proposed `LocalGitObjectReader` adapter is the only M2 boundary that reads Git objects. It reads objects reachable by exact pinned full object IDs from an immutable local repository; it does not resolve branches, tags, or remote refs. It performs no fetch, checkout, remote/network operation, project write, or content execution.

### Restricted Git process contract

- Configure an explicit validated absolute path to `git.exe`; never search `PATH` for the executable. Validate the executable path and fail closed if unsupported or unavailable.
- Launch with fixed argument arrays and no shell. Clear/inert `GIT_*` environment overrides, disable prompts, pagers, system/global configuration and optional locks, and use an isolated configuration. Do not inherit credential helpers, filters, hooks, or arbitrary environment configuration.
- Probe the repository storage format using `git rev-parse --show-object-format=storage`; accept only `sha1`, reject SHA-256 repositories. Do not infer format from OID length alone.
- Read exactly one validated pinned full 40-character lowercase hexadecimal OID per `git cat-file --batch` invocation. Do not accept abbreviated IDs, revision expressions, refs, or multiple input IDs.
- Verify framing exactly: one `<full-oid> <type> <decimal-size>\n` header, exactly the declared payload bytes, one LF terminator, then EOF. Reject malformed headers, wrong IDs/types, extra output, truncation, overflow, or unexpected stderr.
- Recompute object identity over raw bytes as SHA-1 of `type + " " + decimal-byte-length + NUL + payload`; require equality to the requested full OID before parsing.
- Enforce the approved per-object, aggregate, stderr, timeout, and concurrency caps in the resource table below. Kill the process tree on timeout or cancellation; this behavior itself requires Windows validation.
- Reject Git alternates and replace-object mechanisms. Reads must remain local and object-ID-pinned; no network, lazy fetch, refs, checkout, worktree mutation, writes, hooks, filters, credentials, or content execution are permitted.
- Unsupported environment, configuration, object format, process behavior, or repository layout fails closed. No specific Windows or Git version is claimed to have been validated.

`LocalGitObjectReader` is a design boundary; its implementation and Windows security properties are not verified.

### Commit and tree parsing

Verify raw commit object identity before parsing. Preserve exact Git object bytes. A commit requires exactly one `tree`, one `author`, and one `committer` header, and zero or more syntactically valid `parent` headers. Header lines are LF-terminated; continuation lines begin with a single space and attach to the immediately preceding header. Reject orphan continuations, malformed required headers, duplicate required headers, invalid framing, and truncated objects.

Accept well-formed unknown optional headers as opaque bytes. Do not impose unnecessary header ordering rules or encoding allowlists. Treat the commit message as opaque bytes; do not decode or normalize it.

Parse tree payloads as raw Git entries: `<mode> SP <name> NUL <raw-object-id>`, with the OID width required by the accepted SHA-1 format. Accept only directory mode `40000`, regular non-executable file mode `100644`, and executable file mode `100755`. Reject symlink, submodule, and other modes. Require Git's bytewise tree ordering, including the directory-as-trailing-slash comparison rule, and reject duplicate names, case-insensitive portable-path collisions, malformed names, unsafe paths, and file/directory collisions. Preserve exact object bytes and verify each object's identity before interpreting it.

### Pinned asset binding

The required verification chain is:

```text
pinned Git commit
  -> verified commit tree
  -> selected asset directory
  -> manifest identity and provenance
  -> approved file-only content digest
  -> authorized detached attestation
  -> local selected version-directory comparison
```

The manifest's asset ID/version and provenance must bind to the selected directory and pinned repository/revision. The manifest digest and computed content digest must match the authorized detached attestation. Compare only the selected local version directory with the verified pinned tree; require exact manifest/content file equality. Reject missing, extra, mismatched, unsafe, or mutated local content. Local files never override verified Git object bytes; the pinned Git objects are the source of truth. No unrelated repository working-tree content is compared.

## 8. Registry snapshot and freshness

Snapshots are ephemeral and immutable. Canonical content includes stable entries, normalized provenance, verification statuses, policy sequence/digest/expiry, and stable diagnostics. Serialize the snapshot with RFC 8785 JCS; canonical snapshot byte accounting is the UTF-8 byte length of the complete canonical snapshot. Operational timestamps, random IDs, duration, local absolute paths, and content blobs are excluded from canonical bytes and plans.

Snapshot handles and resolver views are opaque runtime-issued capabilities checked in a private registry issuance table; caller-forgeable `verified` or `authenticated` fields do not establish trust. Registry reads and authenticates current policy and protected state and checks freshness before issuing a resolver view.

Registry checks policy freshness both before and after the pure solve. If policy changes or expires during resolution, discard any computed result and return a stable failure; no successful plan may escape. A fixed canonical snapshot, policy state, request, context, algorithm version, and evaluation instant yield equivalent canonical plans and diagnostics. Different evaluation times may change eligibility.

No timestamps, random IDs, or local machine paths appear in canonical plan output, fingerprints, diagnostic messages, or ordering. Plan fingerprinting is not required for M2 acceptance. On any fatal parse, verification, freshness, or resource-limit failure, issue no partial trusted snapshot or successful plan.

### Approved resource limits

Limits are inclusive at the stated boundary; reject only when the limit is exceeded. Detect arithmetic overflow before allocation or accumulation and fail closed. Exactly 16 MiB object blobs remain valid payloads; protocol framing bytes are accounted separately.

| Resource | Approved limit |
| --- | ---: |
| Manifest bytes, per manifest | 1 MiB |
| File/content blob bytes, per file | 16 MiB |
| Total content bytes, per asset | 256 MiB |
| Content-tree depth | 16 |
| Content-tree entries | 10,000 |
| Portable relative path length | 240 bytes |
| Detached attestation envelopes | 256 per asset-version lookup; count before cryptographic validation |
| Raw attestation envelope bytes, per envelope | 64 KiB; count exact raw bytes before cryptographic validation, including invalid envelopes |
| Raw attestation envelope bytes, aggregate | 16 MiB per asset-version lookup; count exact raw bytes before cryptographic validation, including invalid envelopes |
| Raw manifest bytes, aggregate per discovery | 64 MiB |
| Registry snapshot records | 10,000 |
| Canonical snapshot bytes | 64 MiB |
| Diagnostics | 5,000 |
| Git commit object payload | 1 MiB |
| Git tree object payload | 16 MiB |
| Git blob object payload | 16 MiB |
| Git tree payload bytes, aggregate per revision | 64 MiB |
| Git response header | 128 bytes |
| Git stdout, per response | Object payload cap plus 129 bytes (16 MiB + 129 bytes maximum) |
| Git stderr, per process | 64 KiB |
| Git process timeout | 10 seconds |
| Concurrent Git object reads | 4 |
| Concurrent discovery operations | 4 |

The M2.3 resolver limits formerly shown as proposals are outside this M2.2 frozen limit table and remain subject to their own approved implementation design.

Every cap is inclusive; reject only values above the cap. Git response framing bytes are accounted separately from object payload, so a blob exactly at its payload limit remains acceptable. Bound stdout to the maximum object payload cap plus 129 bytes for framing. Enforce per-item and aggregate caps with checked arithmetic before allocation or accumulation; overflow fails closed.

### Diagnostics and truncation

Keep `REGISTRY_*`, `PROVENANCE_*`, and `TRUST_*` diagnostic namespaces distinct from `INTEGRITY_MISMATCH` and unchanged M1 manifest errors. An invalid individual attestation is a per-attestation warning; valid authorized matching evidence keeps eligibility. No valid authorized attestation, a conflicting valid authorized claim, or any other failed binding makes the asset ineligible. Registry-wide trust, parse, state, freshness, or fatal resource-limit failures fail closed.

Diagnostics contain stable codes and safe structured fields only. Use exactly this canonical comparator for diagnostic ordering and truncation selection: `(code, severity, assetId, assetVersion, path, message)`. These are logical comparator field names. For the proposed `RegistryDiagnostic` properties in §10, the mapping is `code` → `code`, `severity` → `severity`, `assetId` → `assetId`, `assetVersion` → `version`, `path` → `safeRelativePath`, and `message` → `detail`; this mapping does not rename API properties. Compare the first five logical fields (`code`, `severity`, `assetId`, `assetVersion`, and `path`) using ordinal string comparison, representing absent optional fields as empty strings. The sixth logical field, `message`, maps to the existing `RegistryDiagnostic.detail` property. If `detail` is present, canonicalize it using RFC 8785 JSON Canonicalization Scheme (JCS), following JCS property-ordering and JSON string-serialization requirements, encode the canonical JSON as UTF-8, and compare the resulting bytes lexicographically as unsigned bytes. For absent `detail`, use the empty string as its comparison value; a present empty object canonicalizes to `{}`. Reject invalid JCS inputs according to the canonicalization requirements; do not use fallback serialization or rely on JavaScript object insertion order. These field-specific comparison rules together define one comparator. When more than 5,000 diagnostics would be emitted, use this same comparator both to sort diagnostics and to retain the lexicographically smallest 4,999 diagnostics, then append the fatal `REGISTRY_DIAGNOSTICS_TRUNCATED` marker, for at most 5,000 total. Truncation is fatal to snapshot issuance; do not issue a partial trusted snapshot.

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

Sort output dependency-first; among simultaneously ready nodes, order by ordinal `(asset id, version)`. Sort diagnostics using the canonical comparator in §8. Proposed initial limits are 100 roots, 500 IDs, 100 candidates per ID, 1,000 edges, and 10,000 search states; exact limits and implementation prereqs remain subject to confirmation. Limit exhaustion returns a blocking diagnostic, never a partial plan.

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

## 11. Approved M2 diagnostic taxonomy

The following M2 codes are stable design contracts, distinct from M1 manifest errors. Do not silently merge or rename them during implementation.

| Code | Trigger | Behavior |
| --- | --- | --- |
| `REGISTRY_INVALID_RECORD` | M1 parsing fails | Quarantine; blocks if needed by requested closure. |
| `REGISTRY_DUPLICATE_ID_VERSION` | More than one record claims exact key | Block key; no order-based winner. |
| `REGISTRY_UNSAFE_PATH` | Unsafe or escaping path | Reject record. |
| `REGISTRY_CASE_COLLISION` | Portable case-insensitive collision | Reject colliding records. |
| `REGISTRY_UNSAFE_NODE_TYPE` | Link, junction, reparse point, or special file | Reject without following. |
| `REGISTRY_SOURCE_CHANGED` | Source changes during indexing | Reject affected entry. |
| `INTEGRITY_MISMATCH` | Tree digest differs | Candidate ineligible; required use blocks. |
| `PROVENANCE_ATTESTATION_MISSING` | No valid authorized proof remains | Blocking for asset eligibility. |
| `PROVENANCE_ATTESTATION_INVALID` | Malformed envelope/payload/encoding | Per-attestation warning; does not override a valid authorized attestation. |
| `PROVENANCE_SIGNATURE_INVALID` | Ed25519 verification fails | Per-attestation warning; does not override a valid authorized attestation. |
| `PROVENANCE_SIGNER_REVOKED` | Signer revoked/expired | Per-attestation warning; no valid authorized claim means missing-attestation block. |
| `PROVENANCE_SOURCE_UNAUTHORIZED` | Repository or signer unauthorized | Per-attestation warning; no valid authorized claim means missing-attestation block. |
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

This taxonomy supplements M1 errors and does not alter their names, issue shapes, or behavior. All diagnostic ordering, safe-field, count/byte-cap, and truncation rules above apply.

## 12. M2 acceptance matrix — NOT EXECUTED

Every row is an approved acceptance requirement or a proposed test mapping; **all M2 tests are NOT EXECUTED**.

| Case | Required behavior | Evidence / status |
| --- | --- | --- |
| File-only content-tree vectors | Exact framing, bytewise path order, empty files included, empty directories and manifest excluded | Independent raw-byte vector suite — **NOT EXECUTED** |
| Attestation framing and eligibility | Nine signed fields and three lookup fields use exact framing; invalid per-attestation warnings do not displace one valid authorized claim; conflicting valid claims block | Security/vector suite — **NOT EXECUTED** |
| Strict policy parsing and canonicalization | Reject duplicate/unknown fields and malformed UTF-8; RFC 8785 bytes, digest, timestamp grammar, interval, and 720-hour lifetime match the freeze | Policy/vector suite — **NOT EXECUTED** |
| Policy chain, bootstrap, and rotation | Independently verified bootstrap; contiguous sequence/digest chain; administrator N+1 signing and successor promotion rules enforced | Policy security suite — **NOT EXECUTED** |
| Protected high-water record | Exact binary framing and HMAC coverage; provider authentication, full-chain tip comparison, incomplete-generation fail-closed behavior | Policy security suite — **NOT EXECUTED** |
| Git executable and batch framing | Explicit validated absolute executable; SHA-1-only probe; one pinned OID; exact framing, identity recomputation, and prohibited operations rejected | Instrumented Git integration — **NOT EXECUTED** |
| Commit/tree parsing | Raw bytes verified before parsing; required commit headers/continuations, opaque optional headers/message, allowed modes/order/collision rules enforced | Git object fixtures — **NOT EXECUTED** |
| Pinned-to-local asset binding | Full pinned commit-to-attestation chain; selected local version directory matches exactly; missing, extra, unsafe, or mutated content rejected | Provenance integration — **NOT EXECUTED** |
| Inclusive resource boundaries | Each approved limit accepts exactly the inclusive maximum and fails closed on overflow or one-over-limit input | Boundary/property suite — **NOT EXECUTED** |
| Snapshot accounting and freshness | Canonical JCS UTF-8 byte accounting; operational metadata excluded; pre/post-solve freshness; fatal failures issue no partial snapshot | Snapshot integration — **NOT EXECUTED** |
| Deterministic diagnostic caps | Stable taxonomy, severity/eligibility, ordering, safe fields, truncation, and fatal cap behavior | Diagnostics suite — **NOT EXECUTED** |
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

## 13. Independent vectors and implementation-time security gates

The approved test-vector process requires fixed raw-byte and hexadecimal fixtures, independently implemented generator and verifier, and manual byte-level review. Include positive and negative cases for framing, ordering, empty files, unsafe paths, digest changes, canonical JSON, attestations, policy chains, protected-state records, Git object identity/framing/parsing, and resource boundaries. Publish no fabricated digest outputs. No M2.2 tests or vectors are claimed as executed.

Approved design requirements are not verified implementation guarantees. The following require explicit implementation-time validation, including Windows-specific evidence:

- ACL enforcement and OS-protected key behavior; provider/key integrity.
- Reparse-point handling, executable substitution defenses, and path containment.
- Git configuration isolation and actual absence of network access and repository writes.
- Process timeout behavior and process-tree termination.
- Source mutation detection, filesystem race handling, and consistency between verified objects and local selected content.
- Supported Windows/Git compatibility baseline and exact executable validation.
- Crash consistency and fail-closed behavior under interrupted policy-state updates.

Do not claim any of these guarantees as verified until evidence is recorded. Privileged restoration of both policy and protected state remains an explicit rollback limitation.

Deferred: CLI integration, installer/project writes, remote marketplace, network refresh, persistent cache, plan fingerprints, agent adapters, and external policy-administration tooling. Policy administration is an external workflow and is not part of registry/resolver implementation.

## 14. Implementation checkpoints

| Checkpoint | Scope and proposed files | Acceptance gate |
| --- | --- | --- |
| M2.1 — Architecture & Decision Baseline | This document and targeted status/decision records | Architecture approved; documentation closure validated. |
| M2.2 — Registry, Integrity & Provenance | Proposed `packages/registry/**`; registry fixtures/unit/integration/security tests | Design freeze approved; implementation requires a separate authorization; only fully verified entries eligible. |
| M2.3 — Dependency & Compatibility Resolver | Proposed `packages/resolver/**`; resolver fixtures and unit tests | Not started; global deterministic constraints, cycle backtracking, compatibility, and bounds. |
| M2.4 — Plans & Diagnostics | Plan, optional-branch, and diagnostic modules/tests | Stable explainable plan; no partial success; optional rollback behavior verified. |
| M2.5 — Acceptance Testing | Full unit/integration/security matrix and authorized status records | Every approved mandatory case has observed evidence; no M2 test is treated as passed before execution. |

Every implementation checkpoint requires its own authorization. M2.2 design is approved; specification synchronization is complete, including the seven exact-parameter groups and Clarification Amendments v1.0–v1.3 (ADR-021–ADR-024); final user acceptance remains pending. M2.2 implementation is NOT AUTHORIZED. M2.3 is NOT STARTED; M2.2 tests are NOT EXECUTED.
