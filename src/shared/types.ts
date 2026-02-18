/**
 * Shared type definitions for the Forgekit MCP server.
 *
 * All tags, project configuration, tool inputs/outputs, and template
 * structures are defined here as the single source of truth.
 */

/** All supported project classification tags. */
export const ALL_TAGS = [
  "UNIVERSAL",
  "WEB-REACT",
  "WEB-STATIC",
  "API",
  "DATA-PIPELINE",
  "ML",
  "HEALTHCARE",
  "FINTECH",
  "WEB3",
  "REALTIME",
  "STATE-MACHINE",
  "GAME",
  "SOCIAL",
  "CLI",
  "LIBRARY",
  "INFRA",
  "MOBILE",
  "ANALYTICS",
] as const;

export type Tag = (typeof ALL_TAGS)[number];

/** Description metadata for a single tag. */
export interface TagInfo {
  readonly tag: Tag;
  readonly description: string;
  readonly appliesWhen: string;
}

/** Result of project classification analysis. */
export interface ClassifyResult {
  readonly suggestedTags: Tag[];
  readonly detectedFromCode: Record<
    string,
    { confidence: number; evidence: string[] }
  >;
  readonly detectedFromDescription: Record<
    string,
    { confidence: number; evidence: string[] }
  >;
  readonly availableTags: readonly Tag[];
  readonly requiresConfirmation: boolean;
}

/** Configuration for scaffolding a project. */
export interface ScaffoldOptions {
  readonly tags: Tag[];
  readonly language: "typescript" | "python";
  readonly projectName: string;
  readonly includeMcpConfig?: boolean;
  readonly includeCiCd?: "github-actions" | "none";
  readonly includeDocker?: boolean;
}

/** Result of a scaffold operation. */
export interface ScaffoldResult {
  readonly filesCreated: string[];
  readonly mcpServersConfigured: string[];
  readonly nextSteps: string[];
  readonly restartRequired: boolean;
}

/** Result of a project audit. */
export interface AuditResult {
  readonly score: number;
  readonly passing: AuditCheck[];
  readonly failing: AuditCheck[];
  readonly recommendations: string[];
}

/** A single audit check result. */
export interface AuditCheck {
  readonly check: string;
  readonly message: string;
  readonly severity?: "error" | "warning" | "info";
}

/** Information about an available hook. */
export interface HookInfo {
  readonly name: string;
  readonly tag: Tag;
  readonly trigger: "pre-commit" | "pre-exec" | "pre-push";
  readonly description: string;
  readonly filename: string;
}

/**
 * Content tier controlling automatic inclusion behavior.
 * - core: Always included. Non-negotiable engineering standards.
 * - recommended: Included by default. User can opt out via config.
 * - optional: Only included when user explicitly opts in.
 */
export type ContentTier = "core" | "recommended" | "optional";

/** All valid content tiers as a constant array for schema validation. */
export const CONTENT_TIERS: readonly ContentTier[] = ["core", "recommended", "optional"] as const;

/** A CLAUDE.md content block from a template. */
export interface ClaudeMdBlock {
  readonly id: string;
  readonly title: string;
  readonly content: string;
  readonly tier?: ContentTier;
}

/** A template YAML file structure for claude-md content. */
export interface ClaudeMdTemplate {
  readonly tag: Tag;
  readonly section: "claude-md";
  readonly blocks: ClaudeMdBlock[];
}

/** A folder/file entry in a structure template. */
export interface StructureEntry {
  readonly path: string;
  readonly type: "directory" | "file";
  readonly description?: string;
  readonly template?: string;
}

/** A structure template for a tag. */
export interface StructureTemplate {
  readonly tag: Tag;
  readonly section: "structure";
  readonly language?: "typescript" | "python" | "both";
  readonly entries: StructureEntry[];
}

/** An NFR (Non-Functional Requirement) block. */
export interface NfrBlock {
  readonly id: string;
  readonly title: string;
  readonly content: string;
  readonly tier?: ContentTier;
}

/** An NFR template for a tag. */
export interface NfrTemplate {
  readonly tag: Tag;
  readonly section: "nfr";
  readonly blocks: NfrBlock[];
}

/** Hook template definition. */
export interface HookTemplate {
  readonly name: string;
  readonly trigger: "pre-commit" | "pre-exec" | "pre-push";
  readonly description: string;
  readonly filename: string;
  readonly script: string;
}

/** Review dimension (section) within a review template. */
export type ReviewDimension =
  | "architecture"
  | "code-quality"
  | "tests"
  | "performance";

/** A single checklist item within a review block. */
export interface ReviewChecklistItem {
  readonly id: string;
  readonly description: string;
  readonly severity: "critical" | "important" | "nice-to-have";
}

/** A review block — one dimension of a code review. */
export interface ReviewBlock {
  readonly id: string;
  readonly dimension: ReviewDimension;
  readonly title: string;
  readonly description: string;
  readonly checklist: ReviewChecklistItem[];
  readonly tier?: ContentTier;
}

/** A review template for a tag. */
export interface ReviewTemplate {
  readonly tag: Tag;
  readonly section: "review";
  readonly blocks: ReviewBlock[];
}

/** Result of a review_project tool call. */
export interface ReviewResult {
  readonly tags: Tag[];
  readonly scope: "comprehensive" | "focused";
  readonly dimensions: ReviewDimensionOutput[];
  readonly issueFormat: string;
}

/** Output for a single review dimension. */
export interface ReviewDimensionOutput {
  readonly dimension: ReviewDimension;
  readonly title: string;
  readonly checklist: ReviewChecklistItem[];
}

/** Complete template set for a tag. */
export interface TagTemplateSet {
  readonly tag: Tag;
  readonly claudeMd?: ClaudeMdTemplate;
  readonly nfr?: NfrTemplate;
  readonly structure?: StructureTemplate;
  readonly hooks?: HookTemplate[];
  readonly review?: ReviewTemplate;
}

/** Module scaffold configuration. */
export interface ModuleConfig {
  readonly moduleName: string;
  readonly tags: Tag[];
  readonly language: "typescript" | "python";
}

/** MCP server configuration for .claude/settings.json. */
export interface McpServerConfig {
  readonly command: string;
  readonly args: string[];
  readonly env?: Record<string, string>;
}

/** User override configuration from forgekit.yaml / .forgekit.json. */
export interface ForgeKitConfig {
  /** Human-readable project name. */
  readonly projectName?: string;
  /** Active project tags. */
  readonly tags?: Tag[];
  /** Content tier preference: which tiers to auto-include. */
  readonly tier?: ContentTier;
  /** Specific block IDs to always include regardless of tier. */
  readonly include?: string[];
  /** Specific block IDs to always exclude regardless of tier. */
  readonly exclude?: string[];
  /** Additional template directories (community packs, local overrides). */
  readonly templateDirs?: string[];
  /** Variable overrides for template rendering. */
  readonly variables?: Record<string, string | number | boolean>;
  /** Override or extend configuration per block ID. */
  readonly overrides?: Record<string, Record<string, unknown>>;
  /** Custom hooks to add beyond template-provided ones. */
  readonly customHooks?: Array<{
    name: string;
    trigger: string;
    script: string;
  }>;
  /** Custom MCP servers to configure. */
  readonly customMcpServers?: Record<string, McpServerConfig>;
  /** Hooks to disable by name. */
  readonly disabledHooks?: string[];
  /** Additional tags beyond auto-detected ones. */
  readonly additionalTags?: Tag[];
}
