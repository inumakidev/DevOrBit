import semver from "semver";
import { z } from "zod";
import {
  AssetManifestError,
  AssetManifestErrorCode,
  type AssetManifestErrorCodeValue,
  type AssetManifestIssue,
} from "../errors.js";

export const assetKinds = [
  "skill",
  "workflow",
  "policy",
  "tool",
  "stack-profile",
  "adapter",
  "pack",
] as const;

export const lifecycleStatuses = [
  "draft",
  "review",
  "validated",
  "stable",
  "deprecated",
] as const;

export const installModes = ["ai-only", "project-only", "combined"] as const;

const identifierPattern = /^[a-z0-9]+(?:[.-][a-z0-9]+)*$/;
const assetIdPattern =
  /^[a-z0-9]+(?:-[a-z0-9]+)*\.[a-z0-9]+(?:-[a-z0-9]+)*\.[a-z0-9]+(?:-[a-z0-9]+)*$/;
const strictSemverPattern =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*)(?:\.(?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*))*))?(?:\+([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/;
const sha256Pattern = /^[a-f0-9]{64}$/;
const revisionPattern = /^[a-f0-9]{40}$/;
const repositoryPattern =
  /^[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?\/[A-Za-z0-9](?:[A-Za-z0-9._-]*[A-Za-z0-9])?$/;
const stableMessageCodes = new Set<string>(
  Object.values(AssetManifestErrorCode),
);

const strictSemverSchema = (
  errorCode:
    | typeof AssetManifestErrorCode.INVALID_ASSET_VERSION
    | typeof AssetManifestErrorCode.INVALID_CONTRACT_VERSION,
) =>
  z
    .string()
    .regex(strictSemverPattern, { error: errorCode })
    .superRefine((version, context) => {
      if (
        strictSemverPattern.test(version) &&
        semver.parse(version, { loose: false })?.raw !== version
      ) {
        context.addIssue({ code: "custom", message: errorCode });
      }
    });

const assetIdSchema = z
  .string()
  .regex(assetIdPattern, { error: AssetManifestErrorCode.INVALID_ASSET_ID });

const identifierSchema = z.string().regex(identifierPattern);
const dependencyRangeSchema = z.string().superRefine((range, context) => {
  if (range.trim().length === 0 || semver.validRange(range) === null) {
    context.addIssue({
      code: "custom",
      message: AssetManifestErrorCode.INVALID_MANIFEST,
    });
  }
});

const dependencyReferenceSchema = z
  .object({
    id: assetIdSchema,
    versionRange: dependencyRangeSchema,
  })
  .strict();

const dependencySchema = z
  .object({
    required: z.array(dependencyReferenceSchema),
    optional: z.array(dependencyReferenceSchema),
  })
  .strict();

const compatibilitySchema = z
  .object({
    agents: z.array(identifierSchema),
    stacks: z.array(identifierSchema),
    modes: z.array(z.enum(installModes)),
    capabilities: z.array(identifierSchema),
  })
  .strict();

const permissionSchema = z
  .object({
    id: identifierSchema,
    reason: z.string().min(1),
  })
  .strict();

const integritySchema = z
  .object({
    algorithm: z.literal("sha256"),
    digest: z.string().regex(sha256Pattern),
  })
  .strict();

const safeRepositoryPathSchema = z.string().superRefine((path, context) => {
  const segments = path.split("/");
  const unsafe =
    path.length === 0 ||
    path.startsWith("/") ||
    path.includes("\\") ||
    path.includes(":") ||
    segments.some(
      (segment) =>
        segment.length === 0 ||
        segment === "." ||
        segment === ".." ||
        !/^[A-Za-z0-9._@+-]+$/.test(segment),
    );

  if (unsafe) {
    context.addIssue({
      code: "custom",
      message: AssetManifestErrorCode.INVALID_MANIFEST,
    });
  }
});

const provenanceSchema = z
  .object({
    repository: z.string().regex(repositoryPattern),
    path: safeRepositoryPathSchema,
    revision: z.string().regex(revisionPattern),
  })
  .strict();

const assetSchema = z
  .object({
    id: assetIdSchema,
    kind: z.enum(assetKinds),
    version: strictSemverSchema(AssetManifestErrorCode.INVALID_ASSET_VERSION),
    contractVersion: strictSemverSchema(
      AssetManifestErrorCode.INVALID_CONTRACT_VERSION,
    ),
    description: z.string().min(1),
    domain: identifierSchema,
    dependencies: dependencySchema,
    compatibility: compatibilitySchema,
    permissions: z.array(permissionSchema),
    integrity: integritySchema,
    provenance: provenanceSchema,
    lifecycleStatus: z.enum(lifecycleStatuses),
  })
  .strict()
  .superRefine((asset, context) => {
    if (!asset.id.startsWith(`${asset.kind}.`)) {
      context.addIssue({
        code: "custom",
        message: AssetManifestErrorCode.INVALID_ASSET_ID,
        path: ["id"],
      });
    }
  });

export const assetManifestSchema = z
  .object({
    manifestVersion: z.literal(1),
    assets: z.array(assetSchema),
  })
  .strict()
  .superRefine((manifest, context) => {
    const firstIndexById = new Map<string, number>();

    manifest.assets.forEach((asset, index) => {
      const firstIndex = firstIndexById.get(asset.id);
      if (firstIndex !== undefined) {
        context.addIssue({
          code: "custom",
          message: AssetManifestErrorCode.DUPLICATE_ASSET_ID,
          path: ["assets", index, "id"],
          params: { relatedPath: ["assets", firstIndex, "id"] },
        });
      } else {
        firstIndexById.set(asset.id, index);
      }
    });
  });

export type AssetManifest = z.infer<typeof assetManifestSchema>;
export type Asset = AssetManifest["assets"][number];
export type AssetKind = (typeof assetKinds)[number];
export type LifecycleStatus = (typeof lifecycleStatuses)[number];
export type InstallMode = (typeof installModes)[number];
export type Dependencies = Asset["dependencies"];
export type DependencyReference = Dependencies["required"][number];
export type Compatibility = Asset["compatibility"];
export type PermissionDeclaration = Asset["permissions"][number];
export type IntegrityMetadata = Asset["integrity"];
export type ProvenanceMetadata = Asset["provenance"];

export const assetManifestJsonSchema = z.toJSONSchema(assetManifestSchema, {
  target: "draft-2020-12",
  unrepresentable: "any",
});

export type SafeParseAssetManifestResult =
  | { success: true; data: AssetManifest }
  | { success: false; error: AssetManifestError };

function isRelatedPath(value: unknown): value is Array<string | number> {
  return (
    Array.isArray(value) &&
    value.every((part) => typeof part === "string" || typeof part === "number")
  );
}

function toAssetManifestIssue(
  issue: z.ZodError["issues"][number],
): AssetManifestIssue {
  let code: AssetManifestErrorCodeValue = stableMessageCodes.has(issue.message)
    ? (issue.message as AssetManifestErrorCodeValue)
    : AssetManifestErrorCode.INVALID_MANIFEST;

  if (issue.path[0] === "manifestVersion") {
    code = AssetManifestErrorCode.UNSUPPORTED_MANIFEST_VERSION;
  } else if (issue.path.length === 0 && issue.code === "invalid_type") {
    code = AssetManifestErrorCode.INVALID_INPUT;
  }

  const messages: Record<AssetManifestErrorCodeValue, string> = {
    INVALID_INPUT: "Input must be an asset manifest object.",
    INVALID_MANIFEST: "Asset manifest contains invalid or unsupported data.",
    UNSUPPORTED_MANIFEST_VERSION: "Manifest version is not supported.",
    INVALID_ASSET_ID: "Asset ID is invalid or its kind prefix does not match.",
    INVALID_ASSET_VERSION: "Asset version must be strict SemVer 2.0.0.",
    INVALID_CONTRACT_VERSION: "Contract version must be strict SemVer 2.0.0.",
    DUPLICATE_ASSET_ID: "Asset ID duplicates an earlier manifest entry.",
  };
  const params =
    issue.code === "custom" && "params" in issue ? issue.params : undefined;
  const relatedPath =
    params && typeof params === "object" && "relatedPath" in params
      ? params.relatedPath
      : undefined;

  return {
    code,
    message: messages[code],
    path: issue.path.map((part) =>
      typeof part === "number" || typeof part === "string"
        ? part
        : String(part),
    ),
    ...(isRelatedPath(relatedPath) ? { relatedPath } : {}),
  };
}

export function safeParseAssetManifest(
  input: unknown,
): SafeParseAssetManifestResult {
  const result = assetManifestSchema.safeParse(input);
  if (result.success) {
    return result;
  }

  return {
    success: false,
    error: new AssetManifestError(
      result.error.issues.map(toAssetManifestIssue),
    ),
  };
}

export function parseAssetManifest(input: unknown): AssetManifest {
  const result = safeParseAssetManifest(input);
  if (!result.success) {
    throw result.error;
  }
  return result.data;
}
