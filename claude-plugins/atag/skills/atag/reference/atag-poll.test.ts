import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { chmod, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { realpathSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const SCRIPT = new URL("../scripts/atag-poll.sh", import.meta.url).pathname;

let tempDir = "";
let binDir = "";
let fixtureDir = "";
let logPath = "";

beforeEach(async () => {
  tempDir = await mkdtemp(join(tmpdir(), "atag-poll-"));
  binDir = join(tempDir, "bin");
  fixtureDir = join(tempDir, "fixture");
  logPath = join(tempDir, "claude.log");
  await mkdir(binDir);
  await mkdir(fixtureDir);
});

afterEach(async () => {
  if (tempDir) await rm(tempDir, { recursive: true, force: true });
});

describe("atag-poll", () => {
  it("prints the startup line and does not invoke Claude when no tags match", async () => {
    await installClaudeStub();
    await writeFile(join(fixtureDir, "note.md"), "plain markdown\n");

    const result = runPoll(["--once", "--dir", fixtureDir]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toBe(`Watching for @agent, @claude, @codex agent tags in ${realpathSync(fixtureDir)}...\n\n`);
    expect(result.stderr).toBe("");
    expect(await readLog()).toBe("");
  });

  it("prints one debug no-match status line after startup", async () => {
    await installClaudeStub();
    await writeFile(join(fixtureDir, "note.md"), "plain markdown\n");

    const result = runPoll(["--once", "--debug", "--dir", fixtureDir]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toMatch(
      new RegExp(
        [
          `^Watching for @agent, @claude, @codex agent tags in ${escapeRegExp(realpathSync(fixtureDir))}\\.\\.\\.`,
          "",
          "\\[[0-9]{2}:[0-9]{2}\\]  No @agent, @claude, @codex agent tags detected",
          "$",
        ].join("\n"),
      ),
    );
    expect(result.stderr).toBe("");
    expect(await readLog()).toBe("");
  });

  it("invokes Claude from the target directory when a default trigger matches", async () => {
    await installClaudeStub({ stdout: "claude output\n" });
    await writeFile(join(fixtureDir, "note.md"), "@codex please help\n");

    const result = runPoll(["--once", "--dir", fixtureDir]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toBe(`Watching for @agent, @claude, @codex agent tags in ${realpathSync(fixtureDir)}...\n\nclaude output\n`);
    const log = await readLog();
    expect(log).toContain(`cwd=${realpathSync(fixtureDir)}`);
    expect(log).toContain("arg=-p");
    expect(log).toContain("arg=--model");
    expect(log).toContain("arg=sonnet");
    expect(log).toContain("arg=--permission-mode");
    expect(log).toContain("arg=acceptEdits");
    expect(log).toContain("Use the atag skill");
  });

  it("does not invoke Claude when active NOTE threads are waiting on the human", async () => {
    await installClaudeStub();
    await writeFile(
      join(fixtureDir, "note.md"),
      [
        "> [!NOTE]+ awaiting direction",
        ">",
        "> @claude make this better",
        ">",
        "> `claude` Which direction should I take it? <!--atag:eot-->",
        "",
        "> [!NOTE]+ legacy agent-last thread",
        ">",
        "> @claude draft a headline",
        ">",
        "> `claude` What benefit should the headline emphasize?",
        "",
        "> [!NOTE]+ legacy colon agent-last thread",
        ">",
        "> @claude draft a headline",
        ">",
        "> `claude`: What benefit should the headline emphasize?",
        "",
      ].join("\n"),
    );

    const result = runPoll(["--once", "--debug", "--dir", fixtureDir]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toMatch(/\[[0-9]{2}:[0-9]{2}\]  No @agent, @claude, @codex agent tags detected\n?$/);
    expect(result.stderr).toBe("");
    expect(await readLog()).toBe("");
  });

  it("invokes Claude when a human replies after an active NOTE agent turn", async () => {
    await installClaudeStub({ stdout: "note scan\n" });
    await writeFile(
      join(fixtureDir, "note.md"),
      [
        "> [!NOTE]+ awaiting direction",
        ">",
        "> @claude make this better",
        ">",
        "> `claude` Which direction should I take it? <!--atag:eot-->",
        ">",
        "> *`sam`* make it more concrete",
        "",
      ].join("\n"),
    );

    const result = runPoll(["--once", "--dir", fixtureDir]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("note scan\n");
    expect(await readLog()).toContain("note.md");
  });

  it("does not invoke Claude for a label-only prefilled human reply line", async () => {
    await installClaudeStub();
    await writeFile(
      join(fixtureDir, "note.md"),
      [
        "> [!NOTE]+ awaiting direction",
        ">",
        "> *`sam`* @claude make this better",
        ">",
        "> `claude` Which direction should I take it? <!--atag:eot-->",
        ">",
        "> *`sam`* ",
        "",
      ].join("\n"),
    );

    const result = runPoll(["--once", "--debug", "--dir", fixtureDir]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toMatch(/\[[0-9]{2}:[0-9]{2}\]  No @agent, @claude, @codex agent tags detected\n?$/);
    expect(result.stderr).toBe("");
    expect(await readLog()).toBe("");
  });

  it("invokes Claude when a human types after a prefilled reply label", async () => {
    await installClaudeStub({ stdout: "prefill reply scan\n" });
    await writeFile(
      join(fixtureDir, "note.md"),
      [
        "> [!NOTE]+ awaiting direction",
        ">",
        "> *`sam`* @claude make this better",
        ">",
        "> `claude` Which direction should I take it? <!--atag:eot-->",
        ">",
        "> *`sam`* make it more concrete",
        "",
      ].join("\n"),
    );

    const result = runPoll(["--once", "--dir", fixtureDir]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("prefill reply scan\n");
    expect(await readLog()).toContain("note.md");
  });

  it("does not invoke custom-trigger runs for default-trigger active NOTE threads", async () => {
    await installClaudeStub();
    await writeFile(
      join(fixtureDir, "note.md"),
      [
        "> [!NOTE]+ waiting on codex",
        ">",
        "> @codex please help",
        ">",
        "> *`sam`* one more thing",
        "",
      ].join("\n"),
    );

    const result = runPoll(["--once", "--dir", fixtureDir, "@pi"]);

    expect(result.exitCode).toBe(0);
    expect(await readLog()).toBe("");
  });

  it("adds terminal response-style instructions when requested", async () => {
    await installClaudeStub();
    await writeFile(join(fixtureDir, "note.md"), "@codex please help\n");

    const result = runPoll(["--once", "--dir", fixtureDir, "--response-style", "terminal"]);

    expect(result.exitCode).toBe(0);
    expect(await readLog()).toContain("Response style: terminal plain text");
  });

  it("adds markdown response-style instructions when requested", async () => {
    await installClaudeStub();
    await writeFile(join(fixtureDir, "note.md"), "@codex please help\n");

    const result = runPoll(["--once", "--dir", fixtureDir, "--response-style", "markdown"]);

    expect(result.exitCode).toBe(0);
    expect(await readLog()).toContain("Response style: Markdown");
  });

  it("separates debug match and invocation output with blank lines", async () => {
    await installClaudeStub({ stdout: "claude output\n" });
    await writeFile(join(fixtureDir, "note.md"), "@codex please help\n");

    const result = runPoll(["--once", "--debug", "--dir", fixtureDir]);

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toContain(`for @agent, @claude, @codex\n\natag-poll: match ${realpathSync(fixtureDir)}/note.md\n`);
    expect(result.stderr).toContain("\natag-poll: invoking claude ");
    expect(result.stderr).toEndWith("\n\n");
  });

  it("lets custom triggers replace the default triggers", async () => {
    await installClaudeStub();
    await writeFile(join(fixtureDir, "note.md"), "@codex default only\n");

    const result = runPoll(["--once", "--dir", fixtureDir, "@pi"]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toBe(`Watching for @pi agent tags in ${realpathSync(fixtureDir)}...\n\n`);
    expect(result.stderr).toBe("");
    expect(await readLog()).toBe("");
  });

  it("accepts comma-separated custom triggers with optional whitespace", async () => {
    await installClaudeStub({ stdout: "matched\n" });
    await writeFile(join(fixtureDir, "note.md"), "@pi custom\n");

    const result = runPoll(["--once", "--dir", fixtureDir, "@agento,", "@pi"]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toBe(`Watching for @agento, @pi agent tags in ${realpathSync(fixtureDir)}...\n\nmatched\n`);
    expect(await readLog()).toContain("@agento, @pi");
  });

  it("rejects whitespace-separated custom triggers", async () => {
    await installClaudeStub();

    const result = runPoll(["--once", "--dir", fixtureDir, "@agento", "@pi"]);

    expect(result.exitCode).toBe(2);
    expect(result.stderr).toContain("invalid trigger list");
    expect(await readLog()).toBe("");
  });

  it("invokes Claude for unsealed DONE follow-ups", async () => {
    await installClaudeStub({ stdout: "done scan\n" });
    await writeFile(
      join(fixtureDir, "note.md"),
      [
        "> [!DONE]- tightened intro",
        ">",
        "> @claude tighten the intro",
        ">",
        "> `claude` done. <!--atag:eot-->",
        "> one more tweak",
        "",
      ].join("\n"),
    );

    const result = runPoll(["--once", "--dir", fixtureDir]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toBe(`Watching for @agent, @claude, @codex agent tags in ${realpathSync(fixtureDir)}...\n\ndone scan\n`);
    expect(await readLog()).toContain("note.md");
  });

  it("passes through Claude args after -- and lets them override defaults", async () => {
    await installClaudeStub();
    await writeFile(join(fixtureDir, "note.md"), "@codex please help\n");

    const result = runPoll(["--once", "--dir", fixtureDir, "--", "--model", "opus", "--max-budget-usd", "1"]);

    expect(result.exitCode).toBe(0);
    const log = await readLog();
    expect(log).toContain("arg=--max-budget-usd");
    expect(log).toContain("arg=1");
    expect(log).toContain("arg=opus");
  });

  it("propagates Claude failures", async () => {
    await installClaudeStub({ stdout: "partial\n", stderr: "boom\n", exitCode: 7 });
    await writeFile(join(fixtureDir, "note.md"), "@codex please help\n");

    const result = runPoll(["--once", "--dir", fixtureDir]);

    expect(result.exitCode).toBe(7);
    expect(result.stdout).toBe(`Watching for @agent, @claude, @codex agent tags in ${realpathSync(fixtureDir)}...\n\npartial\n`);
    expect(result.stderr).toBe("boom\n");
  });
});

function runPoll(args: string[]) {
  const proc = Bun.spawnSync({
    cmd: [SCRIPT, ...args],
    env: {
      ...process.env,
      PATH: `${binDir}:${process.env.PATH ?? ""}`,
      ATAG_POLL_LOG: logPath,
    },
    stdout: "pipe",
    stderr: "pipe",
  });
  return {
    exitCode: proc.exitCode,
    stdout: new TextDecoder().decode(proc.stdout),
    stderr: new TextDecoder().decode(proc.stderr),
  };
}

async function installClaudeStub(options: { stdout?: string; stderr?: string; exitCode?: number } = {}) {
  const stdout = JSON.stringify(options.stdout ?? "");
  const stderr = JSON.stringify(options.stderr ?? "");
  const exitCode = options.exitCode ?? 0;
  const stub = `#!/usr/bin/env bash
set -euo pipefail
{
  printf 'cwd=%s\\n' "$PWD"
  for arg in "$@"; do printf 'arg=%s\\n' "$arg"; done
} >> "$ATAG_POLL_LOG"
printf '%b' ${stdout}
printf '%b' ${stderr} >&2
exit ${exitCode}
`;
  const path = join(binDir, "claude");
  await writeFile(path, stub);
  await chmod(path, 0o755);
}

async function readLog(): Promise<string> {
  try {
    return await readFile(logPath, "utf8");
  } catch {
    return "";
  }
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
