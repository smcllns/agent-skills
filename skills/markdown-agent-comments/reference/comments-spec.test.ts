// Verifies the scan documented in `SKILL.md` against the fixtures in
// `comments-spec.md`.
//
// Run: `bun test` from this directory, or `bun test reference/comments-spec.test.ts`
// from the skill root. Requires bun >= 1.3 and `awk` (standard on macOS/Linux).
//
// Source-of-truth design:
//   - `reference/scan.awk` is the canonical scan implementation. The test
//     invokes it via `find ... -exec awk -f scan.awk` — the docs and the
//     test can't drift since both reference the same file.
//   - A consistency test asserts SKILL.md documents the find+awk command
//     and that scan.awk mentions every agent name in AGENTS.
//   - Fixtures live in `comments-spec.md`. Each section's fenced block whose
//     info string is `md @test:match` or `md @test:nomatch` is one fixture;
//     other fences are ignored.
//   - Per-agent fixtures (one bare `#<agent>` directive per name) are
//     generated programmatically from AGENTS.

import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

// ─── agent list (TS side) ─────────────────────────────────────────────────
const AGENTS = ["claude", "codex", "pi", "agent", "hermes"] as const;

const SKILL_PATH = new URL("../SKILL.md", import.meta.url);
const SPEC_PATH = new URL("./comments-spec.md", import.meta.url);
const SCAN_AWK_PATH = fileURLToPath(new URL("./scan.awk", import.meta.url));
const SKILL = readFileSync(SKILL_PATH, "utf8");
const SPEC = readFileSync(SPEC_PATH, "utf8");
const SCAN_AWK = readFileSync(SCAN_AWK_PATH, "utf8");

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
  tempDir = await mkdtemp(join(tmpdir(), "markdown-agent-comments-"));
  const seen = new Set<string>();
  for (const fx of ALL_FIXTURES) {
    const slug = slugify(fx.name);
    if (seen.has(slug)) throw new Error(`Duplicate fixture name (slugged): "${fx.name}"`);
    seen.add(slug);
    const content = fx.content.endsWith("\n") ? fx.content : fx.content + "\n";
    await writeFile(join(tempDir, `${slug}.md`), content);
  }

  const proc = Bun.spawnSync({
    cmd: ["find", tempDir, "-name", "*.md", "-exec", "awk", "-f", SCAN_AWK_PATH, "{}", "+"],
    stdout: "pipe",
    stderr: "pipe",
  });
  if (proc.exitCode !== 0) {
    throw new Error(`scan failed (exit ${proc.exitCode}): ${new TextDecoder().decode(proc.stderr)}`);
  }
  matched = new Set(
    new TextDecoder().decode(proc.stdout)
      .trim().split("\n").filter(Boolean)
      .map((p) => p.replace(`${tempDir}/`, "").replace(/\.md$/, "")),
  );

  console.log(`Scan:     find <path> -name '*.md' -exec awk -f reference/scan.awk {} +`);
  console.log(`Agents:   ${AGENTS.join(" ")}`);
  console.log(`Fixtures: ${SPEC_FIXTURES.length} from spec + ${AGENT_FIXTURES.length} generated = ${ALL_FIXTURES.length}`);
});

afterAll(async () => {
  if (tempDir) await rm(tempDir, { recursive: true, force: true });
});

// ─── tests ────────────────────────────────────────────────────────────────
describe("SKILL.md ⇄ scan.awk are in sync", () => {
  it("SKILL.md documents the find+awk command", () => {
    expect(SKILL).toContain("awk -f reference/scan.awk");
  });
  it("SKILL.md mentions every agent name", () => {
    for (const agent of AGENTS) expect(SKILL).toContain(agent);
  });
  it("scan.awk includes every documented agent name", () => {
    for (const agent of AGENTS) expect(SCAN_AWK).toContain(agent);
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
