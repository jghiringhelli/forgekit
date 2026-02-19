/**
 * scaffold_project tool handler.
 *
 * Generates full project structure from classified tags.
 */

import { z } from "zod";
import { mkdirSync, writeFileSync, chmodSync } from "node:fs";
import { join, dirname } from "node:path";
import { ALL_TAGS, ALL_OUTPUT_TARGETS, OUTPUT_TARGET_CONFIGS, DEFAULT_OUTPUT_TARGET } from "../shared/types.js";
import type { Tag, ScaffoldResult, OutputTarget } from "../shared/types.js";
import { loadAllTemplatesWithExtras, loadUserOverrides } from "../registry/loader.js";
import { composeTemplates } from "../registry/composer.js";
import {
  renderInstructionFile,
  renderStatusMd,
  renderPrdSkeleton,
  renderTechSpecSkeleton,
} from "../registry/renderer.js";
import { createLogger } from "../shared/logger/index.js";

const logger = createLogger("tools/scaffold");

// ── Schema ───────────────────────────────────────────────────────────

export const scaffoldProjectSchema = z.object({
  tags: z
    .array(z.enum(ALL_TAGS as unknown as [string, ...string[]]))
    .min(1)
    .describe("Project classification tags. UNIVERSAL is always included."),
  project_dir: z
    .string()
    .describe("Absolute path to the project root directory."),
  project_name: z
    .string()
    .describe("Human-readable project name."),
  language: z
    .enum(["typescript", "python"])
    .default("typescript")
    .describe("Primary programming language."),
  dry_run: z
    .boolean()
    .default(false)
    .describe("If true, return the plan without writing files."),
  output_targets: z
    .array(z.enum(ALL_OUTPUT_TARGETS as unknown as [string, ...string[]]))
    .default(["claude"])
    .describe("AI assistant targets to generate instruction files for. Options: claude, cursor, copilot, windsurf, cline, aider."),
});

// ── Handler ──────────────────────────────────────────────────────────

export async function scaffoldProjectHandler(
  args: z.infer<typeof scaffoldProjectSchema>,
): Promise<{ content: Array<{ type: "text"; text: string }> }> {
  const tags: Tag[] = args.tags.includes("UNIVERSAL")
    ? (args.tags as Tag[])
    : (["UNIVERSAL", ...args.tags] as Tag[]);

  logger.info("Scaffolding project", {
    tags,
    projectDir: args.project_dir,
    dryRun: args.dry_run,
  });

  // Load and compose templates (respects forgecraft.yaml config if present)
  const userConfig = loadUserOverrides(args.project_dir);
  const templateSets = await loadAllTemplatesWithExtras(
    undefined,
    userConfig?.templateDirs,
  );
  const composed = composeTemplates(tags, templateSets, {
    config: userConfig ?? undefined,
  });

  const context = {
    projectName: args.project_name,
    language: args.language,
    tags,
  };

  const filesCreated: string[] = [];

  // Render content
  const outputTargets = (args.output_targets ?? [DEFAULT_OUTPUT_TARGET]) as OutputTarget[];
  const statusMdContent = renderStatusMd(context);
  const prdContent = renderPrdSkeleton(context);
  const techSpecContent = renderTechSpecSkeleton(context);

  if (args.dry_run) {
    const plan = buildDryRunPlan(composed, tags);
    return { content: [{ type: "text", text: plan }] };
  }

  // Create directories from structure entries
  for (const entry of composed.structureEntries) {
    const fullPath = join(args.project_dir, entry.path);
    if (entry.type === "directory") {
      mkdirSync(fullPath, { recursive: true });
      filesCreated.push(`${entry.path}/`);
    }
  }

  // Write instruction files for all output targets
  for (const target of outputTargets) {
    const targetConfig = OUTPUT_TARGET_CONFIGS[target];
    const content = renderInstructionFile(composed.instructionBlocks, context, target);
    const outputPath = targetConfig.directory
      ? join(args.project_dir, targetConfig.directory, targetConfig.filename)
      : join(args.project_dir, targetConfig.filename);
    mkdirSync(dirname(outputPath), { recursive: true });
    writeFileSafe(outputPath, content);
    filesCreated.push(targetConfig.directory ? `${targetConfig.directory}/${targetConfig.filename}` : targetConfig.filename);
  }

  // Write Status.md
  writeFileSafe(join(args.project_dir, "Status.md"), statusMdContent);
  filesCreated.push("Status.md");

  // Write docs
  mkdirSync(join(args.project_dir, "docs"), { recursive: true });
  writeFileSafe(join(args.project_dir, "docs", "PRD.md"), prdContent);
  filesCreated.push("docs/PRD.md");
  writeFileSafe(join(args.project_dir, "docs", "TechSpec.md"), techSpecContent);
  filesCreated.push("docs/TechSpec.md");

  // Write .env.example
  writeFileSafe(
    join(args.project_dir, ".env.example"),
    "NODE_ENV=development\nLOG_LEVEL=info\n",
  );
  filesCreated.push(".env.example");

  // Write hooks
  const hooksDir = join(args.project_dir, ".claude", "hooks");
  mkdirSync(hooksDir, { recursive: true });

  for (const hook of composed.hooks) {
    const hookPath = join(hooksDir, hook.filename);
    writeFileSafe(hookPath, hook.script);
    try {
      chmodSync(hookPath, 0o755);
    } catch {
      // chmod may fail on Windows, that's OK
    }
    filesCreated.push(`.claude/hooks/${hook.filename}`);
  }

  // Write .gitignore if not present
  const gitignorePath = join(args.project_dir, ".gitignore");
  writeFileSafe(
    gitignorePath,
    "node_modules/\ndist/\n.env\ncoverage/\n*.log\n",
  );
  filesCreated.push(".gitignore");

  const result: ScaffoldResult = {
    filesCreated,
    mcpServersConfigured: [],
    nextSteps: [
      "Review and adjust instruction files for your project specifics",
      "Fill in docs/PRD.md with your actual requirements",
      "Fill in docs/TechSpec.md with your architecture decisions",
      "Run `npm install` or equivalent to install dependencies",
      "Start implementing your first feature module",
    ],
    restartRequired: true,
  };

  let text = `# Project Scaffolded Successfully\n\n`;
  text += `**Tags:** ${tags.map((t) => `[${t}]`).join(" ")}\n`;
  text += `**Files Created:** ${filesCreated.length}\n\n`;
  text += `## Created Files\n`;
  text += filesCreated.map((f) => `- \`${f}\``).join("\n");
  text += `\n\n## Next Steps\n`;
  text += result.nextSteps.map((s, i) => `${i + 1}. ${s}`).join("\n");
  text += `\n\n⚠️ **Restart may be required** to pick up instruction files and hooks.`;

  return { content: [{ type: "text", text }] };
}

/**
 * Write a file, creating parent directories as needed.
 */
function writeFileSafe(filePath: string, content: string): void {
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, content, "utf-8");
}

/**
 * Build a dry-run plan without writing files.
 */
function buildDryRunPlan(
  composed: ReturnType<typeof composeTemplates>,
  tags: Tag[],
): string {
  let text = `# Scaffold Plan (Dry Run)\n\n`;
  text += `**Tags:** ${tags.map((t) => `[${t}]`).join(" ")}\n\n`;

  text += `## Directories to Create\n`;
  const dirs = composed.structureEntries.filter((e) => e.type === "directory");
  text += dirs.map((d) => `- \`${d.path}/\`${d.description ? ` — ${d.description}` : ""}`).join("\n");

  text += `\n\n## Files to Generate\n`;
  text += `- CLAUDE.md (${composed.claudeMdBlocks.length} blocks)\n`;
  text += `- Status.md\n`;
  text += `- docs/PRD.md (skeleton)\n`;
  text += `- docs/TechSpec.md (skeleton with ${composed.nfrBlocks.length} NFR sections)\n`;
  text += `- .env.example\n`;
  text += `- .gitignore\n`;

  text += `\n## Hooks to Install (${composed.hooks.length})\n`;
  text += composed.hooks
    .map((h) => `- \`${h.filename}\` (${h.trigger}) — ${h.description}`)
    .join("\n");

  text += `\n\n_Run again with dry_run=false to write files._`;
  return text;
}
