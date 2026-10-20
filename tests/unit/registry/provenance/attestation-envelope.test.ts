import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  DetachedAttestationEnvelopeError,
  DetachedAttestationEnvelopeFailureReason,
  parseDetachedAttestationEnvelope,
} from "../../../../packages/registry/src/provenance/attestation-envelope.js";

interface EnvelopeVector {
  readonly name: string;
  readonly rawEnvelope: string;
  readonly expectedEnvelopeSha256: string;
}

const vectors = JSON.parse(
  readFileSync(
    resolve(
      process.cwd(),
      "tests/fixtures/registry/attestation-envelope-vectors.json",
    ),
    "utf8",
  ),
) as { readonly vectors: readonly EnvelopeVector[] };

const vector = vectors.vectors.find(({ name }) => name === "valid-envelope");
if (vector === undefined) {
  throw new Error("Required valid-envelope vector is missing.");
}

const maxEnvelopeBytes = 64 * 1024;
const maxJsonDepth = 8;
const maxJsonNodes = 128;
const validSignature = "A".repeat(86);

interface MutableEnvelope {
  format: unknown;
  payload: Record<string, unknown>;
  signature: unknown;
}

function parsedEnvelope(): MutableEnvelope {
  return JSON.parse(vector.rawEnvelope) as MutableEnvelope;
}

function encodeEnvelope(envelope: unknown): Uint8Array {
  return Buffer.from(JSON.stringify(envelope), "utf8");
}

function parseRaw(raw: string) {
  return parseDetachedAttestationEnvelope({
    envelopeBytes: Buffer.from(raw, "utf8"),
  });
}

function expectEnvelopeError(
  action: () => unknown,
  reason: (typeof DetachedAttestationEnvelopeFailureReason)[keyof typeof DetachedAttestationEnvelopeFailureReason],
): void {
  try {
    action();
    expect.fail("Expected DetachedAttestationEnvelopeError.");
  } catch (error) {
    expect(error).toBeInstanceOf(DetachedAttestationEnvelopeError);
    expect(error).toMatchObject({ reason });
    expect((error as Error).message).toBe(
      "Detached attestation envelope is invalid.",
    );
  }
}

function replaceSignature(raw: string, signature: string): string {
  return raw.replace(
    `"signature":"${validSignature}"`,
    `"signature":${signature}`,
  );
}

function replaceField(
  key: string,
  replacement: string,
  raw = vector.rawEnvelope,
): string {
  const target = `"${key}":`;
  const index = raw.indexOf(target);
  if (index < 0) {
    throw new Error(`Test field ${key} is missing.`);
  }
  const valueStart = index + target.length;
  let valueEnd = valueStart;
  let inString = false;
  let escaped = false;
  let nesting = 0;
  for (; valueEnd < raw.length; valueEnd += 1) {
    const char = raw[valueEnd];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }
    if (char === '"') {
      inString = true;
    } else if (char === "{" || char === "[") {
      nesting += 1;
    } else if (char === "}" || char === "]") {
      if (nesting === 0) {
        break;
      }
      nesting -= 1;
    } else if (char === "," && nesting === 0) {
      break;
    }
  }
  return `${raw.slice(0, valueStart)}${replacement}${raw.slice(valueEnd)}`;
}

describe("internal detached attestation envelope parser", () => {
  it("parses the exact envelope and returns the raw-byte digest", () => {
    const inputBytes = Buffer.from(vector.rawEnvelope, "utf8");
    const before = Buffer.from(inputBytes);
    const result = parseDetachedAttestationEnvelope({
      envelopeBytes: inputBytes,
    });

    expect(result.payload).toEqual({
      repositoryId: "owner/repo",
      revision: "0123456789abcdef0123456789abcdef01234567",
      assetPath: "assets/skill.example.asset/1.2.3-rc.1+build.7",
      assetId: "skill.example.asset",
      assetVersion: "1.2.3-rc.1+build.7",
      manifestSha256: "a".repeat(64),
      contentTreeAlgorithm: "devorbit-asset-tree-v1",
      contentTreeSha256: "b".repeat(64),
      signerKeyId: `sha256:${"c".repeat(64)}`,
    });
    expect(result.signature).toEqual(Buffer.alloc(64));
    expect(result.signature).toBeInstanceOf(Uint8Array);
    expect(result.signature.byteLength).toBe(64);
    expect(result.envelopeSha256).toBe(vector.expectedEnvelopeSha256);
    expect(createHash("sha256").update(inputBytes).digest("hex")).toBe(
      vector.expectedEnvelopeSha256,
    );
    expect(inputBytes).toEqual(before);
    expect(Object.hasOwn(result, "verified")).toBe(false);
    expect(Object.hasOwn(result, "trusted")).toBe(false);
  });

  it("accepts property reordering and whitespace without changing claims", () => {
    const original = parsedEnvelope();
    const reordered = JSON.stringify(
      {
        signature: original.signature,
        payload: Object.fromEntries(Object.entries(original.payload).reverse()),
        format: original.format,
      },
      null,
      2,
    );

    const result = parseRaw(reordered);
    expect(result.payload).toEqual(parseRaw(vector.rawEnvelope).payload);
    expect(result.envelopeSha256).not.toBe(vector.expectedEnvelopeSha256);
  });

  it("accepts exactly 64 KiB and rejects 64 KiB plus one byte", () => {
    const padded = vector.rawEnvelope.padEnd(maxEnvelopeBytes, " ");
    expect(Buffer.byteLength(padded, "utf8")).toBe(maxEnvelopeBytes);
    expect(parseRaw(padded).envelopeSha256).not.toBe("");

    const oversized = `${padded} `;
    expect(Buffer.byteLength(oversized, "utf8")).toBe(maxEnvelopeBytes + 1);
    expectEnvelopeError(
      () => parseRaw(oversized),
      DetachedAttestationEnvelopeFailureReason.ENVELOPE_TOO_LARGE,
    );
  });

  it("rejects non-byte inputs, shared memory, BOM, and malformed UTF-8", () => {
    expectEnvelopeError(
      () =>
        Reflect.apply(parseDetachedAttestationEnvelope, undefined, [
          { envelopeBytes: "not bytes" },
        ]),
      DetachedAttestationEnvelopeFailureReason.INVALID_INPUT,
    );

    if (typeof SharedArrayBuffer !== "undefined") {
      expectEnvelopeError(
        () =>
          parseDetachedAttestationEnvelope({
            envelopeBytes: new Uint8Array(new SharedArrayBuffer(4)),
          }),
        DetachedAttestationEnvelopeFailureReason.INVALID_INPUT,
      );
    }

    expectEnvelopeError(
      () =>
        parseDetachedAttestationEnvelope({
          envelopeBytes: Buffer.concat([
            Buffer.from([0xef, 0xbb, 0xbf]),
            Buffer.from(vector.rawEnvelope, "utf8"),
          ]),
        }),
      DetachedAttestationEnvelopeFailureReason.UTF8_BOM,
    );
    expectEnvelopeError(
      () =>
        parseDetachedAttestationEnvelope({
          envelopeBytes: Buffer.from([0x7b, 0xff, 0x7d]),
        }),
      DetachedAttestationEnvelopeFailureReason.MALFORMED_UTF8,
    );
  });

  it("rejects duplicate decoded keys at top-level and nested payload levels", () => {
    const duplicateTopLevel = vector.rawEnvelope.replace(
      ',"payload":',
      ',"for\\u006dat":"devorbit-detached-attestation-v1","payload":',
    );
    expectEnvelopeError(
      () => parseRaw(duplicateTopLevel),
      DetachedAttestationEnvelopeFailureReason.DUPLICATE_JSON_KEY,
    );

    const duplicatePayload = vector.rawEnvelope.replace(
      '"revision":',
      '"repositoryId":"owner/repo","revision":',
    );
    expectEnvelopeError(
      () => parseRaw(duplicatePayload),
      DetachedAttestationEnvelopeFailureReason.DUPLICATE_JSON_KEY,
    );

    const duplicateNested = vector.rawEnvelope.replace(
      '"payload":{',
      '"payload":{"nested":{"same":1,"same":2},',
    );
    expectEnvelopeError(
      () => parseRaw(duplicateNested),
      DetachedAttestationEnvelopeFailureReason.DUPLICATE_JSON_KEY,
    );
  });

  it("rejects missing or unknown envelope and payload properties", () => {
    const missingTopLevel = parsedEnvelope();
    delete (missingTopLevel as Partial<MutableEnvelope>).signature;
    expectEnvelopeError(
      () =>
        parseDetachedAttestationEnvelope({
          envelopeBytes: encodeEnvelope(missingTopLevel),
        }),
      DetachedAttestationEnvelopeFailureReason.INVALID_ENVELOPE_SHAPE,
    );

    const unknownTopLevel = {
      ...parsedEnvelope(),
      extra: "not allowed",
    };
    expectEnvelopeError(
      () =>
        parseDetachedAttestationEnvelope({
          envelopeBytes: encodeEnvelope(unknownTopLevel),
        }),
      DetachedAttestationEnvelopeFailureReason.INVALID_ENVELOPE_SHAPE,
    );

    const missingPayload = parsedEnvelope();
    delete missingPayload.payload.signerKeyId;
    expectEnvelopeError(
      () =>
        parseDetachedAttestationEnvelope({
          envelopeBytes: encodeEnvelope(missingPayload),
        }),
      DetachedAttestationEnvelopeFailureReason.INVALID_ENVELOPE_SHAPE,
    );

    const unknownPayload = parsedEnvelope();
    unknownPayload.payload.extra = "not allowed";
    expectEnvelopeError(
      () =>
        parseDetachedAttestationEnvelope({
          envelopeBytes: encodeEnvelope(unknownPayload),
        }),
      DetachedAttestationEnvelopeFailureReason.INVALID_ENVELOPE_SHAPE,
    );
  });

  it("rejects unsupported format and wrong field types", () => {
    const wrongFormat = parsedEnvelope();
    wrongFormat.format = "devorbit-detached-attestation-v2";
    expectEnvelopeError(
      () =>
        parseDetachedAttestationEnvelope({
          envelopeBytes: encodeEnvelope(wrongFormat),
        }),
      DetachedAttestationEnvelopeFailureReason.INVALID_ENVELOPE_FORMAT,
    );

    const wrongRepositoryType = parsedEnvelope();
    wrongRepositoryType.payload.repositoryId = 1;
    expectEnvelopeError(
      () =>
        parseDetachedAttestationEnvelope({
          envelopeBytes: encodeEnvelope(wrongRepositoryType),
        }),
      DetachedAttestationEnvelopeFailureReason.INVALID_REPOSITORY_ID,
    );

    const wrongPayloadType = parsedEnvelope();
    wrongPayloadType.payload = [] as unknown as Record<string, unknown>;
    expectEnvelopeError(
      () =>
        parseDetachedAttestationEnvelope({
          envelopeBytes: encodeEnvelope(wrongPayloadType),
        }),
      DetachedAttestationEnvelopeFailureReason.INVALID_ENVELOPE_SHAPE,
    );
  });

  it.each([
    [
      "repository syntax",
      "repositoryId",
      JSON.stringify("../repo"),
      "INVALID_REPOSITORY_ID",
    ],
    [
      "repository case",
      "repositoryId",
      JSON.stringify("Owner/repo"),
      "INVALID_REPOSITORY_ID",
    ],
    [
      "revision",
      "revision",
      JSON.stringify("A".repeat(40)),
      "INVALID_REVISION",
    ],
    [
      "asset path",
      "assetPath",
      JSON.stringify("assets/../1.0.0"),
      "INVALID_ASSET_PATH",
    ],
    ["asset ID", "assetId", JSON.stringify("invalid"), "INVALID_ASSET_ID"],
    [
      "asset version",
      "assetVersion",
      JSON.stringify("01.0.0"),
      "INVALID_ASSET_VERSION",
    ],
    [
      "manifest digest",
      "manifestSha256",
      JSON.stringify("A".repeat(64)),
      "INVALID_DIGEST",
    ],
    [
      "content algorithm",
      "contentTreeAlgorithm",
      JSON.stringify("sha256"),
      "INVALID_CONTENT_TREE_ALGORITHM",
    ],
    [
      "content digest",
      "contentTreeSha256",
      JSON.stringify("bad"),
      "INVALID_DIGEST",
    ],
    [
      "signer key ID",
      "signerKeyId",
      JSON.stringify(`sha256:${"D".repeat(64)}`),
      "INVALID_SIGNER_KEY_ID",
    ],
  ] as const)("rejects invalid %s", (_label, field, replacement, reason) => {
    const raw = replaceField(field, replacement);
    expectEnvelopeError(() => parseRaw(raw), reason);
  });

  it("rejects path and identity/version inconsistencies", () => {
    expectEnvelopeError(
      () =>
        parseRaw(
          replaceField(
            "assetPath",
            JSON.stringify("assets/skill.example.asset/1.2.3"),
          ),
        ),
      DetachedAttestationEnvelopeFailureReason.INVALID_ASSET_PATH,
    );
    expectEnvelopeError(
      () =>
        parseRaw(
          replaceField(
            "assetPath",
            JSON.stringify("assets/skill.other.asset/1.2.3-rc.1+build.7"),
          ),
        ),
      DetachedAttestationEnvelopeFailureReason.INVALID_ASSET_PATH,
    );
  });

  it("accepts valid JSON escapes and Unicode pairs before schema validation", () => {
    const escapedAscii = vector.rawEnvelope
      .replace('"owner/repo"', '"\\u006fwner\\/repo"')
      .replace('"skill.example.asset"', '"skill.\\u0065xample.asset"');
    expect(parseRaw(escapedAscii).payload.repositoryId).toBe("owner/repo");

    const escapedPair = replaceField(
      "assetId",
      JSON.stringify("skill.😀.asset"),
    );
    expectEnvelopeError(
      () => parseRaw(escapedPair),
      DetachedAttestationEnvelopeFailureReason.INVALID_ASSET_ID,
    );
    const loneSurrogate = replaceField("assetId", '"skill.\\uD800.asset"');
    expectEnvelopeError(
      () => parseRaw(loneSurrogate),
      DetachedAttestationEnvelopeFailureReason.MALFORMED_JSON,
    );
  });

  it("rejects invalid JSON grammar, escapes, controls, and trailing content", () => {
    for (const raw of [
      replaceField("signature", "01"),
      replaceField("signature", '"bad\\xescape"'),
      replaceField("signature", '"unescaped\ncontrol"'),
      `${vector.rawEnvelope} garbage`,
      vector.rawEnvelope.replace('"payload":{', '"payload":{,'),
      vector.rawEnvelope.replace('"signature":"', '"signature":"\\u12G4'),
    ]) {
      expectEnvelopeError(
        () => parseRaw(raw),
        DetachedAttestationEnvelopeFailureReason.MALFORMED_JSON,
      );
    }
  });

  it("accepts valid JSON numbers, booleans, nulls, and arrays before field typing", () => {
    for (const replacement of [
      "0",
      "-1",
      "1.25e+2",
      "true",
      "false",
      "null",
      "[]",
      "{}",
    ]) {
      expectEnvelopeError(
        () => parseRaw(replaceField("repositoryId", replacement)),
        DetachedAttestationEnvelopeFailureReason.INVALID_REPOSITORY_ID,
      );
    }
  });

  it("enforces maximum JSON nesting depth of eight containers", () => {
    const atLimit = replaceSignature(
      vector.rawEnvelope,
      `${"[".repeat(maxJsonDepth - 1)}"x"${"]".repeat(maxJsonDepth - 1)}`,
    );
    expectEnvelopeError(
      () => parseRaw(atLimit),
      DetachedAttestationEnvelopeFailureReason.INVALID_SIGNATURE_ENCODING,
    );

    const overLimit = replaceSignature(
      vector.rawEnvelope,
      `${"[".repeat(maxJsonDepth)}"x"${"]".repeat(maxJsonDepth)}`,
    );
    expectEnvelopeError(
      () => parseRaw(overLimit),
      DetachedAttestationEnvelopeFailureReason.JSON_DEPTH_EXCEEDED,
    );
  });

  it("counts each object key and each JSON value against the 128-node limit", () => {
    const withArrayNodes = (nullCount: number) =>
      `${vector.rawEnvelope.slice(0, -1)},"extra":[${Array.from(
        { length: nullCount },
        () => "null",
      ).join(",")}]}`;

    expectEnvelopeError(
      () => parseRaw(withArrayNodes(maxJsonNodes - 27)),
      DetachedAttestationEnvelopeFailureReason.INVALID_ENVELOPE_SHAPE,
    );
    expectEnvelopeError(
      () => parseRaw(withArrayNodes(maxJsonNodes - 26)),
      DetachedAttestationEnvelopeFailureReason.JSON_NODE_LIMIT_EXCEEDED,
    );
  });

  it("requires canonical unpadded base64url encoding of exactly 64 bytes", () => {
    for (const invalid of [
      `"${validSignature}="`,
      `"${validSignature.slice(0, -1)}B"`,
      `"${Buffer.alloc(63).toString("base64url")}"`,
      `"${Buffer.alloc(65).toString("base64url")}"`,
      '"not+base64url"',
    ]) {
      expectEnvelopeError(
        () => parseRaw(replaceSignature(vector.rawEnvelope, invalid)),
        DetachedAttestationEnvelopeFailureReason.INVALID_SIGNATURE_ENCODING,
      );
    }
  });

  it("returns copied signature bytes, a stable digest, and generic non-sensitive failures", () => {
    const result = parseRaw(vector.rawEnvelope);
    result.signature[0] = 1;
    expect(parseRaw(vector.rawEnvelope).signature[0]).toBe(0);

    const attackerValue = "private-attacker-input";
    try {
      parseRaw(replaceField("repositoryId", JSON.stringify(attackerValue)));
      expect.fail("Expected invalid repository ID.");
    } catch (error) {
      expect(error).toBeInstanceOf(DetachedAttestationEnvelopeError);
      expect((error as Error).message).toBe(
        "Detached attestation envelope is invalid.",
      );
      expect((error as Error).message).not.toContain(attackerValue);
    }
  });
});
