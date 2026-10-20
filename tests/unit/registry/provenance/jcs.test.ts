import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  canonicalizeJcs,
  JcsCanonicalizationError,
  JcsFailureReason,
  type JcsResourceBudget,
} from "../../../../packages/registry/src/provenance/jcs.js";

interface NumberVector {
  readonly name: string;
  readonly ieee754Hex: string;
  readonly canonical: string;
}

interface ObjectVector {
  readonly name: string;
  readonly input: string;
  readonly canonical: string;
}

const vectors = JSON.parse(
  readFileSync(
    resolve(process.cwd(), "tests/fixtures/registry/jcs-vectors.json"),
    "utf8",
  ),
) as {
  readonly numberVectors: readonly NumberVector[];
  readonly objectVectors: readonly ObjectVector[];
};

const generousBudget: JcsResourceBudget = {
  maxDepth: 64,
  maxNodes: 100_000,
  maxPropertiesPerObject: 10_000,
  maxStringUtf8Bytes: 1024 * 1024,
  maxTotalStringUtf8Bytes: 4 * 1024 * 1024,
  maxOutputBytes: 4 * 1024 * 1024,
};

function canonicalText(value: unknown, budget = generousBudget): string {
  return new TextDecoder().decode(canonicalizeJcs(value, budget));
}

function expectJcsFailure(
  callback: () => unknown,
  reason: JcsFailureReason,
): void {
  try {
    callback();
    expect.fail("Expected JCS canonicalization to fail.");
  } catch (error) {
    expect(error).toBeInstanceOf(JcsCanonicalizationError);
    expect((error as JcsCanonicalizationError).reason).toBe(reason);
    expect((error as Error).message).toBe("JCS canonicalization failed.");
  }
}

function numberFromHex(hex: string): number {
  const bytes = Buffer.from(hex, "hex");
  return new DataView(
    bytes.buffer,
    bytes.byteOffset,
    bytes.byteLength,
  ).getFloat64(0, false);
}

describe("internal RFC 8785 JCS canonicalizer", () => {
  it("matches RFC 8785 Appendix B binary64 serialization vectors", () => {
    for (const vector of vectors.numberVectors) {
      expect(
        Buffer.from(
          canonicalizeJcs(numberFromHex(vector.ieee754Hex), generousBudget),
        ),
        vector.name,
      ).toEqual(Buffer.from(vector.canonical, "utf8"));
    }
  });

  it("matches the RFC 8785 canonical object example byte-for-byte", () => {
    for (const vector of vectors.objectVectors) {
      const input: unknown = JSON.parse(vector.input);
      expect(
        Buffer.from(canonicalizeJcs(input, generousBudget)),
        vector.name,
      ).toEqual(Buffer.from(vector.canonical, "utf8"));
    }
  });

  it("sorts property names by UTF-16 code units", () => {
    const value = Object.create(null) as Record<string, unknown>;
    value["\u{10000}"] = 1;
    value["\ue000"] = 2;
    value.z = 3;
    value.A = 4;

    expect(canonicalText(value)).toBe('{"A":4,"z":3,"𐀀":1,"":2}');
  });

  it("escapes strings and preserves valid Unicode without normalization", () => {
    const value = {
      text: '"\\\b\t\n\f\r\u0000\u001f/é\u{1f600}',
      composed: "\u00e9",
      decomposed: "e\u0301",
    };
    expect(canonicalText(value)).toBe(
      '{"composed":"é","decomposed":"é","text":"\\"\\\\\\b\\t\\n\\f\\r\\u0000\\u001f/é😀"}',
    );
  });

  it("supports empty structures and prototype-sensitive property names safely", () => {
    const value = Object.create(null) as Record<string, unknown>;
    Object.defineProperty(value, "__proto__", {
      value: { polluted: true },
      enumerable: true,
      configurable: true,
      writable: true,
    });
    expect(canonicalText(value)).toBe('{"__proto__":{"polluted":true}}');
    expect(Object.getPrototypeOf(value)).toBeNull();

    const ordinary = { proto: "proto-value" };
    Object.defineProperty(ordinary, "__proto__", {
      value: { own: true },
      enumerable: true,
      configurable: true,
      writable: true,
    });
    Object.defineProperty(ordinary, "constructor", {
      value: "constructor-value",
      enumerable: true,
      configurable: true,
      writable: true,
    });
    Object.defineProperty(ordinary, "prototype", {
      value: "prototype-value",
      enumerable: true,
      configurable: true,
      writable: true,
    });
    const originalPrototype = Object.getPrototypeOf(ordinary);
    expect(canonicalText(ordinary)).toBe(
      '{"__proto__":{"own":true},"constructor":"constructor-value","proto":"proto-value","prototype":"prototype-value"}',
    );
    expect(Object.getPrototypeOf(ordinary)).toBe(originalPrototype);

    const ownProto = Object.create(Object.prototype) as Record<string, unknown>;
    Object.defineProperty(ownProto, "__proto__", {
      value: { own: true },
      enumerable: true,
      configurable: true,
      writable: true,
    });
    expect(canonicalText(ownProto)).toBe('{"__proto__":{"own":true}}');
    expect(Object.getPrototypeOf(ownProto)).toBe(Object.prototype);
    expect(canonicalText({})).toBe("{}");
    expect(canonicalText([])).toBe("[]");
  });

  it("serializes nested arrays and objects deterministically", () => {
    expect(canonicalText({ z: [null, true, { b: 2, a: 1 }], a: [] })).toBe(
      '{"a":[],"z":[null,true,{"a":1,"b":2}]}',
    );
  });

  it("rejects non-finite numbers and unsupported primitive values", () => {
    for (const value of [
      Number.NaN,
      Number.POSITIVE_INFINITY,
      Number.NEGATIVE_INFINITY,
    ]) {
      expectJcsFailure(
        () => canonicalizeJcs(value, generousBudget),
        JcsFailureReason.INVALID_VALUE,
      );
    }
    for (const value of [undefined, 1n, Symbol("x"), () => undefined]) {
      expectJcsFailure(
        () => canonicalizeJcs(value, generousBudget),
        JcsFailureReason.INVALID_VALUE,
      );
    }
  });

  it("rejects lone surrogates in string values and property names", () => {
    expectJcsFailure(
      () => canonicalizeJcs("\ud800", generousBudget),
      JcsFailureReason.INVALID_UNICODE,
    );
    const invalidKey = Object.create(null) as Record<string, unknown>;
    invalidKey["\udfff"] = 1;
    expectJcsFailure(
      () => canonicalizeJcs(invalidKey, generousBudget),
      JcsFailureReason.INVALID_UNICODE,
    );
  });

  it("rejects custom prototypes, accessors, symbols, and non-enumerable properties", () => {
    expectJcsFailure(
      () => canonicalizeJcs(new Date(0), generousBudget),
      JcsFailureReason.UNSUPPORTED_OBJECT_SHAPE,
    );

    const accessor = {};
    Object.defineProperty(accessor, "value", {
      enumerable: true,
      get: () => 1,
    });
    expectJcsFailure(
      () => canonicalizeJcs(accessor, generousBudget),
      JcsFailureReason.UNSUPPORTED_OBJECT_SHAPE,
    );

    expectJcsFailure(
      () => canonicalizeJcs({ [Symbol("extra")]: 1 }, generousBudget),
      JcsFailureReason.UNSUPPORTED_OBJECT_SHAPE,
    );

    const hidden = {};
    Object.defineProperty(hidden, "hidden", { value: 1 });
    expectJcsFailure(
      () => canonicalizeJcs(hidden, generousBudget),
      JcsFailureReason.UNSUPPORTED_OBJECT_SHAPE,
    );
  });

  it("rejects sparse arrays, accessors, extra properties, and custom prototypes", () => {
    const sparse = new Array(1);
    expectJcsFailure(
      () => canonicalizeJcs(sparse, generousBudget),
      JcsFailureReason.UNSUPPORTED_OBJECT_SHAPE,
    );

    const accessor: unknown[] = [];
    Object.defineProperty(accessor, "0", {
      enumerable: true,
      get: () => 1,
    });
    accessor.length = 1;
    expectJcsFailure(
      () => canonicalizeJcs(accessor, generousBudget),
      JcsFailureReason.UNSUPPORTED_OBJECT_SHAPE,
    );

    const extra = [1] as number[] & { extra?: number };
    extra.extra = 2;
    expectJcsFailure(
      () => canonicalizeJcs(extra, generousBudget),
      JcsFailureReason.UNSUPPORTED_OBJECT_SHAPE,
    );

    const customPrototype = Object.setPrototypeOf([], {});
    expectJcsFailure(
      () => canonicalizeJcs(customPrototype, generousBudget),
      JcsFailureReason.UNSUPPORTED_OBJECT_SHAPE,
    );
  });

  it("rejects cyclic structures but permits repeated acyclic references", () => {
    const cyclic: { self?: unknown } = {};
    cyclic.self = cyclic;
    expectJcsFailure(
      () => canonicalizeJcs(cyclic, generousBudget),
      JcsFailureReason.CYCLE_DETECTED,
    );

    const shared = { value: 1 };
    expect(canonicalText([shared, shared])).toBe('[{"value":1},{"value":1}]');
  });

  it("does not mutate inputs and returns independently owned output bytes", () => {
    const value = Object.freeze({ nested: Object.freeze([1, "é"]) });
    const first = canonicalizeJcs(value, generousBudget);
    const before = new TextDecoder().decode(first);
    first[0] = 0;
    const second = canonicalizeJcs(value, generousBudget);

    expect(new TextDecoder().decode(second)).toBe(before);
    expect(value.nested).toEqual([1, "é"]);
  });

  it("accepts exact depth and rejects one level over", () => {
    const atLimit = { child: [] };
    expect(canonicalText(atLimit, { ...generousBudget, maxDepth: 2 })).toBe(
      '{"child":[]}',
    );
    expectJcsFailure(
      () =>
        canonicalizeJcs(atLimit, {
          ...generousBudget,
          maxDepth: 1,
        }),
      JcsFailureReason.DEPTH_LIMIT_EXCEEDED,
    );
    expect(canonicalText(1, { ...generousBudget, maxDepth: 0 })).toBe("1");
  });

  it("enforces the inclusive node limit", () => {
    expect(canonicalText([1, 2], { ...generousBudget, maxNodes: 3 })).toBe(
      "[1,2]",
    );
    expectJcsFailure(
      () =>
        canonicalizeJcs([1, 2], {
          ...generousBudget,
          maxNodes: 2,
        }),
      JcsFailureReason.NODE_LIMIT_EXCEEDED,
    );
    expectJcsFailure(
      () =>
        canonicalizeJcs(null, {
          ...generousBudget,
          maxNodes: 0,
        }),
      JcsFailureReason.NODE_LIMIT_EXCEEDED,
    );
  });

  it("enforces inclusive object property limits before sorting", () => {
    expect(
      canonicalText(
        { b: 1, a: 2 },
        { ...generousBudget, maxPropertiesPerObject: 2 },
      ),
    ).toBe('{"a":2,"b":1}');
    expectJcsFailure(
      () =>
        canonicalizeJcs(
          { b: 1, a: 2 },
          { ...generousBudget, maxPropertiesPerObject: 1 },
        ),
      JcsFailureReason.PROPERTY_LIMIT_EXCEEDED,
    );
  });

  it("enforces per-string and cumulative UTF-8 byte limits", () => {
    expect(
      canonicalText("", {
        ...generousBudget,
        maxStringUtf8Bytes: 0,
        maxTotalStringUtf8Bytes: 0,
      }),
    ).toBe('""');
    expect(
      canonicalText("é", {
        ...generousBudget,
        maxStringUtf8Bytes: 2,
        maxTotalStringUtf8Bytes: 2,
      }),
    ).toBe('"é"');
    expectJcsFailure(
      () =>
        canonicalizeJcs("é", {
          ...generousBudget,
          maxStringUtf8Bytes: 1,
        }),
      JcsFailureReason.STRING_LIMIT_EXCEEDED,
    );
    expectJcsFailure(
      () =>
        canonicalizeJcs(
          { a: "é" },
          {
            ...generousBudget,
            maxStringUtf8Bytes: 2,
            maxTotalStringUtf8Bytes: 2,
          },
        ),
      JcsFailureReason.STRING_LIMIT_EXCEEDED,
    );
    expect(
      canonicalText(
        { a: "é" },
        {
          ...generousBudget,
          maxStringUtf8Bytes: 2,
          maxTotalStringUtf8Bytes: 3,
        },
      ),
    ).toBe('{"a":"é"}');
  });

  it("rejects large strings as soon as their string budgets are exceeded", () => {
    const largeValue = "x".repeat(2_000_000);
    expectJcsFailure(
      () =>
        canonicalizeJcs(largeValue, {
          ...generousBudget,
          maxStringUtf8Bytes: 8,
        }),
      JcsFailureReason.STRING_LIMIT_EXCEEDED,
    );

    const largeKey = "k".repeat(2_000_000);
    const value = Object.create(null) as Record<string, unknown>;
    value[largeKey] = 1;
    expectJcsFailure(
      () =>
        canonicalizeJcs(value, {
          ...generousBudget,
          maxStringUtf8Bytes: 8,
        }),
      JcsFailureReason.STRING_LIMIT_EXCEEDED,
    );

    expectJcsFailure(
      () =>
        canonicalizeJcs("large cumulative value", {
          ...generousBudget,
          maxTotalStringUtf8Bytes: 4,
        }),
      JcsFailureReason.STRING_LIMIT_EXCEEDED,
    );
  });

  it("enforces exact output bytes including escaped control expansion", () => {
    expect(
      canonicalText("\u0000", {
        ...generousBudget,
        maxOutputBytes: 8,
      }),
    ).toBe('"\\u0000"');
    expectJcsFailure(
      () =>
        canonicalizeJcs("\u0000", {
          ...generousBudget,
          maxOutputBytes: 7,
        }),
      JcsFailureReason.OUTPUT_LIMIT_EXCEEDED,
    );
    expectJcsFailure(
      () =>
        canonicalizeJcs(
          {},
          {
            ...generousBudget,
            maxOutputBytes: 1,
          },
        ),
      JcsFailureReason.OUTPUT_LIMIT_EXCEEDED,
    );
    expectJcsFailure(
      () =>
        canonicalizeJcs("x", {
          ...generousBudget,
          maxOutputBytes: 0,
        }),
      JcsFailureReason.OUTPUT_LIMIT_EXCEEDED,
    );
  });

  it("enforces output limits at the 4096-byte chunk boundary", () => {
    const value = "a".repeat(4094);
    const canonical = `"${value}"`;
    expect(
      canonicalText(value, {
        ...generousBudget,
        maxOutputBytes: 4096,
      }),
    ).toBe(canonical);
    expectJcsFailure(
      () =>
        canonicalizeJcs(value, {
          ...generousBudget,
          maxOutputBytes: 4095,
        }),
      JcsFailureReason.OUTPUT_LIMIT_EXCEEDED,
    );

    const overChunk = "b".repeat(4095);
    expect(
      canonicalText(overChunk, {
        ...generousBudget,
        maxOutputBytes: 4097,
      }),
    ).toBe(`"${overChunk}"`);
    expectJcsFailure(
      () =>
        canonicalizeJcs(overChunk, {
          ...generousBudget,
          maxOutputBytes: 4096,
        }),
      JcsFailureReason.OUTPUT_LIMIT_EXCEEDED,
    );
  });

  it("rejects malformed, missing, accessor-backed, and unexpected budgets", () => {
    const invalidBudgets: unknown[] = [
      null,
      [],
      {},
      { ...generousBudget, extra: 1 },
      { ...generousBudget, maxDepth: -1 },
      { ...generousBudget, maxNodes: 1.5 },
      { ...generousBudget, maxOutputBytes: Number.MAX_SAFE_INTEGER + 1 },
      { ...generousBudget, maxDepth: Number.NaN },
      { ...generousBudget, maxDepth: Number.POSITIVE_INFINITY },
      { ...generousBudget, maxDepth: Number.NEGATIVE_INFINITY },
      { ...generousBudget, maxDepth: "64" },
    ];
    const accessorBudget = { ...generousBudget };
    Object.defineProperty(accessorBudget, "maxDepth", {
      enumerable: true,
      get: () => 64,
    });
    invalidBudgets.push(accessorBudget);

    for (const budget of invalidBudgets) {
      expectJcsFailure(
        () => canonicalizeJcs(null, budget as JcsResourceBudget),
        JcsFailureReason.INVALID_BUDGET,
      );
    }

    const symbolBudget = {
      ...generousBudget,
      [Symbol("extra")]: 1,
    };
    expectJcsFailure(
      () => canonicalizeJcs(null, symbolBudget),
      JcsFailureReason.INVALID_BUDGET,
    );
  });

  it("uses generic errors without attacker-controlled strings", () => {
    const secret = "attacker-controlled-secret";
    expectJcsFailure(
      () => canonicalizeJcs({ [secret]: "\ud800" }, generousBudget),
      JcsFailureReason.INVALID_UNICODE,
    );
  });
});
