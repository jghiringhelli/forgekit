import { describe, it, expect } from "vitest";
import {
  renderTemplate,
  renderClaudeMd,
  renderNfrs,
  renderStatusMd,
  renderPrdSkeleton,
  renderTechSpecSkeleton,
  type RenderContext,
} from "../../src/registry/renderer.js";
import type { ClaudeMdBlock, NfrBlock } from "../../src/shared/types.js";

function makeContext(overrides: Partial<RenderContext> = {}): RenderContext {
  return {
    projectName: "TestProject",
    language: "typescript",
    tags: ["UNIVERSAL", "API"],
    ...overrides,
  };
}

describe("renderer", () => {
  describe("renderTemplate", () => {
    it("should substitute simple variables", () => {
      const result = renderTemplate("Hello {{projectName}}", makeContext());
      expect(result).toBe("Hello TestProject");
    });

    it("should handle snake_case to camelCase mapping", () => {
      const result = renderTemplate("Name: {{project_name}}", makeContext());
      expect(result).toBe("Name: TestProject");
    });

    it("should use default value when variable is missing", () => {
      const result = renderTemplate("Max: {{max_lines | default: 300}}", makeContext());
      expect(result).toBe("Max: 300");
    });

    it("should prefer actual value over default", () => {
      const ctx = makeContext({ maxLines: "500" } as Partial<RenderContext>);
      const result = renderTemplate("Max: {{max_lines | default: 300}}", ctx);
      expect(result).toBe("Max: 500");
    });

    it("should leave placeholder when no value and no default", () => {
      const result = renderTemplate("Repo: {{repo_url}}", makeContext());
      expect(result).toBe("Repo: {{repo_url}}");
    });

    it("should handle multiple substitutions", () => {
      const result = renderTemplate(
        "{{projectName}} uses {{language}}",
        makeContext(),
      );
      expect(result).toBe("TestProject uses typescript");
    });

    it("should handle tags as formatted list", () => {
      const result = renderTemplate("Tags: {{tags}}", makeContext());
      expect(result).toContain("`[UNIVERSAL]`");
      expect(result).toContain("`[API]`");
    });

    it("should handle whitespace in variable syntax", () => {
      const result = renderTemplate("{{ projectName }}", makeContext());
      expect(result).toBe("TestProject");
    });
  });

  describe("renderClaudeMd", () => {
    it("should render blocks with header", () => {
      const blocks: ClaudeMdBlock[] = [
        { id: "test", title: "Test", content: "## Test\nContent here" },
      ];
      const result = renderClaudeMd(blocks, makeContext());

      expect(result).toContain("# CLAUDE.md");
      expect(result).toContain("## Test");
      expect(result).toContain("Content here");
    });

    it("should render multiple blocks in order", () => {
      const blocks: ClaudeMdBlock[] = [
        { id: "first", title: "First", content: "## First Block" },
        { id: "second", title: "Second", content: "## Second Block" },
      ];
      const result = renderClaudeMd(blocks, makeContext());

      const firstIdx = result.indexOf("First Block");
      const secondIdx = result.indexOf("Second Block");
      expect(firstIdx).toBeLessThan(secondIdx);
    });

    it("should substitute variables within blocks", () => {
      const blocks: ClaudeMdBlock[] = [
        { id: "test", title: "Test", content: "Project: {{projectName}}" },
      ];
      const result = renderClaudeMd(blocks, makeContext());
      expect(result).toContain("Project: TestProject");
    });
  });

  describe("renderNfrs", () => {
    it("should render NFR blocks", () => {
      const blocks: NfrBlock[] = [
        { id: "security", title: "Security", content: "## Security\nRequirements" },
      ];
      const result = renderNfrs(blocks, makeContext());
      expect(result).toContain("## Security");
      expect(result).toContain("Requirements");
    });
  });

  describe("renderStatusMd", () => {
    it("should include tags", () => {
      const result = renderStatusMd(makeContext());
      expect(result).toContain("UNIVERSAL");
      expect(result).toContain("API");
    });

    it("should include feature tracker table", () => {
      const result = renderStatusMd(makeContext());
      expect(result).toContain("Feature Tracker");
    });
  });

  describe("renderPrdSkeleton", () => {
    it("should include project name", () => {
      const result = renderPrdSkeleton(makeContext());
      expect(result).toContain("PRD: TestProject");
    });

    it("should include tags in NFR section", () => {
      const result = renderPrdSkeleton(makeContext());
      expect(result).toContain("UNIVERSAL, API");
    });
  });

  describe("renderTechSpecSkeleton", () => {
    it("should include project name and language", () => {
      const result = renderTechSpecSkeleton(makeContext());
      expect(result).toContain("Tech Spec: TestProject");
      expect(result).toContain("typescript");
    });

    it("should use framework when provided", () => {
      const result = renderTechSpecSkeleton(makeContext({ framework: "Next.js" }));
      expect(result).toContain("Next.js");
    });

    it("should show TBD when no framework", () => {
      const result = renderTechSpecSkeleton(makeContext());
      expect(result).toContain("[TBD]");
    });
  });
});
