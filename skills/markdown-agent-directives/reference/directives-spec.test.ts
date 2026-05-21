// Verifies the scan documented in `SKILL.md` against the fixtures in
// `directives-spec.md`.
//
// Run: `bun test` from this directory, or `bun test reference/directives-spec.test.ts`
// from the skill root. Requires bun >= 1.3. No package.json needed — bun ships
// with `bun:test` built in. For editor types, install `@types/bun` globally
// (optional; the test runs fine without it).
//
// Source-of-truth design:
//   - SCAN_REGEX and AGENTS are HARDCODED here as TS constants.
//   - A consistency test asserts SKILL.md contains both verbatim, so editing
//     SKILL.md without updating the test (or vice versa) fails loud.
//   - Fixtures live in `directives-spec.md`. Each section's fenced block whose
//     info string is `md @test:match` or `md @test:nomatch` is one fixture;
//     other fences are ignored.
//   - Per-agent fixtures (one bare `#<agent>` directive per name) are
//     generated programmatically from AGENTS.

import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// ─── single source of truth (TS side) ─────────────────────────────────────
const SCAN_REGEX = String.raw`(\[!NOTE\]|^([^>]*[[:space:]])?#(agent|claude|codex)([^[:alnum:]_]|$))`;
const AGENTS = ["agent", "claude", "codex"] as const;

const SKILL_PATH = new URL("../SKILL.md", import.meta.url);
const SPEC_PATH = new URL("./directives-spec.md", import.meta.url);
const SKILL = readFileSync(SKILL_PATH, "utf8");
const SPEC = readFileSync(SPEC_PATH, "utf8");

// ─── parse fixtures from spec.md ──────────────────────────────────────────
// A fixture is any fenced block (3+ backticks) whose info string is
// `md @test:match` or `md @test:nomatch`. Each block's name is the nearest
// heading preceding it.
interface Fixture {
  name: string;
  expect: "match" | "nomatch";
  content: string;
}

function parseSpec(spec: string): Fixture[] {
  const fixtures: Fixture[] = [];
  const fenceRe = /(`{3,})md @test:(match|nomatch)\b[^\n]*\n([\s\S]*?)\n\1\s*$/gm;
  for (const m of spec.matchAll(fenceRe)) {
    const [, , expect, content] = m;
    const name = nearestHeadingBefore(spec, m.index!) ?? `fixture@${m.index}`;
    fixtures.push({ name, expect: expect as "match" | "nomatch", content });
  }
  return fixtures;
}

function nearestHeadingBefore(text: string, offset: number): string | null {
  const headings = [...text.slice(0, offset).matchAll(/(^|\n)#{1,6} +([^\n]+)/g)];
  return headings.length ? headings[headings.length - 1][2].trim() : null;
}

const SPEC_FIXTURES = parseSpec(SPEC);
const AGENT_FIXTURES: Fixture[] = AGENTS.map((agent) => ({
  name: `bare #${agent} directive (generated)`,
  expect: "match",
  content: `#${agent} please assist`,
}));
const ALL_FIXTURES = [...SPEC_FIXTURES, ...AGENT_FIXTURES];

// ─── harness ──────────────────────────────────────────────────────────────
let matched: Set<string>;
let tempDir = "";

beforeAll(async () => {
  tempDir = await mkdtemp(join(tmpdir(), "markdown-agent-directives-"));
  const seen = new Set<string>();
  for (const fx of ALL_FIXTURES) {
    const slug = slugify(fx.name);
    if (seen.has(slug)) throw new Error(`Duplicate fixture name (slugged): "${fx.name}"`);
    seen.add(slug);
    const content = fx.content.endsWith("\n") ? fx.content : fx.content + "\n";
    await writeFile(join(tempDir, `${slug}.md`), content);
  }

  const proc = Bun.spawnSync({
    cmd: ["grep", "-rlnE", "--include=*.md", SCAN_REGEX, tempDir],
    stdout: "pipe",
    stderr: "pipe",
  });
  // grep exits 1 when no matches — not an error for us.
  if (proc.exitCode !== 0 && proc.exitCode !== 1) {
    throw new Error(`grep failed (exit ${proc.exitCode}): ${new TextDecoder().decode(proc.stderr)}`);
  }
  matched = new Set(
    new TextDecoder().decode(proc.stdout)
      .trim().split("\n").filter(Boolean)
      .map((p) => p.replace(`${tempDir}/`, "").replace(/\.md$/, "")),
  );

  console.log(`Regex:    ${SCAN_REGEX}`);
  console.log(`Agents:   ${AGENTS.join(" ")}`);
  console.log(`Fixtures: ${SPEC_FIXTURES.length} from spec + ${AGENT_FIXTURES.length} generated = ${ALL_FIXTURES.length}`);
});

afterAll(async () => {
  if (tempDir) await rm(tempDir, { recursive: true, force: true });
});

// ─── tests ────────────────────────────────────────────────────────────────
describe("SKILL.md ⇄ test constants are in sync", () => {
  it("SKILL.md contains the scan regex verbatim", () => {
    expect(SKILL).toContain(SCAN_REGEX);
  });
  it("SKILL.md mentions every agent name", () => {
    for (const agent of AGENTS) expect(SKILL).toContain(agent);
  });
});

describe("spec.md fixtures", () => {
  it("contains both match and nomatch examples", () => {
    expect(SPEC_FIXTURES.length).toBeGreaterThan(0);
    expect(SPEC_FIXTURES.some((f) => f.expect === "match")).toBe(true);
    expect(SPEC_FIXTURES.some((f) => f.expect === "nomatch")).toBe(true);
  });
});

describe("scan picks up exactly the expected fixtures", () => {
  for (const fx of ALL_FIXTURES) {
    const verb = fx.expect === "match" ? "matches" : "skips";
    it(`${verb}: ${fx.name}`, () => {
      expect(matched.has(slugify(fx.name))).toBe(fx.expect === "match");
    });
  }
});

// ─── helpers ──────────────────────────────────────────────────────────────
function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
