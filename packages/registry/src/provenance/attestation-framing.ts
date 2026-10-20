import { constants as bufferConstants } from "node:buffer";
import { createHash } from "node:crypto";
import { AssetManifestErrorCode, safeParseAssetManifest } from "@devorbit/core";
import type { AssetRecord } from "../manifest/asset-record.js";

const lookupDomain = Buffer.from("DEVORBIT-ATTESTATION-LOOKUP\0v1\0", "ascii");
const signedPayloadDomain = Buffer.from(
  "DEVORBIT-DETACHED-ATTESTATION\0v1\0",
  "ascii",
);
const contentTreeAlgorithm = "devorbit-asset-tree-v1";
const repositoryPattern =
  /^[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?\/[A-Za-z0-9](?:[A-Za-z0-9._-]*[A-Za-z0-9])?$/;
const revisionPattern = /^[a-f0-9]{40}$/;
const sha256Pattern = /^[a-f0-9]{64}$/;
const signerKeyIdPattern = /^sha256:[a-f0-9]{64}$/;
const portablePathSegment = /^[A-Za-z0-9._@+-]+$/;
const reservedDeviceName = /^(?:CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i;
const maxUint32 = 0xffff_ffff;
const maxBufferLength = Math.min(maxUint32, bufferConstants.MAX_LENGTH);

export const AttestationFramingFailureReason = {
  INVALID_INPUT: "INVALID_INPUT",
  INVALID_REPOSITORY_ID: "INVALID_REPOSITORY_ID",
  INVALID_REVISION: "INVALID_REVISION",
  INVALID_ASSET_RECORD: "INVALID_ASSET_RECORD",
  INVALID_ASSET_PATH: "INVALID_ASSET_PATH",
  INVALID_ASSET_ID: "INVALID_ASSET_ID",
  INVALID_ASSET_VERSION: "INVALID_ASSET_VERSION",
  INVALID_DIGEST: "INVALID_DIGEST",
  INVALID_SIGNER_KEY_ID: "INVALID_SIGNER_KEY_ID",
  FIELD_TOO_LARGE: "FIELD_TOO_LARGE",
} as const;

export type AttestationFramingFailureReason =
  (typeof AttestationFramingFailureReason)[keyof typeof AttestationFramingFailureReason];

export class AttestationFramingError extends Error {
  readonly reason: AttestationFramingFailureReason;

  constructor(reason: AttestationFramingFailureReason) {
    super("Attestation framing input is invalid.");
    this.name = "AttestationFramingError";
    this.reason = reason;
  }
}

export interface AttestationFramingInput {
  readonly repositoryId: string;
  readonly revision: string;
  readonly record: AssetRecord;
  readonly signerKeyId: string;
}

export interface AttestationFramingOutput {
  readonly lookupId: string;
  readonly signedPayload: Uint8Array;
}

function fail(reason: AttestationFramingFailureReason): never {
  throw new AttestationFramingError(reason);
}

function utf8Field(value: string): Buffer {
  const byteLength = Buffer.byteLength(value, "utf8");
  if (byteLength > maxBufferLength) {
    return fail(AttestationFramingFailureReason.FIELD_TOO_LARGE);
  }
  return Buffer.from(value, "utf8");
}

function frameFields(domain: Buffer, fields: readonly string[]): Buffer {
  const encodedFields = fields.map(utf8Field);
  const totalLength =
    domain.byteLength +
    encodedFields.reduce((length, field) => length + 4 + field.byteLength, 0);
  if (totalLength > bufferConstants.MAX_LENGTH) {
    return fail(AttestationFramingFailureReason.FIELD_TOO_LARGE);
  }
  const stream = Buffer.alloc(totalLength);
  let offset = 0;
  domain.copy(stream, offset);
  offset += domain.byteLength;

  for (const field of encodedFields) {
    stream.writeUInt32BE(field.byteLength, offset);
    offset += 4;
    field.copy(stream, offset);
    offset += field.byteLength;
  }

  return stream;
}

function validateAssetPath(
  path: string,
  assetId: string,
  version: string,
): void {
  const expectedPath = `assets/${assetId}/${version}`;
  const segments = path.split("/");
  if (
    path !== expectedPath ||
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
    fail(AttestationFramingFailureReason.INVALID_ASSET_PATH);
  }
}

function normalizeAndValidate(
  input: AttestationFramingInput,
): AttestationFramingOutput {
  if (typeof input !== "object" || input === null) {
    return fail(AttestationFramingFailureReason.INVALID_INPUT);
  }

  const repositoryId = input.repositoryId;
  const revision = input.revision;
  const signerKeyId = input.signerKeyId;
  const record = input.record;

  if (
    typeof repositoryId !== "string" ||
    !repositoryPattern.test(repositoryId)
  ) {
    return fail(AttestationFramingFailureReason.INVALID_REPOSITORY_ID);
  }
  if (typeof revision !== "string" || !revisionPattern.test(revision)) {
    return fail(AttestationFramingFailureReason.INVALID_REVISION);
  }
  if (
    typeof signerKeyId !== "string" ||
    !signerKeyIdPattern.test(signerKeyId)
  ) {
    return fail(AttestationFramingFailureReason.INVALID_SIGNER_KEY_ID);
  }
  if (typeof record !== "object" || record === null) {
    return fail(AttestationFramingFailureReason.INVALID_ASSET_RECORD);
  }

  const asset = record.asset;
  if (typeof asset !== "object" || asset === null) {
    return fail(AttestationFramingFailureReason.INVALID_ASSET_RECORD);
  }

  const assetId = asset.id;
  const assetVersion = asset.version;
  const assetPath = asset.provenance?.path;
  const assetIntegrity = asset.integrity;
  const manifestSha256 = record.manifestSha256;
  const contentTreeSha256 = record.contentTreeSha256;

  if (typeof assetId !== "string") {
    return fail(AttestationFramingFailureReason.INVALID_ASSET_ID);
  }
  if (typeof assetVersion !== "string") {
    return fail(AttestationFramingFailureReason.INVALID_ASSET_VERSION);
  }
  if (typeof assetPath !== "string") {
    return fail(AttestationFramingFailureReason.INVALID_ASSET_RECORD);
  }
  validateAssetPath(assetPath, assetId, assetVersion);

  const m1Validation = safeParseAssetManifest({
    manifestVersion: 1,
    assets: [asset],
  });
  if (!m1Validation.success) {
    const errorCodes = new Set(
      m1Validation.error.issues.map(({ code }) => code),
    );
    return fail(
      errorCodes.has(AssetManifestErrorCode.INVALID_ASSET_ID)
        ? AttestationFramingFailureReason.INVALID_ASSET_ID
        : errorCodes.has(AssetManifestErrorCode.INVALID_ASSET_VERSION)
          ? AttestationFramingFailureReason.INVALID_ASSET_VERSION
          : AttestationFramingFailureReason.INVALID_ASSET_RECORD,
    );
  }

  if (
    typeof assetIntegrity !== "object" ||
    assetIntegrity === null ||
    assetIntegrity.algorithm !== "sha256" ||
    typeof assetIntegrity.digest !== "string" ||
    !sha256Pattern.test(assetIntegrity.digest) ||
    typeof manifestSha256 !== "string" ||
    !sha256Pattern.test(manifestSha256) ||
    typeof contentTreeSha256 !== "string" ||
    !sha256Pattern.test(contentTreeSha256) ||
    contentTreeSha256 !== assetIntegrity.digest
  ) {
    return fail(AttestationFramingFailureReason.INVALID_DIGEST);
  }

  const normalizedRepositoryId = repositoryId.toLowerCase();
  const lookupStream = frameFields(lookupDomain, [
    normalizedRepositoryId,
    revision,
    assetPath,
  ]);
  const signedPayload = frameFields(signedPayloadDomain, [
    normalizedRepositoryId,
    revision,
    assetPath,
    assetId,
    assetVersion,
    manifestSha256,
    contentTreeAlgorithm,
    contentTreeSha256,
    signerKeyId,
  ]);

  return {
    lookupId: createHash("sha256").update(lookupStream).digest("hex"),
    signedPayload: Buffer.from(signedPayload),
  };
}

export function frameAttestation(
  input: AttestationFramingInput,
): AttestationFramingOutput {
  return normalizeAndValidate(input);
}
