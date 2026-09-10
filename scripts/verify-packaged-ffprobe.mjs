import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import process from "node:process";

function run(file, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(file, args, { shell: false, windowsHide: true });
    let stdout = "";
    let stderr = "";
    child.stdout?.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr?.on("data", (chunk) => {
      stderr += chunk;
    });
    child.once("error", reject);
    child.once("close", (code, signal) =>
      resolve({ code, signal, stdout, stderr }),
    );
  });
}

function option(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

const root = process.cwd();
const binary =
  option("--binary") ??
  process.env.CINEPLAYSTUDIO_FFPROBE ??
  path.join(root, "release", "win-unpacked", "resources", "bin", "ffprobe.exe");
const ffmpeg =
  option("--ffmpeg") ??
  process.env.CINEPLAYSTUDIO_FFMPEG ??
  path.join(root, "release", "win-unpacked", "resources", "bin", "ffmpeg.exe");
const fixture = option("--fixture");
const tempRoot = await fs.mkdtemp(
  path.join(os.tmpdir(), "CinePlayStudio FFprobe 中文 空格-"),
);
const input = fixture
  ? path.resolve(fixture)
  : path.join(tempRoot, "样例 video 中文 空格.mp4");

try {
  const version = await run(binary, ["-version"]);
  if (version.code !== 0)
    throw new Error(
      `ffprobe -version failed (${version.code}): ${version.stderr.slice(0, 500)}`,
    );

  if (!fixture) {
    const generated = await run(ffmpeg, [
      "-hide_banner",
      "-loglevel",
      "error",
      "-f",
      "lavfi",
      "-i",
      "color=c=black:s=16x16:d=0.1",
      "-y",
      input,
    ]);
    if (generated.code !== 0)
      throw new Error(
        `Unable to create Chinese/spaced fixture: ${generated.stderr.slice(0, 500)}`,
      );
  }

  const probe = await run(binary, [
    "-v",
    "error",
    "-print_format",
    "json",
    "-show_format",
    "-show_streams",
    input,
  ]);
  if (probe.code !== 0)
    throw new Error(
      `ffprobe failed (${probe.code}): ${probe.stderr.slice(0, 500)}`,
    );
  const metadata = JSON.parse(probe.stdout);
  if (!Array.isArray(metadata.streams) || metadata.streams.length === 0)
    throw new Error("ffprobe returned no streams");
  console.log(
    JSON.stringify({
      ok: true,
      binary,
      input,
      streamCount: metadata.streams.length,
    }),
  );
} finally {
  if (process.env.CINEPLAYSTUDIO_KEEP_FFPROBE_FIXTURE !== "1")
    await fs.rm(tempRoot, { recursive: true, force: true });
}
