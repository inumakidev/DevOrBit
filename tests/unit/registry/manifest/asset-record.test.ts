import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  type AssetManifest,
  AssetManifestError,
  AssetManifestErrorCode,
} from "../../../../packages/core/src/index.js";
import {
  type AssetTreeFile,
  AssetTreeIntegrityError,
  AssetTreeIntegrityErrorCode,
} from "../../../../packages/registry/src/integrity/asset-tree.js";
import {
  AssetRecordBindingClassification,
  type AssetRecordBindingClassificationValue,
  AssetRecordBindingError,
  AssetRecordBindingFailureReason,
  type AssetRecordBindingFailureReasonValue,
  bindManifestToContentRecord,
} from "../../../../packages/registry/src/manifest/asset-record.js";

interface ManifestRecordVector {
  readonly name: string;
  readonly manifestBytesHex: string;
  readonly expectedManifestSha256: string;
  readonly expectedContentTreeSha256: string;
}

const manifestVectors = JSON.parse(
  readFileSync(
    resolve(
      process.cwd(),
      "tests/fixtures/registry/manifest-record-vectors.json",
    ),
    "utf8",
  ),
) as { readonly vectors: readonly ManifestRecordVector[] };

const expected = { assetId: "skill.a.b", version: "1.0.0" };
const contentFiles: readonly AssetTreeFile[] = [
  { path: "hello.txt", bytes: Buffer.from("Hello\n", "utf8") },
];

function manifestBytes(vector: ManifestRecordVector): Buffer {
  return Buffer.from(vector.manifestBytesHex, "hex");
}

function validManifest(description: string): AssetManifest {
  return {
    manifestVersion: 1,
    assets: [
      {
        id: expected.assetId,
        kind: "skill",
        version: expected.version,
        contractVersion: "1.0.0",
        description,
        domain: "x",
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
          digest:
            "cb2c71f96d176e5746c4a55479aaf483268424175f0b78546d80a0f97da1c896",
        },
        provenance: {
          repository: "owner/repo",
          path: "assets/skill.a.b/1.0.0",
          revision: "0123456789abcdef0123456789abcdef01234567",
        },
        lifecycleStatus: "stable",
      },
    ],
  };
}

function encodeValidManifest(description: string): Buffer {
  return Buffer.from(JSON.stringify(validManifest(description)), "utf8");
}

function expectBindingFailure(
  action: () => unknown,
  classification: AssetRecordBindingClassificationValue,
  reason: AssetRecordBindingFailureReasonValue,
): void {
  try {
    action();
    expect.fail("Expected AssetRecordBindingError.");
  } catch (error) {
    expect(error).toBeInstanceOf(AssetRecordBindingError);
    expect(error).toMatchObject({ classification, reason });
    expect((error as Error).message).toBe("Asset record binding failed.");
  }
}

describe("internal manifest-to-content record binding", () => {
  it.each(manifestVectors.vectors)(
    "binds $name using exact raw manifest bytes",
    (vector) => {
      const result = bindManifestToContentRecord({
        manifestBytes: manifestBytes(vector),
        expected,
        contentFiles,
      });

      expect(result.asset).toEqual(validManifest("x").assets[0]);
      expect(result.manifestSha256).toBe(vector.expectedManifestSha256);
      expect(result.contentTreeSha256).toBe(vector.expectedContentTreeSha256);
    },
  );

  it("produces distinct raw hashes for equivalent JSON serializations", () => {
    const [compact, spaced] = manifestVectors.vectors;
    if (compact === undefined || spaced === undefined) {
      throw new Error("Required raw-manifest vectors are missing.");
    }

    const compactResult = bindManifestToContentRecord({
      manifestBytes: manifestBytes(compact),
      expected,
      contentFiles,
    });
    const spacedResult = bindManifestToContentRecord({
      manifestBytes: manifestBytes(spaced),
      expected,
      contentFiles,
    });

    expect(compactResult.asset).toEqual(spacedResult.asset);
    expect(compactResult.manifestSha256).not.toBe(spacedResult.manifestSha256);
    expect(compactResult.contentTreeSha256).toBe(
      spacedResult.contentTreeSha256,
    );
  });

  it("preserves the original M1 manifest error", () => {
    const invalidManifest = {
      ...validManifest("x"),
      assets: [
        {
          ...validManifest("x").assets[0],
          version: "not-semver",
        },
      ],
    };
    const bytes = Buffer.from(JSON.stringify(invalidManifest), "utf8");
    let originalError: unknown;
    try {
      bindManifestToContentRecord({
        manifestBytes: bytes,
        expected,
        contentFiles,
      });
    } catch (error) {
      originalError = error;
    }

    expect(originalError).toBeInstanceOf(Error);
    expect(originalError).not.toBeInstanceOf(AssetRecordBindingError);
    expect(originalError).toMatchObject({
      name: AssetManifestError.name,
      code: AssetManifestErrorCode.INVALID_ASSET_VERSION,
      issues: expect.arrayContaining([
        expect.objectContaining({
          code: AssetManifestErrorCode.INVALID_ASSET_VERSION,
        }),
      ]),
    });
  });

  it.each([
    {
      name: "empty assets",
      manifest: { manifestVersion: 1, assets: [] },
    },
    {
      name: "multiple assets",
      manifest: {
        ...validManifest("x"),
        assets: [
          ...validManifest("x").assets,
          {
            ...validManifest("x").assets[0],
            id: "skill.a.c",
            provenance: {
              ...validManifest("x").assets[0]?.provenance,
              path: "assets/skill.a.c/1.0.0",
            },
          },
        ],
      },
    },
  ])("rejects an M2 record with $name", ({ manifest }) => {
    expectBindingFailure(
      () =>
        bindManifestToContentRecord({
          manifestBytes: Buffer.from(JSON.stringify(manifest), "utf8"),
          expected,
          contentFiles,
        }),
      AssetRecordBindingClassification.INVALID_RECORD,
      AssetRecordBindingFailureReason.ASSET_COUNT_MISMATCH,
    );
  });

  it.each([
    {
      name: "asset ID",
      expected: { assetId: "skill.a.c", version: "1.0.0" },
      reason: AssetRecordBindingFailureReason.ASSET_ID_MISMATCH,
    },
    {
      name: "asset version",
      expected: { assetId: "skill.a.b", version: "2.0.0" },
      reason: AssetRecordBindingFailureReason.ASSET_VERSION_MISMATCH,
    },
    {
      name: "invalid SemVer",
      expected: { assetId: "skill.a.b", version: "01.0.0" },
      reason: AssetRecordBindingFailureReason.INVALID_EXPECTED_IDENTITY,
    },
  ])("rejects a mismatched expected $name", ({ expected: wanted, reason }) => {
    expectBindingFailure(
      () =>
        bindManifestToContentRecord({
          manifestBytes: encodeValidManifest("x"),
          expected: wanted,
          contentFiles,
        }),
      AssetRecordBindingClassification.INVALID_RECORD,
      reason,
    );
  });

  it("rejects a provenance path that differs from the canonical path", () => {
    const manifest = validManifest("x");
    const asset = manifest.assets[0];
    if (asset === undefined) {
      throw new Error("Expected valid asset fixture.");
    }
    const changed = {
      ...manifest,
      assets: [
        {
          ...asset,
          provenance: {
            ...asset.provenance,
            path: "assets/skill.a.b/1.0.1",
          },
        },
      ],
    };

    expectBindingFailure(
      () =>
        bindManifestToContentRecord({
          manifestBytes: Buffer.from(JSON.stringify(changed), "utf8"),
          expected,
          contentFiles,
        }),
      AssetRecordBindingClassification.INVALID_RECORD,
      AssetRecordBindingFailureReason.PROVENANCE_PATH_MISMATCH,
    );
  });

  it("classifies a content digest mismatch", () => {
    expectBindingFailure(
      () =>
        bindManifestToContentRecord({
          manifestBytes: encodeValidManifest("x"),
          expected,
          contentFiles: [{ path: "hello.txt", bytes: Buffer.from("changed") }],
        }),
      AssetRecordBindingClassification.INTEGRITY_MISMATCH,
      "CONTENT_DIGEST_MISMATCH",
    );
  });

  it("rejects malformed JSON without exposing input bytes", () => {
    expectBindingFailure(
      () =>
        bindManifestToContentRecord({
          manifestBytes: Buffer.from('{"secret":"do-not-report"', "utf8"),
          expected,
          contentFiles,
        }),
      AssetRecordBindingClassification.INVALID_RECORD,
      AssetRecordBindingFailureReason.MALFORMED_JSON,
    );
  });

  it("rejects malformed UTF-8 and a leading UTF-8 BOM", () => {
    for (const bytes of [
      Uint8Array.from([0xc3, 0x28]),
      Uint8Array.from([0xef, 0xbb, 0xbf, 0x7b, 0x7d]),
    ]) {
      expectBindingFailure(
        () =>
          bindManifestToContentRecord({
            manifestBytes: bytes,
            expected,
            contentFiles,
          }),
        AssetRecordBindingClassification.INVALID_RECORD,
        bytes[0] === 0xef
          ? AssetRecordBindingFailureReason.UTF8_BOM
          : AssetRecordBindingFailureReason.MALFORMED_UTF8,
      );
    }
  });

  it("rejects unsupported and SharedArrayBuffer-backed manifest bytes", () => {
    const unsupportedBytes = new DataView(new ArrayBuffer(0));
    expectBindingFailure(
      () =>
        Reflect.apply(bindManifestToContentRecord, undefined, [
          { manifestBytes: unsupportedBytes, expected, contentFiles },
        ]),
      AssetRecordBindingClassification.INVALID_RECORD,
      AssetRecordBindingFailureReason.INVALID_MANIFEST_BYTES,
    );

    if (typeof SharedArrayBuffer === "undefined") {
      throw new Error(
        "SharedArrayBuffer is required in the supported runtime.",
      );
    }
    expectBindingFailure(
      () =>
        bindManifestToContentRecord({
          manifestBytes: new Uint8Array(new SharedArrayBuffer(1)),
          expected,
          contentFiles,
        }),
      AssetRecordBindingClassification.INVALID_RECORD,
      AssetRecordBindingFailureReason.INVALID_MANIFEST_BYTES,
    );
  });

  it("rejects invalid expected identity and path components", () => {
    for (const invalidExpected of [
      {
        assetId: "../skill.a.b",
        version: "1.0.0",
        reason: AssetRecordBindingFailureReason.INVALID_CANONICAL_PATH,
      },
      {
        assetId: "Skill.a.b",
        version: "1.0.0",
        reason: AssetRecordBindingFailureReason.INVALID_EXPECTED_IDENTITY,
      },
      {
        assetId: "skill.a.b",
        version: "1.0.0/",
        reason: AssetRecordBindingFailureReason.INVALID_CANONICAL_PATH,
      },
      {
        assetId: "skill.a.b",
        version: "CON",
        reason: AssetRecordBindingFailureReason.INVALID_CANONICAL_PATH,
      },
    ]) {
      expectBindingFailure(
        () =>
          bindManifestToContentRecord({
            manifestBytes: encodeValidManifest("x"),
            expected: invalidExpected,
            contentFiles,
          }),
        AssetRecordBindingClassification.INVALID_RECORD,
        invalidExpected.reason,
      );
    }
  });

  it("accepts the inclusive manifest limit and rejects one byte over", () => {
    const targetLength = 1024 * 1024;
    const emptyDescription = encodeValidManifest("");
    const exactLimit = encodeValidManifest(
      "x".repeat(targetLength - emptyDescription.byteLength),
    );
    expect(exactLimit.byteLength).toBe(targetLength);
    expect(() =>
      bindManifestToContentRecord({
        manifestBytes: exactLimit,
        expected,
        contentFiles,
      }),
    ).not.toThrow();

    const overLimit = Buffer.concat([exactLimit, Buffer.from("#", "ascii")]);
    expect(overLimit.byteLength).toBe(targetLength + 1);
    expectBindingFailure(
      () =>
        bindManifestToContentRecord({
          manifestBytes: overLimit,
          expected,
          contentFiles,
        }),
      AssetRecordBindingClassification.RESOURCE_LIMIT,
      AssetRecordBindingFailureReason.MANIFEST_TOO_LARGE,
    );
  });

  it("propagates existing asset-tree errors unchanged", () => {
    let originalError: unknown;
    try {
      bindManifestToContentRecord({
        manifestBytes: encodeValidManifest("x"),
        expected,
        contentFiles: [{ path: "../unsafe", bytes: new Uint8Array() }],
      });
    } catch (error) {
      originalError = error;
    }

    expect(originalError).toBeInstanceOf(AssetTreeIntegrityError);
    expect(originalError).toMatchObject({
      code: AssetTreeIntegrityErrorCode.INVALID_FILE_PATH,
    });
  });

  it("preserves existing content-tree entry limits", () => {
    const tooManyFiles = Array.from({ length: 10_001 }, (_, index) => ({
      path: `file-${index.toString().padStart(5, "0")}.bin`,
      bytes: new Uint8Array(),
    }));
    let originalError: unknown;
    try {
      bindManifestToContentRecord({
        manifestBytes: encodeValidManifest("x"),
        expected,
        contentFiles: tooManyFiles,
      });
    } catch (error) {
      originalError = error;
    }

    expect(originalError).toBeInstanceOf(AssetTreeIntegrityError);
    expect(originalError).toMatchObject({
      code: AssetTreeIntegrityErrorCode.RESOURCE_LIMIT_EXCEEDED,
    });
  });

  it("uses the raw snapshot digest, not a reserialized manifest digest", () => {
    const vector = manifestVectors.vectors[0];
    if (vector === undefined) {
      throw new Error("Required compact manifest vector is missing.");
    }
    const bytes = manifestBytes(vector);
    const result = bindManifestToContentRecord({
      manifestBytes: bytes,
      expected,
      contentFiles,
    });
    expect(result.manifestSha256).toBe(
      createHash("sha256").update(bytes).digest("hex"),
    );
  });
});
