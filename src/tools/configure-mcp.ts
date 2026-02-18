/**
 * configure_mcp tool handler.
 *
 * Generates .claude/settings.json with recommended MCP servers based on tags.
 */

import { z } from "zod";
import { mkdirSync, writeFileSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { ALL_TAGS } from "../shared/types.js";
import type { Tag, McpServerConfig } from "../shared/types.js";

// ── Schema ───────────────────────────────────────────────────────────

export const configureMcpSchema = z.object({
  tags: z
    .array(z.enum(ALL_TAGS as unknown as [string, ...string[]]))
    .min(1)
    .describe("Active project tags."),
  project_dir: z
    .string()
    .describe("Absolute path to the project root directory."),
  custom_servers: z
    .record(
      z.object({
        command: z.string(),
        args: z.array(z.string()),
        env: z.record(z.string()).optional(),
      }),
    )
    .optional()
    .describe("Custom MCP servers to add alongside recommended ones."),
  auto_approve_tools: z
    .boolean()
    .default(true)
    .describe(
      "If true, adds permissions.allow entries for all configured MCP servers " +
      "so tool invocations are auto-approved without manual confirmation.",
    ),
});

// ── Recommended Servers per Tag ──────────────────────────────────────

const TAG_SERVERS: Record<string, Record<string, McpServerConfig>> = {
  UNIVERSAL: {
    forgekit: {
      command: "npx",
      args: ["-y", "@forgekit/mcp-server"],
    },
    codeseeker: {
      command: "npx",
      args: ["-y", "codeseeker"],
    },
  },
};

// ── Handler ──────────────────────────────────────────────────────────

export async function configureMcpHandler(
  args: z.infer<typeof configureMcpSchema>,
): Promise<{ content: Array<{ type: "text"; text: string }> }> {
  const tags = args.tags as Tag[];

  // Collect recommended servers
  const servers: Record<string, McpServerConfig> = {};

  for (const tag of tags) {
    const tagServers = TAG_SERVERS[tag];
    if (tagServers) {
      Object.assign(servers, tagServers);
    }
  }

  // Add custom servers
  if (args.custom_servers) {
    Object.assign(servers, args.custom_servers);
  }

  // Build settings.json
  const mcpConfig: Record<string, { command: string; args: string[]; env?: Record<string, string> }> = {};
  for (const [name, config] of Object.entries(servers)) {
    mcpConfig[name] = {
      command: config.command,
      args: config.args,
      ...(config.env ? { env: config.env } : {}),
    };
  }

  // Build permissions.allow entries for auto-approval
  const permissionRules: string[] = [];
  if (args.auto_approve_tools) {
    for (const serverName of Object.keys(servers)) {
      permissionRules.push(`mcp__${serverName}__*`);
    }
  }

  const settings: Record<string, unknown> = { mcpServers: mcpConfig };
  if (permissionRules.length > 0) {
    settings["permissions"] = { allow: permissionRules };
  }

  // Handle existing settings
  const settingsDir = join(args.project_dir, ".claude");
  const settingsPath = join(settingsDir, "settings.json");

  let merged: Record<string, unknown> = settings;
  if (existsSync(settingsPath)) {
    try {
      const existing = JSON.parse(readFileSync(settingsPath, "utf-8")) as Record<string, unknown>;
      const existingPerms = (existing["permissions"] as Record<string, unknown>) ?? {};
      const existingAllow = (existingPerms["allow"] as string[]) ?? [];

      // Merge permissions: deduplicate existing + new rules
      const mergedAllow = [...new Set([...existingAllow, ...permissionRules])];

      merged = {
        ...existing,
        permissions: {
          ...existingPerms,
          allow: mergedAllow,
        },
        mcpServers: {
          ...(existing["mcpServers"] as Record<string, unknown> ?? {}),
          ...mcpConfig,
        },
      };
    } catch {
      // Existing file unparseable, overwrite
    }
  }

  mkdirSync(settingsDir, { recursive: true });
  writeFileSync(settingsPath, JSON.stringify(merged, null, 2) + "\n", "utf-8");

  const serverNames = Object.keys(servers);

  return {
    content: [
      {
        type: "text",
        text:
          `MCP configuration written to \`.claude/settings.json\`.\n\n` +
          `**Servers configured (${serverNames.length}):**\n` +
          serverNames.map((n) => `- \`${n}\`: \`${servers[n]!.command} ${servers[n]!.args.join(" ")}\``).join("\n") +
          (permissionRules.length > 0
            ? `\n\n**Auto-approved (${permissionRules.length}):**\n` +
              permissionRules.map((r) => `- \`${r}\``).join("\n")
            : "") +
          `\n\n⚠️ Restart required to pick up MCP server changes.`,
      },
    ],
  };
}
