import { createHash } from "node:crypto";

const domainPrefix = Buffer.from("DEVORBIT-ASSET-TREE\0v1\0", "ascii");
const fileRecordMarker = Buffer.from([0x46]);
const maxFileBytes = 16 * 1024 * 1024;
const maxTotalContentBytes = 256 * 1024 * 1024;
const maxTreeDepth = 16;
const maxTreeEntries = 10_000;
const maxPathBytes = 240;
const supportedPathSegment = /^[A-Za-z0-9._@+-]+$/;
const reservedDeviceName = /^(?:CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i;

export const AssetTreeIntegrityErrorCode = {
  INVALID_FILE_LIST: "INVALID_FILE_LIST",
  INVALID_FILE_ENTRY: "INVALID_FILE_ENTRY",
  INVALID_FILE_PATH: "INVALID_FILE_PATH",
  DUPLICATE_FILE_PATH: "DUPLICATE_FILE_PATH",
  CASE_COLLIDING_FILE_PATH: "CASE_COLLIDING_FILE_PATH",
  INVALID_FILE_BYTES: "INVALID_FILE_BYTES",
  RESOURCE_LIMIT_EXCEEDED: "RESOURCE_LIMIT_EXCEEDED",
} as const;

export type AssetTreeIntegrityErrorCodeValue =
  (typeof AssetTreeIntegrityErrorCode)[keyof typeof AssetTreeIntegrityErrorCode];

export class AssetTreeIntegrityError extends Error {
  readonly code: AssetTreeIntegrityErrorCodeValue;

  constructor(code: AssetTreeIntegrityErrorCodeValue, message: string) {
    super(message);
    this.name = "AssetTreeIntegrityError";
    this.code = code;
  }
}

export interface AssetTreeFile {
  readonly path: string;
  readonly bytes: Uint8Array;
}

interface ValidatedAssetTreeFile {
  readonly pathBytes: Buffer;
  readonly sourceBytes: Uint8Array;
}

interface OwnedAssetTreeFile {
  readonly pathBytes: Buffer;
  readonly bytes: Buffer;
}

interface AssetTreePathNode {
  filePath?: string;
  firstFilePath?: string;
  readonly children: Map<string, AssetTreePathNode>;
}

function invalidPath(): never {
  throw new AssetTreeIntegrityError(
    AssetTreeIntegrityErrorCode.INVALID_FILE_PATH,
    "Asset-tree file path is invalid or unsupported.",
  );
}

function validatePath(path: string): Buffer {
  if (
    path.length === 0 ||
    path.startsWith("/") ||
    path.includes("\\") ||
    path.includes(":")
  ) {
    return invalidPath();
  }
  if (path.length > maxPathBytes) {
    throw new AssetTreeIntegrityError(
      AssetTreeIntegrityErrorCode.RESOURCE_LIMIT_EXCEEDED,
      "Asset-tree path exceeds the approved byte limit.",
    );
  }

  const segments = path.split("/");
  if (
    segments.length > maxTreeDepth ||
    segments.some(
      (segment) =>
        segment.length === 0 ||
        segment === "." ||
        segment === ".." ||
        segment.endsWith(".") ||
        segment.endsWith(" ") ||
        !supportedPathSegment.test(segment) ||
        reservedDeviceName.test(segment.split(".", 1)[0] ?? ""),
    )
  ) {
    return invalidPath();
  }

  const pathBytes = Buffer.from(path, "utf8");
  if (pathBytes.byteLength > maxPathBytes) {
    throw new AssetTreeIntegrityError(
      AssetTreeIntegrityErrorCode.RESOURCE_LIMIT_EXCEEDED,
      "Asset-tree path exceeds the approved byte limit.",
    );
  }
  return pathBytes;
}

function validatePathHierarchy(files: readonly ValidatedAssetTreeFile[]): void {
  const root: AssetTreePathNode = { children: new Map() };

  for (const file of files) {
    const path = file.pathBytes.toString("ascii");
    const segments = path.split("/");
    let node = root;

    for (let index = 0; index < segments.length; index += 1) {
      if (node.filePath !== undefined) {
        const ancestor = segments.slice(0, index).join("/");
        const code =
          node.filePath === ancestor
            ? AssetTreeIntegrityErrorCode.INVALID_FILE_PATH
            : AssetTreeIntegrityErrorCode.CASE_COLLIDING_FILE_PATH;
        throw new AssetTreeIntegrityError(
          code,
          "Asset-tree input contains a file/directory path conflict.",
        );
      }

      const segment = segments[index];
      if (segment === undefined) {
        throw new AssetTreeIntegrityError(
          AssetTreeIntegrityErrorCode.INVALID_FILE_PATH,
          "Asset-tree input contains an invalid file path.",
        );
      }
      const foldedSegment = segment.toLowerCase();
      let child = node.children.get(foldedSegment);
      if (child === undefined) {
        child = { children: new Map() };
        node.children.set(foldedSegment, child);
      }
      child.firstFilePath ??= path;
      node = child;
    }

    if (node.children.size > 0) {
      const descendantPath = node.firstFilePath;
      const exactPrefix = descendantPath?.startsWith(`${path}/`);
      throw new AssetTreeIntegrityError(
        exactPrefix
          ? AssetTreeIntegrityErrorCode.INVALID_FILE_PATH
          : AssetTreeIntegrityErrorCode.CASE_COLLIDING_FILE_PATH,
        "Asset-tree input contains a file/directory path conflict.",
      );
    }
    node.filePath = path;
  }
}

function validateFiles(files: readonly AssetTreeFile[]): OwnedAssetTreeFile[] {
  if (!Array.isArray(files)) {
    throw new AssetTreeIntegrityError(
      AssetTreeIntegrityErrorCode.INVALID_FILE_LIST,
      "Asset-tree input must be an array of file entries.",
    );
  }
  if (files.length > maxTreeEntries) {
    throw new AssetTreeIntegrityError(
      AssetTreeIntegrityErrorCode.RESOURCE_LIMIT_EXCEEDED,
      "Asset tree exceeds the approved entry limit.",
    );
  }

  const seenPaths = new Set<string>();
  const seenCaseFoldedPaths = new Set<string>();
  const validatedFiles: ValidatedAssetTreeFile[] = [];
  let totalContentBytes = 0;

  for (const file of files) {
    if (typeof file !== "object" || file === null) {
      throw new AssetTreeIntegrityError(
        AssetTreeIntegrityErrorCode.INVALID_FILE_ENTRY,
        "Asset-tree input contains an invalid file entry.",
      );
    }
    const path = file.path;
    const sourceBytes = file.bytes;
    if (typeof path !== "string") {
      throw new AssetTreeIntegrityError(
        AssetTreeIntegrityErrorCode.INVALID_FILE_ENTRY,
        "Asset-tree input contains an invalid file entry.",
      );
    }
    if (!(sourceBytes instanceof Uint8Array)) {
      throw new AssetTreeIntegrityError(
        AssetTreeIntegrityErrorCode.INVALID_FILE_BYTES,
        "Asset-tree file content must be supplied as Uint8Array bytes.",
      );
    }
    if (
      typeof SharedArrayBuffer !== "undefined" &&
      sourceBytes.buffer instanceof SharedArrayBuffer
    ) {
      throw new AssetTreeIntegrityError(
        AssetTreeIntegrityErrorCode.INVALID_FILE_BYTES,
        "SharedArrayBuffer-backed asset-tree content is unsupported.",
      );
    }

    const pathBytes = validatePath(path);
    if (seenPaths.has(path)) {
      throw new AssetTreeIntegrityError(
        AssetTreeIntegrityErrorCode.DUPLICATE_FILE_PATH,
        "Asset-tree input contains a duplicate file path.",
      );
    }
    seenPaths.add(path);

    const caseFoldedPath = path.toLowerCase();
    if (seenCaseFoldedPaths.has(caseFoldedPath)) {
      throw new AssetTreeIntegrityError(
        AssetTreeIntegrityErrorCode.CASE_COLLIDING_FILE_PATH,
        "Asset-tree input contains paths that collide under ASCII case folding.",
      );
    }
    seenCaseFoldedPaths.add(caseFoldedPath);

    if (sourceBytes.byteLength > maxFileBytes) {
      throw new AssetTreeIntegrityError(
        AssetTreeIntegrityErrorCode.RESOURCE_LIMIT_EXCEEDED,
        "Asset-tree file exceeds the approved per-file byte limit.",
      );
    }
    if (totalContentBytes > maxTotalContentBytes - sourceBytes.byteLength) {
      throw new AssetTreeIntegrityError(
        AssetTreeIntegrityErrorCode.RESOURCE_LIMIT_EXCEEDED,
        "Asset tree exceeds the approved aggregate content byte limit.",
      );
    }
    totalContentBytes += sourceBytes.byteLength;
    validatedFiles.push({ pathBytes, sourceBytes });
  }

  validatePathHierarchy(validatedFiles);
  return validatedFiles.map(({ pathBytes, sourceBytes }) => {
    try {
      return { pathBytes, bytes: Buffer.from(sourceBytes) };
    } catch (error) {
      throw new AssetTreeIntegrityError(
        AssetTreeIntegrityErrorCode.INVALID_FILE_BYTES,
        `Unable to snapshot asset-tree file bytes: ${String(error)}`,
      );
    }
  });
}

/**
 * Hashes each caller-supplied file; filesystem-level manifest exclusion belongs to input selection.
 */
export function computeAssetTreeDigest(
  files: readonly AssetTreeFile[],
): string {
  const validatedFiles = validateFiles(files);
  validatedFiles.sort((left, right) =>
    Buffer.compare(left.pathBytes, right.pathBytes),
  );

  const hash = createHash("sha256");
  hash.update(domainPrefix);
  const pathLengthBytes = Buffer.alloc(4);
  const fileLengthBytes = Buffer.alloc(8);

  for (const file of validatedFiles) {
    pathLengthBytes.writeUInt32BE(file.pathBytes.byteLength);
    fileLengthBytes.writeBigUInt64BE(BigInt(file.bytes.byteLength));
    hash.update(fileRecordMarker);
    hash.update(pathLengthBytes);
    hash.update(file.pathBytes);
    hash.update(fileLengthBytes);
    hash.update(file.bytes);
  }

  return hash.digest("hex");
}
