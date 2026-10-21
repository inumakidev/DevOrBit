git diff --checkimport { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  canonicalizeJcs,
  type JcsResourceBudget,
} from "../../../../packages/registry/src/provenance/jcs.js";
import {
  parseTrustPolicy,
  TrustPolicyError,
  TrustPolicyFailureReason,
} from "../../../../packages/registry/src/provenance/trust-policy.js";

interface PolicyVector {
  readonly name: string;
  readonly policy: unknown;
  readonly canonicalPolicy: string;
  readonly policyDigest: string;
}

const vectors = JSON.parse(
  readFileSync(
    resolve(process.cwd(), "tests/fixtures/registry/trust-policy-vectors.json"),
    "utf8",
  ),
) as { readonly vectors: readonly PolicyVector[] };

const minimumVector = vectors.vectors.find(
  ({ name }) => name === "minimum-policy",
);
const signerVector = vectors.vectors.find(
  ({ name }) => name === "policy-with-successor-and-signer",
);
if (minimumVector === undefined || signerVector === undefined) {
  throw new Error("Required trust-policy digest vectors are missing.");
}

const maxPolicyBytes = 1_048_576;
const maxCollectionEntries = 10_000;
const jcsBudget: JcsResourceBudget = {
  maxDepth: 64,
  maxNodes: 1_000_000,
  maxPropertiesPerObject: 10_000,
  maxStringUtf8Bytes: 1_048_576,
  maxTotalStringUtf8Bytes: 1_048_576,
  maxOutputBytes: 1_048_576,
};

type MutableObject = Record<string, unknown>;

function keyMaterial(fill: number): { keyId: string; publicKey: string } {
  const bytes = Buffer.alloc(32, fill);
  return {
    keyId: `sha256:${createHash("sha256").update(bytes).digest("hex")}`,
    publicKey: bytes.toString("base64url"),
  };
}

function signer(fill = 2): MutableObject {
  return {
    ...keyMaterial(fill),
    repositoryIds: ["owner/repo"],
    validFrom: "2026-01-01T00:00:00.000Z",
    expiresAt: "2026-01-31T00:00:00.000Z",
  };
}

function policy(): MutableObject {
  return {
    format: "devorbit-trust-policy-v1",
    sequence: 1,
    issuedAt: "2026-01-01T00:00:00.000Z",
    expiresAt: "2026-01-31T00:00:00.000Z",
    administrator: keyMaterial(0),
    nextAdministrator: null,
    repositories: [],
    authorizedSigners: [],
    revocations: { signerKeyIds: [], repositoryIds: [] },
  };
}

function asObject(value: unknown): MutableObject {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error("Test policy object has an unexpected shape.");
  }
  return value as MutableObject;
}

function encode(value: unknown): Uint8Array {
  const text = JSON.stringify(value);
  if (typeof text !== "string") {
    throw new Error("Test input did not serialize.");
  }
  return Buffer.from(text, "utf8");
}

function rawPolicy(value = policy()): string {
  const bytes = encode(value);
  return Buffer.from(bytes).toString("utf8");
}

function parse(value = policy()) {
  return parseTrustPolicy(encode(value));
}

function expectPolicyError(
  action: () => unknown,
  reason: TrustPolicyFailureReason,
): void {
  try {
    action();
    expect.fail("Expected TrustPolicyError.");
  } catch (error) {
    expect(error).toBeInstanceOf(TrustPolicyError);
    if (!(error instanceof TrustPolicyError)) {
      throw error;
    }
    expect(error.reason).toBe(reason);
    expect(error.message).toBe("Trust policy is invalid.");
  }
}

function reverseProperties(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(reverseProperties);
  }
  if (typeof value !== "object" || value === null) {
    return value;
  }
  return Object.fromEntries(
    Object.entries(value)
      .reverse()
      .map(([key, child]) => [key, reverseProperties(child)]),
  );
}

function repositoryIds(count: number): string[] {
  return Array.from(
    { length: count },
    (_, index) => `owner/repo${String(index).padStart(5, "0")}`,
  );
}

function wrapNestedObjects(count: number): unknown {
  let value: unknown = null;
  for (let index = 0; index < count; index += 1) {
    value = { nested: value };
  }
  return value;
}

describe("internal strict trust-policy parser", () => {
  it("parses the valid minimum policy and freezes its representation", () => {
    const result = parseTrustPolicy(encode(minimumVector.policy));
    expect(result.policy.sequence).toBe(1);
    expect(result.policy.administrator).toEqual(keyMaterial(0));
    expect(result.policy.nextAdministrator).toBeNull();
    expect(result.policy.authorizedSigners).toEqual([]);
    expect(result.policyDigest).toBe(minimumVector.policyDigest);
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.policy)).toBe(true);
    expect(Object.isFrozen(result.policy.administrator)).toBe(true);
    expect(Object.isFrozen(result.policy.repositories)).toBe(true);
  });

  it("accepts a non-null successor administrator and a valid authorized signer", () => {
    const result = parseTrustPolicy(encode(signerVector.policy));
    expect(result.policy.nextAdministrator).toEqual(keyMaterial(1));
    expect(result.policy.authorizedSigners).toHaveLength(1);
    expect(result.policy.authorizedSigners[0]).toEqual(signer());
    expect(result.policyDigest).toBe(signerVector.policyDigest);
  });

  it("matches independent canonical policy and SHA-256 vectors", () => {
    for (const vector of vectors.vectors) {
      const result = parseTrustPolicy(encode(vector.policy));
      expect(result.policyDigest, vector.name).toBe(vector.policyDigest);
      expect(
        Buffer.from(canonicalizeJcs(result.policy, jcsBudget)).toString("utf8"),
        vector.name,
      ).toBe(vector.canonicalPolicy);
      expect(
        createHash("sha256")
          .update(vector.canonicalPolicy, "utf8")
          .digest("hex"),
        vector.name,
      ).toBe(vector.policyDigest);
    }
  });

  it("accepts whitespace and property-order variations without changing the digest", () => {
    const baseline = parse();
    const reordered = reverseProperties(policy());
    const raw = ` \n\t${rawPolicy(reordered)}\r\n `;
    const variant = parseTrustPolicy(Buffer.from(raw, "utf8"));
    expect(variant.policy).toEqual(baseline.policy);
    expect(variant.policyDigest).toBe(baseline.policyDigest);
  });

  it.each(["1", "1.0", "1e0"])(
    "accepts exact equivalent sequence form %s",
    (sequence) => {
      const raw = rawPolicy().replace('"sequence":1', `"sequence":${sequence}`);
      const result = parseTrustPolicy(Buffer.from(raw, "utf8"));
      expect(result.policy.sequence).toBe(1);
      expect(result.policyDigest).toBe(minimumVector.policyDigest);
    },
  );

  it.each([
    "1.0000000000000001",
    "9007199254740991.1",
    "0",
    "-1",
    "9007199254740992",
    "1e999999999999999999999",
  ])("rejects non-positive, inexact, or unsafe sequence %s", (sequence) => {
    const raw = rawPolicy().replace('"sequence":1', `"sequence":${sequence}`);
    expectPolicyError(
      () => parseTrustPolicy(Buffer.from(raw, "utf8")),
      TrustPolicyFailureReason.INVALID_SEQUENCE,
    );
  });

  it("rejects missing and unknown fields at every schema object level", () => {
    const missingCases: Array<() => MutableObject> = [
      ...Object.keys(policy()).map((key) => () => {
        const candidate = policy();
        delete candidate[key];
        return candidate;
      }),
      ...["keyId", "publicKey"].map((key) => () => {
        const candidate = policy();
        const administrator = asObject(candidate.administrator);
        delete administrator[key];
        return candidate;
      }),
      ...["keyId", "publicKey"].map((key) => () => {
        const candidate = policy();
        candidate.nextAdministrator = keyMaterial(1);
        delete asObject(candidate.nextAdministrator)[key];
        return candidate;
      }),
      ...["keyId", "publicKey", "repositoryIds", "validFrom", "expiresAt"].map(
        (key) => () => {
          const candidate = policy();
          candidate.repositories = ["owner/repo"];
          candidate.authorizedSigners = [signer()];
          delete asObject((candidate.authorizedSigners as unknown[])[0])[key];
          return candidate;
        },
      ),
      ...["signerKeyIds", "repositoryIds"].map((key) => () => {
        const candidate = policy();
        delete asObject(candidate.revocations)[key];
        return candidate;
      }),
    ];
    for (const build of missingCases) {
      expectPolicyError(
        () => parse(build()),
        TrustPolicyFailureReason.INVALID_POLICY_SHAPE,
      );
    }

    const unknownCases: Array<() => MutableObject> = [
      () => Object.assign(policy(), { extra: true }),
      () => {
        const candidate = policy();
        candidate.administrator = Object.assign(keyMaterial(0), {
          extra: true,
        });
        return candidate;
      },
      () => {
        const candidate = policy();
        candidate.nextAdministrator = Object.assign(keyMaterial(1), {
          extra: true,
        });
        return candidate;
      },
      () => {
        const candidate = policy();
        candidate.repositories = ["owner/repo"];
        candidate.authorizedSigners = [
          Object.assign(signer(), { extra: true }),
        ];
        return candidate;
      },
      () => {
        const candidate = policy();
        Object.assign(asObject(candidate.revocations), { extra: true });
        return candidate;
      },
    ];
    for (const build of unknownCases) {
      expectPolicyError(
        () => parse(build()),
        TrustPolicyFailureReason.INVALID_POLICY_SHAPE,
      );
    }
  });

  it("rejects duplicate decoded keys at root and nested levels, including escaped aliases", () => {
    const base = rawPolicy();
    const adminKeyId = keyMaterial(0).keyId;
    const rootDuplicate = base.replace(
      '"format":',
      '"format":"devorbit-trust-policy-v1","format":',
    );
    const escapedRootAlias = base.replace(
      '"format":',
      '"\\u0066ormat":"devorbit-trust-policy-v1","format":',
    );
    const adminDuplicate = base.replace(
      `"keyId":"${adminKeyId}",`,
      `"keyId":"${adminKeyId}","keyId":"${adminKeyId}",`,
    );
    const withSigner = policy();
    withSigner.repositories = ["owner/repo"];
    withSigner.authorizedSigners = [signer()];
    const signerKeyId = keyMaterial(2).keyId;
    const signerDuplicate = rawPolicy(withSigner).replace(
      `"keyId":"${signerKeyId}",`,
      `"keyId":"${signerKeyId}","keyId":"${signerKeyId}",`,
    );
    const revocationDuplicate = base.replace(
      '"signerKeyIds":[]',
      '"signerKeyIds":[],"signerKeyIds":[]',
    );

    for (const raw of [
      rootDuplicate,
      escapedRootAlias,
      adminDuplicate,
      signerDuplicate,
      revocationDuplicate,
    ]) {
      expectPolicyError(
        () => parseTrustPolicy(Buffer.from(raw, "utf8")),
        TrustPolicyFailureReason.DUPLICATE_JSON_KEY,
      );
    }
  });

  it("rejects malformed UTF-8, BOM, malformed JSON, oversized input, and shared memory", () => {
    expectPolicyError(
      () => parseTrustPolicy(Uint8Array.of(0xc3, 0x28)),
      TrustPolicyFailureReason.MALFORMED_UTF8,
    );
    expectPolicyError(
      () =>
        parseTrustPolicy(
          Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), encode(policy())]),
        ),
      TrustPolicyFailureReason.UTF8_BOM,
    );
    for (const raw of ["", '{"format":', '{"x":1,}']) {
      expectPolicyError(
        () => parseTrustPolicy(Buffer.from(raw, "utf8")),
        TrustPolicyFailureReason.MALFORMED_JSON,
      );
    }
    const oversizedInvalidUtf8 = Buffer.alloc(maxPolicyBytes + 1, 0xff);
    expectPolicyError(
      () => parseTrustPolicy(oversizedInvalidUtf8),
      TrustPolicyFailureReason.INPUT_TOO_LARGE,
    );

    const shared = new SharedArrayBuffer(encode(policy()).byteLength);
    const sharedBytes = new Uint8Array(shared);
    sharedBytes.set(encode(policy()));
    expectPolicyError(
      () => parseTrustPolicy(sharedBytes),
      TrustPolicyFailureReason.SHARED_MEMORY_INPUT,
    );
  });

  it("accepts exactly 1 MiB of raw input and rejects one byte more", () => {
    const base = encode(policy());
    const exact = Buffer.concat([
      base,
      Buffer.alloc(maxPolicyBytes - base.byteLength, 0x20),
    ]);
    expect(parseTrustPolicy(exact).policyDigest).toBe(
      minimumVector.policyDigest,
    );
    const over = Buffer.concat([exact, Buffer.from(" ")]);
    expectPolicyError(
      () => parseTrustPolicy(over),
      TrustPolicyFailureReason.INPUT_TOO_LARGE,
    );
  });

  it("rejects invalid timestamp syntax and Gregorian dates", () => {
    for (const timestamp of [
      "2026-02-29T00:00:00.000Z",
      "0000-01-01T00:00:00.000Z",
      "2026-01-01T24:00:00.000Z",
      "2026-01-01T00:00:60.000Z",
      "2026-01-01T00:00:00Z",
      "2026-01-01T00:00:00.000+00:00",
      "2026-01-01T00:00:00.000Z\n",
    ]) {
      const candidate = policy();
      candidate.issuedAt = timestamp;
      expectPolicyError(
        () => parse(candidate),
        TrustPolicyFailureReason.INVALID_TIMESTAMP,
      );
    }
    const leapDayPolicy = policy();
    leapDayPolicy.issuedAt = "2024-02-01T00:00:00.000Z";
    leapDayPolicy.expiresAt = "2024-03-02T00:00:00.000Z";
    expect(parse(leapDayPolicy).policy.issuedAt).toBe(
      "2024-02-01T00:00:00.000Z",
    );
  });

  it("requires the exact policy lifetime and contained nonempty signer intervals", () => {
    const badLifetime = policy();
    badLifetime.expiresAt = "2026-01-30T00:00:00.000Z";
    expectPolicyError(
      () => parse(badLifetime),
      TrustPolicyFailureReason.INVALID_INTERVAL,
    );

    const emptySignerInterval = policy();
    emptySignerInterval.repositories = ["owner/repo"];
    emptySignerInterval.authorizedSigners = [
      { ...signer(), expiresAt: "2026-01-01T00:00:00.000Z" },
    ];
    expectPolicyError(
      () => parse(emptySignerInterval),
      TrustPolicyFailureReason.INVALID_INTERVAL,
    );

    for (const signerInterval of [
      {
        ...signer(),
        validFrom: "2025-12-31T23:59:59.999Z",
      },
      {
        ...signer(),
        expiresAt: "2026-01-31T00:00:00.001Z",
      },
    ]) {
      const candidate = policy();
      candidate.repositories = ["owner/repo"];
      candidate.authorizedSigners = [signerInterval];
      expectPolicyError(
        () => parse(candidate),
        TrustPolicyFailureReason.INVALID_INTERVAL,
      );
    }

    const oldButStructurallyValid = policy();
    oldButStructurallyValid.issuedAt = "2000-01-01T00:00:00.000Z";
    oldButStructurallyValid.expiresAt = "2000-01-31T00:00:00.000Z";
    expect(parse(oldButStructurallyValid).policy.issuedAt).toBe(
      "2000-01-01T00:00:00.000Z",
    );
  });

  it("rejects noncanonical repositories, out-of-policy scopes, and unordered arrays", () => {
    for (const repositoryId of [
      "Owner/repo",
      "owner/repo\n",
      "owner/repo/extra",
    ]) {
      const candidate = policy();
      candidate.repositories = [repositoryId];
      expectPolicyError(
        () => parse(candidate),
        TrustPolicyFailureReason.INVALID_REPOSITORY_ID,
      );
    }

    const invalidScope = policy();
    invalidScope.repositories = ["owner/repo"];
    invalidScope.authorizedSigners = [
      { ...signer(), repositoryIds: ["other/repo"] },
    ];
    expectPolicyError(
      () => parse(invalidScope),
      TrustPolicyFailureReason.INVALID_REPOSITORY_ID,
    );

    const unsortedArrays = [
      { repositories: ["owner/z", "owner/a"] },
      { repositories: ["owner/a", "owner/a"] },
      {
        repositories: ["owner/a", "owner/z"],
        signerRepositories: ["owner/z", "owner/a"],
      },
      { repositories: [], revokedRepositories: ["owner/z", "owner/a"] },
      {
        repositories: [],
        revokedSigners: [
          `sha256:${"b".repeat(64)}`,
          `sha256:${"a".repeat(64)}`,
        ],
      },
    ];
    for (const values of unsortedArrays) {
      const candidate = policy();
      candidate.repositories = values.repositories ?? [];
      if (values.signerRepositories !== undefined) {
        candidate.repositories = values.repositories ?? [];
        candidate.repositories = ["owner/a", "owner/z"];
        candidate.authorizedSigners = [
          { ...signer(), repositoryIds: values.signerRepositories },
        ];
      }
      if (values.revokedRepositories !== undefined) {
        asObject(candidate.revocations).repositoryIds =
          values.revokedRepositories;
      }
      if (values.revokedSigners !== undefined) {
        asObject(candidate.revocations).signerKeyIds = values.revokedSigners;
      }
      expectPolicyError(
        () => parse(candidate),
        TrustPolicyFailureReason.INVALID_ORDERING,
      );
    }

    const unsortedSigners = policy();
    unsortedSigners.repositories = ["owner/repo"];
    unsortedSigners.authorizedSigners = [signer(2), signer(1)];
    expectPolicyError(
      () => parse(unsortedSigners),
      TrustPolicyFailureReason.INVALID_ORDERING,
    );
    const duplicateSigners = policy();
    duplicateSigners.repositories = ["owner/repo"];
    duplicateSigners.authorizedSigners = [signer(2), signer(2)];
    expectPolicyError(
      () => parse(duplicateSigners),
      TrustPolicyFailureReason.INVALID_ORDERING,
    );
  });

  it("rejects invalid public-key encodings, lengths, and fingerprints", () => {
    for (const publicKey of [
      "not-base64url",
      `${keyMaterial(0).publicKey}=`,
      "A".repeat(42),
      `${"A".repeat(42)}B`,
    ]) {
      const candidate = policy();
      asObject(candidate.administrator).publicKey = publicKey;
      expectPolicyError(
        () => parse(candidate),
        TrustPolicyFailureReason.INVALID_PUBLIC_KEY,
      );
    }
    const mismatch = policy();
    asObject(mismatch.administrator).keyId = `sha256:${"f".repeat(64)}`;
    expectPolicyError(
      () => parse(mismatch),
      TrustPolicyFailureReason.KEY_ID_MISMATCH,
    );
    const successorMismatch = policy();
    successorMismatch.nextAdministrator = {
      ...keyMaterial(1),
      keyId: `sha256:${"e".repeat(64)}`,
    };
    expectPolicyError(
      () => parse(successorMismatch),
      TrustPolicyFailureReason.KEY_ID_MISMATCH,
    );
    const signerMismatch = policy();
    signerMismatch.repositories = ["owner/repo"];
    signerMismatch.authorizedSigners = [
      { ...signer(), keyId: `sha256:${"d".repeat(64)}` },
    ];
    expectPolicyError(
      () => parse(signerMismatch),
      TrustPolicyFailureReason.KEY_ID_MISMATCH,
    );
  });

  it("validates revocation structure and canonical IDs without applying revocation", () => {
    const valid = policy();
    asObject(valid.revocations).signerKeyIds = [
      `sha256:${"a".repeat(64)}`,
      `sha256:${"b".repeat(64)}`,
    ];
    asObject(valid.revocations).repositoryIds = ["owner/a", "owner/z"];
    expect(parse(valid).policy.revocations).toEqual({
      signerKeyIds: [`sha256:${"a".repeat(64)}`, `sha256:${"b".repeat(64)}`],
      repositoryIds: ["owner/a", "owner/z"],
    });

    const badSignerId = policy();
    asObject(badSignerId.revocations).signerKeyIds = ["not-a-key-id"];
    expectPolicyError(
      () => parse(badSignerId),
      TrustPolicyFailureReason.INVALID_PUBLIC_KEY,
    );
    const badRepository = policy();
    asObject(badRepository.revocations).repositoryIds = ["Owner/repo"];
    expectPolicyError(
      () => parse(badRepository),
      TrustPolicyFailureReason.INVALID_REPOSITORY_ID,
    );
  });

  it("enforces inclusive collection boundaries where they fit under the raw cap", () => {
    const ids = repositoryIds(maxCollectionEntries);
    const repositoryPolicy = policy();
    repositoryPolicy.repositories = ids;
    expect(parse(repositoryPolicy).policy.repositories).toHaveLength(
      maxCollectionEntries,
    );
    const repositoryOver = policy();
    repositoryOver.repositories = [...ids, "owner/repo10000"];
    expectPolicyError(
      () => parse(repositoryOver),
      TrustPolicyFailureReason.JSON_RESOURCE_LIMIT,
    );

    const scopedPolicy = policy();
    scopedPolicy.repositories = ids;
    scopedPolicy.authorizedSigners = [{ ...signer(), repositoryIds: ids }];
    expect(
      parse(scopedPolicy).policy.authorizedSigners[0]?.repositoryIds,
    ).toHaveLength(maxCollectionEntries);
    const scopeOver = policy();
    scopeOver.repositories = [...ids, "owner/repo10000"];
    scopeOver.authorizedSigners = [
      { ...signer(), repositoryIds: [...ids, "owner/repo10000"] },
    ];
    expectPolicyError(
      () => parse(scopeOver),
      TrustPolicyFailureReason.JSON_RESOURCE_LIMIT,
    );

    const revokedRepositories = policy();
    asObject(revokedRepositories.revocations).repositoryIds = ids;
    expect(
      parse(revokedRepositories).policy.revocations.repositoryIds,
    ).toHaveLength(maxCollectionEntries);
    const revokedRepositoriesOver = policy();
    asObject(revokedRepositoriesOver.revocations).repositoryIds = [
      ...ids,
      "owner/repo10000",
    ];
    expectPolicyError(
      () => parse(revokedRepositoriesOver),
      TrustPolicyFailureReason.JSON_RESOURCE_LIMIT,
    );

    const revokedSigners = policy();
    const signerIds = Array.from(
      { length: maxCollectionEntries },
      (_, index) => `sha256:${index.toString(16).padStart(64, "0")}`,
    );
    asObject(revokedSigners.revocations).signerKeyIds = signerIds;
    expect(parse(revokedSigners).policy.revocations.signerKeyIds).toHaveLength(
      maxCollectionEntries,
    );
    const revokedSignersOver = policy();
    asObject(revokedSignersOver.revocations).signerKeyIds = [
      ...signerIds,
      `sha256:${"f".repeat(64)}`,
    ];
    expectPolicyError(
      () => parse(revokedSignersOver),
      TrustPolicyFailureReason.JSON_RESOURCE_LIMIT,
    );
  });

  it("bounds parser properties, array entries, and nesting before schema construction", () => {
    const base = policy();
    const exactProperties = { ...base } as MutableObject;
    for (let index = 0; index < 9_991; index += 1) {
      exactProperties[`extra${String(index).padStart(5, "0")}`] = null;
    }
    expectPolicyError(
      () => parse(exactProperties),
      TrustPolicyFailureReason.INVALID_POLICY_SHAPE,
    );
    const excessiveProperties = { ...base } as MutableObject;
    for (let index = 0; index < 9_992; index += 1) {
      excessiveProperties[`extra${String(index).padStart(5, "0")}`] = null;
    }
    expectPolicyError(
      () => parse(excessiveProperties),
      TrustPolicyFailureReason.JSON_RESOURCE_LIMIT,
    );

    const exactArray = policy();
    exactArray.authorizedSigners = Array.from(
      { length: maxCollectionEntries },
      () => null,
    );
    expectPolicyError(
      () => parse(exactArray),
      TrustPolicyFailureReason.INVALID_POLICY_SHAPE,
    );
    const excessiveArray = policy();
    excessiveArray.authorizedSigners = Array.from(
      { length: maxCollectionEntries + 1 },
      () => null,
    );
    expectPolicyError(
      () => parse(excessiveArray),
      TrustPolicyFailureReason.JSON_RESOURCE_LIMIT,
    );

    const exactDepth = policy();
    Object.assign(exactDepth, { extra: wrapNestedObjects(63) });
    expectPolicyError(
      () => parse(exactDepth),
      TrustPolicyFailureReason.INVALID_POLICY_SHAPE,
    );
    const excessiveDepth = policy();
    Object.assign(excessiveDepth, { extra: wrapNestedObjects(64) });
    expectPolicyError(
      () => parse(excessiveDepth),
      TrustPolicyFailureReason.JSON_RESOURCE_LIMIT,
    );
  });

  it("rejects unsupported input without exposing attacker-controlled contents", () => {
    const secret = "untrusted-sensitive-policy-value";
    const raw = `{"${secret}":true}`;
    expectPolicyError(
      () => parseTrustPolicy(Buffer.from(raw, "utf8")),
      TrustPolicyFailureReason.INVALID_POLICY_SHAPE,
    );
    try {
      parseTrustPolicy(Buffer.from(raw, "utf8"));
    } catch (error) {
      expect((error as Error).message).not.toContain(secret);
      expect(String(error)).not.toContain(secret);
    }
    expect(Object.hasOwn(Object.prototype, "polluted")).toBe(false);

    const prototypeKey = rawPolicy().replace(
      '"format":',
      '"__proto__":{"polluted":true},"format":',
    );
    expectPolicyError(
      () => parseTrustPolicy(Buffer.from(prototypeKey, "utf8")),
      TrustPolicyFailureReason.INVALID_POLICY_SHAPE,
    );
    expect(Object.hasOwn(Object.prototype, "polluted")).toBe(false);
  });
});
