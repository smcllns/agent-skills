// Verifies the scan regex documented in `SKILL.md` against the fixtures in
// `comments-spec.md`. The regex is parsed from SKILL.md (never hardcoded) so
// this test can't drift from the docs — change the regex there, the test
// runs the new regex. Per-agent fixtures are generated from the regex's
// `#(name1|name2|…)\b` alternation so adding a name extends coverage for free.
//
// Run: `bun test` from `tests/`.

import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

interface Fixture {
  name: string;
  expect: "match" | "nomatch";
  content: string;
  generated?: boolean;
}

const SKILL_PATH = new URL("../SKILL.md", import.meta.url);
const SPEC_PATH = new URL("./comments-spec.md", import.meta.url);

function extractRegex(skill: string): string {
  const m = skill.match(/grep -rlnE --include='\*\.md' '([^']+)'/);
  if (!m) throw new Error("Could not extract scan regex from SKILL.md — has the documented grep command changed shape?");
  return m[1];
}

function extractAgentNames(regex: string): string[] {
  const m = regex.match(/#\(([^)]+)\)\\b/);
  if (!m) throw new Error(`Could not extract agent names from regex: ${regex}`);
  return m[1].split("|");
}

// Parse fixtures from spec.md. Each fixture is a `## ` section with:
//   1. An HTML annotation: `<!-- @test: match -->` or `<!-- @test: nomatch -->`
//   2. The first fenced block whose info string starts with `md`
//      (3+ backticks, info `md`). The content of that block is the fixture.
// Sections without an annotation are skipped (preamble, category headers).
function parseSpec(spec: string): Fixture[] {
  const sections = spec.split(/^## /m).slice(1);
  const fixtures: Fixture[] = [];

  for (const section of sections) {
    const firstNewline = section.indexOf("\n");
    const title = section.slice(0, firstNewline).trim();
    const body = section.slice(firstNewline + 1);

    const annotation = body.match(/<!--\s*@test:\s*(match|nomatch)\b/);
    if (!annotation) continue;

    const fence = body.match(/^(`{3,})md\b[^\n]*\n([\s\S]*?)\n\1\s*$/m);
    if (!fence) {
      throw new Error(`Fixture "${title}" has an @test annotation but no \`md\` fenced block`);
    }

    fixtures.push({
      name: title,
      expect: annotation[1] as "match" | "nomatch",
      content: fence[2],
    });
  }

  return fixtures;
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

const skill = readFileSync(SKILL_PATH, "utf8");
const spec = readFileSync(SPEC_PATH, "utf8");

const REGEX = extractRegex(skill);
const AGENTS = extractAgentNames(REGEX);
const SPEC_FIXTURES = parseSpec(spec);
const AGENT_FIXTURES: Fixture[] = AGENTS.map((agent) => ({
  name: `Bare #${agent} directive (generated)`,
  expect: "match" as const,
  content: `#${agent} please assist\n`,
  generated: true,
}));
const ALL_FIXTURES = [...SPEC_FIXTURES, ...AGENT_FIXTURES];

console.log(`Regex:  ${REGEX}`);
console.log(`Agents: ${AGENTS.join(" ")}`);
console.log(`Fixtures: ${SPEC_FIXTURES.length} from spec + ${AGENT_FIXTURES.length} generated = ${ALL_FIXTURES.length}`);

let tempDir = "";
let matchedSlugs = new Set<string>();

beforeAll(async () => {
  tempDir = await mkdtemp(join(tmpdir(), "markdown-agent-comments-test-"));
  const seen = new Set<string>();
  for (const fx of ALL_FIXTURES) {
    const slug = slugify(fx.name);
    if (seen.has(slug)) throw new Error(`Duplicate fixture slug: ${slug} (rename one of the sections)`);
    seen.add(slug);
    const content = fx.content.endsWith("\n") ? fx.content : fx.content + "\n";
    await writeFile(join(tempDir, `${slug}.md`), content);
  }

  const proc = Bun.spawnSync({
    cmd: ["grep", "-rlnE", "--include=*.md", REGEX, tempDir],
    stdout: "pipe",
    stderr: "pipe",
  });
  // grep exits 1 when there are no matches; that's not an error for us.
  if (proc.exitCode !== 0 && proc.exitCode !== 1) {
    throw new Error(`grep failed (exit ${proc.exitCode}): ${new TextDecoder().decode(proc.stderr)}`);
  }
  const stdout = new TextDecoder().decode(proc.stdout);
  matchedSlugs = new Set(
    stdout
      .trim()
      .split("\n")
      .filter(Boolean)
      .map((p) => p.replace(`${tempDir}/`, "").replace(/\.md$/, "")),
  );
});

afterAll(async () => {
  if (tempDir) await rm(tempDir, { recursive: true, force: true });
});

describe("scan regex parses cleanly from SKILL.md", () => {
  it("includes the [!NOTE] alternative", () => {
    expect(REGEX).toContain("\\[!NOTE\\]");
  });

  it("includes at least one agent name", () => {
    expect(AGENTS.length).toBeGreaterThan(0);
  });
});

describe("spec.md fixtures", () => {
  it("contains at least one fixture per behavior", () => {
    expect(SPEC_FIXTURES.length).toBeGreaterThan(0);
    expect(SPEC_FIXTURES.some((f) => f.expect === "match")).toBe(true);
    expect(SPEC_FIXTURES.some((f) => f.expect === "nomatch")).toBe(true);
  });
});

describe("each fixture matches its expectation", () => {
  // Using `it.each`-style loop is fine; bun:test enumerates these eagerly.
  for (const fx of [...SPEC_FIXTURES, ...AGENT_FIXTURES]) {
    const label = `[${fx.expect}] ${fx.name}`;
    it(label, () => {
      const slug = slugify(fx.name);
      const wasMatched = matchedSlugs.has(slug);
      const shouldMatch = fx.expect === "match";
      expect(wasMatched).toBe(shouldMatch);
    });
  }
});
