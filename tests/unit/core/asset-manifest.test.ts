import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import { describe, expect, it } from "vitest";
import {
  type AssetManifest,
  AssetManifestError,
  AssetManifestErrorCode,
  assetManifestJsonSchema,
  parseAssetManifest,
  safeParseAssetManifest,
} from "../../../packages/core/src/index.js";

const fixturePath = (name: string) =>
  resolve(process.cwd(), "tests/fixtures/manifests", name);
const loadFixture = (name: string): unknown =>
  JSON.parse(readFileSync(fixturePath(name), "utf8"));
const validFixture = loadFixture("valid.json") as AssetManifest;
const schemaText = readFileSync(
  resolve(process.cwd(), "schemas/asset-manifest.schema.json"),
  "utf8",
);
const checkedInSchema = JSON.parse(schemaText);
const ajv = new Ajv2020({ allErrors: true, strict: false });
const validateSchema = ajv.compile(checkedInSchema);

describe("asset manifest contract", () => {
  it("parses the complete valid fixture", () => {
    expect(parseAssetManifest(validFixture)).toEqual(validFixture);
  });

  it("accepts a manifest with no assets", () => {
    expect(parseAssetManifest({ manifestVersion: 1, assets: [] })).toEqual({
      manifestVersion: 1,
      assets: [],
    });
  });

  it("requires all asset metadata", () => {
    const result = safeParseAssetManifest(
      loadFixture("invalid/missing-required-metadata.json"),
    );
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toContainEqual(
        expect.objectContaining({
          code: AssetManifestErrorCode.INVALID_MANIFEST,
          path: ["assets", 0, "domain"],
        }),
      );
    }
  });

  it("rejects unsupported manifest versions with a stable code and path", () => {
    const result = safeParseAssetManifest(
      loadFixture("invalid/unsupported-manifest-version.json"),
    );
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toContainEqual(
        expect.objectContaining({
          code: AssetManifestErrorCode.UNSUPPORTED_MANIFEST_VERSION,
          path: ["manifestVersion"],
        }),
      );
    }
  });

  it.each([
    ["leading v", "v1.2.3", false],
    ["surrounding whitespace", " 1.2.3", false],
    ["version range", "^1.2.3", false],
    ["prerelease", "1.2.3-rc.1", true],
    ["build metadata", "1.2.3+build.5", true],
  ])("validates strict SemVer (%s)", (_label, version, valid) => {
    const candidate = structuredClone(validFixture);
    candidate.assets[0].version = version as string;
    const result = safeParseAssetManifest(candidate);
    expect(result.success).toBe(valid);
    if (!valid && !result.success) {
      expect(result.error.issues).toContainEqual(
        expect.objectContaining({
          code: AssetManifestErrorCode.INVALID_ASSET_VERSION,
          path: ["assets", 0, "version"],
        }),
      );
    }
  });

  it("validates contractVersion with the same strict SemVer rules", () => {
    const candidate = structuredClone(validFixture);
    candidate.assets[0].contractVersion = "1.0.0-rc.2+build.4";
    expect(safeParseAssetManifest(candidate).success).toBe(true);
    candidate.assets[0].contractVersion = "^1.0.0";
    const result = safeParseAssetManifest(candidate);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toContainEqual(
        expect.objectContaining({
          code: AssetManifestErrorCode.INVALID_CONTRACT_VERSION,
          path: ["assets", 0, "contractVersion"],
        }),
      );
    }
  });

  it.each([
    ["wildcard", "*", true],
    ["prerelease range", ">=1.2.3-alpha.1 <2.0.0", true],
    ["empty", "", false],
    ["invalid range", "not-a-range", false],
  ])("validates dependency range syntax (%s)", (_label, range, valid) => {
    const candidate = structuredClone(validFixture);
    candidate.assets[0].dependencies.required[0].versionRange = range as string;
    expect(safeParseAssetManifest(candidate).success).toBe(valid);
  });

  it("rejects duplicate IDs with the duplicate and original paths", () => {
    const result = safeParseAssetManifest(
      loadFixture("invalid/duplicate-id.json"),
    );
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toContainEqual({
        code: AssetManifestErrorCode.DUPLICATE_ASSET_ID,
        message: "Asset ID duplicates an earlier manifest entry.",
        path: ["assets", 1, "id"],
        relatedPath: ["assets", 0, "id"],
      });
    }
  });

  it("rejects unknown fields", () => {
    const result = safeParseAssetManifest(
      loadFixture("invalid/unknown-field.json"),
    );
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.code).toBe(
        AssetManifestErrorCode.INVALID_MANIFEST,
      );
    }
  });

  it("rejects unknown fields at every defined object level", () => {
    const asset = validFixture.assets[0];
    const dependency = asset.dependencies.required[0];
    const permission = asset.permissions[0];
    const candidates = [
      { ...validFixture, extra: true },
      { ...validFixture, assets: [{ ...asset, extra: true }] },
      {
        ...validFixture,
        assets: [
          {
            ...asset,
            dependencies: { ...asset.dependencies, extra: true },
          },
        ],
      },
      {
        ...validFixture,
        assets: [
          {
            ...asset,
            dependencies: {
              required: [{ ...dependency, extra: true }],
              optional: [],
            },
          },
        ],
      },
      {
        ...validFixture,
        assets: [
          {
            ...asset,
            compatibility: { ...asset.compatibility, extra: true },
          },
        ],
      },
      {
        ...validFixture,
        assets: [
          {
            ...asset,
            permissions: [{ ...permission, extra: true }],
          },
        ],
      },
      {
        ...validFixture,
        assets: [
          {
            ...asset,
            integrity: { ...asset.integrity, extra: true },
          },
        ],
      },
      {
        ...validFixture,
        assets: [
          {
            ...asset,
            provenance: { ...asset.provenance, extra: true },
          },
        ],
      },
    ];

    for (const candidate of candidates) {
      expect(safeParseAssetManifest(candidate).success).toBe(false);
    }
  });

  it("rejects malformed IDs without normalizing them", () => {
    for (const id of [
      "Skill.frontend.component-design",
      "skill.frontend.component_design",
      "skill.frontend.component.design",
    ]) {
      const candidate = structuredClone(validFixture);
      candidate.assets[0].id = id;
      const result = safeParseAssetManifest(candidate);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toContainEqual(
          expect.objectContaining({
            code: AssetManifestErrorCode.INVALID_ASSET_ID,
            path: ["assets", 0, "id"],
          }),
        );
      }
    }
  });

  it("rejects an ID whose kind prefix does not match", () => {
    const result = safeParseAssetManifest(
      loadFixture("invalid/id-kind-mismatch.json"),
    );
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toContainEqual(
        expect.objectContaining({
          code: AssetManifestErrorCode.INVALID_ASSET_ID,
          path: ["assets", 0, "id"],
        }),
      );
    }
  });

  it("keeps domain independent from the ID namespace", () => {
    const candidate = structuredClone(validFixture);
    candidate.assets[0].domain = "backend";
    expect(safeParseAssetManifest(candidate).success).toBe(true);
  });

  it("rejects invalid lifecycle and asset-kind values", () => {
    const candidate = structuredClone(validFixture);
    candidate.assets[0].kind =
      "unknown" as (typeof candidate.assets)[number]["kind"];
    candidate.assets[0].lifecycleStatus =
      "released" as (typeof candidate.assets)[number]["lifecycleStatus"];
    const result = safeParseAssetManifest(candidate);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            code: AssetManifestErrorCode.INVALID_MANIFEST,
            path: ["assets", 0, "kind"],
          }),
          expect.objectContaining({
            code: AssetManifestErrorCode.INVALID_MANIFEST,
            path: ["assets", 0, "lifecycleStatus"],
          }),
        ]),
      );
    }
  });

  it("rejects unsafe provenance paths", () => {
    const candidate = structuredClone(validFixture);
    candidate.assets[0].provenance.path = "content/../private";
    expect(safeParseAssetManifest(candidate).success).toBe(false);
  });

  it("validates compatibility and permission declarations", () => {
    const candidate = structuredClone(validFixture);
    candidate.assets[0].compatibility.modes = ["all" as "ai-only"];
    candidate.assets[0].permissions = [{ id: "project.read", reason: "" }];
    const result = safeParseAssetManifest(candidate);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: ["assets", 0, "compatibility", "modes", 0],
          }),
          expect.objectContaining({
            path: ["assets", 0, "permissions", 0, "reason"],
          }),
        ]),
      );
    }
  });

  it("validates integrity digest and provenance revision metadata", () => {
    const candidate = structuredClone(validFixture);
    candidate.assets[0].integrity.digest = "not-a-digest";
    candidate.assets[0].provenance.revision = "not-a-revision";
    expect(safeParseAssetManifest(candidate).success).toBe(false);
  });

  it("returns only bounded, safe error messages", () => {
    const secret = "do-not-echo-this-secret";
    const result = safeParseAssetManifest({
      manifestVersion: 1,
      assets: [{ id: secret, kind: "skill" }],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeInstanceOf(AssetManifestError);
      expect(JSON.stringify(result.error.issues)).not.toContain(secret);
      expect(
        result.error.issues.every((issue) => issue.message.length < 100),
      ).toBe(true);
    }
  });

  it("returns consistent parse and safe-parse results", () => {
    const result = safeParseAssetManifest(validFixture);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(parseAssetManifest(validFixture)).toEqual(result.data);
    }
    expect(() =>
      parseAssetManifest(loadFixture("invalid/unknown-field.json")),
    ).toThrow(AssetManifestError);
  });

  it("reports invalid non-object input with a stable error code", () => {
    const result = safeParseAssetManifest("not a manifest");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]).toMatchObject({
        code: AssetManifestErrorCode.INVALID_INPUT,
        path: [],
      });
    }
  });

  it("matches the generated Draft 2020-12 schema structurally", () => {
    expect(checkedInSchema).toEqual(assetManifestJsonSchema);
    expect(checkedInSchema.$schema).toBe(
      "https://json-schema.org/draft/2020-12/schema",
    );
    expect(validateSchema(validFixture)).toBe(true);
    expect(
      validateSchema(loadFixture("invalid/missing-required-metadata.json")),
    ).toBe(false);
    expect(
      validateSchema(loadFixture("invalid/unsupported-manifest-version.json")),
    ).toBe(false);
  });

  it("documents JSON Schema semantic parity limits", () => {
    // JSON Schema uniqueItems compares entire objects, not only each asset's ID.
    // Kind/ID-prefix agreement is enforced by Zod's cross-field refinement.
    // Dependency range parsing and repository path traversal checks are runtime
    // refinements; Draft 2020-12 cannot encode those semantics portably here.
    expect(
      safeParseAssetManifest(loadFixture("invalid/duplicate-id.json")).success,
    ).toBe(false);
    expect(
      safeParseAssetManifest(loadFixture("invalid/id-kind-mismatch.json"))
        .success,
    ).toBe(false);
  });
});
