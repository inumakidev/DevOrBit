const budgetFields = [
  "maxDepth",
  "maxNodes",
  "maxPropertiesPerObject",
  "maxStringUtf8Bytes",
  "maxTotalStringUtf8Bytes",
  "maxOutputBytes",
] as const;

export const JcsFailureReason = {
  INVALID_BUDGET: "INVALID_BUDGET",
  INVALID_VALUE: "INVALID_VALUE",
  UNSUPPORTED_OBJECT_SHAPE: "UNSUPPORTED_OBJECT_SHAPE",
  INVALID_UNICODE: "INVALID_UNICODE",
  CYCLE_DETECTED: "CYCLE_DETECTED",
  DEPTH_LIMIT_EXCEEDED: "DEPTH_LIMIT_EXCEEDED",
  NODE_LIMIT_EXCEEDED: "NODE_LIMIT_EXCEEDED",
  PROPERTY_LIMIT_EXCEEDED: "PROPERTY_LIMIT_EXCEEDED",
  STRING_LIMIT_EXCEEDED: "STRING_LIMIT_EXCEEDED",
  OUTPUT_LIMIT_EXCEEDED: "OUTPUT_LIMIT_EXCEEDED",
} as const;

export type JcsFailureReason =
  (typeof JcsFailureReason)[keyof typeof JcsFailureReason];

export class JcsCanonicalizationError extends Error {
  readonly reason: JcsFailureReason;

  constructor(reason: JcsFailureReason) {
    super("JCS canonicalization failed.");
    this.name = "JcsCanonicalizationError";
    this.reason = reason;
  }
}

export interface JcsResourceBudget {
  readonly maxDepth: number;
  readonly maxNodes: number;
  readonly maxPropertiesPerObject: number;
  readonly maxStringUtf8Bytes: number;
  readonly maxTotalStringUtf8Bytes: number;
  readonly maxOutputBytes: number;
}

interface ObjectProperty {
  readonly key: string;
  readonly value: unknown;
}

interface ArrayFrame {
  readonly type: "array";
  readonly value: object;
  readonly depth: number;
  readonly items: readonly unknown[];
  index: number;
}

interface ObjectFrame {
  readonly type: "object";
  readonly value: object;
  readonly depth: number;
  readonly items: readonly ObjectProperty[];
  index: number;
}

type ContainerFrame = ArrayFrame | ObjectFrame;

const chunkSize = 4096;
const hexDigits = "0123456789abcdef";

function fail(reason: JcsFailureReason): never {
  throw new JcsCanonicalizationError(reason);
}

function isObjectLike(value: unknown): value is object {
  return typeof value === "object" && value !== null;
}

function validateBudget(value: unknown): JcsResourceBudget {
  if (
    !isObjectLike(value) ||
    Array.isArray(value) ||
    (Object.getPrototypeOf(value) !== Object.prototype &&
      Object.getPrototypeOf(value) !== null)
  ) {
    return fail(JcsFailureReason.INVALID_BUDGET);
  }

  const keys = Reflect.ownKeys(value);
  if (
    keys.length !== budgetFields.length ||
    keys.some(
      (key) =>
        typeof key !== "string" || !budgetFields.some((field) => field === key),
    )
  ) {
    return fail(JcsFailureReason.INVALID_BUDGET);
  }

  const validated: number[] = [];
  for (const field of budgetFields) {
    const descriptor = Object.getOwnPropertyDescriptor(value, field);
    if (
      descriptor === undefined ||
      !descriptor.enumerable ||
      !Object.hasOwn(descriptor, "value") ||
      typeof descriptor.value !== "number" ||
      !Number.isSafeInteger(descriptor.value) ||
      descriptor.value < 0
    ) {
      return fail(JcsFailureReason.INVALID_BUDGET);
    }
    validated.push(descriptor.value);
  }

  const [
    maxDepth,
    maxNodes,
    maxPropertiesPerObject,
    maxStringUtf8Bytes,
    maxTotalStringUtf8Bytes,
    maxOutputBytes,
  ] = validated;
  if (
    maxDepth === undefined ||
    maxNodes === undefined ||
    maxPropertiesPerObject === undefined ||
    maxStringUtf8Bytes === undefined ||
    maxTotalStringUtf8Bytes === undefined ||
    maxOutputBytes === undefined
  ) {
    return fail(JcsFailureReason.INVALID_BUDGET);
  }
  return {
    maxDepth,
    maxNodes,
    maxPropertiesPerObject,
    maxStringUtf8Bytes,
    maxTotalStringUtf8Bytes,
    maxOutputBytes,
  };
}

class ByteWriter {
  private readonly chunks: Uint8Array[] = [];
  private current: Uint8Array | undefined;
  private currentLength = 0;
  private length = 0;

  constructor(private readonly maximum: number) {}

  get byteLength(): number {
    return this.length;
  }

  writeByte(value: number): void {
    this.ensureCapacity(1);
    const current = this.current;
    if (current === undefined) {
      fail(JcsFailureReason.INVALID_VALUE);
    }
    current[this.currentLength] = value;
    this.currentLength += 1;
    this.length += 1;
  }

  writeAscii(value: string): void {
    for (let index = 0; index < value.length; index += 1) {
      const code = value.charCodeAt(index);
      if (code > 0x7f) {
        fail(JcsFailureReason.INVALID_VALUE);
      }
      this.writeByte(code);
    }
  }

  finish(): Uint8Array {
    if (this.current !== undefined && this.currentLength > 0) {
      this.chunks.push(this.current.subarray(0, this.currentLength));
    }
    // Bounded chunks remain live while allocating the newly owned result buffer.
    const result = new Uint8Array(this.length);
    let offset = 0;
    for (const chunk of this.chunks) {
      result.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return result;
  }

  private ensureCapacity(additionalBytes: number): void {
    if (
      !Number.isSafeInteger(additionalBytes) ||
      additionalBytes < 0 ||
      this.length > this.maximum - additionalBytes
    ) {
      fail(JcsFailureReason.OUTPUT_LIMIT_EXCEEDED);
    }

    if (
      this.current === undefined ||
      this.currentLength + additionalBytes > this.current.byteLength
    ) {
      if (this.current !== undefined && this.currentLength > 0) {
        this.chunks.push(this.current.subarray(0, this.currentLength));
      }
      this.current = new Uint8Array(chunkSize);
      this.currentLength = 0;
    }
  }
}

/**
 * Canonicalizes trusted duplicate-aware JSON data or controlled internal values.
 * Arbitrary JavaScript proxies are unsupported and cannot be reliably detected.
 */
export function canonicalizeJcs(
  value: unknown,
  budgetValue: JcsResourceBudget,
): Uint8Array {
  const budget = validateBudget(budgetValue);
  const writer = new ByteWriter(budget.maxOutputBytes);
  const active = new WeakSet<object>();
  let nodeCount = 0;
  let totalStringBytes = 0;

  function accountNode(): void {
    if (nodeCount >= budget.maxNodes) {
      fail(JcsFailureReason.NODE_LIMIT_EXCEEDED);
    }
    nodeCount += 1;
  }

  function inspectString(valueToInspect: string): void {
    let utf8Length = 0;
    for (let index = 0; index < valueToInspect.length; index += 1) {
      const codeUnit = valueToInspect.charCodeAt(index);
      if (codeUnit >= 0xd800 && codeUnit <= 0xdbff) {
        const next = valueToInspect.charCodeAt(index + 1);
        if (
          index + 1 >= valueToInspect.length ||
          next < 0xdc00 ||
          next > 0xdfff
        ) {
          fail(JcsFailureReason.INVALID_UNICODE);
        }
        utf8Length += 4;
        index += 1;
      } else if (codeUnit >= 0xdc00 && codeUnit <= 0xdfff) {
        fail(JcsFailureReason.INVALID_UNICODE);
      } else if (codeUnit <= 0x7f) {
        utf8Length += 1;
      } else if (codeUnit <= 0x7ff) {
        utf8Length += 2;
      } else {
        utf8Length += 3;
      }
      if (
        utf8Length > budget.maxStringUtf8Bytes ||
        totalStringBytes > budget.maxTotalStringUtf8Bytes - utf8Length
      ) {
        fail(JcsFailureReason.STRING_LIMIT_EXCEEDED);
      }
    }
    totalStringBytes += utf8Length;
  }

  function emitUtf8(codePoint: number): void {
    if (codePoint <= 0x7f) {
      writer.writeByte(codePoint);
    } else if (codePoint <= 0x7ff) {
      writer.writeByte(0xc0 | (codePoint >> 6));
      writer.writeByte(0x80 | (codePoint & 0x3f));
    } else if (codePoint <= 0xffff) {
      writer.writeByte(0xe0 | (codePoint >> 12));
      writer.writeByte(0x80 | ((codePoint >> 6) & 0x3f));
      writer.writeByte(0x80 | (codePoint & 0x3f));
    } else {
      writer.writeByte(0xf0 | (codePoint >> 18));
      writer.writeByte(0x80 | ((codePoint >> 12) & 0x3f));
      writer.writeByte(0x80 | ((codePoint >> 6) & 0x3f));
      writer.writeByte(0x80 | (codePoint & 0x3f));
    }
  }

  function writeString(valueToEmit: string): void {
    writer.writeByte(0x22);
    for (let index = 0; index < valueToEmit.length; index += 1) {
      const codeUnit = valueToEmit.charCodeAt(index);
      if (codeUnit === 0x22) {
        writer.writeAscii('\\"');
      } else if (codeUnit === 0x5c) {
        writer.writeAscii("\\\\");
      } else if (codeUnit === 0x08) {
        writer.writeAscii("\\b");
      } else if (codeUnit === 0x09) {
        writer.writeAscii("\\t");
      } else if (codeUnit === 0x0a) {
        writer.writeAscii("\\n");
      } else if (codeUnit === 0x0c) {
        writer.writeAscii("\\f");
      } else if (codeUnit === 0x0d) {
        writer.writeAscii("\\r");
      } else if (codeUnit < 0x20) {
        writer.writeAscii(
          `\\u00${hexDigits[codeUnit >> 4]}${hexDigits[codeUnit & 0x0f]}`,
        );
      } else if (codeUnit >= 0xd800 && codeUnit <= 0xdbff) {
        const low = valueToEmit.charCodeAt(index + 1);
        emitUtf8(0x10000 + ((codeUnit - 0xd800) << 10) + (low - 0xdc00));
        index += 1;
      } else {
        emitUtf8(codeUnit);
      }
    }
    writer.writeByte(0x22);
  }

  function emitString(valueToEmit: string): void {
    inspectString(valueToEmit);
    writeString(valueToEmit);
  }

  function compareUtf16(left: string, right: string): number {
    return left < right ? -1 : left > right ? 1 : 0;
  }

  function inspectObject(valueToInspect: object): ObjectProperty[] {
    const prototype = Object.getPrototypeOf(valueToInspect);
    if (prototype !== Object.prototype && prototype !== null) {
      fail(JcsFailureReason.UNSUPPORTED_OBJECT_SHAPE);
    }

    const keys = Reflect.ownKeys(valueToInspect);
    if (keys.length > budget.maxPropertiesPerObject) {
      fail(JcsFailureReason.PROPERTY_LIMIT_EXCEEDED);
    }
    if (keys.length > budget.maxNodes - nodeCount) {
      fail(JcsFailureReason.NODE_LIMIT_EXCEEDED);
    }

    const properties: ObjectProperty[] = [];
    for (const key of keys) {
      if (typeof key !== "string") {
        fail(JcsFailureReason.UNSUPPORTED_OBJECT_SHAPE);
      }
      inspectString(key);
      const descriptor = Object.getOwnPropertyDescriptor(valueToInspect, key);
      if (
        descriptor === undefined ||
        !descriptor.enumerable ||
        !Object.hasOwn(descriptor, "value")
      ) {
        fail(JcsFailureReason.UNSUPPORTED_OBJECT_SHAPE);
      }
      properties.push({ key, value: descriptor.value });
    }

    properties.sort((left, right) => compareUtf16(left.key, right.key));
    return properties;
  }

  function inspectArray(valueToInspect: unknown[]): readonly unknown[] {
    if (Object.getPrototypeOf(valueToInspect) !== Array.prototype) {
      fail(JcsFailureReason.UNSUPPORTED_OBJECT_SHAPE);
    }

    const ownKeys = Reflect.ownKeys(valueToInspect);
    if (ownKeys.length !== valueToInspect.length + 1) {
      fail(JcsFailureReason.UNSUPPORTED_OBJECT_SHAPE);
    }
    let hasLength = false;
    for (const key of ownKeys) {
      if (key === "length") {
        hasLength = true;
      } else if (
        typeof key !== "string" ||
        !/^(0|[1-9][0-9]*)$/.test(key) ||
        Number(key) >= valueToInspect.length
      ) {
        fail(JcsFailureReason.UNSUPPORTED_OBJECT_SHAPE);
      }
    }
    if (!hasLength) {
      fail(JcsFailureReason.UNSUPPORTED_OBJECT_SHAPE);
    }

    const values: unknown[] = [];
    for (let index = 0; index < valueToInspect.length; index += 1) {
      const descriptor = Object.getOwnPropertyDescriptor(
        valueToInspect,
        String(index),
      );
      if (
        descriptor === undefined ||
        !descriptor.enumerable ||
        !Object.hasOwn(descriptor, "value")
      ) {
        fail(JcsFailureReason.UNSUPPORTED_OBJECT_SHAPE);
      }
      values.push(descriptor.value);
    }
    return values;
  }

  const frames: ContainerFrame[] = [];

  function beginValue(current: unknown, parentDepth: number): void {
    accountNode();

    if (current === null) {
      writer.writeAscii("null");
    } else if (typeof current === "boolean") {
      writer.writeAscii(current ? "true" : "false");
    } else if (typeof current === "number") {
      if (!Number.isFinite(current)) {
        fail(JcsFailureReason.INVALID_VALUE);
      }
      const serialized = JSON.stringify(current);
      if (typeof serialized !== "string") {
        fail(JcsFailureReason.INVALID_VALUE);
      }
      writer.writeAscii(serialized);
    } else if (typeof current === "string") {
      emitString(current);
    } else if (Array.isArray(current)) {
      const depth = parentDepth + 1;
      if (depth > budget.maxDepth) {
        fail(JcsFailureReason.DEPTH_LIMIT_EXCEEDED);
      }
      if (active.has(current)) {
        fail(JcsFailureReason.CYCLE_DETECTED);
      }
      if (current.length > budget.maxNodes - nodeCount) {
        fail(JcsFailureReason.NODE_LIMIT_EXCEEDED);
      }
      const values = inspectArray(current);
      active.add(current);
      writer.writeByte(0x5b);
      frames.push({
        type: "array",
        value: current,
        depth,
        items: values,
        index: 0,
      });
    } else if (isObjectLike(current)) {
      const depth = parentDepth + 1;
      if (depth > budget.maxDepth) {
        fail(JcsFailureReason.DEPTH_LIMIT_EXCEEDED);
      }
      if (active.has(current)) {
        fail(JcsFailureReason.CYCLE_DETECTED);
      }
      const properties = inspectObject(current);
      active.add(current);
      writer.writeByte(0x7b);
      frames.push({
        type: "object",
        value: current,
        depth,
        items: properties,
        index: 0,
      });
    } else {
      fail(JcsFailureReason.INVALID_VALUE);
    }
  }

  beginValue(value, 0);
  while (frames.length > 0) {
    const frame = frames[frames.length - 1];
    if (frame === undefined) {
      fail(JcsFailureReason.INVALID_VALUE);
    }

    if (frame.index >= frame.items.length) {
      writer.writeByte(frame.type === "array" ? 0x5d : 0x7d);
      active.delete(frame.value);
      frames.pop();
      continue;
    }

    if (frame.index > 0) {
      writer.writeByte(0x2c);
    }

    let child: unknown;
    if (frame.type === "object") {
      const property = frame.items[frame.index];
      if (property === undefined) {
        fail(JcsFailureReason.INVALID_VALUE);
      }
      writeString(property.key);
      writer.writeByte(0x3a);
      child = property.value;
    } else {
      child = frame.items[frame.index];
    }
    frame.index += 1;
    beginValue(child, frame.depth);
  }

  return writer.finish();
}
