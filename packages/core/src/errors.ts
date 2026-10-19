export const AssetManifestErrorCode = {
  INVALID_INPUT: "INVALID_INPUT",
  INVALID_MANIFEST: "INVALID_MANIFEST",
  UNSUPPORTED_MANIFEST_VERSION: "UNSUPPORTED_MANIFEST_VERSION",
  INVALID_ASSET_ID: "INVALID_ASSET_ID",
  INVALID_ASSET_VERSION: "INVALID_ASSET_VERSION",
  INVALID_CONTRACT_VERSION: "INVALID_CONTRACT_VERSION",
  DUPLICATE_ASSET_ID: "DUPLICATE_ASSET_ID",
} as const;

export type AssetManifestErrorCodeValue =
  (typeof AssetManifestErrorCode)[keyof typeof AssetManifestErrorCode];

export interface AssetManifestIssue {
  code: AssetManifestErrorCodeValue;
  message: string;
  path: Array<string | number>;
  relatedPath?: Array<string | number>;
}

export class AssetManifestError extends Error {
  readonly code: AssetManifestErrorCodeValue;
  readonly issues: AssetManifestIssue[];

  constructor(issues: AssetManifestIssue[]) {
    super(issues[0]?.message ?? "Asset manifest validation failed.");
    this.name = "AssetManifestError";
    this.code = issues[0]?.code ?? AssetManifestErrorCode.INVALID_MANIFEST;
    this.issues = issues;
  }
}
