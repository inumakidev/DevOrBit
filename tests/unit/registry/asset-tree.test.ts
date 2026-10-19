import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  type AssetTreeFile,
  AssetTreeIntegrityError,
  AssetTreeIntegrityErrorCode,
  computeAssetTreeDigest,
} from "../../../packages/registry/src/index.js";

interface AssetTreeVector {
  readonly name: string;
  readonly files: readonly {
    readonly path: string;
    readonly bytesHex: string;
  }[];
  readonly expectedDigest: string;
}

const vectorFixture = JSON.parse(
  readFileSync(
    resolve(process.cwd(), "tests/fixtures/registry/asset-tree-vectors.json"),
    "utf8",
  ),
) as { readonly vectors: readonly AssetTreeVector[] };

function vectorFiles(vector: AssetTreeVector): AssetTreeFile[] {
  return vector.files.map(({ path, bytesHex }) => ({
    path,
    bytes: Buffer.from(bytesHex, "hex"),
  }));
}

function expectErrorCode(
  action: () => unknown,
  code: (typeof AssetTreeIntegrityErrorCode)[keyof typeof AssetTreeIntegrityErrorCode],
): void {
  try {
    action();
    expect.fail(`Expected AssetTreeIntegrityError with code ${code}.`);
  } catch (error) {
    expect(error).toBeInstanceOf(AssetTreeIntegrityError);
    expect(error).toMatchObject({ code });
  }
}

describe("devorbit-asset-tree-v1 integrity", () => {
  it.each(vectorFixture.vectors)(
    "$name matches its independent vector",
    (vector) => {
      expect(computeAssetTreeDigest(vectorFiles(vector))).toBe(
        vector.expectedDigest,
      );
    },
  );

  it("is independent of file input order and uses canonical path sorting", () => {
    const vector = vectorFixture.vectors.find(
      ({ name }) => name === "multiple-files-discovered-in-reverse-order",
    );
    if (vector === undefined) {
      throw new Error("Required reverse-order asset-tree vector is missing.");
    }
    const reverseOrderedFiles = vectorFiles(vector).reverse();

    expect(computeAssetTreeDigest(reverseOrderedFiles)).toBe(
      vector.expectedDigest,
    );
  });

  it("rejects unsafe and unsupported paths without normalizing them", () => {
    for (const path of [
      "",
      "/absolute.txt",
      "a//b.txt",
      "./a.txt",
      "a/../b.txt",
      "a\\b.txt",
      "a:b.txt",
      "trailing.",
      "trailing ",
      "CON.txt",
      "folder/NUL",
      "café.txt",
      "unsupported?.txt",
    ]) {
      expectErrorCode(
        () => computeAssetTreeDigest([{ path, bytes: new Uint8Array() }]),
        AssetTreeIntegrityErrorCode.INVALID_FILE_PATH,
      );
    }
  });

  it("rejects duplicate paths and ASCII case collisions", () => {
    expectErrorCode(
      () =>
        computeAssetTreeDigest([
          { path: "same.txt", bytes: new Uint8Array() },
          { path: "same.txt", bytes: new Uint8Array() },
        ]),
      AssetTreeIntegrityErrorCode.DUPLICATE_FILE_PATH,
    );
    expectErrorCode(
      () =>
        computeAssetTreeDigest([
          { path: "Name.txt", bytes: new Uint8Array() },
          { path: "name.txt", bytes: new Uint8Array() },
        ]),
      AssetTreeIntegrityErrorCode.CASE_COLLIDING_FILE_PATH,
    );
  });

  it.each([
    ["a", "a/b", AssetTreeIntegrityErrorCode.INVALID_FILE_PATH],
    ["A", "a/b", AssetTreeIntegrityErrorCode.CASE_COLLIDING_FILE_PATH],
    [
      "dir/file",
      "dir/file/child",
      AssetTreeIntegrityErrorCode.INVALID_FILE_PATH,
    ],
    ["a/b", "a", AssetTreeIntegrityErrorCode.INVALID_FILE_PATH],
    ["a/b", "A", AssetTreeIntegrityErrorCode.CASE_COLLIDING_FILE_PATH],
    [
      "dir/file/child",
      "dir/file",
      AssetTreeIntegrityErrorCode.INVALID_FILE_PATH,
    ],
  ] as const)(
    "rejects file/directory prefix conflicts (%s, %s)",
    (firstPath, secondPath, code) => {
      expectErrorCode(
        () =>
          computeAssetTreeDigest([
            { path: firstPath, bytes: new Uint8Array() },
            { path: secondPath, bytes: new Uint8Array() },
          ]),
        code,
      );
    },
  );

  it("accepts inclusive path length and depth limits", () => {
    const pathAtLimit = `${Array.from({ length: 15 }, () => "a").join("/")}/${"b".repeat(210)}`;
    expect(Buffer.byteLength(pathAtLimit, "utf8")).toBe(240);
    expect(() =>
      computeAssetTreeDigest([{ path: pathAtLimit, bytes: new Uint8Array() }]),
    ).not.toThrow();

    const pathAtDepthLimit = Array.from({ length: 16 }, () => "a").join("/");
    expect(() =>
      computeAssetTreeDigest([
        { path: pathAtDepthLimit, bytes: new Uint8Array() },
      ]),
    ).not.toThrow();
  });

  it("rejects paths one byte or one segment over their limits", () => {
    const pathOverLengthLimit = `${Array.from({ length: 15 }, () => "a").join("/")}/${"b".repeat(211)}`;
    expectErrorCode(
      () =>
        computeAssetTreeDigest([
          { path: pathOverLengthLimit, bytes: new Uint8Array() },
        ]),
      AssetTreeIntegrityErrorCode.RESOURCE_LIMIT_EXCEEDED,
    );

    const pathOverDepthLimit = Array.from({ length: 17 }, () => "a").join("/");
    expectErrorCode(
      () =>
        computeAssetTreeDigest([
          { path: pathOverDepthLimit, bytes: new Uint8Array() },
        ]),
      AssetTreeIntegrityErrorCode.INVALID_FILE_PATH,
    );
  });

  it("accepts exactly the maximum file size and rejects one byte over", () => {
    const maxFile = new Uint8Array(16 * 1024 * 1024);
    expect(() =>
      computeAssetTreeDigest([{ path: "maximum.bin", bytes: maxFile }]),
    ).not.toThrow();
    expectErrorCode(
      () =>
        computeAssetTreeDigest([
          {
            path: "oversized.bin",
            bytes: new Uint8Array(maxFile.byteLength + 1),
          },
        ]),
      AssetTreeIntegrityErrorCode.RESOURCE_LIMIT_EXCEEDED,
    );
  });

  it("accepts exactly the aggregate content limit and rejects one byte over", () => {
    const maxFile = new Uint8Array(16 * 1024 * 1024);
    const filesAtLimit = Array.from({ length: 16 }, (_, index) => ({
      path: `file-${index.toString().padStart(2, "0")}.bin`,
      bytes: maxFile,
    }));
    expect(() => computeAssetTreeDigest(filesAtLimit)).not.toThrow();
    expectErrorCode(
      () =>
        computeAssetTreeDigest([
          ...filesAtLimit,
          { path: "one-byte-over.bin", bytes: new Uint8Array(1) },
        ]),
      AssetTreeIntegrityErrorCode.RESOURCE_LIMIT_EXCEEDED,
    );
  });

  it("accepts exactly the entry-count limit and rejects one entry over", () => {
    const filesAtLimit = Array.from({ length: 10_000 }, (_, index) => ({
      path: `file-${index.toString().padStart(5, "0")}.bin`,
      bytes: new Uint8Array(),
    }));
    expect(() => computeAssetTreeDigest(filesAtLimit)).not.toThrow();
    expectErrorCode(
      () =>
        computeAssetTreeDigest([
          ...filesAtLimit,
          { path: "one-over.bin", bytes: new Uint8Array() },
        ]),
      AssetTreeIntegrityErrorCode.RESOURCE_LIMIT_EXCEEDED,
    );
  });

  it("hashes every supplied file; manifest exclusion belongs to input selection", () => {
    const manifestBytes = Buffer.from('{"manifestVersion":1}', "utf8");
    const suppliedFiles = [{ path: "manifest.json", bytes: manifestBytes }];

    expect(computeAssetTreeDigest(suppliedFiles)).not.toBe(
      computeAssetTreeDigest([]),
    );
  });

  it("changes the digest when file content changes", () => {
    const original = vectorFixture.vectors.find(
      ({ name }) => name === "hello-file",
    );
    const changed = vectorFixture.vectors.find(
      ({ name }) => name === "changed-content",
    );
    if (original === undefined || changed === undefined) {
      throw new Error(
        "Required content-change asset-tree vectors are missing.",
      );
    }

    expect(computeAssetTreeDigest(vectorFiles(original))).not.toBe(
      computeAssetTreeDigest(vectorFiles(changed)),
    );
  });

  it("rejects inputs that are not an array of file byte entries", () => {
    expectErrorCode(
      () => Reflect.apply(computeAssetTreeDigest, undefined, [null]),
      AssetTreeIntegrityErrorCode.INVALID_FILE_LIST,
    );
    expectErrorCode(
      () =>
        Reflect.apply(computeAssetTreeDigest, undefined, [
          [{ path: "file.bin", bytes: new DataView(new ArrayBuffer(1)) }],
        ]),
      AssetTreeIntegrityErrorCode.INVALID_FILE_BYTES,
    );
  });

  it("rejects SharedArrayBuffer-backed file bytes", () => {
    if (typeof SharedArrayBuffer === "undefined") {
      throw new Error(
        "SharedArrayBuffer is required in the supported Node runtime.",
      );
    }
    const sharedBytes = new Uint8Array(new SharedArrayBuffer(1));
    expectErrorCode(
      () =>
        computeAssetTreeDigest([{ path: "shared.bin", bytes: sharedBytes }]),
      AssetTreeIntegrityErrorCode.INVALID_FILE_BYTES,
    );
  });
});
