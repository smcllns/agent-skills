// Verifies the scan documented in `SKILL.md` against the fixtures in
// `markdown-agent-tags.spec.md`.
//
// Run: `bun test` from this directory, or `bun test reference/markdown-agent-tags.spec.test.ts`
// from the skill root. Requires bun >= 1.3. No package.json needed — bun ships
// with `bun:test` built in. For editor types, install `@types/bun` globally
// (optional; the test runs fine without it).
//
// Source-of-truth design:
//   - SCAN_REGEX and AGENTS are HARDCODED here as TS constants.
//   - DONE_SCAN_AWK is HARDCODED here as the inline awk program from SKILL.md.
//   - Consistency tests assert SKILL.md contains them verbatim, so editing
//     SKILL.md without updating the test (or vice versa) fails loud.
//   - Fixtures live in `markdown-agent-tags.spec.md`. Each section's fenced
//     block can opt into the grep scan with `@test:match` / `@test:nomatch`, and
//     into the DONE seal scan with `@done:match` / `@done:nomatch`.
//   - Per-agent fixtures (one bare `@<agent>` tag per name) are
//     generated programmatically from AGENTS.

import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// ─── single source of truth (TS side) ─────────────────────────────────────
const SCAN_REGEX = String.raw`(\[!NOTE\]\+|^([^>]*[[:space:]])?@(agent|claude|codex)([^[:alnum:]_]|$))`;
const AGENTS = ["agent", "claude", "codex"] as const;
const DONE_EOT = "<!--atag:eot-->";
const LEGACY_DONE_EOT = "<!--md-asks:eot-->";
const DONE_SCAN_AWK = String.raw`function finish_done() {
  if (in_done && !sealed) print callout_file ":" start
  in_done = 0
  sealed = 0
  callout_file = ""
}
FNR == 1 && NR > 1 { finish_done() }
/^[[:space:]]*>[[:space:]]*\[!DONE\]-/ {
  finish_done()
  in_done = 1
  sealed = 0
  callout_file = FILENAME
  start = FNR
}
!in_done { next }
$0 !~ /^[[:space:]]*>/ { finish_done(); next }
{
  line = $0
  sub(/^[[:space:]]*>[[:space:]]*/, "", line)
  if (line !~ /^[[:space:]]*$/) {
    sealed = (line ~ /<!--(atag|md-asks):eot-->[[:space:]]*$/)
  }
}
END { finish_done() }`;

const SKILL_PATH = new URL("../SKILL.md", import.meta.url);
const SPEC_PATH = new URL("./markdown-agent-tags.spec.md", import.meta.url);
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

function parseMarkedSpec(spec: string, marker: "done"): Fixture[] {
  const fixtures: Fixture[] = [];
  const fenceRe = /(`{3,})md ([^\n]*)\n([\s\S]*?)\n\1\s*$/gm;
  const markerRe = new RegExp(`(?:^|\\s)@${marker}:(match|nomatch)\\b`);
  for (const m of spec.matchAll(fenceRe)) {
    const [, , info, content] = m;
    const markerMatch = info.match(markerRe);
    if (!markerMatch) continue;
    const name = nearestHeadingBefore(spec, m.index!) ?? `fixture@${m.index}`;
    fixtures.push({ name, expect: markerMatch[1] as "match" | "nomatch", content });
  }
  return fixtures;
}

function nearestHeadingBefore(text: string, offset: number): string | null {
  const headings = [...text.slice(0, offset).matchAll(/(^|\n)#{1,6} +([^\n]+)/g)];
  return headings.length ? headings[headings.length - 1][2].trim() : null;
}

const SPEC_FIXTURES = parseSpec(SPEC);
const DONE_FIXTURES = parseMarkedSpec(SPEC, "done");
const AGENT_FIXTURES: Fixture[] = AGENTS.map((agent) => ({
  name: `bare @${agent} tag (generated)`,
  expect: "match",
  content: `@${agent} please assist`,
}));
const ALL_FIXTURES = [...SPEC_FIXTURES, ...AGENT_FIXTURES];

// ─── harness ──────────────────────────────────────────────────────────────
let grepMatched: Set<string>;
let doneMatched: Set<string>;
let grepTempDir = "";
let doneTempDir = "";

beforeAll(async () => {
  const grepScan = await writeFixtures(ALL_FIXTURES, "markdown-agent-tags-grep-");
  grepTempDir = grepScan.tempDir;

  const proc = Bun.spawnSync({
    cmd: ["grep", "-rlnE", "--include=*.md", SCAN_REGEX, grepTempDir],
    stdout: "pipe",
    stderr: "pipe",
  });
  // grep exits 1 when no matches — not an error for us.
  if (proc.exitCode !== 0 && proc.exitCode !== 1) {
    throw new Error(`grep failed (exit ${proc.exitCode}): ${new TextDecoder().decode(proc.stderr)}`);
  }
  grepMatched = new Set(
    new TextDecoder().decode(proc.stdout)
      .trim().split("\n").filter(Boolean)
      .map((p) => p.replace(`${grepTempDir}/`, "").replace(/\.md$/, "")),
  );

  const doneScan = await writeFixtures(DONE_FIXTURES, "markdown-agent-tags-done-");
  doneTempDir = doneScan.tempDir;

  const doneProc = Bun.spawnSync({
    cmd: ["awk", DONE_SCAN_AWK, ...doneScan.paths],
    stdout: "pipe",
    stderr: "pipe",
  });
  if (doneProc.exitCode !== 0) {
    throw new Error(`DONE scan failed (exit ${doneProc.exitCode}): ${new TextDecoder().decode(doneProc.stderr)}`);
  }
  doneMatched = new Set(
    new TextDecoder().decode(doneProc.stdout)
      .trim().split("\n").filter(Boolean)
      .map((line) => {
        const path = line.slice(0, line.lastIndexOf(":"));
        return path.replace(`${doneTempDir}/`, "").replace(/\.md$/, "");
      }),
  );

  console.log(`Regex:    ${SCAN_REGEX}`);
  console.log(`DONE EOT: ${DONE_EOT}`);
  console.log(`Agents:   ${AGENTS.join(" ")}`);
  console.log(`Fixtures: ${SPEC_FIXTURES.length} grep from spec + ${AGENT_FIXTURES.length} generated = ${ALL_FIXTURES.length}; ${DONE_FIXTURES.length} DONE`);
});

afterAll(async () => {
  if (grepTempDir) await rm(grepTempDir, { recursive: true, force: true });
  if (doneTempDir) await rm(doneTempDir, { recursive: true, force: true });
});

// ─── tests ────────────────────────────────────────────────────────────────
describe("SKILL.md ⇄ test constants are in sync", () => {
  it("SKILL.md contains the scan regex verbatim", () => {
    expect(SKILL).toContain(SCAN_REGEX);
  });
  it("SKILL.md contains the DONE seal token and inline awk verbatim", () => {
    expect(SKILL).toContain(DONE_EOT);
    expect(SKILL).toContain(LEGACY_DONE_EOT);
    expect(SKILL).toContain(DONE_SCAN_AWK);
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
  it("contains both DONE match and nomatch examples", () => {
    expect(DONE_FIXTURES.length).toBeGreaterThan(0);
    expect(DONE_FIXTURES.some((f) => f.expect === "match")).toBe(true);
    expect(DONE_FIXTURES.some((f) => f.expect === "nomatch")).toBe(true);
  });
});

describe("grep scan picks up exactly the expected fixtures", () => {
  for (const fx of ALL_FIXTURES) {
    const verb = fx.expect === "match" ? "matches" : "skips";
    it(`${verb}: ${fx.name}`, () => {
      expect(grepMatched.has(slugify(fx.name))).toBe(fx.expect === "match");
    });
  }
});

describe("DONE seal scan picks up exactly the expected fixtures", () => {
  for (const fx of DONE_FIXTURES) {
    const verb = fx.expect === "match" ? "matches" : "skips";
    it(`${verb}: ${fx.name}`, () => {
      expect(doneMatched.has(slugify(fx.name))).toBe(fx.expect === "match");
    });
  }
});

// ─── helpers ──────────────────────────────────────────────────────────────
async function writeFixtures(fixtures: Fixture[], prefix: string): Promise<{ tempDir: string; paths: string[] }> {
  const tempDir = await mkdtemp(join(tmpdir(), prefix));
  const paths: string[] = [];
  const seen = new Set<string>();
  for (const fx of fixtures) {
    const slug = slugify(fx.name);
    if (seen.has(slug)) throw new Error(`Duplicate fixture name (slugged): "${fx.name}"`);
    seen.add(slug);
    const path = join(tempDir, `${slug}.md`);
    const content = fx.content.endsWith("\n") ? fx.content : fx.content + "\n";
    await writeFile(path, content);
    paths.push(path);
  }
  return { tempDir, paths };
}

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
