import { createHash } from "node:crypto";
import {
  type Asset,
  parseAssetManifest,
  safeParseAssetManifest,
} from "@devorbit/core";
import {
  type AssetTreeFile,
  computeAssetTreeDigest,
} from "../integrity/asset-tree.js";

const maxManifestBytes = 1024 * 1024;
const portablePathSegment = /^[A-Za-z0-9._@+-]+$/;
const reservedDeviceName = /^(?:CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i;

export const AssetRecordBindingClassification = {
  INVALID_RECORD: "REGISTRY_INVALID_RECORD",
  INTEGRITY_MISMATCH: "INTEGRITY_MISMATCH",
  RESOURCE_LIMIT: "RESOURCE_LIMIT_EXCEEDED",
} as const;

export type AssetRecordBindingClassificationValue =
  (typeof AssetRecordBindingClassification)[keyof typeof AssetRecordBindingClassification];

export const AssetRecordBindingFailureReason = {
  INVALID_MANIFEST_BYTES: "INVALID_MANIFEST_BYTES",
  MALFORMED_UTF8: "MALFORMED_UTF8",
  UTF8_BOM: "UTF8_BOM",
  MALFORMED_JSON: "MALFORMED_JSON",
  INVALID_EXPECTED_IDENTITY: "INVALID_EXPECTED_IDENTITY",
  INVALID_CANONICAL_PATH: "INVALID_CANONICAL_PATH",
  ASSET_COUNT_MISMATCH: "ASSET_COUNT_MISMATCH",
  ASSET_ID_MISMATCH: "ASSET_ID_MISMATCH",
  ASSET_VERSION_MISMATCH: "ASSET_VERSION_MISMATCH",
  PROVENANCE_PATH_MISMATCH: "PROVENANCE_PATH_MISMATCH",
  MANIFEST_TOO_LARGE: "MANIFEST_TOO_LARGE",
  CONTENT_DIGEST_MISMATCH: "CONTENT_DIGEST_MISMATCH",
} as const;

export type AssetRecordBindingFailureReasonValue =
  (typeof AssetRecordBindingFailureReason)[keyof typeof AssetRecordBindingFailureReason];

export class AssetRecordBindingError extends Error {
  readonly classification: AssetRecordBindingClassificationValue;
  readonly reason: AssetRecordBindingFailureReasonValue;

  constructor(
    classification: AssetRecordBindingClassificationValue,
    reason: AssetRecordBindingFailureReasonValue,
  ) {
    super("Asset record binding failed.");
    this.name = "AssetRecordBindingError";
    this.classification = classification;
    this.reason = reason;
  }
}

export interface AssetRecordBindingInput {
  readonly manifestBytes: Uint8Array;
  readonly expected: {
    readonly assetId: string;
    readonly version: string;
  };
  readonly contentFiles: readonly AssetTreeFile[];
}

export interface AssetRecord {
  readonly asset: Asset;
  readonly manifestSha256: string;
  readonly contentTreeSha256: string;
}

function invalidRecord(reason: AssetRecordBindingFailureReasonValue): never {
  throw new AssetRecordBindingError(
    AssetRecordBindingClassification.INVALID_RECORD,
    reason,
  );
}

function invalidExpectedPath(): never {
  return invalidRecord(AssetRecordBindingFailureReason.INVALID_CANONICAL_PATH);
}

function deriveCanonicalVersionPath(assetId: string, version: string): string {
  const path = `assets/${assetId}/${version}`;
  const segments = path.split("/");
  if (
    path.startsWith("/") ||
    path.includes("\\") ||
    path.includes(":") ||
    segments.length !== 3 ||
    segments.some(
      (segment) =>
        segment.length === 0 ||
        segment === "." ||
        segment === ".." ||
        segment.endsWith(".") ||
        segment.endsWith(" ") ||
        !portablePathSegment.test(segment) ||
        reservedDeviceName.test(segment.split(".", 1)[0] ?? ""),
    )
  ) {
    return invalidExpectedPath();
  }
  return path;
}

function validateManifestBytes(input: unknown): Buffer {
  if (!(input instanceof Uint8Array)) {
    return invalidRecord(
      AssetRecordBindingFailureReason.INVALID_MANIFEST_BYTES,
    );
  }

  if (
    typeof SharedArrayBuffer !== "undefined" &&
    input.buffer instanceof SharedArrayBuffer
  ) {
    return invalidRecord(
      AssetRecordBindingFailureReason.INVALID_MANIFEST_BYTES,
    );
  }

  if (input.byteLength > maxManifestBytes) {
    throw new AssetRecordBindingError(
      AssetRecordBindingClassification.RESOURCE_LIMIT,
      AssetRecordBindingFailureReason.MANIFEST_TOO_LARGE,
    );
  }

  return Buffer.from(input);
}

function decodeManifest(snapshot: Uint8Array): string {
  if (
    snapshot.byteLength >= 3 &&
    snapshot[0] === 0xef &&
    snapshot[1] === 0xbb &&
    snapshot[2] === 0xbf
  ) {
    return invalidRecord(AssetRecordBindingFailureReason.UTF8_BOM);
  }

  try {
    return new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(
      snapshot,
    );
  } catch (error) {
    if (error instanceof TypeError) {
      return invalidRecord(AssetRecordBindingFailureReason.MALFORMED_UTF8);
    }
    throw error;
  }
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch (error) {
    if (error instanceof SyntaxError) {
      return invalidRecord(AssetRecordBindingFailureReason.MALFORMED_JSON);
    }
    throw error;
  }
}

export function bindManifestToContentRecord(
  input: AssetRecordBindingInput,
): AssetRecord {
  if (
    typeof input !== "object" ||
    input === null ||
    typeof input.expected !== "object" ||
    input.expected === null ||
    typeof input.expected.assetId !== "string" ||
    typeof input.expected.version !== "string"
  ) {
    return invalidRecord(
      AssetRecordBindingFailureReason.INVALID_EXPECTED_IDENTITY,
    );
  }

  const expectedPath = deriveCanonicalVersionPath(
    input.expected.assetId,
    input.expected.version,
  );
  const manifestSnapshot = validateManifestBytes(input.manifestBytes);
  const manifestSha256 = createHash("sha256")
    .update(manifestSnapshot)
    .digest("hex");
  const parsedJson = parseJson(decodeManifest(manifestSnapshot));
  const manifest = parseAssetManifest(parsedJson);

  if (manifest.assets.length !== 1) {
    return invalidRecord(AssetRecordBindingFailureReason.ASSET_COUNT_MISMATCH);
  }

  const asset = manifest.assets[0];
  if (asset === undefined) {
    return invalidRecord(AssetRecordBindingFailureReason.ASSET_COUNT_MISMATCH);
  }

  const expectedIdentityValidation = safeParseAssetManifest({
    manifestVersion: 1,
    assets: [
      {
        ...asset,
        id: input.expected.assetId,
        version: input.expected.version,
      },
    ],
  });
  if (!expectedIdentityValidation.success) {
    return invalidRecord(
      AssetRecordBindingFailureReason.INVALID_EXPECTED_IDENTITY,
    );
  }

  if (asset.id !== input.expected.assetId) {
    return invalidRecord(AssetRecordBindingFailureReason.ASSET_ID_MISMATCH);
  }
  if (asset.version !== input.expected.version) {
    return invalidRecord(
      AssetRecordBindingFailureReason.ASSET_VERSION_MISMATCH,
    );
  }
  if (asset.provenance.path !== expectedPath) {
    return invalidRecord(
      AssetRecordBindingFailureReason.PROVENANCE_PATH_MISMATCH,
    );
  }

  const contentTreeSha256 = computeAssetTreeDigest(input.contentFiles);
  if (contentTreeSha256 !== asset.integrity.digest) {
    throw new AssetRecordBindingError(
      AssetRecordBindingClassification.INTEGRITY_MISMATCH,
      AssetRecordBindingFailureReason.CONTENT_DIGEST_MISMATCH,
    );
  }

  return { asset, manifestSha256, contentTreeSha256 };
}
