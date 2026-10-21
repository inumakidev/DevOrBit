import { createHash } from "node:crypto";
import {
  canonicalizeJcs,
  JcsCanonicalizationError,
  type JcsResourceBudget,
} from "./jcs.js";

const maxPolicyBytes = 1_048_576;
const maxCollectionEntries = 10_000;
// Count each JSON value and decoded object key; raw input size keeps this below the cap for valid JSON.
const maxParserItems = 1_000_000;
const maxParserDepth = 64;
const maxStringBytes = 1_048_576;
const maxExponentMagnitude = 2_000_000;
const policyFormat = "devorbit-trust-policy-v1";
const keyIdPattern = /^sha256:[a-f0-9]{64}$/;
const repositoryPattern =
  /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\/[a-z0-9](?:[a-z0-9._-]*[a-z0-9])?$/;

const policyJcsBudget: JcsResourceBudget = Object.freeze({
  maxDepth: 64,
  maxNodes: 1_000_000,
  maxPropertiesPerObject: 10_000,
  maxStringUtf8Bytes: 1_048_576,
  maxTotalStringUtf8Bytes: 1_048_576,
  maxOutputBytes: 1_048_576,
});

export const TrustPolicyFailureReason = {
  INVALID_INPUT: "INVALID_INPUT",
  SHARED_MEMORY_INPUT: "SHARED_MEMORY_INPUT",
  INPUT_TOO_LARGE: "INPUT_TOO_LARGE",
  UTF8_BOM: "UTF8_BOM",
  MALFORMED_UTF8: "MALFORMED_UTF8",
  MALFORMED_JSON: "MALFORMED_JSON",
  DUPLICATE_JSON_KEY: "DUPLICATE_JSON_KEY",
  JSON_RESOURCE_LIMIT: "JSON_RESOURCE_LIMIT",
  INVALID_POLICY_SHAPE: "INVALID_POLICY_SHAPE",
  INVALID_POLICY_VALUE: "INVALID_POLICY_VALUE",
  INVALID_SEQUENCE: "INVALID_SEQUENCE",
  INVALID_TIMESTAMP: "INVALID_TIMESTAMP",
  INVALID_INTERVAL: "INVALID_INTERVAL",
  INVALID_REPOSITORY_ID: "INVALID_REPOSITORY_ID",
  INVALID_ORDERING: "INVALID_ORDERING",
  INVALID_PUBLIC_KEY: "INVALID_PUBLIC_KEY",
  KEY_ID_MISMATCH: "KEY_ID_MISMATCH",
  CANONICALIZATION_FAILED: "CANONICALIZATION_FAILED",
} as const;

export type TrustPolicyFailureReason =
  (typeof TrustPolicyFailureReason)[keyof typeof TrustPolicyFailureReason];

export class TrustPolicyError extends Error {
  readonly reason: TrustPolicyFailureReason;

  constructor(reason: TrustPolicyFailureReason) {
    super("Trust policy is invalid.");
    this.name = "TrustPolicyError";
    this.reason = reason;
  }
}

export interface TrustPolicyAdministrator {
  readonly keyId: string;
  readonly publicKey: string;
}

export interface TrustPolicyAuthorizedSigner {
  readonly keyId: string;
  readonly publicKey: string;
  readonly repositoryIds: readonly string[];
  readonly validFrom: string;
  readonly expiresAt: string;
}

export interface TrustPolicy {
  readonly format: typeof policyFormat;
  readonly sequence: number;
  readonly issuedAt: string;
  readonly expiresAt: string;
  readonly administrator: TrustPolicyAdministrator;
  readonly nextAdministrator: TrustPolicyAdministrator | null;
  readonly repositories: readonly string[];
  readonly authorizedSigners: readonly TrustPolicyAuthorizedSigner[];
  readonly revocations: {
    readonly signerKeyIds: readonly string[];
    readonly repositoryIds: readonly string[];
  };
}

export interface ParsedTrustPolicy {
  readonly policy: TrustPolicy;
  readonly policyDigest: string;
}

const jsonNumberBrand = Symbol("json-number");

interface JsonNumber {
  readonly [jsonNumberBrand]: true;
  readonly token: string;
}

type JsonObject = { readonly [key: string]: JsonValue };
type JsonValue =
  | string
  | JsonNumber
  | boolean
  | null
  | JsonObject
  | JsonValue[];

function fail(reason: TrustPolicyFailureReason): never {
  throw new TrustPolicyError(reason);
}

function isObject(value: JsonValue): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasExactKeys(value: JsonObject, expected: readonly string[]): boolean {
  const keys = Reflect.ownKeys(value);
  return (
    keys.length === expected.length &&
    keys.every((key) => typeof key === "string" && expected.includes(key)) &&
    expected.every((key) => Object.hasOwn(value, key))
  );
}

function isJsonNumber(value: JsonValue): value is JsonNumber {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    Object.hasOwn(value, jsonNumberBrand)
  );
}

class StrictJsonParser {
  private offset = 0;
  private parserItems = 0;
  private totalStringBytes = 0;

  constructor(private readonly text: string) {}

  parse(): JsonValue {
    this.skipWhitespace();
    const value = this.parseValue(0);
    this.skipWhitespace();
    if (this.offset !== this.text.length) {
      return fail(TrustPolicyFailureReason.MALFORMED_JSON);
    }
    return value;
  }

  private countParserItem(): void {
    if (this.parserItems >= maxParserItems) {
      fail(TrustPolicyFailureReason.JSON_RESOURCE_LIMIT);
    }
    this.parserItems += 1;
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
    this.countParserItem();
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
    return fail(TrustPolicyFailureReason.MALFORMED_JSON);
  }

  private parseObject(depth: number): JsonObject {
    if (depth > maxParserDepth) {
      return fail(TrustPolicyFailureReason.JSON_RESOURCE_LIMIT);
    }
    this.offset += 1;
    this.skipWhitespace();

    const result = Object.create(null) as Record<string, JsonValue>;
    const keys = new Set<string>();
    if (this.consume("}")) {
      return result;
    }

    while (true) {
      if (keys.size >= maxCollectionEntries) {
        return fail(TrustPolicyFailureReason.JSON_RESOURCE_LIMIT);
      }
      if (this.text[this.offset] !== '"') {
        return fail(TrustPolicyFailureReason.MALFORMED_JSON);
      }
      this.countParserItem();
      const key = this.parseString();
      if (keys.has(key)) {
        return fail(TrustPolicyFailureReason.DUPLICATE_JSON_KEY);
      }
      keys.add(key);
      this.skipWhitespace();
      if (!this.consume(":")) {
        return fail(TrustPolicyFailureReason.MALFORMED_JSON);
      }
      result[key] = this.parseValue(depth);
      this.skipWhitespace();
      if (this.consume("}")) {
        return result;
      }
      if (!this.consume(",")) {
        return fail(TrustPolicyFailureReason.MALFORMED_JSON);
      }
      this.skipWhitespace();
    }
  }

  private parseArray(depth: number): JsonValue[] {
    if (depth > maxParserDepth) {
      return fail(TrustPolicyFailureReason.JSON_RESOURCE_LIMIT);
    }
    this.offset += 1;
    this.skipWhitespace();

    const result: JsonValue[] = [];
    if (this.consume("]")) {
      return result;
    }

    while (true) {
      if (result.length >= maxCollectionEntries) {
        return fail(TrustPolicyFailureReason.JSON_RESOURCE_LIMIT);
      }
      result.push(this.parseValue(depth));
      this.skipWhitespace();
      if (this.consume("]")) {
        return result;
      }
      if (!this.consume(",")) {
        return fail(TrustPolicyFailureReason.MALFORMED_JSON);
      }
      this.skipWhitespace();
    }
  }

  private parseString(): string {
    this.offset += 1;
    const parts: string[] = [];
    let stringBytes = 0;

    const append = (value: string, byteLength: number): void => {
      if (
        stringBytes > maxStringBytes - byteLength ||
        this.totalStringBytes > maxStringBytes - byteLength
      ) {
        fail(TrustPolicyFailureReason.JSON_RESOURCE_LIMIT);
      }
      stringBytes += byteLength;
      this.totalStringBytes += byteLength;
      parts.push(value);
    };

    while (this.offset < this.text.length) {
      const char = this.text.charCodeAt(this.offset);
      this.offset += 1;

      if (char === 0x22) {
        return parts.join("");
      }
      if (char < 0x20) {
        return fail(TrustPolicyFailureReason.MALFORMED_JSON);
      }
      if (char === 0x5c) {
        const escaped = this.text[this.offset];
        this.offset += 1;
        if (escaped === '"' || escaped === "\\" || escaped === "/") {
          append(escaped, 1);
        } else if (escaped === "b") {
          append("\b", 1);
        } else if (escaped === "f") {
          append("\f", 1);
        } else if (escaped === "n") {
          append("\n", 1);
        } else if (escaped === "r") {
          append("\r", 1);
        } else if (escaped === "t") {
          append("\t", 1);
        } else if (escaped === "u") {
          const first = this.parseHexCodeUnit();
          if (first >= 0xd800 && first <= 0xdbff) {
            if (this.text.slice(this.offset, this.offset + 2) !== "\\u") {
              return fail(TrustPolicyFailureReason.MALFORMED_JSON);
            }
            this.offset += 2;
            const second = this.parseHexCodeUnit();
            if (second < 0xdc00 || second > 0xdfff) {
              return fail(TrustPolicyFailureReason.MALFORMED_JSON);
            }
            append(String.fromCharCode(first, second), 4);
          } else if (first >= 0xdc00 && first <= 0xdfff) {
            return fail(TrustPolicyFailureReason.MALFORMED_JSON);
          } else {
            append(
              String.fromCharCode(first),
              first <= 0x7f ? 1 : first <= 0x7ff ? 2 : 3,
            );
          }
        } else {
          return fail(TrustPolicyFailureReason.MALFORMED_JSON);
        }
        continue;
      }
      if (char >= 0xd800 && char <= 0xdbff) {
        const next = this.text.charCodeAt(this.offset);
        if (next < 0xdc00 || next > 0xdfff) {
          return fail(TrustPolicyFailureReason.MALFORMED_JSON);
        }
        append(String.fromCharCode(char, next), 4);
        this.offset += 1;
      } else if (char >= 0xdc00 && char <= 0xdfff) {
        return fail(TrustPolicyFailureReason.MALFORMED_JSON);
      } else {
        append(
          String.fromCharCode(char),
          char <= 0x7f ? 1 : char <= 0x7ff ? 2 : 3,
        );
      }
    }

    return fail(TrustPolicyFailureReason.MALFORMED_JSON);
  }

  private parseHexCodeUnit(): number {
    const hex = this.text.slice(this.offset, this.offset + 4);
    if (!/^[0-9a-fA-F]{4}$/.test(hex) || hex.length !== 4) {
      return fail(TrustPolicyFailureReason.MALFORMED_JSON);
    }
    this.offset += 4;
    return Number.parseInt(hex, 16);
  }

  private parseLiteral<T extends boolean | null>(literal: string, value: T): T {
    if (
      this.text.slice(this.offset, this.offset + literal.length) !== literal
    ) {
      return fail(TrustPolicyFailureReason.MALFORMED_JSON);
    }
    this.offset += literal.length;
    return value;
  }

  private parseNumber(): JsonNumber {
    const start = this.offset;
    if (this.consume("-") && this.offset >= this.text.length) {
      return fail(TrustPolicyFailureReason.MALFORMED_JSON);
    }

    if (this.consume("0")) {
      const next = this.text[this.offset];
      if (next !== undefined && next >= "0" && next <= "9") {
        return fail(TrustPolicyFailureReason.MALFORMED_JSON);
      }
    } else {
      if (!this.consumeDigitOneToNine()) {
        return fail(TrustPolicyFailureReason.MALFORMED_JSON);
      }
      while (this.consumeDigit()) {
        // Consume the remaining integer digits.
      }
    }

    if (this.consume(".")) {
      if (!this.consumeDigit()) {
        return fail(TrustPolicyFailureReason.MALFORMED_JSON);
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
        return fail(TrustPolicyFailureReason.MALFORMED_JSON);
      }
      while (this.consumeDigit()) {
        // Consume the remaining exponent digits.
      }
    }

    return {
      [jsonNumberBrand]: true,
      token: this.text.slice(start, this.offset),
    };
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

  private consume(expected: string): boolean {
    if (this.text[this.offset] !== expected) {
      return false;
    }
    this.offset += 1;
    return true;
  }
}

function parseExponent(exponent: string | undefined): number {
  if (exponent === undefined) {
    return 0;
  }
  let offset = 0;
  let sign = 1;
  if (exponent[offset] === "+" || exponent[offset] === "-") {
    if (exponent[offset] === "-") {
      sign = -1;
    }
    offset += 1;
  }
  while (offset < exponent.length && exponent[offset] === "0") {
    offset += 1;
  }
  let magnitude = 0;
  for (; offset < exponent.length; offset += 1) {
    const digit = exponent.charCodeAt(offset) - 0x30;
    if (magnitude > Math.floor((maxExponentMagnitude - digit) / 10)) {
      return sign * (maxExponentMagnitude + 1);
    }
    magnitude = magnitude * 10 + digit;
  }
  return sign * magnitude;
}

function exactPositiveSafeInteger(token: string): number | undefined {
  const match =
    /^(-?)(0|[1-9][0-9]*)(?:\.([0-9]+))?(?:[eE]([+-]?[0-9]+))?$/.exec(token);
  if (match === null || match[1] === "-") {
    return undefined;
  }
  const integerPart = match[2];
  if (integerPart === undefined) {
    return undefined;
  }
  const fractionPart = match[3] ?? "";
  const coefficient = `${integerPart}${fractionPart}`;
  let firstNonZero = 0;
  while (
    firstNonZero < coefficient.length &&
    coefficient.charCodeAt(firstNonZero) === 0x30
  ) {
    firstNonZero += 1;
  }
  if (firstNonZero === coefficient.length) {
    return undefined;
  }

  let end = coefficient.length;
  while (end > firstNonZero && coefficient.charCodeAt(end - 1) === 0x30) {
    end -= 1;
  }
  const significantDigits = coefficient.slice(firstNonZero, end);
  const scale =
    parseExponent(match[4]) - fractionPart.length + (coefficient.length - end);
  if (scale < 0 || significantDigits.length + scale > 16 || scale > 16) {
    return undefined;
  }
  const exactValue = Number(`${significantDigits}${"0".repeat(scale)}`);
  if (!Number.isSafeInteger(exactValue) || exactValue <= 0) {
    return undefined;
  }
  return exactValue;
}

function validateString(
  value: JsonValue,
  reason: TrustPolicyFailureReason = TrustPolicyFailureReason.INVALID_POLICY_VALUE,
): string {
  if (typeof value !== "string") {
    return fail(reason);
  }
  return value;
}

function validateObject(
  value: JsonValue,
  expected: readonly string[],
): JsonObject {
  if (!isObject(value) || !hasExactKeys(value, expected)) {
    return fail(TrustPolicyFailureReason.INVALID_POLICY_SHAPE);
  }
  return value;
}

function validateRepositoryId(value: JsonValue): string {
  const repositoryId = validateString(
    value,
    TrustPolicyFailureReason.INVALID_REPOSITORY_ID,
  );
  if (
    !repositoryPattern.test(repositoryId) ||
    repositoryPattern.exec(repositoryId)?.[0] !== repositoryId
  ) {
    return fail(TrustPolicyFailureReason.INVALID_REPOSITORY_ID);
  }
  return repositoryId;
}

function validateSortedStringArray(
  value: JsonValue,
  validateItem: (item: JsonValue) => string,
  reason: TrustPolicyFailureReason,
): readonly string[] {
  if (!Array.isArray(value) || value.length > maxCollectionEntries) {
    return fail(
      Array.isArray(value)
        ? TrustPolicyFailureReason.JSON_RESOURCE_LIMIT
        : TrustPolicyFailureReason.INVALID_POLICY_VALUE,
    );
  }
  const items: string[] = [];
  let previous: string | undefined;
  for (const item of value) {
    const current = validateItem(item);
    if (previous !== undefined && previous >= current) {
      return fail(reason);
    }
    items.push(current);
    previous = current;
  }
  return Object.freeze(items);
}

function daysInMonth(year: number, month: number): number {
  if (month === 2) {
    const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
    return leapYear ? 29 : 28;
  }
  return [4, 6, 9, 11].includes(month) ? 30 : 31;
}

function parseTimestamp(value: JsonValue): {
  readonly text: string;
  readonly time: number;
} {
  const text = validateString(
    value,
    TrustPolicyFailureReason.INVALID_TIMESTAMP,
  );
  const match =
    /^([0-9]{4})-([0-9]{2})-([0-9]{2})T([0-9]{2}):([0-9]{2}):([0-9]{2})\.([0-9]{3})Z$/.exec(
      text,
    );
  if (match === null || match[0] !== text) {
    return fail(TrustPolicyFailureReason.INVALID_TIMESTAMP);
  }
  const [year, month, day, hour, minute, second, millisecond] = match
    .slice(1)
    .map(Number);
  if (
    year === undefined ||
    month === undefined ||
    day === undefined ||
    hour === undefined ||
    minute === undefined ||
    second === undefined ||
    millisecond === undefined ||
    year < 1 ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > daysInMonth(year, month) ||
    hour > 23 ||
    minute > 59 ||
    second > 59
  ) {
    return fail(TrustPolicyFailureReason.INVALID_TIMESTAMP);
  }
  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day);
  date.setUTCHours(hour, minute, second, millisecond);
  return { text, time: date.getTime() };
}

function validateKeyFields(
  keyIdValue: JsonValue,
  publicKeyValue: JsonValue,
): TrustPolicyAdministrator {
  const keyId = validateString(keyIdValue);
  const publicKey = validateString(publicKeyValue);
  if (!keyIdPattern.test(keyId) || keyIdPattern.exec(keyId)?.[0] !== keyId) {
    return fail(TrustPolicyFailureReason.INVALID_PUBLIC_KEY);
  }
  if (!/^[A-Za-z0-9_-]{43}$/.test(publicKey)) {
    return fail(TrustPolicyFailureReason.INVALID_PUBLIC_KEY);
  }
  const rawPublicKey = Buffer.from(publicKey, "base64url");
  if (
    rawPublicKey.byteLength !== 32 ||
    rawPublicKey.toString("base64url") !== publicKey
  ) {
    return fail(TrustPolicyFailureReason.INVALID_PUBLIC_KEY);
  }
  const actualKeyId = `sha256:${createHash("sha256").update(rawPublicKey).digest("hex")}`;
  if (keyId !== actualKeyId) {
    return fail(TrustPolicyFailureReason.KEY_ID_MISMATCH);
  }
  return Object.freeze({ keyId, publicKey });
}

function validateKey(value: JsonValue): TrustPolicyAdministrator {
  const object = validateObject(value, ["keyId", "publicKey"]);
  return validateKeyFields(object.keyId, object.publicKey);
}

function validateSigner(value: JsonValue): TrustPolicyAuthorizedSigner {
  const object = validateObject(value, [
    "keyId",
    "publicKey",
    "repositoryIds",
    "validFrom",
    "expiresAt",
  ]);
  const key = validateKeyFields(object.keyId, object.publicKey);
  const repositoryIds = validateSortedStringArray(
    object.repositoryIds,
    validateRepositoryId,
    TrustPolicyFailureReason.INVALID_ORDERING,
  );
  const validFrom = parseTimestamp(object.validFrom);
  const expiresAt = parseTimestamp(object.expiresAt);
  if (validFrom.time >= expiresAt.time) {
    return fail(TrustPolicyFailureReason.INVALID_INTERVAL);
  }
  return Object.freeze({
    keyId: key.keyId,
    publicKey: key.publicKey,
    repositoryIds,
    validFrom: validFrom.text,
    expiresAt: expiresAt.text,
  });
}

function validateAdministrator(value: JsonValue): TrustPolicyAdministrator {
  return validateKey(value);
}

function freezePolicy(value: TrustPolicy): TrustPolicy {
  return Object.freeze(value);
}

export function parseTrustPolicy(policyBytes: Uint8Array): ParsedTrustPolicy {
  if (!(policyBytes instanceof Uint8Array)) {
    return fail(TrustPolicyFailureReason.INVALID_INPUT);
  }
  if (
    typeof SharedArrayBuffer !== "undefined" &&
    policyBytes.buffer instanceof SharedArrayBuffer
  ) {
    return fail(TrustPolicyFailureReason.SHARED_MEMORY_INPUT);
  }
  if (policyBytes.byteLength > maxPolicyBytes) {
    return fail(TrustPolicyFailureReason.INPUT_TOO_LARGE);
  }

  const rawBytes = Buffer.from(policyBytes);
  if (
    rawBytes.byteLength >= 3 &&
    rawBytes[0] === 0xef &&
    rawBytes[1] === 0xbb &&
    rawBytes[2] === 0xbf
  ) {
    return fail(TrustPolicyFailureReason.UTF8_BOM);
  }

  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(
      rawBytes,
    );
  } catch (error) {
    if (error instanceof TypeError) {
      return fail(TrustPolicyFailureReason.MALFORMED_UTF8);
    }
    throw error;
  }

  const parsed = new StrictJsonParser(text).parse();
  const root = validateObject(parsed, [
    "format",
    "sequence",
    "issuedAt",
    "expiresAt",
    "administrator",
    "nextAdministrator",
    "repositories",
    "authorizedSigners",
    "revocations",
  ]);
  if (root.format !== policyFormat) {
    return fail(TrustPolicyFailureReason.INVALID_POLICY_VALUE);
  }
  if (!isJsonNumber(root.sequence)) {
    return fail(TrustPolicyFailureReason.INVALID_SEQUENCE);
  }
  const sequence = exactPositiveSafeInteger(root.sequence.token);
  if (sequence === undefined) {
    return fail(TrustPolicyFailureReason.INVALID_SEQUENCE);
  }

  const issuedAt = parseTimestamp(root.issuedAt);
  const expiresAt = parseTimestamp(root.expiresAt);
  if (expiresAt.time - issuedAt.time !== 720 * 60 * 60 * 1000) {
    return fail(TrustPolicyFailureReason.INVALID_INTERVAL);
  }

  const administrator = validateAdministrator(root.administrator);
  const nextAdministrator =
    root.nextAdministrator === null
      ? null
      : validateAdministrator(root.nextAdministrator);
  const repositories = validateSortedStringArray(
    root.repositories,
    validateRepositoryId,
    TrustPolicyFailureReason.INVALID_ORDERING,
  );

  if (
    !Array.isArray(root.authorizedSigners) ||
    root.authorizedSigners.length > maxCollectionEntries
  ) {
    return fail(
      Array.isArray(root.authorizedSigners)
        ? TrustPolicyFailureReason.JSON_RESOURCE_LIMIT
        : TrustPolicyFailureReason.INVALID_POLICY_VALUE,
    );
  }
  const repositorySet = new Set(repositories);
  const authorizedSigners: TrustPolicyAuthorizedSigner[] = [];
  let previousKeyId: string | undefined;
  for (const signerValue of root.authorizedSigners) {
    const signer = validateSigner(signerValue);
    if (previousKeyId !== undefined && previousKeyId >= signer.keyId) {
      return fail(TrustPolicyFailureReason.INVALID_ORDERING);
    }
    const validFrom = parseTimestamp(signer.validFrom).time;
    const signerExpiresAt = parseTimestamp(signer.expiresAt).time;
    if (
      validFrom < issuedAt.time ||
      signerExpiresAt > expiresAt.time ||
      validFrom >= signerExpiresAt
    ) {
      return fail(TrustPolicyFailureReason.INVALID_INTERVAL);
    }
    if (
      signer.repositoryIds.some(
        (repositoryId) => !repositorySet.has(repositoryId),
      )
    ) {
      return fail(TrustPolicyFailureReason.INVALID_REPOSITORY_ID);
    }
    authorizedSigners.push(signer);
    previousKeyId = signer.keyId;
  }

  const revocations = validateObject(root.revocations, [
    "signerKeyIds",
    "repositoryIds",
  ]);
  const revokedSignerKeyIds = validateSortedStringArray(
    revocations.signerKeyIds,
    (value) => {
      const keyId = validateString(
        value,
        TrustPolicyFailureReason.INVALID_PUBLIC_KEY,
      );
      if (
        !keyIdPattern.test(keyId) ||
        keyIdPattern.exec(keyId)?.[0] !== keyId
      ) {
        return fail(TrustPolicyFailureReason.INVALID_PUBLIC_KEY);
      }
      return keyId;
    },
    TrustPolicyFailureReason.INVALID_ORDERING,
  );
  const revokedRepositoryIds = validateSortedStringArray(
    revocations.repositoryIds,
    validateRepositoryId,
    TrustPolicyFailureReason.INVALID_ORDERING,
  );

  const revocationObject = Object.create(null) as {
    signerKeyIds: readonly string[];
    repositoryIds: readonly string[];
  };
  revocationObject.signerKeyIds = revokedSignerKeyIds;
  revocationObject.repositoryIds = revokedRepositoryIds;
  Object.freeze(revocationObject);

  const policyObject = Object.create(null) as {
    format: typeof policyFormat;
    sequence: number;
    issuedAt: string;
    expiresAt: string;
    administrator: TrustPolicyAdministrator;
    nextAdministrator: TrustPolicyAdministrator | null;
    repositories: readonly string[];
    authorizedSigners: readonly TrustPolicyAuthorizedSigner[];
    revocations: TrustPolicy["revocations"];
  };
  policyObject.format = policyFormat;
  policyObject.sequence = sequence;
  policyObject.issuedAt = issuedAt.text;
  policyObject.expiresAt = expiresAt.text;
  policyObject.administrator = administrator;
  policyObject.nextAdministrator = nextAdministrator;
  policyObject.repositories = repositories;
  policyObject.authorizedSigners = Object.freeze(authorizedSigners);
  policyObject.revocations = revocationObject;
  const policy = freezePolicy(policyObject);

  let canonicalBytes: Uint8Array;
  try {
    canonicalBytes = canonicalizeJcs(policy, policyJcsBudget);
  } catch (error) {
    if (error instanceof JcsCanonicalizationError) {
      return fail(TrustPolicyFailureReason.CANONICALIZATION_FAILED);
    }
    throw error;
  }
  const policyDigest = createHash("sha256")
    .update(canonicalBytes)
    .digest("hex");
  return Object.freeze({ policy, policyDigest });
}
