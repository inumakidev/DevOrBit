import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import type { Asset } from "../../../../packages/core/src/index.js";
import type { AssetRecord } from "../../../../packages/registry/src/manifest/asset-record.js";
import type {
  DetachedAttestationPayload,
  ParsedDetachedAttestationEnvelope,
} from "../../../../packages/registry/src/provenance/attestation-envelope.js";
import { frameAttestation } from "../../../../packages/registry/src/provenance/attestation-framing.js";
import {
  AttestationVerificationError,
  AttestationVerificationFailureReason,
  verifyDetachedAttestation,
} from "../../../../packages/registry/src/provenance/attestation-verification.js";

interface VerificationVector {
  readonly claims: DetachedAttestationPayload;
  readonly signedPayloadHex: string;
  readonly signedPayloadSha256: string;
  readonly publicKeyHex: string;
  readonly signerKeyId: string;
  readonly signatureBase64url: string;
  readonly mutatedSignatureBase64url: string;
  readonly alternatePublicKeyHex: string;
}

const vector = JSON.parse(
  readFileSync(
    resolve(
      process.cwd(),
      "tests/fixtures/registry/attestation-verification-vectors.json",
    ),
    "utf8",
  ),
) as VerificationVector;

const digest0 = "0".repeat(64);
const lineTerminators = ["\n", "\r", "\r\n"];

function makeAsset(
  overrides: {
    readonly id?: string;
    readonly version?: string;
    readonly repository?: string;
    readonly revision?: string;
    readonly path?: string;
    readonly digest?: string;
  } = {},
): Asset {
  const id = overrides.id ?? vector.claims.assetId;
  const version = overrides.version ?? vector.claims.assetVersion;
  return {
    id,
    kind: "skill",
    version,
    contractVersion: "1.0.0",
    description: "Attestation verification test asset",
    domain: "test",
    dependencies: { required: [], optional: [] },
    compatibility: {
      agents: [],
      stacks: [],
      modes: [],
      capabilities: [],
    },
    permissions: [],
    integrity: {
      algorithm: "sha256",
      digest: overrides.digest ?? vector.claims.contentTreeSha256,
    },
    provenance: {
      repository: overrides.repository ?? vector.claims.repositoryId,
      path: overrides.path ?? `assets/${id}/${version}`,
      revision: overrides.revision ?? vector.claims.revision,
    },
    lifecycleStatus: "stable",
  };
}

function makeRecord(
  asset: Asset = makeAsset(),
  manifestSha256 = vector.claims.manifestSha256,
): AssetRecord {
  return {
    asset,
    manifestSha256,
    contentTreeSha256: asset.integrity.digest,
  };
}

function makeEnvelope(
  claims: Partial<DetachedAttestationPayload> = {},
  signature: Uint8Array = Buffer.from(vector.signatureBase64url, "base64url"),
): ParsedDetachedAttestationEnvelope {
  return {
    payload: { ...vector.claims, ...claims },
    signature,
    envelopeSha256: digest0,
  };
}

function makeForgedEnvelope(
  payload: Readonly<Record<string, unknown>>,
  envelopeSha256 = digest0,
): ParsedDetachedAttestationEnvelope {
  return {
    ...makeEnvelope(),
    payload: { ...vector.claims, ...payload },
    envelopeSha256,
  } as unknown as ParsedDetachedAttestationEnvelope;
}

function makeInput(
  overrides: {
    readonly envelope?: ParsedDetachedAttestationEnvelope;
    readonly repositoryId?: string;
    readonly revision?: string;
    readonly record?: AssetRecord;
    readonly publicKey?: Uint8Array;
  } = {},
) {
  return {
    envelope: overrides.envelope ?? makeEnvelope(),
    repositoryId: overrides.repositoryId ?? vector.claims.repositoryId,
    revision: overrides.revision ?? vector.claims.revision,
    record: overrides.record ?? makeRecord(),
    publicKey: overrides.publicKey ?? Buffer.from(vector.publicKeyHex, "hex"),
  };
}

function expectFailure(
  action: () => unknown,
  reason: (typeof AttestationVerificationFailureReason)[keyof typeof AttestationVerificationFailureReason],
): void {
  try {
    action();
    expect.fail("Expected AttestationVerificationError.");
  } catch (error) {
    expect(error).toBeInstanceOf(AttestationVerificationError);
    expect(error).toMatchObject({ reason });
    expect((error as Error).message).toBe("Attestation verification failed.");
  }
}

describe("internal detached attestation verification", () => {
  it("verifies the signature and returns only validity and context consistency", () => {
    const result = verifyDetachedAttestation(
      makeInput({ repositoryId: "Owner/Repo" }),
    );

    expect(result).toEqual({
      signatureValid: true,
      contextConsistent: true,
    });
    expect(Object.keys(result).sort()).toEqual([
      "contextConsistent",
      "signatureValid",
    ]);
    expect(JSON.stringify(result)).not.toMatch(/trusted|authorized|eligible/i);
  });

  it("rejects an invalid signature", () => {
    expectFailure(
      () =>
        verifyDetachedAttestation(
          makeInput({
            envelope: makeEnvelope(
              {},
              Buffer.from(vector.mutatedSignatureBase64url, "base64url"),
            ),
          }),
        ),
      AttestationVerificationFailureReason.INVALID_SIGNATURE,
    );
  });

  it("rejects a supplied key whose fingerprint does not match the claim", () => {
    expectFailure(
      () =>
        verifyDetachedAttestation(
          makeInput({
            publicKey: Buffer.from(vector.alternatePublicKeyHex, "hex"),
          }),
        ),
      AttestationVerificationFailureReason.KEY_MISMATCH,
    );
  });

  it.each([
    ["repositoryId", { repositoryId: "another/repo" }],
    ["revision", { revision: "1".repeat(40) }],
    [
      "assetPath",
      {
        assetId: "skill.other.id",
        assetVersion: "1.0.1",
        assetPath: "assets/skill.other.id/1.0.1",
      },
    ],
    [
      "assetId",
      { assetId: "skill.other.id", assetPath: "assets/skill.other.id/1.0.0" },
    ],
    [
      "assetVersion",
      {
        assetVersion: "1.0.1",
        assetPath: `assets/${vector.claims.assetId}/1.0.1`,
      },
    ],
    ["manifestSha256", { manifestSha256: "2".repeat(64) }],
    ["contentTreeSha256", { contentTreeSha256: "2".repeat(64) }],
  ] as const)("rejects a well-formed %s claim mismatch", (_name, claims) => {
    expectFailure(
      () =>
        verifyDetachedAttestation(
          makeInput({ envelope: makeEnvelope(claims) }),
        ),
      AttestationVerificationFailureReason.BINDING_MISMATCH,
    );
  });

  it("classifies an invalid content-tree algorithm as invalid input", () => {
    expectFailure(
      () =>
        verifyDetachedAttestation(
          makeInput({
            envelope: makeEnvelope({
              contentTreeAlgorithm:
                "other-algorithm" as unknown as DetachedAttestationPayload["contentTreeAlgorithm"],
            }),
          }),
        ),
      AttestationVerificationFailureReason.INVALID_INPUT,
    );
  });

  it("classifies a different signer-key claim as a key mismatch", () => {
    expectFailure(
      () =>
        verifyDetachedAttestation(
          makeInput({
            envelope: makeEnvelope({
              signerKeyId: `sha256:${"2".repeat(64)}`,
            }),
          }),
        ),
      AttestationVerificationFailureReason.KEY_MISMATCH,
    );
  });

  it("rejects invalid caller repository syntax and revision", () => {
    for (const input of [
      makeInput({ repositoryId: " owner/repo " }),
      makeInput({ repositoryId: "owner/repo/extra" }),
      makeInput({ revision: "A".repeat(40) }),
    ]) {
      expectFailure(
        () => verifyDetachedAttestation(input),
        AttestationVerificationFailureReason.INVALID_INPUT,
      );
    }
  });

  it("rejects terminal line endings in caller repository IDs and revisions", () => {
    for (const lineEnding of lineTerminators) {
      expectFailure(
        () =>
          verifyDetachedAttestation(
            makeInput({
              repositoryId: `${vector.claims.repositoryId}${lineEnding}`,
            }),
          ),
        AttestationVerificationFailureReason.INVALID_INPUT,
      );
      expectFailure(
        () =>
          verifyDetachedAttestation(
            makeInput({ revision: `${vector.claims.revision}${lineEnding}` }),
          ),
        AttestationVerificationFailureReason.INVALID_INPUT,
      );
    }
  });

  it("rejects terminal line endings in record provenance and digest fields", () => {
    for (const lineEnding of lineTerminators) {
      expectFailure(
        () =>
          verifyDetachedAttestation(
            makeInput({
              record: makeRecord(
                makeAsset({
                  repository: `${vector.claims.repositoryId}${lineEnding}`,
                }),
              ),
            }),
          ),
        AttestationVerificationFailureReason.INVALID_INPUT,
      );
      expectFailure(
        () =>
          verifyDetachedAttestation(
            makeInput({
              record: makeRecord(
                makeAsset({
                  revision: `${vector.claims.revision}${lineEnding}`,
                }),
              ),
            }),
          ),
        AttestationVerificationFailureReason.INVALID_INPUT,
      );
      expectFailure(
        () =>
          verifyDetachedAttestation(
            makeInput({
              record: makeRecord(
                makeAsset(),
                `${vector.claims.manifestSha256}${lineEnding}`,
              ),
            }),
          ),
        AttestationVerificationFailureReason.INVALID_INPUT,
      );

      const malformedContentTreeDigest = `${vector.claims.contentTreeSha256}${lineEnding}`;
      expectFailure(
        () =>
          verifyDetachedAttestation(
            makeInput({
              record: {
                ...makeRecord(),
                contentTreeSha256: malformedContentTreeDigest,
              },
            }),
          ),
        AttestationVerificationFailureReason.INVALID_INPUT,
      );
      expectFailure(
        () =>
          verifyDetachedAttestation(
            makeInput({
              record: {
                ...makeRecord(),
                asset: makeAsset({ digest: malformedContentTreeDigest }),
              },
            }),
          ),
        AttestationVerificationFailureReason.INVALID_INPUT,
      );
    }
  });

  it("rejects terminal line endings in forged parsed-envelope fields", () => {
    for (const lineEnding of lineTerminators) {
      for (const payload of [
        { repositoryId: `${vector.claims.repositoryId}${lineEnding}` },
        { revision: `${vector.claims.revision}${lineEnding}` },
        { assetId: `${vector.claims.assetId}${lineEnding}` },
        { manifestSha256: `${vector.claims.manifestSha256}${lineEnding}` },
        {
          contentTreeSha256: `${vector.claims.contentTreeSha256}${lineEnding}`,
        },
        {
          signerKeyId: `${vector.claims.signerKeyId}${lineEnding}`,
        },
      ]) {
        expectFailure(
          () =>
            verifyDetachedAttestation(
              makeInput({ envelope: makeForgedEnvelope(payload) }),
            ),
          AttestationVerificationFailureReason.INVALID_INPUT,
        );
      }
      expectFailure(
        () =>
          verifyDetachedAttestation(
            makeInput({
              envelope: makeForgedEnvelope({}, `${digest0}${lineEnding}`),
            }),
          ),
        AttestationVerificationFailureReason.INVALID_INPUT,
      );
    }
  });

  it("rejects record provenance that disagrees with the caller context", () => {
    expectFailure(
      () =>
        verifyDetachedAttestation(
          makeInput({
            record: makeRecord(makeAsset({ repository: "other/repo" })),
          }),
        ),
      AttestationVerificationFailureReason.BINDING_MISMATCH,
    );
    expectFailure(
      () =>
        verifyDetachedAttestation(
          makeInput({
            record: makeRecord(makeAsset({ revision: "1".repeat(40) })),
          }),
        ),
      AttestationVerificationFailureReason.BINDING_MISMATCH,
    );
  });

  it("rejects malformed envelope and record structures", () => {
    const malformedEnvelope = {
      ...makeEnvelope(),
      unrecognized: true,
    } as unknown as ParsedDetachedAttestationEnvelope;
    expectFailure(
      () =>
        verifyDetachedAttestation(makeInput({ envelope: malformedEnvelope })),
      AttestationVerificationFailureReason.INVALID_INPUT,
    );
    const malformedPayload = {
      ...makeEnvelope(),
      payload: { ...vector.claims, revision: 42 },
    } as unknown as ParsedDetachedAttestationEnvelope;
    expectFailure(
      () =>
        verifyDetachedAttestation(makeInput({ envelope: malformedPayload })),
      AttestationVerificationFailureReason.INVALID_INPUT,
    );
    expectFailure(
      () =>
        verifyDetachedAttestation({
          ...makeInput(),
          record: { ...makeRecord(), extra: true } as unknown as AssetRecord,
        }),
      AttestationVerificationFailureReason.INVALID_INPUT,
    );
  });

  it("rejects keys and signatures with incorrect lengths", () => {
    expectFailure(
      () =>
        verifyDetachedAttestation(makeInput({ publicKey: new Uint8Array(31) })),
      AttestationVerificationFailureReason.INVALID_INPUT,
    );
    expectFailure(
      () =>
        verifyDetachedAttestation(makeInput({ publicKey: new Uint8Array(33) })),
      AttestationVerificationFailureReason.INVALID_INPUT,
    );
    for (const length of [63, 65]) {
      expectFailure(
        () =>
          verifyDetachedAttestation(
            makeInput({
              envelope: makeEnvelope({}, new Uint8Array(length)),
            }),
          ),
        AttestationVerificationFailureReason.INVALID_INPUT,
      );
    }
  });

  it("rejects SharedArrayBuffer-backed keys and signatures", () => {
    if (typeof SharedArrayBuffer === "undefined") {
      return;
    }
    const sharedKey = new Uint8Array(new SharedArrayBuffer(32));
    expectFailure(
      () => verifyDetachedAttestation(makeInput({ publicKey: sharedKey })),
      AttestationVerificationFailureReason.INVALID_INPUT,
    );

    const sharedSignature = new Uint8Array(new SharedArrayBuffer(64));
    expectFailure(
      () =>
        verifyDetachedAttestation(
          makeInput({
            envelope: makeEnvelope({}, sharedSignature),
          }),
        ),
      AttestationVerificationFailureReason.INVALID_INPUT,
    );
  });

  it("matches independent key fingerprint and signed-payload vectors", () => {
    const publicKey = Buffer.from(vector.publicKeyHex, "hex");
    expect(
      `sha256:${createHash("sha256").update(publicKey).digest("hex")}`,
    ).toBe(vector.signerKeyId);
    expect(vector.signerKeyId).toBe(vector.claims.signerKeyId);

    const expectedPayload = Buffer.from(vector.signedPayloadHex, "hex");
    expect(createHash("sha256").update(expectedPayload).digest("hex")).toBe(
      vector.signedPayloadSha256,
    );

    const framed = frameAttestation({
      repositoryId: vector.claims.repositoryId,
      revision: vector.claims.revision,
      record: makeRecord(),
      signerKeyId: vector.signerKeyId,
    });
    expect(Buffer.from(framed.signedPayload).toString("hex")).toBe(
      vector.signedPayloadHex,
    );
    expect(
      createHash("sha256").update(framed.signedPayload).digest("hex"),
    ).toBe(vector.signedPayloadSha256);
  });

  it("does not mutate supplied objects or byte arrays", () => {
    const input = makeInput({ repositoryId: "Owner/Repo" });
    const originalKey = Buffer.from(input.publicKey);
    const originalSignature = Buffer.from(input.envelope.signature);
    const originalPayload = { ...input.envelope.payload };
    const originalAsset = structuredClone(input.record.asset);

    verifyDetachedAttestation(input);

    expect(input.publicKey).toEqual(originalKey);
    expect(input.envelope.signature).toEqual(originalSignature);
    expect(input.envelope.payload).toEqual(originalPayload);
    expect(input.record.asset).toEqual(originalAsset);
  });

  it("uses one generic error message without claim values", () => {
    const attackerValue = "private repository/repo";
    expectFailure(
      () =>
        verifyDetachedAttestation(makeInput({ repositoryId: attackerValue })),
      AttestationVerificationFailureReason.INVALID_INPUT,
    );
    try {
      verifyDetachedAttestation(makeInput({ repositoryId: attackerValue }));
    } catch (error) {
      expect((error as Error).message).not.toContain(attackerValue);
    }
  });

  it("keeps caller-selected repository context independent of envelope claims", () => {
    expectFailure(
      () =>
        verifyDetachedAttestation(
          makeInput({
            repositoryId: "different/repo",
          }),
        ),
      AttestationVerificationFailureReason.BINDING_MISMATCH,
    );
  });
});
