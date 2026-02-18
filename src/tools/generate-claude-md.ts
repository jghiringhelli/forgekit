/**
 * generate_claude_md tool handler.
 *
 * Generates or regenerates CLAUDE.md for given tags.
 */

import { z } from "zod";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { ALL_TAGS } from "../shared/types.js";
import type { Tag } from "../shared/types.js";
import { loadAllTemplatesWithExtras, loadUserOverrides } from "../registry/loader.js";
import { composeTemplates } from "../registry/composer.js";
import { renderClaudeMd } from "../registry/renderer.js";

// ── Schema ───────────────────────────────────────────────────────────

export const generateClaudeMdSchema = z.object({
  tags: z
    .array(z.enum(ALL_TAGS as unknown as [string, ...string[]]))
    .min(1)
    .describe("Project classification tags."),
  project_dir: z
    .string()
    .optional()
    .describe("Absolute path to project. If provided, writes CLAUDE.md to disk."),
  project_name: z
    .string()
    .default("My Project")
    .describe("Project name for variable substitution."),
  merge_with_existing: z
    .boolean()
    .default(false)
    .describe("If true, merge with existing CLAUDE.md instead of replacing."),
});

// ── Handler ──────────────────────────────────────────────────────────

export async function generateClaudeMdHandler(
  args: z.infer<typeof generateClaudeMdSchema>,
): Promise<{ content: Array<{ type: "text"; text: string }> }> {
  const tags: Tag[] = args.tags.includes("UNIVERSAL")
    ? (args.tags as Tag[])
    : (["UNIVERSAL", ...args.tags] as Tag[]);

  const userConfig = args.project_dir ? loadUserOverrides(args.project_dir) : null;
  const templateSets = await loadAllTemplatesWithExtras(
    undefined,
    userConfig?.templateDirs,
  );
  const composed = composeTemplates(tags, templateSets, {
    config: userConfig ?? undefined,
  });

  const context = {
    projectName: args.project_name,
    language: "typescript" as const,
    tags,
  };

  let claudeMdContent = renderClaudeMd(composed.claudeMdBlocks, context);

  // Handle merge with existing
  if (args.merge_with_existing && args.project_dir) {
    const existingPath = join(args.project_dir, "CLAUDE.md");
    if (existsSync(existingPath)) {
      const existing = readFileSync(existingPath, "utf-8");
      claudeMdContent = mergeClaudeMd(existing, claudeMdContent);
    }
  }

  // Write to disk if project_dir provided
  if (args.project_dir) {
    const targetPath = join(args.project_dir, "CLAUDE.md");
    writeFileSync(targetPath, claudeMdContent, "utf-8");

    return {
      content: [
        {
          type: "text",
          text: `CLAUDE.md generated and written to \`${targetPath}\`.\n\n**Tags:** ${tags.map((t) => `[${t}]`).join(" ")}\n**Blocks:** ${composed.claudeMdBlocks.length}\n\n⚠️ Restart required to pick up changes.`,
        },
      ],
    };
  }

  // Return content only
  return {
    content: [
      {
        type: "text",
        text: claudeMdContent,
      },
    ],
  };
}

/**
 * Merge generated CLAUDE.md with existing one.
 * Keeps any custom sections from the existing file.
 */
function mergeClaudeMd(existing: string, generated: string): string {
  const existingLines = existing.split("\n");
  const generatedLines = generated.split("\n");

  // Find custom sections (sections not in generated)
  const generatedHeaders = new Set(
    generatedLines
      .filter((l) => l.startsWith("## ") || l.startsWith("### "))
      .map((l) => l.trim()),
  );

  const customSections: string[] = [];
  let inCustomSection = false;
  let currentSection: string[] = [];

  for (const line of existingLines) {
    if (line.startsWith("## ") || line.startsWith("### ")) {
      if (inCustomSection && currentSection.length > 0) {
        customSections.push(currentSection.join("\n"));
      }
      inCustomSection = !generatedHeaders.has(line.trim());
      currentSection = inCustomSection ? [line] : [];
    } else if (inCustomSection) {
      currentSection.push(line);
    }
  }

  if (inCustomSection && currentSection.length > 0) {
    customSections.push(currentSection.join("\n"));
  }

  // Append custom sections to generated content
  if (customSections.length > 0) {
    return (
      generated +
      "\n\n<!-- Custom Sections (preserved from previous CLAUDE.md) -->\n\n" +
      customSections.join("\n\n")
    );
  }

  return generated;
}
