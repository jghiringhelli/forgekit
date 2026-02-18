/**
 * Template composer.
 *
 * Given a set of active tags, composes CLAUDE.md blocks, folder structures,
 * hooks, and NFRs from all matching templates into unified outputs.
 * Handles merge, deduplication, ordering, and tier-based filtering.
 */

import { createLogger } from "../shared/logger/index.js";
import type {
  Tag,
  TagTemplateSet,
  ClaudeMdBlock,
  StructureEntry,
  NfrBlock,
  HookTemplate,
  ReviewBlock,
  ContentTier,
  ForgeCraftConfig,
} from "../shared/types.js";

const logger = createLogger("registry/composer");

/**
 * Tier inclusion hierarchy.
 * "core" → includes only core blocks.
 * "recommended" → includes core + recommended.
 * "optional" → includes core + recommended + optional.
 * Blocks without a tier field are treated as "core" (always included).
 */
const TIER_HIERARCHY: Record<ContentTier, ContentTier[]> = {
  core: ["core"],
  recommended: ["core", "recommended"],
  optional: ["core", "recommended", "optional"],
};

/** Default tier when none is specified in config. */
const DEFAULT_TIER: ContentTier = "recommended";

/** Composed output for a set of active tags. */
export interface ComposedTemplates {
  readonly claudeMdBlocks: ClaudeMdBlock[];
  readonly structureEntries: StructureEntry[];
  readonly nfrBlocks: NfrBlock[];
  readonly hooks: HookTemplate[];
  readonly reviewBlocks: ReviewBlock[];
}

/** Options for controlling template composition. */
export interface ComposeOptions {
  /** ForgeCraft project config with tier preferences and include/exclude. */
  readonly config?: ForgeCraftConfig;
}

/**
 * Check if a block should be included based on the tier filter.
 * Blocks without a tier are treated as "core" (always included).
 *
 * @param blockTier - The tier of the block (undefined = core)
 * @param allowedTiers - The set of allowed tiers
 * @returns true if the block should be included
 */
function isTierAllowed(
  blockTier: ContentTier | undefined,
  allowedTiers: Set<ContentTier>,
): boolean {
  const effective = blockTier ?? "core";
  return allowedTiers.has(effective);
}

/**
 * Check if a block ID is included/excluded by the config lists.
 *
 * @param blockId - The block identifier
 * @param include - Explicit include list (if set, only these are included)
 * @param exclude - Explicit exclude list (always excluded)
 * @returns true if the block should be included
 */
function isBlockAllowed(
  blockId: string,
  include?: string[],
  exclude?: string[],
): boolean {
  if (exclude?.includes(blockId)) {
    return false;
  }
  if (include && include.length > 0) {
    return include.includes(blockId);
  }
  return true;
}

/**
 * Compose templates for a given set of active tags.
 * UNIVERSAL is always included first regardless of whether it's in the tags list.
 *
 * @param activeTags - Tags to compose for
 * @param allTemplates - Full template map from the loader
 * @param options - Optional composition config (tier filtering, include/exclude)
 * @returns Composed and filtered templates
 */
export function composeTemplates(
  activeTags: Tag[],
  allTemplates: Map<Tag, TagTemplateSet>,
  options?: ComposeOptions,
): ComposedTemplates {
  const config = options?.config;
  const tierLevel = config?.tier ?? DEFAULT_TIER;
  const allowedTiers = new Set(TIER_HIERARCHY[tierLevel]);
  const includeList = config?.include;
  const excludeList = config?.exclude;

  // Ensure UNIVERSAL is first and present
  const orderedTags = normalizeTagOrder(activeTags);

  const claudeMdBlocks: ClaudeMdBlock[] = [];
  const structureEntries: StructureEntry[] = [];
  const nfrBlocks: NfrBlock[] = [];
  const hooks: HookTemplate[] = [];
  const reviewBlocks: ReviewBlock[] = [];

  const seenBlockIds = new Set<string>();
  const seenPaths = new Set<string>();
  const seenHookNames = new Set<string>();
  const seenNfrIds = new Set<string>();
  const seenReviewIds = new Set<string>();

  for (const tag of orderedTags) {
    const templateSet = allTemplates.get(tag);
    if (!templateSet) {
      logger.warn("No templates found for tag", { tag });
      continue;
    }

    // Compose CLAUDE.md blocks (deduplicate by id, filter by tier)
    if (templateSet.claudeMd?.blocks) {
      for (const block of templateSet.claudeMd.blocks) {
        if (
          !seenBlockIds.has(block.id) &&
          isTierAllowed(block.tier, allowedTiers) &&
          isBlockAllowed(block.id, includeList, excludeList)
        ) {
          seenBlockIds.add(block.id);
          claudeMdBlocks.push(block);
        }
      }
    }

    // Compose structure entries (deduplicate by path — not tier-filtered)
    if (templateSet.structure?.entries) {
      for (const entry of templateSet.structure.entries) {
        if (!seenPaths.has(entry.path)) {
          seenPaths.add(entry.path);
          structureEntries.push(entry);
        }
      }
    }

    // Compose NFR blocks (deduplicate by id, filter by tier)
    if (templateSet.nfr?.blocks) {
      for (const block of templateSet.nfr.blocks) {
        if (
          !seenNfrIds.has(block.id) &&
          isTierAllowed(block.tier, allowedTiers) &&
          isBlockAllowed(block.id, includeList, excludeList)
        ) {
          seenNfrIds.add(block.id);
          nfrBlocks.push(block);
        }
      }
    }

    // Compose hooks (deduplicate by name — not tier-filtered)
    if (templateSet.hooks) {
      for (const hook of templateSet.hooks) {
        if (!seenHookNames.has(hook.name)) {
          seenHookNames.add(hook.name);
          hooks.push(hook);
        }
      }
    }

    // Compose review blocks (deduplicate by id, filter by tier)
    if (templateSet.review?.blocks) {
      for (const block of templateSet.review.blocks) {
        if (
          !seenReviewIds.has(block.id) &&
          isTierAllowed(block.tier, allowedTiers) &&
          isBlockAllowed(block.id, includeList, excludeList)
        ) {
          seenReviewIds.add(block.id);
          reviewBlocks.push(block);
        }
      }
    }
  }

  logger.info("Templates composed", {
    tags: orderedTags,
    tier: tierLevel,
    claudeMdBlocks: claudeMdBlocks.length,
    structureEntries: structureEntries.length,
    nfrBlocks: nfrBlocks.length,
    hooks: hooks.length,
    reviewBlocks: reviewBlocks.length,
  });

  return { claudeMdBlocks, structureEntries, nfrBlocks, hooks, reviewBlocks };
}

/**
 * Ensure UNIVERSAL is always first in the tag list.
 * Remove duplicates. Preserve user order for other tags.
 */
function normalizeTagOrder(tags: Tag[]): Tag[] {
  const seen = new Set<Tag>();
  const result: Tag[] = [];

  // UNIVERSAL always first
  if (!tags.includes("UNIVERSAL")) {
    result.push("UNIVERSAL");
    seen.add("UNIVERSAL");
  }

  for (const tag of tags) {
    if (!seen.has(tag)) {
      seen.add(tag);
      result.push(tag);
    }
  }

  return result;
}
