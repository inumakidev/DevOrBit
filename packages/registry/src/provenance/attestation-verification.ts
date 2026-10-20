import { createHash, createPublicKey, verify } from "node:crypto";
import { type Asset, safeParseAssetManifest } from "@devorbit/core";
import type { AssetRecord } from "../manifest/asset-record.js";
import type {
  DetachedAttestationPayload,
  ParsedDetachedAttestationEnvelope,
} from "./attestation-envelope.js";
import {
  AttestationFramingError,
  frameAttestation,
} from "./attestation-framing.js";

const contentTreeAlgorithm = "devorbit-asset-tree-v1";
const repositoryPattern =
  /^[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?\/[A-Za-z0-9](?:[A-Za-z0-9._-]*[A-Za-z0-9])?$/;
const revisionPattern = /^[a-f0-9]{40}$/;
const sha256Pattern = /^[a-f0-9]{64}$/;
const signerKeyIdPattern = /^sha256:[a-f0-9]{64}$/;
const assetIdPattern =
  /^[a-z0-9]+(?:-[a-z0-9]+)*\.[a-z0-9]+(?:-[a-z0-9]+)*\.[a-z0-9]+(?:-[a-z0-9]+)*$/;
const portablePathSegment = /^[A-Za-z0-9._@+-]+$/;
const reservedDeviceName = /^(?:CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i;
const spkiEd25519Prefix = Buffer.from("302a300506032b6570032100", "hex");
const payloadFields = [
  "repositoryId",
  "revision",
  "assetPath",
  "assetId",
  "assetVersion",
  "manifestSha256",
  "contentTreeAlgorithm",
  "contentTreeSha256",
  "signerKeyId",
] as const;

export const AttestationVerificationFailureReason = {
  INVALID_INPUT: "INVALID_INPUT",
  BINDING_MISMATCH: "BINDING_MISMATCH",
  KEY_MISMATCH: "KEY_MISMATCH",
  INVALID_SIGNATURE: "INVALID_SIGNATURE",
} as const;

export type AttestationVerificationFailureReason =
  (typeof AttestationVerificationFailureReason)[keyof typeof AttestationVerificationFailureReason];

export class AttestationVerificationError extends Error {
  readonly reason: AttestationVerificationFailureReason;

  constructor(reason: AttestationVerificationFailureReason) {
    super("Attestation verification failed.");
    this.name = "AttestationVerificationError";
    this.reason = reason;
  }
}

export interface VerifyDetachedAttestationInput {
  readonly envelope: ParsedDetachedAttestationEnvelope;
  readonly repositoryId: string;
  readonly revision: string;
  readonly record: AssetRecord;
  readonly publicKey: Uint8Array;
}

export interface VerifyDetachedAttestationOutput {
  readonly signatureValid: true;
  readonly contextConsistent: true;
}

function fail(reason: AttestationVerificationFailureReason): never {
  throw new AttestationVerificationError(reason);
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function matchesExactly(pattern: RegExp, value: string): boolean {
  return pattern.test(value) && pattern.exec(value)?.[0] === value;
}

function hasExactlyKeys(
  value: Record<string, unknown>,
  expected: readonly string[],
): boolean {
  const keys = Reflect.ownKeys(value);
  return (
    keys.length === expected.length &&
    keys.every((key) => typeof key === "string" && expected.includes(key)) &&
    expected.every((key) => Object.hasOwn(value, key))
  );
}

function isSharedArrayBufferBacked(bytes: Uint8Array): boolean {
  return (
    typeof SharedArrayBuffer !== "undefined" &&
    bytes.buffer instanceof SharedArrayBuffer
  );
}

function validatePayload(payloadValue: unknown): DetachedAttestationPayload {
  if (!isObject(payloadValue) || !hasExactlyKeys(payloadValue, payloadFields)) {
    return fail(AttestationVerificationFailureReason.INVALID_INPUT);
  }

  const payload = payloadValue;
  if (
    payloadFields.some((field) => typeof payload[field] !== "string") ||
    payload.contentTreeAlgorithm !== contentTreeAlgorithm ||
    typeof payload.repositoryId !== "string" ||
    !matchesExactly(repositoryPattern, payload.repositoryId) ||
    payload.repositoryId !== payload.repositoryId.toLowerCase() ||
    typeof payload.revision !== "string" ||
    !matchesExactly(revisionPattern, payload.revision) ||
    typeof payload.assetId !== "string" ||
    !matchesExactly(assetIdPattern, payload.assetId) ||
    typeof payload.assetVersion !== "string" ||
    typeof payload.assetPath !== "string" ||
    payload.assetPath !== `assets/${payload.assetId}/${payload.assetVersion}` ||
    typeof payload.manifestSha256 !== "string" ||
    !matchesExactly(sha256Pattern, payload.manifestSha256) ||
    typeof payload.contentTreeSha256 !== "string" ||
    !matchesExactly(sha256Pattern, payload.contentTreeSha256) ||
    typeof payload.signerKeyId !== "string" ||
    !matchesExactly(signerKeyIdPattern, payload.signerKeyId)
  ) {
    return fail(AttestationVerificationFailureReason.INVALID_INPUT);
  }

  const pathSegments = payload.assetPath.split("/");
  if (
    pathSegments.some(
      (segment) =>
        segment.length === 0 ||
        segment === "." ||
        segment === ".." ||
        segment.endsWith(".") ||
        segment.endsWith(" ") ||
        !matchesExactly(portablePathSegment, segment) ||
        matchesExactly(reservedDeviceName, segment.split(".", 1)[0] ?? ""),
    )
  ) {
    return fail(AttestationVerificationFailureReason.INVALID_INPUT);
  }

  return {
    repositoryId: payload.repositoryId,
    revision: payload.revision,
    assetPath: payload.assetPath,
    assetId: payload.assetId,
    assetVersion: payload.assetVersion,
    manifestSha256: payload.manifestSha256,
    contentTreeAlgorithm,
    contentTreeSha256: payload.contentTreeSha256,
    signerKeyId: payload.signerKeyId,
  };
}

function validateRecord(recordValue: unknown): AssetRecord {
  if (
    !isObject(recordValue) ||
    !hasExactlyKeys(recordValue, [
      "asset",
      "manifestSha256",
      "contentTreeSha256",
    ])
  ) {
    return fail(AttestationVerificationFailureReason.INVALID_INPUT);
  }

  const record = recordValue;
  const assetValue = record.asset;
  if (!isObject(assetValue)) {
    return fail(AttestationVerificationFailureReason.INVALID_INPUT);
  }

  const provenanceValue = assetValue.provenance;
  const integrityValue = assetValue.integrity;
  if (
    typeof record.manifestSha256 !== "string" ||
    !matchesExactly(sha256Pattern, record.manifestSha256) ||
    typeof record.contentTreeSha256 !== "string" ||
    !matchesExactly(sha256Pattern, record.contentTreeSha256) ||
    !isObject(provenanceValue) ||
    typeof provenanceValue.repository !== "string" ||
    !matchesExactly(repositoryPattern, provenanceValue.repository) ||
    typeof provenanceValue.revision !== "string" ||
    !matchesExactly(revisionPattern, provenanceValue.revision) ||
    !isObject(integrityValue) ||
    typeof integrityValue.digest !== "string" ||
    !matchesExactly(sha256Pattern, integrityValue.digest)
  ) {
    return fail(AttestationVerificationFailureReason.INVALID_INPUT);
  }

  const validation = safeParseAssetManifest({
    manifestVersion: 1,
    assets: [assetValue],
  });
  if (
    !validation.success ||
    !matchesExactly(sha256Pattern, record.manifestSha256) ||
    !matchesExactly(sha256Pattern, record.contentTreeSha256)
  ) {
    return fail(AttestationVerificationFailureReason.INVALID_INPUT);
  }

  const asset = validation.data.assets[0];
  if (
    asset === undefined ||
    asset.integrity.algorithm !== "sha256" ||
    asset.integrity.digest !== record.contentTreeSha256
  ) {
    return fail(AttestationVerificationFailureReason.INVALID_INPUT);
  }

  return {
    asset,
    manifestSha256: record.manifestSha256,
    contentTreeSha256: record.contentTreeSha256,
  };
}

function validateEnvelope(envelopeValue: unknown): {
  readonly payload: DetachedAttestationPayload;
  readonly signature: Buffer;
} {
  if (
    !isObject(envelopeValue) ||
    !hasExactlyKeys(envelopeValue, [
      "payload",
      "signature",
      "envelopeSha256",
    ]) ||
    typeof envelopeValue.envelopeSha256 !== "string" ||
    !matchesExactly(sha256Pattern, envelopeValue.envelopeSha256) ||
    !(envelopeValue.signature instanceof Uint8Array) ||
    isSharedArrayBufferBacked(envelopeValue.signature) ||
    envelopeValue.signature.byteLength !== 64
  ) {
    return fail(AttestationVerificationFailureReason.INVALID_INPUT);
  }

  return {
    payload: validatePayload(envelopeValue.payload),
    signature: Buffer.from(envelopeValue.signature),
  };
}

function validateAssetIdentityClaims(
  payload: DetachedAttestationPayload,
  asset: Asset,
): void {
  const validation = safeParseAssetManifest({
    manifestVersion: 1,
    assets: [
      {
        ...asset,
        id: payload.assetId,
        version: payload.assetVersion,
      },
    ],
  });
  if (!validation.success) {
    fail(AttestationVerificationFailureReason.INVALID_INPUT);
  }
}

function canonicalRepositoryId(value: unknown): string {
  if (typeof value !== "string" || !matchesExactly(repositoryPattern, value)) {
    return fail(AttestationVerificationFailureReason.INVALID_INPUT);
  }
  return value.toLowerCase();
}

export function verifyDetachedAttestation(
  input: VerifyDetachedAttestationInput,
): VerifyDetachedAttestationOutput {
  if (
    !isObject(input) ||
    !hasExactlyKeys(input, [
      "envelope",
      "repositoryId",
      "revision",
      "record",
      "publicKey",
    ]) ||
    typeof input.revision !== "string" ||
    !matchesExactly(revisionPattern, input.revision) ||
    !(input.publicKey instanceof Uint8Array) ||
    isSharedArrayBufferBacked(input.publicKey) ||
    input.publicKey.byteLength !== 32
  ) {
    return fail(AttestationVerificationFailureReason.INVALID_INPUT);
  }

  const repositoryId = canonicalRepositoryId(input.repositoryId);
  const record = validateRecord(input.record);
  const envelope = validateEnvelope(input.envelope);
  const asset = record.asset;
  validateAssetIdentityClaims(envelope.payload, asset);

  const provenanceRepository = canonicalRepositoryId(
    asset.provenance.repository,
  );
  if (
    provenanceRepository !== repositoryId ||
    asset.provenance.revision !== input.revision
  ) {
    return fail(AttestationVerificationFailureReason.BINDING_MISMATCH);
  }

  const publicKey = Buffer.from(input.publicKey);
  const signerKeyId = `sha256:${createHash("sha256").update(publicKey).digest("hex")}`;
  if (envelope.payload.signerKeyId !== signerKeyId) {
    return fail(AttestationVerificationFailureReason.KEY_MISMATCH);
  }

  let framed: ReturnType<typeof frameAttestation>;
  try {
    framed = frameAttestation({
      repositoryId,
      revision: input.revision,
      record,
      signerKeyId,
    });
  } catch (error) {
    if (error instanceof AttestationFramingError) {
      return fail(AttestationVerificationFailureReason.INVALID_INPUT);
    }
    throw error;
  }

  const expectedClaims: DetachedAttestationPayload = {
    repositoryId,
    revision: input.revision,
    assetPath: asset.provenance.path,
    assetId: asset.id,
    assetVersion: asset.version,
    manifestSha256: record.manifestSha256,
    contentTreeAlgorithm,
    contentTreeSha256: record.contentTreeSha256,
    signerKeyId,
  };
  for (const field of payloadFields) {
    if (envelope.payload[field] !== expectedClaims[field]) {
      return fail(AttestationVerificationFailureReason.BINDING_MISMATCH);
    }
  }

  let importedKey: ReturnType<typeof createPublicKey>;
  try {
    importedKey = createPublicKey({
      key: Buffer.concat([spkiEd25519Prefix, publicKey]),
      format: "der",
      type: "spki",
    });
  } catch {
    return fail(AttestationVerificationFailureReason.INVALID_INPUT);
  }

  let signatureValid: boolean;
  try {
    signatureValid = verify(
      null,
      Buffer.from(framed.signedPayload),
      importedKey,
      envelope.signature,
    );
  } catch {
    return fail(AttestationVerificationFailureReason.INVALID_INPUT);
  }
  if (!signatureValid) {
    return fail(AttestationVerificationFailureReason.INVALID_SIGNATURE);
  }

  return { signatureValid: true, contextConsistent: true };
}
