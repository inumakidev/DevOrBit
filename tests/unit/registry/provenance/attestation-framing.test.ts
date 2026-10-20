import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import type { Asset } from "../../../../packages/core/src/index.js";
import type { AssetRecord } from "../../../../packages/registry/src/manifest/asset-record.js";
import {
  AttestationFramingError,
  AttestationFramingFailureReason,
  frameAttestation,
} from "../../../../packages/registry/src/provenance/attestation-framing.js";

interface AttestationVector {
  readonly name: string;
  readonly repositoryId: string;
  readonly revision: string;
  readonly assetId: string;
  readonly assetVersion: string;
  readonly assetPath: string;
  readonly manifestSha256: string;
  readonly contentTreeSha256: string;
  readonly signerKeyId: string;
  readonly streamHex: string;
  readonly expectedSha256?: string;
  readonly expectedLookupId?: string;
  readonly reportedStreamSha256?: string;
}

const vectors = JSON.parse(
  readFileSync(
    resolve(
      process.cwd(),
      "tests/fixtures/registry/attestation-framing-vectors.json",
    ),
    "utf8",
  ),
) as { readonly vectors: readonly AttestationVector[] };

const digest0 = "0".repeat(64);
const digest1 = "1".repeat(64);
const digest2 = "2".repeat(64);

function makeAsset(
  overrides: {
    readonly id?: string;
    readonly version?: string;
    readonly path?: string;
    readonly digest?: string;
  } = {},
): Asset {
  const id = overrides.id ?? "skill.a.b";
  const version = overrides.version ?? "1.0.0";
  return {
    id,
    kind: "skill",
    version,
    contractVersion: "1.0.0",
    description: "Framing test asset",
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
      digest: overrides.digest ?? digest1,
    },
    provenance: {
      repository: "owner/repo",
      path: overrides.path ?? `assets/${id}/${version}`,
      revision: "0000000000000000000000000000000000000000",
    },
    lifecycleStatus: "stable",
  };
}

function makeRecord(
  asset: Asset = makeAsset(),
  manifestSha256 = digest0,
  contentTreeSha256 = asset.integrity.digest,
): AssetRecord {
  return { asset, manifestSha256, contentTreeSha256 };
}

function makeInput(
  overrides: Partial<{
    readonly repositoryId: string;
    readonly revision: string;
    readonly record: AssetRecord;
    readonly signerKeyId: string;
  }> = {},
) {
  return {
    repositoryId: overrides.repositoryId ?? "owner/repo",
    revision: overrides.revision ?? "0000000000000000000000000000000000000000",
    record: overrides.record ?? makeRecord(),
    signerKeyId: overrides.signerKeyId ?? `sha256:${digest2}`,
  };
}

function vectorRecord(vector: AttestationVector): AssetRecord {
  return makeRecord(
    makeAsset({
      id: vector.assetId,
      version: vector.assetVersion,
      path: vector.assetPath,
      digest: vector.contentTreeSha256,
    }),
    vector.manifestSha256,
    vector.contentTreeSha256,
  );
}

function expectFramingError(
  action: () => unknown,
  reason: (typeof AttestationFramingFailureReason)[keyof typeof AttestationFramingFailureReason],
): void {
  try {
    action();
    expect.fail("Expected AttestationFramingError.");
  } catch (error) {
    expect(error).toBeInstanceOf(AttestationFramingError);
    expect(error).toMatchObject({ reason });
    expect((error as Error).message).toBe(
      "Attestation framing input is invalid.",
    );
  }
}

function streamHex(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("hex");
}

function payloadSha256(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

describe("internal attestation framing", () => {
  it("matches the independent lookup framing vector", () => {
    const vector = vectors.vectors.find(
      ({ name }) => name === "normalized-repository-lookup",
    );
    if (vector === undefined || vector.expectedLookupId === undefined) {
      throw new Error("Required lookup vector is missing.");
    }

    const result = frameAttestation({
      ...makeInput({
        repositoryId: vector.repositoryId,
        revision: vector.revision,
        record: vectorRecord({
          ...vector,
          assetId: "skill.a.b",
          assetVersion: "1.0.0",
          manifestSha256: digest0,
          contentTreeSha256: digest1,
          signerKeyId: `sha256:${digest2}`,
          streamHex: "",
        }),
      }),
    });

    expect(result.lookupId).toBe(vector.expectedLookupId);
    expect(
      createHash("sha256")
        .update(Buffer.from(vector.streamHex, "hex"))
        .digest("hex"),
    ).toBe(vector.expectedLookupId);
  });

  it("matches the exact nine-field signed-payload vector", () => {
    const vector = vectors.vectors.find(
      ({ name }) => name === "signed-payload",
    );
    if (vector === undefined || vector.expectedSha256 === undefined) {
      throw new Error("Required signed-payload vector is missing.");
    }

    const result = frameAttestation({
      repositoryId: vector.repositoryId,
      revision: vector.revision,
      record: vectorRecord(vector),
      signerKeyId: vector.signerKeyId,
    });
    const expectedBytes = Buffer.from(vector.streamHex, "hex");

    expect(streamHex(result.signedPayload)).toBe(vector.streamHex);
    expect(result.signedPayload).toEqual(expectedBytes);
    expect(payloadSha256(result.signedPayload)).toBe(vector.expectedSha256);
    expect(
      Buffer.from(result.signedPayload).indexOf(
        Buffer.from("devorbit-asset-tree-v1"),
      ),
    ).toBeGreaterThan(-1);
    expect(
      Buffer.from(result.signedPayload.subarray(0, 33)).toString("hex"),
    ).toBe(
      "4445564f524249542d44455441434845442d4154544553544154494f4e00763100",
    );
    expect(
      Buffer.from(result.signedPayload.subarray(33, 37)).toString("hex"),
    ).toBe("0000000a");
  });

  it("rejects the reported version mutation with a mismatched path", () => {
    const vector = vectors.vectors.find(
      ({ name }) => name === "signed-payload-mismatched-version-and-path",
    );
    if (vector === undefined) {
      throw new Error("Required mismatched-version vector is missing.");
    }

    expectFramingError(
      () =>
        frameAttestation({
          repositoryId: vector.repositoryId,
          revision: vector.revision,
          record: vectorRecord(vector),
          signerKeyId: vector.signerKeyId,
        }),
      AttestationFramingFailureReason.INVALID_ASSET_PATH,
    );
  });

  it("matches the independently generated canonical version mutation", () => {
    const vector = vectors.vectors.find(
      ({ name }) => name === "signed-payload-canonical-version-mutation",
    );
    if (vector === undefined || vector.expectedSha256 === undefined) {
      throw new Error("Required canonical mutation vector is missing.");
    }

    const result = frameAttestation({
      repositoryId: vector.repositoryId,
      revision: vector.revision,
      record: vectorRecord(vector),
      signerKeyId: vector.signerKeyId,
    });

    expect(streamHex(result.signedPayload)).toBe(vector.streamHex);
    expect(payloadSha256(result.signedPayload)).toBe(vector.expectedSha256);
  });

  it("normalizes only repository ID and preserves canonical path case", () => {
    const lowercase = frameAttestation(
      makeInput({ repositoryId: "owner/repo" }),
    );
    const mixedCase = frameAttestation(
      makeInput({ repositoryId: "Owner/Repo" }),
    );
    expect(mixedCase.lookupId).toBe(lowercase.lookupId);
    expect(mixedCase.signedPayload).toEqual(lowercase.signedPayload);

    const uppercaseVersion = "1.0.0-RC.1";
    const pathCase = `assets/skill.a.b/${uppercaseVersion}`;
    const preserved = frameAttestation(
      makeInput({
        record: makeRecord(
          makeAsset({ version: uppercaseVersion, path: pathCase }),
        ),
      }),
    );
    expect(streamHex(preserved.signedPayload)).toContain(
      Buffer.from(pathCase).toString("hex"),
    );
    expectFramingError(
      () =>
        frameAttestation(
          makeInput({
            record: makeRecord(
              makeAsset({
                version: uppercaseVersion,
                path: `assets/skill.a.b/${uppercaseVersion.toLowerCase()}`,
              }),
            ),
          }),
        ),
      AttestationFramingFailureReason.INVALID_ASSET_PATH,
    );
  });

  it("changes framed bindings when source or record values change", () => {
    const baseline = frameAttestation(makeInput());
    const changedInputs = [
      makeInput({ repositoryId: "other/repo" }),
      makeInput({ revision: "1111111111111111111111111111111111111111" }),
      makeInput({
        record: makeRecord(
          makeAsset({
            version: "1.0.1",
            path: "assets/skill.a.b/1.0.1",
          }),
        ),
      }),
      makeInput({
        record: makeRecord(
          makeAsset({
            id: "skill.c.d",
            path: "assets/skill.c.d/1.0.0",
          }),
        ),
      }),
      makeInput({
        record: makeRecord(makeAsset(), "3".repeat(64), digest1),
      }),
      makeInput({
        record: makeRecord(
          makeAsset({ digest: "4".repeat(64) }),
          digest0,
          "4".repeat(64),
        ),
      }),
      makeInput({ signerKeyId: `sha256:${"5".repeat(64)}` }),
    ];

    for (const changed of changedInputs) {
      const result = frameAttestation(changed);
      expect(result.signedPayload).not.toEqual(baseline.signedPayload);
    }

    const [repositoryChanged, revisionChanged, pathChanged] = changedInputs;
    if (
      repositoryChanged === undefined ||
      revisionChanged === undefined ||
      pathChanged === undefined
    ) {
      throw new Error("Required binding sensitivity inputs are missing.");
    }
    expect(baseline.lookupId).not.toBe(
      frameAttestation(repositoryChanged).lookupId,
    );
    expect(baseline.lookupId).not.toBe(
      frameAttestation(revisionChanged).lookupId,
    );
    expect(baseline.lookupId).not.toBe(frameAttestation(pathChanged).lookupId);
    expect(
      Buffer.from(baseline.signedPayload).includes(
        Buffer.from("devorbit-asset-tree-v1"),
      ),
    ).toBe(true);
  });

  it.each([
    ["repository syntax", { repositoryId: "../repo" }, "INVALID_REPOSITORY_ID"],
    [
      "repository whitespace",
      { repositoryId: " owner/repo" },
      "INVALID_REPOSITORY_ID",
    ],
    ["revision length", { revision: "0".repeat(39) }, "INVALID_REVISION"],
    ["revision case", { revision: "A".repeat(40) }, "INVALID_REVISION"],
    ["signer key ID", { signerKeyId: "sha256:ABC" }, "INVALID_SIGNER_KEY_ID"],
  ] as const)("rejects invalid %s", (_name, override, reason) => {
    expectFramingError(() => frameAttestation(makeInput(override)), reason);
  });

  it("preserves M1 asset ID and strict SemVer validation", () => {
    expectFramingError(
      () =>
        frameAttestation(
          makeInput({
            record: makeRecord(
              makeAsset({ id: "invalid", path: "assets/invalid/1.0.0" }),
            ),
          }),
        ),
      AttestationFramingFailureReason.INVALID_ASSET_ID,
    );
    expectFramingError(
      () =>
        frameAttestation(
          makeInput({
            record: makeRecord(
              makeAsset({
                version: "01.0.0",
                path: "assets/skill.a.b/01.0.0",
              }),
            ),
          }),
        ),
      AttestationFramingFailureReason.INVALID_ASSET_VERSION,
    );
  });

  it("rejects unsafe, noncanonical, and mismatched asset paths", () => {
    for (const path of [
      "assets/skill.a.b/1.0.0/",
      "assets/../1.0.0",
      "assets\\skill.a.b\\1.0.0",
      "assets/skill.a.b/1.0.1",
      "assets/skill.a.b/café",
    ]) {
      expectFramingError(
        () =>
          frameAttestation(
            makeInput({ record: makeRecord(makeAsset({ path })) }),
          ),
        AttestationFramingFailureReason.INVALID_ASSET_PATH,
      );
    }
  });

  it("rejects invalid digests and inconsistent record integrity", () => {
    expectFramingError(
      () =>
        frameAttestation(
          makeInput({ record: makeRecord(makeAsset(), "bad", digest1) }),
        ),
      AttestationFramingFailureReason.INVALID_DIGEST,
    );
    expectFramingError(
      () =>
        frameAttestation(
          makeInput({
            record: makeRecord(makeAsset(), digest0, "3".repeat(64)),
          }),
        ),
      AttestationFramingFailureReason.INVALID_DIGEST,
    );
  });

  it("handles malformed runtime inputs with stable generic errors", () => {
    expectFramingError(
      () => Reflect.apply(frameAttestation, undefined, [null]),
      AttestationFramingFailureReason.INVALID_INPUT,
    );
    expectFramingError(
      () => Reflect.apply(frameAttestation, undefined, [{}]),
      AttestationFramingFailureReason.INVALID_REPOSITORY_ID,
    );

    const attackerValue = "attacker-value-that-must-not-leak";
    try {
      frameAttestation(makeInput({ repositoryId: attackerValue }));
      expect.fail("Expected invalid repository ID.");
    } catch (error) {
      expect(error).toBeInstanceOf(AttestationFramingError);
      expect((error as Error).message).not.toContain(attackerValue);
      expect((error as Error).message).toBe(
        "Attestation framing input is invalid.",
      );
    }
  });

  it("is deterministic and does not mutate its input record", () => {
    const asset = makeAsset();
    Object.freeze(asset.integrity);
    Object.freeze(asset.provenance);
    Object.freeze(asset);
    const record = Object.freeze(makeRecord(asset));
    const input = Object.freeze(makeInput({ record }));
    const before = JSON.stringify(input);

    const first = frameAttestation(input);
    const second = frameAttestation(input);

    expect(first.lookupId).toBe(second.lookupId);
    expect(first.signedPayload).toEqual(second.signedPayload);
    expect(JSON.stringify(input)).toBe(before);
  });
});
