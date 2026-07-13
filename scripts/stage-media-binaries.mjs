import { createRequire } from "node:module";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const require = createRequire(import.meta.url);
const root = process.cwd();
const destination = path.join(root, "build-resources", "bin", "win32-x64");

async function resolveBinary(packageName, exportValue) {
  const value = exportValue ?? require(packageName);
  const candidate = typeof value === "string" ? value : value?.path;
  if (!candidate) {
    throw new Error(`Unable to resolve binary path from ${packageName}`);
  }
  return path.resolve(candidate);
}

async function stage(source, target) {
  const stat = await fs.stat(source);
  if (!stat.isFile() || stat.size < 1024) {
    throw new Error(`Binary is missing or unexpectedly small: ${source}`);
  }
  await fs.copyFile(source, path.join(destination, target));
}

await fs.rm(destination, { recursive: true, force: true });
await fs.mkdir(destination, { recursive: true });
await stage(await resolveBinary("ffmpeg-static"), "ffmpeg.exe");
await stage(await resolveBinary("ffprobe-static"), "ffprobe.exe");

for (const packageName of ["ffmpeg-static", "ffprobe-static"]) {
  let copiedLicense = false;
  for (const license of ["LICENSE", "LICENSE.txt"]) {
    try {
      const packageRoot = path.dirname(
        require.resolve(`${packageName}/package.json`),
      );
      const source = path.join(packageRoot, license);
      await fs.copyFile(
        source,
        path.join(destination, `${packageName}-${license}`),
      );
      copiedLicense = true;
      break;
    } catch {
      // License filenames differ between binary packages; continue probing.
    }
  }
  if (!copiedLicense)
    throw new Error(`No license file found for ${packageName}`);
}

for (const suffix of ["LICENSE", "README"]) {
  try {
    const source = `${await resolveBinary("ffmpeg-static")}.${suffix}`;
    await fs.copyFile(
      source,
      path.join(destination, `ffmpeg-binary-${suffix}`),
    );
  } catch {
    // The package license is mandatory above; binary-specific notices are best effort.
  }
}

console.log(`Staged media binaries in ${destination}`);
