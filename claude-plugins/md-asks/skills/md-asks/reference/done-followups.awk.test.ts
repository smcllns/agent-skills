import { describe, expect, it } from "bun:test";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { fileURLToPath } from "node:url";

const AWK_PATH = fileURLToPath(new URL("./done-followups.awk", import.meta.url));

describe("done-followups.awk", () => {
  it("reports DONE callouts where a human spoke last", async () => {
    const lines = await runScanner({
      "human-last.md": [
        "> [!DONE]- tightened intro",
        ">",
        "> @claude tighten the intro",
        ">",
        "> @claude: done, tightened it.",
        ">",
        "> @sam: one more tweak please",
      ].join("\n"),
    });

    expect(lines).toEqual(["human-last.md:7"]);
  });

  it("skips DONE callouts where an agent spoke last", async () => {
    const lines = await runScanner({
      "agent-last.md": [
        "> [!DONE]- tightened intro",
        ">",
        "> @claude tighten the intro",
        ">",
        "> @sam: one more tweak please",
        ">",
        "> @claude: done, tightened it again.",
      ].join("\n"),
    });

    expect(lines).toEqual([]);
  });

  it("ignores active and plain done callouts", async () => {
    const lines = await runScanner({
      "not-canonical-done.md": [
        "> [!NOTE]+ open thread",
        "> @sam: still needs work",
        "",
        "> [!DONE] plain done callout",
        "> @sam: not an agent thread",
        "",
        "> [!DONE]+ plain done callout",
        "> @sam: not an agent thread",
      ].join("\n"),
    });

    expect(lines).toEqual([]);
  });

  it("uses the caller-provided agent list", async () => {
    const lines = await runScanner(
      {
        "custom-agent.md": [
          "> [!DONE]- patched note",
          ">",
          "> @sam: can you make one more change?",
          ">",
          "> @pi: done, made the change.",
        ].join("\n"),
      },
      "agent claude codex pi",
    );

    expect(lines).toEqual([]);
  });

  it("reports multiple files independently", async () => {
    const lines = await runScanner({
      "first.md": [
        "> [!DONE]- first",
        ">",
        "> @claude: done.",
        ">",
        "> @sam: follow up",
      ].join("\n"),
      "second.md": [
        "intro",
        "",
        "> [!DONE]- second",
        ">",
        "> @codex: done.",
        ">",
        "> @human: follow up",
      ].join("\n"),
    });

    expect(lines).toEqual(["first.md:5", "second.md:7"]);
  });

  it("reports multiple DONE callouts in one file independently", async () => {
    const lines = await runScanner({
      "same-file.md": [
        "> [!DONE]- first",
        ">",
        "> @claude: done.",
        ">",
        "> @sam: follow up",
        "",
        "> [!DONE]- second",
        ">",
        "> @codex: done.",
        ">",
        "> @alex: follow up",
        "",
        "> [!DONE]- third",
        ">",
        "> @sam: another follow up",
        ">",
        "> @claude: handled it.",
      ].join("\n"),
    });

    expect(lines).toEqual(["same-file.md:5", "same-file.md:11"]);
  });
});

async function runScanner(files: Record<string, string>, agents?: string): Promise<string[]> {
  const tempDir = await mkdtemp(join(tmpdir(), "md-asks-done-followups-"));

  try {
    const paths: string[] = [];
    for (const [name, content] of Object.entries(files)) {
      const path = join(tempDir, name);
      await writeFile(path, content.endsWith("\n") ? content : content + "\n");
      paths.push(path);
    }

    const cmd = ["awk"];
    if (agents) cmd.push("-v", `agents=${agents}`);
    cmd.push("-f", AWK_PATH, ...paths);

    const proc = Bun.spawnSync({
      cmd,
      stdout: "pipe",
      stderr: "pipe",
    });

    if (proc.exitCode !== 0) {
      throw new Error(`awk failed (exit ${proc.exitCode}): ${new TextDecoder().decode(proc.stderr)}`);
    }

    return new TextDecoder().decode(proc.stdout)
      .trim()
      .split("\n")
      .filter(Boolean)
      .map((line) => {
        const [path, lineNumber] = line.split(":");
        return `${basename(path)}:${lineNumber}`;
      });
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}
