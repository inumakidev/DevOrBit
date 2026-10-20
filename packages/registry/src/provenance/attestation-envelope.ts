import { createHash } from "node:crypto";
import {
  type AssetKind,
  AssetManifestErrorCode,
  assetKinds,
  safeParseAssetManifest,
} from "@devorbit/core";

const maxEnvelopeBytes = 64 * 1024;
const maxJsonDepth = 8;
const maxJsonNodes = 128;
const envelopeFormat = "devorbit-detached-attestation-v1";
const contentTreeAlgorithm = "devorbit-asset-tree-v1";
const repositoryPattern =
  /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\/[a-z0-9](?:[a-z0-9._-]*[a-z0-9])?$/;
const revisionPattern = /^[a-f0-9]{40}$/;
const sha256Pattern = /^[a-f0-9]{64}$/;
const signerKeyIdPattern = /^sha256:[a-f0-9]{64}$/;
const portablePathSegment = /^[A-Za-z0-9._@+-]+$/;
const reservedDeviceName = /^(?:CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i;

export const DetachedAttestationEnvelopeFailureReason = {
  INVALID_INPUT: "INVALID_INPUT",
  ENVELOPE_TOO_LARGE: "ENVELOPE_TOO_LARGE",
  UTF8_BOM: "UTF8_BOM",
  MALFORMED_UTF8: "MALFORMED_UTF8",
  MALFORMED_JSON: "MALFORMED_JSON",
  DUPLICATE_JSON_KEY: "DUPLICATE_JSON_KEY",
  JSON_DEPTH_EXCEEDED: "JSON_DEPTH_EXCEEDED",
  JSON_NODE_LIMIT_EXCEEDED: "JSON_NODE_LIMIT_EXCEEDED",
  INVALID_ENVELOPE_SHAPE: "INVALID_ENVELOPE_SHAPE",
  INVALID_ENVELOPE_FORMAT: "INVALID_ENVELOPE_FORMAT",
  INVALID_REPOSITORY_ID: "INVALID_REPOSITORY_ID",
  INVALID_REVISION: "INVALID_REVISION",
  INVALID_ASSET_PATH: "INVALID_ASSET_PATH",
  INVALID_ASSET_ID: "INVALID_ASSET_ID",
  INVALID_ASSET_VERSION: "INVALID_ASSET_VERSION",
  INVALID_DIGEST: "INVALID_DIGEST",
  INVALID_CONTENT_TREE_ALGORITHM: "INVALID_CONTENT_TREE_ALGORITHM",
  INVALID_SIGNER_KEY_ID: "INVALID_SIGNER_KEY_ID",
  INVALID_SIGNATURE_ENCODING: "INVALID_SIGNATURE_ENCODING",
} as const;

export type DetachedAttestationEnvelopeFailureReason =
  (typeof DetachedAttestationEnvelopeFailureReason)[keyof typeof DetachedAttestationEnvelopeFailureReason];

export class DetachedAttestationEnvelopeError extends Error {
  readonly reason: DetachedAttestationEnvelopeFailureReason;

  constructor(reason: DetachedAttestationEnvelopeFailureReason) {
    super("Detached attestation envelope is invalid.");
    this.name = "DetachedAttestationEnvelopeError";
    this.reason = reason;
  }
}

export interface DetachedAttestationPayload {
  readonly repositoryId: string;
  readonly revision: string;
  readonly assetPath: string;
  readonly assetId: string;
  readonly assetVersion: string;
  readonly manifestSha256: string;
  readonly contentTreeAlgorithm: typeof contentTreeAlgorithm;
  readonly contentTreeSha256: string;
  readonly signerKeyId: string;
}

export interface ParsedDetachedAttestationEnvelope {
  readonly payload: DetachedAttestationPayload;
  readonly signature: Uint8Array;
  readonly envelopeSha256: string;
}

export interface ParseDetachedAttestationEnvelopeInput {
  readonly envelopeBytes: Uint8Array;
}

type JsonObject = { readonly [key: string]: JsonValue };
type JsonValue = string | number | boolean | null | JsonObject | JsonValue[];

function fail(reason: DetachedAttestationEnvelopeFailureReason): never {
  throw new DetachedAttestationEnvelopeError(reason);
}

function matchesExactly(pattern: RegExp, value: string): boolean {
  return pattern.test(value) && pattern.exec(value)?.[0] === value;
}

class StrictJsonParser {
  private offset = 0;
  private nodeCount = 0;

  constructor(private readonly text: string) {}

  parse(): JsonValue {
    this.skipWhitespace();
    const value = this.parseValue(0);
    this.skipWhitespace();
    if (this.offset !== this.text.length) {
      return fail(DetachedAttestationEnvelopeFailureReason.MALFORMED_JSON);
    }
    return value;
  }

  // Count each JSON value, including containers, and each decoded object key.
  private countNode(): void {
    this.nodeCount += 1;
    if (this.nodeCount > maxJsonNodes) {
      fail(DetachedAttestationEnvelopeFailureReason.JSON_NODE_LIMIT_EXCEEDED);
    }
  }

  private skipWhitespace(): void {
    while (this.offset < this.text.length) {
      const char = this.text.charCodeAt(this.offset);
      if (char !== 0x20 && char !== 0x09 && char !== 0x0a && char !== 0x0d) {
        break;
      }
      this.offset += 1;
    }
  }

  private parseValue(parentDepth: number): JsonValue {
    this.skipWhitespace();
    this.countNode();
    const char = this.text[this.offset];

    if (char === "{") {
      return this.parseObject(parentDepth + 1);
    }
    if (char === "[") {
      return this.parseArray(parentDepth + 1);
    }
    if (char === '"') {
      return this.parseString();
    }
    if (char === "t") {
      return this.parseLiteral("true", true);
    }
    if (char === "f") {
      return this.parseLiteral("false", false);
    }
    if (char === "n") {
      return this.parseLiteral("null", null);
    }
    if (char === "-" || (char !== undefined && char >= "0" && char <= "9")) {
      return this.parseNumber();
    }
    return fail(DetachedAttestationEnvelopeFailureReason.MALFORMED_JSON);
  }

  private parseObject(depth: number): JsonObject {
    if (depth > maxJsonDepth) {
      return fail(DetachedAttestationEnvelopeFailureReason.JSON_DEPTH_EXCEEDED);
    }
    this.offset += 1;
    this.skipWhitespace();

    const result = Object.create(null) as Record<string, JsonValue>;
    const keys = new Set<string>();
    if (this.consume("}")) {
      return result;
    }

    while (true) {
      if (this.text[this.offset] !== '"') {
        return fail(DetachedAttestationEnvelopeFailureReason.MALFORMED_JSON);
      }
      this.countNode();
      const key = this.parseString();
      if (keys.has(key)) {
        return fail(
          DetachedAttestationEnvelopeFailureReason.DUPLICATE_JSON_KEY,
        );
      }
      keys.add(key);
      this.skipWhitespace();
      if (!this.consume(":")) {
        return fail(DetachedAttestationEnvelopeFailureReason.MALFORMED_JSON);
      }
      result[key] = this.parseValue(depth);
      this.skipWhitespace();
      if (this.consume("}")) {
        return result;
      }
      if (!this.consume(",")) {
        return fail(DetachedAttestationEnvelopeFailureReason.MALFORMED_JSON);
      }
      this.skipWhitespace();
    }
  }

  private parseArray(depth: number): JsonValue[] {
    if (depth > maxJsonDepth) {
      return fail(DetachedAttestationEnvelopeFailureReason.JSON_DEPTH_EXCEEDED);
    }
    this.offset += 1;
    this.skipWhitespace();

    const result: JsonValue[] = [];
    if (this.consume("]")) {
      return result;
    }

    while (true) {
      result.push(this.parseValue(depth));
      this.skipWhitespace();
      if (this.consume("]")) {
        return result;
      }
      if (!this.consume(",")) {
        return fail(DetachedAttestationEnvelopeFailureReason.MALFORMED_JSON);
      }
      this.skipWhitespace();
    }
  }

  private parseString(): string {
    this.offset += 1;
    const parts: string[] = [];

    while (this.offset < this.text.length) {
      const char = this.text.charCodeAt(this.offset);
      this.offset += 1;

      if (char === 0x22) {
        return parts.join("");
      }
      if (char < 0x20) {
        return fail(DetachedAttestationEnvelopeFailureReason.MALFORMED_JSON);
      }
      if (char === 0x5c) {
        const escaped = this.text[this.offset];
        this.offset += 1;
        if (escaped === '"' || escaped === "\\" || escaped === "/") {
          parts.push(escaped);
        } else if (escaped === "b") {
          parts.push("\b");
        } else if (escaped === "f") {
          parts.push("\f");
        } else if (escaped === "n") {
          parts.push("\n");
        } else if (escaped === "r") {
          parts.push("\r");
        } else if (escaped === "t") {
          parts.push("\t");
        } else if (escaped === "u") {
          const first = this.parseHexCodeUnit();
          if (first >= 0xd800 && first <= 0xdbff) {
            if (this.text.slice(this.offset, this.offset + 2) !== "\\u") {
              return fail(
                DetachedAttestationEnvelopeFailureReason.MALFORMED_JSON,
              );
            }
            this.offset += 2;
            const second = this.parseHexCodeUnit();
            if (second < 0xdc00 || second > 0xdfff) {
              return fail(
                DetachedAttestationEnvelopeFailureReason.MALFORMED_JSON,
              );
            }
            parts.push(String.fromCharCode(first, second));
          } else if (first >= 0xdc00 && first <= 0xdfff) {
            return fail(
              DetachedAttestationEnvelopeFailureReason.MALFORMED_JSON,
            );
          } else {
            parts.push(String.fromCharCode(first));
          }
        } else {
          return fail(DetachedAttestationEnvelopeFailureReason.MALFORMED_JSON);
        }
        continue;
      }
      if (char >= 0xd800 && char <= 0xdbff) {
        const next = this.text.charCodeAt(this.offset);
        if (next < 0xdc00 || next > 0xdfff) {
          return fail(DetachedAttestationEnvelopeFailureReason.MALFORMED_JSON);
        }
        parts.push(String.fromCharCode(char, next));
        this.offset += 1;
      } else if (char >= 0xdc00 && char <= 0xdfff) {
        return fail(DetachedAttestationEnvelopeFailureReason.MALFORMED_JSON);
      } else {
        parts.push(String.fromCharCode(char));
      }
    }

    return fail(DetachedAttestationEnvelopeFailureReason.MALFORMED_JSON);
  }

  private parseHexCodeUnit(): number {
    const hex = this.text.slice(this.offset, this.offset + 4);
    if (!/^[0-9a-fA-F]{4}$/.test(hex) || hex.length !== 4) {
      return fail(DetachedAttestationEnvelopeFailureReason.MALFORMED_JSON);
    }
    this.offset += 4;
    return Number.parseInt(hex, 16);
  }

  private parseLiteral<T extends boolean | null>(literal: string, value: T): T {
    if (
      this.text.slice(this.offset, this.offset + literal.length) !== literal
    ) {
      return fail(DetachedAttestationEnvelopeFailureReason.MALFORMED_JSON);
    }
    this.offset += literal.length;
    return value;
  }

  private parseNumber(): number {
    const start = this.offset;
    if (this.consume("-") && this.offset >= this.text.length) {
      return fail(DetachedAttestationEnvelopeFailureReason.MALFORMED_JSON);
    }

    if (this.consume("0")) {
      const next = this.text[this.offset];
      if (next !== undefined && next >= "0" && next <= "9") {
        return fail(DetachedAttestationEnvelopeFailureReason.MALFORMED_JSON);
      }
    } else {
      if (!this.consumeDigitOneToNine()) {
        return fail(DetachedAttestationEnvelopeFailureReason.MALFORMED_JSON);
      }
      while (this.consumeDigit()) {
        // Consume the remaining integer digits.
      }
    }

    if (this.consume(".")) {
      if (!this.consumeDigit()) {
        return fail(DetachedAttestationEnvelopeFailureReason.MALFORMED_JSON);
      }
      while (this.consumeDigit()) {
        // Consume the remaining fraction digits.
      }
    }

    if (this.consume("e") || this.consume("E")) {
      if (!this.consume("+")) {
        this.consume("-");
      }
      if (!this.consumeDigit()) {
        return fail(DetachedAttestationEnvelopeFailureReason.MALFORMED_JSON);
      }
      while (this.consumeDigit()) {
        // Consume the remaining exponent digits.
      }
    }

    return Number(this.text.slice(start, this.offset));
  }

  private consumeDigit(): boolean {
    const char = this.text[this.offset];
    if (char === undefined || char < "0" || char > "9") {
      return false;
    }
    this.offset += 1;
    return true;
  }

  private consumeDigitOneToNine(): boolean {
    const char = this.text[this.offset];
    if (char === undefined || char < "1" || char > "9") {
      return false;
    }
    this.offset += 1;
    return true;
  }

  private consume(char: string): boolean {
    if (this.text[this.offset] !== char) {
      return false;
    }
    this.offset += 1;
    return true;
  }
}

function isJsonObject(value: JsonValue): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasExactKeys(value: JsonObject, expected: readonly string[]): boolean {
  const keys = Object.keys(value);
  return (
    keys.length === expected.length &&
    expected.every((key) => Object.hasOwn(value, key))
  );
}

function validateAssetIdentity(assetId: string, assetVersion: string): void {
  const kind: AssetKind =
    assetKinds.find((candidate) => assetId.startsWith(`${candidate}.`)) ??
    "skill";
  // Fixed placeholder fields let M1 validate only its asset ID and SemVer rules.
  const result = safeParseAssetManifest({
    manifestVersion: 1,
    assets: [
      {
        id: assetId,
        kind,
        version: assetVersion,
        contractVersion: "1.0.0",
        description: "Attestation payload validation.",
        domain: "attestation",
        dependencies: { required: [], optional: [] },
        compatibility: {
          agents: [],
          stacks: [],
          modes: [],
          capabilities: [],
        },
        permissions: [],
        integrity: { algorithm: "sha256", digest: "0".repeat(64) },
        provenance: {
          repository: "validation/repository",
          path: "assets/validation/1.0.0",
          revision: "0".repeat(40),
        },
        lifecycleStatus: "stable",
      },
    ],
  });

  if (!result.success) {
    const codes = new Set(result.error.issues.map(({ code }) => code));
    if (codes.has(AssetManifestErrorCode.INVALID_ASSET_ID)) {
      fail(DetachedAttestationEnvelopeFailureReason.INVALID_ASSET_ID);
    }
    if (codes.has(AssetManifestErrorCode.INVALID_ASSET_VERSION)) {
      fail(DetachedAttestationEnvelopeFailureReason.INVALID_ASSET_VERSION);
    }
    fail(DetachedAttestationEnvelopeFailureReason.INVALID_ENVELOPE_SHAPE);
  }
}

function validateAssetPath(
  assetPath: string,
  assetId: string,
  assetVersion: string,
): void {
  const expectedPath = `assets/${assetId}/${assetVersion}`;
  const segments = assetPath.split("/");
  if (
    assetPath !== expectedPath ||
    segments.length !== 3 ||
    segments.some(
      (segment) =>
        !matchesExactly(portablePathSegment, segment) ||
        segment === "." ||
        segment === ".." ||
        segment.endsWith(".") ||
        segment.endsWith(" ") ||
        reservedDeviceName.test(segment.split(".", 1)[0] ?? ""),
    )
  ) {
    fail(DetachedAttestationEnvelopeFailureReason.INVALID_ASSET_PATH);
  }
}

function validateEnvelope(value: JsonValue): {
  readonly payload: DetachedAttestationPayload;
  readonly signature: Uint8Array;
} {
  const topLevelKeys = ["format", "payload", "signature"] as const;
  if (!isJsonObject(value) || !hasExactKeys(value, topLevelKeys)) {
    fail(DetachedAttestationEnvelopeFailureReason.INVALID_ENVELOPE_SHAPE);
  }
  if (value.format !== envelopeFormat) {
    fail(DetachedAttestationEnvelopeFailureReason.INVALID_ENVELOPE_FORMAT);
  }
  if (typeof value.signature !== "string") {
    fail(DetachedAttestationEnvelopeFailureReason.INVALID_SIGNATURE_ENCODING);
  }
  if (!isJsonObject(value.payload)) {
    fail(DetachedAttestationEnvelopeFailureReason.INVALID_ENVELOPE_SHAPE);
  }

  const payloadKeys = [
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
  const payload = value.payload;
  if (!hasExactKeys(payload, payloadKeys)) {
    fail(DetachedAttestationEnvelopeFailureReason.INVALID_ENVELOPE_SHAPE);
  }

  const repositoryId = payload.repositoryId;
  const revision = payload.revision;
  const assetPath = payload.assetPath;
  const assetId = payload.assetId;
  const assetVersion = payload.assetVersion;
  const manifestSha256 = payload.manifestSha256;
  const contentTreeAlgorithmValue = payload.contentTreeAlgorithm;
  const contentTreeSha256 = payload.contentTreeSha256;
  const signerKeyId = payload.signerKeyId;

  if (
    typeof repositoryId !== "string" ||
    !matchesExactly(repositoryPattern, repositoryId)
  ) {
    fail(DetachedAttestationEnvelopeFailureReason.INVALID_REPOSITORY_ID);
  }
  if (
    typeof revision !== "string" ||
    !matchesExactly(revisionPattern, revision)
  ) {
    fail(DetachedAttestationEnvelopeFailureReason.INVALID_REVISION);
  }
  if (typeof assetId !== "string") {
    fail(DetachedAttestationEnvelopeFailureReason.INVALID_ASSET_ID);
  }
  if (typeof assetVersion !== "string") {
    fail(DetachedAttestationEnvelopeFailureReason.INVALID_ASSET_VERSION);
  }
  if (typeof assetPath !== "string") {
    fail(DetachedAttestationEnvelopeFailureReason.INVALID_ASSET_PATH);
  }
  if (
    typeof manifestSha256 !== "string" ||
    !matchesExactly(sha256Pattern, manifestSha256) ||
    typeof contentTreeSha256 !== "string" ||
    !matchesExactly(sha256Pattern, contentTreeSha256)
  ) {
    fail(DetachedAttestationEnvelopeFailureReason.INVALID_DIGEST);
  }
  if (contentTreeAlgorithmValue !== contentTreeAlgorithm) {
    fail(
      DetachedAttestationEnvelopeFailureReason.INVALID_CONTENT_TREE_ALGORITHM,
    );
  }
  if (
    typeof signerKeyId !== "string" ||
    !matchesExactly(signerKeyIdPattern, signerKeyId)
  ) {
    fail(DetachedAttestationEnvelopeFailureReason.INVALID_SIGNER_KEY_ID);
  }

  validateAssetIdentity(assetId, assetVersion);
  validateAssetPath(assetPath, assetId, assetVersion);

  if (!/^[A-Za-z0-9_-]+$/.test(value.signature)) {
    fail(DetachedAttestationEnvelopeFailureReason.INVALID_SIGNATURE_ENCODING);
  }
  const signature = Buffer.from(value.signature, "base64url");
  if (
    signature.byteLength !== 64 ||
    signature.toString("base64url") !== value.signature
  ) {
    fail(DetachedAttestationEnvelopeFailureReason.INVALID_SIGNATURE_ENCODING);
  }

  return {
    payload: {
      repositoryId,
      revision,
      assetPath,
      assetId,
      assetVersion,
      manifestSha256,
      contentTreeAlgorithm,
      contentTreeSha256,
      signerKeyId,
    },
    signature: Buffer.from(signature),
  };
}

export function parseDetachedAttestationEnvelope(
  input: ParseDetachedAttestationEnvelopeInput,
): ParsedDetachedAttestationEnvelope {
  if (
    typeof input !== "object" ||
    input === null ||
    !(input.envelopeBytes instanceof Uint8Array)
  ) {
    return fail(DetachedAttestationEnvelopeFailureReason.INVALID_INPUT);
  }
  if (
    typeof SharedArrayBuffer !== "undefined" &&
    input.envelopeBytes.buffer instanceof SharedArrayBuffer
  ) {
    return fail(DetachedAttestationEnvelopeFailureReason.INVALID_INPUT);
  }
  if (input.envelopeBytes.byteLength > maxEnvelopeBytes) {
    return fail(DetachedAttestationEnvelopeFailureReason.ENVELOPE_TOO_LARGE);
  }

  const envelopeBytes = Buffer.from(input.envelopeBytes);
  if (
    envelopeBytes.byteLength >= 3 &&
    envelopeBytes[0] === 0xef &&
    envelopeBytes[1] === 0xbb &&
    envelopeBytes[2] === 0xbf
  ) {
    return fail(DetachedAttestationEnvelopeFailureReason.UTF8_BOM);
  }

  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(
      envelopeBytes,
    );
  } catch (error) {
    if (error instanceof TypeError) {
      return fail(DetachedAttestationEnvelopeFailureReason.MALFORMED_UTF8);
    }
    throw error;
  }

  const parsed = new StrictJsonParser(text).parse();
  const result = validateEnvelope(parsed);
  return {
    payload: Object.freeze(result.payload),
    signature: result.signature,
    envelopeSha256: createHash("sha256").update(envelopeBytes).digest("hex"),
  };
}
