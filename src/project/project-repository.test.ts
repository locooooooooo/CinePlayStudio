import { describe, expect, it } from "vitest";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { invalidProjectFixtures } from "./project-fixtures/invalid-projects";
import { cloneValidProjectDocument } from "./project-fixtures/valid-project";
import {
  ProjectRepository,
  type ProjectStoragePort,
} from "./project-repository";

class MemoryStorage implements ProjectStoragePort {
  readonly files = new Map<string, string>();
  failWrites = false;
  failRenames = false;
  maxConcurrentWrites = 0;
  private activeWrites = 0;

  async ensureDirectory(_directoryPath: string): Promise<void> {}

  async exists(filePath: string): Promise<boolean> {
    return this.files.has(filePath);
  }

  async readFile(filePath: string): Promise<string> {
    const value = this.files.get(filePath);
    if (value === undefined) throw new Error("missing");
    return value;
  }

  async writeFile(filePath: string, content: string): Promise<void> {
    this.activeWrites += 1;
    this.maxConcurrentWrites = Math.max(
      this.maxConcurrentWrites,
      this.activeWrites,
    );
    try {
      await Promise.resolve();
      if (this.failWrites) throw new Error("write failed");
      this.files.set(filePath, content);
    } finally {
      this.activeWrites -= 1;
    }
  }

  async copyFile(source: string, destination: string): Promise<void> {
    this.files.set(destination, await this.readFile(source));
  }

  async rename(source: string, destination: string): Promise<void> {
    await Promise.resolve();
    if (this.failRenames) throw new Error("rename failed");
    this.files.set(destination, await this.readFile(source));
    this.files.delete(source);
  }

  async removeFile(filePath: string): Promise<void> {
    this.files.delete(filePath);
  }
}

function projectFile(root: string): string {
  return path.join(path.resolve(root), "project.json");
}

function recoveryFile(root: string): string {
  return path.join(path.resolve(root), "project.previous.json");
}

function temporaryFiles(storage: MemoryStorage): string[] {
  return [...storage.files.keys()].filter(
    (filePath) =>
      filePath.includes(".project.json.") && filePath.endsWith(".tmp"),
  );
}

function updatedProject(modifiedAt: string, name: string) {
  const project = cloneValidProjectDocument();
  project.modifiedAt = modifiedAt;
  project.name = name;
  return project;
}

function createFileStorage(): ProjectStoragePort {
  return {
    ensureDirectory: (directoryPath) =>
      fs.mkdir(directoryPath, { recursive: true }).then(() => undefined),
    exists: async (filePath) =>
      fs
        .access(filePath)
        .then(() => true)
        .catch(() => false),
    readFile: (filePath) => fs.readFile(filePath, "utf8"),
    writeFile: (filePath, content) => fs.writeFile(filePath, content, "utf8"),
    copyFile: (source, destination) =>
      fs.copyFile(source, destination).then(() => undefined),
    rename: (source, destination) => fs.rename(source, destination),
    removeFile: (filePath) => fs.rm(filePath, { force: true }),
  };
}

describe("ProjectRepository", () => {
  it("creates, opens, saves, reloads, and round-trips deterministically", async () => {
    const storage = new MemoryStorage();
    const repository = new ProjectRepository(storage);
    const root = "C:\\projects\\demo";
    const document = cloneValidProjectDocument();

    expect(await repository.open(root)).toMatchObject({
      ok: false,
      code: "PROJECT_NOT_FOUND",
    });

    const created = await repository.create(root, document);
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    expect(created.value.revision).toMatch(/^sha256:/);
    expect(created.value.recoveryPath).toBe(recoveryFile(root));
    expect(storage.files.get(projectFile(root))).toBe(
      JSON.stringify(created.value.document, null, 2),
    );

    const opened = await repository.open(root);
    expect(opened).toEqual(created);

    const updated = updatedProject("2026-08-05T00:00:00Z", "Updated Edit");
    const saved = await repository.save(root, updated, created.value.revision);
    expect(saved.ok).toBe(true);
    if (!saved.ok) return;

    expect(saved.value.revision).not.toBe(created.value.revision);
    const reloaded = await repository.reload(root);
    expect(reloaded).toEqual(saved);
    expect(reloaded.ok && reloaded.value.document).toEqual(updated);

    expect(
      await repository.save(root, document, created.value.revision),
    ).toMatchObject({ ok: false, code: "REVISION_CONFLICT" });
    expect(await repository.create(root, document)).toMatchObject({
      ok: false,
      code: "PROJECT_ALREADY_EXISTS",
    });
  });

  it("serializes concurrent saves and prevents an old completion from overwriting a new revision", async () => {
    const storage = new MemoryStorage();
    const repository = new ProjectRepository(storage);
    const root = "C:\\projects\\concurrent";
    const created = await repository.create(root, cloneValidProjectDocument());
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const firstDocument = updatedProject("2026-08-05T00:02:00Z", "First Save");
    const secondDocument = updatedProject(
      "2026-08-05T00:03:00Z",
      "Second Save",
    );
    const firstSave = repository.save(
      root,
      firstDocument,
      created.value.revision,
    );
    const secondSave = repository.save(
      root,
      secondDocument,
      created.value.revision,
    );
    const [firstResult, secondResult] = await Promise.all([
      firstSave,
      secondSave,
    ]);

    expect(firstResult.ok).toBe(true);
    expect(secondResult).toMatchObject({
      ok: false,
      code: "REVISION_CONFLICT",
    });
    expect(storage.maxConcurrentWrites).toBe(1);

    const finalSnapshot = await repository.reload(root);
    expect(finalSnapshot.ok).toBe(true);
    if (!finalSnapshot.ok || !firstResult.ok) return;
    expect(finalSnapshot.value.document).toEqual(firstDocument);
    expect(finalSnapshot.value.revision).toBe(firstResult.value.revision);
  });

  it("rejects invalid documents and paths without creating a project", async () => {
    for (const fixture of Object.values(invalidProjectFixtures)) {
      const storage = new MemoryStorage();
      const repository = new ProjectRepository(storage);
      const result = await repository.create("C:\\projects\\invalid", fixture);

      expect(result).toMatchObject({ ok: false, code: "PROJECT_INVALID" });
      expect(storage.files.has(projectFile("C:\\projects\\invalid"))).toBe(
        false,
      );
    }

    const storage = new MemoryStorage();
    const repository = new ProjectRepository(storage);
    for (const invalidRoot of [
      "relative\\project",
      "\\root-relative\\project",
      "/root-relative/project",
    ]) {
      expect(await repository.open(invalidRoot)).toMatchObject({
        ok: false,
        code: "PROJECT_INVALID",
      });
    }

    const root = "C:\\projects\\invalid-input";
    const created = await repository.create(root, cloneValidProjectDocument());
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    expect(
      await repository.save(root, cloneValidProjectDocument(), ""),
    ).toMatchObject({ ok: false, code: "PROJECT_INVALID" });
    expect(
      await repository.save(root, null, created.value.revision),
    ).toMatchObject({ ok: false, code: "PROJECT_INVALID" });
  });

  it("rejects damaged and unknown higher-version project files on reload", async () => {
    const storage = new MemoryStorage();
    const repository = new ProjectRepository(storage);
    const root = "C:\\projects\\damaged";
    const filePath = projectFile(root);

    storage.files.set(filePath, "{not-json");
    expect(await repository.open(root)).toMatchObject({
      ok: false,
      code: "PROJECT_INVALID",
    });

    storage.files.set(
      filePath,
      JSON.stringify(invalidProjectFixtures.unsupportedHigherSchemaVersion),
    );
    const result = await repository.reload(root);
    expect(result).toMatchObject({
      ok: false,
      code: "PROJECT_INVALID",
    });
    if ("message" in result) {
      expect(result.message).toContain("unsupported schema version");
    }
  });

  it("preserves the last successful version and recovery path after a write failure", async () => {
    const storage = new MemoryStorage();
    const repository = new ProjectRepository(storage);
    const root = "C:\\projects\\recovery";
    const created = await repository.create(root, cloneValidProjectDocument());
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const before = await storage.readFile(projectFile(root));
    storage.failWrites = true;
    const failed = await repository.save(
      root,
      updatedProject("2026-08-05T00:04:00Z", "Failed Save"),
      created.value.revision,
    );

    expect(failed).toMatchObject({ ok: false, code: "WRITE_FAILED" });
    expect(await storage.readFile(projectFile(root))).toBe(before);
    expect(await storage.readFile(recoveryFile(root))).toBe(before);
    expect(temporaryFiles(storage)).toEqual([]);

    const recovered = await repository.reload(root);
    expect(recovered).toEqual(created);

    storage.failWrites = false;
    const saved = await repository.save(
      root,
      updatedProject("2026-08-05T00:05:00Z", "Recovered Save"),
      created.value.revision,
    );
    expect(saved.ok).toBe(true);
  });

  it("cleans the temporary file when atomic replacement fails", async () => {
    const storage = new MemoryStorage();
    const repository = new ProjectRepository(storage);
    const root = "C:\\projects\\rename-failure";
    const created = await repository.create(root, cloneValidProjectDocument());
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const before = await storage.readFile(projectFile(root));
    storage.failRenames = true;
    const failed = await repository.save(
      root,
      updatedProject("2026-08-05T00:06:00Z", "Rename Failure"),
      created.value.revision,
    );

    expect(failed).toMatchObject({ ok: false, code: "WRITE_FAILED" });
    expect(await storage.readFile(projectFile(root))).toBe(before);
    expect(await storage.readFile(recoveryFile(root))).toBe(before);
    expect(temporaryFiles(storage)).toEqual([]);
  });

  it("round-trips create and save through a real user-owned directory", async () => {
    const root = await fs.mkdtemp(
      path.join(os.tmpdir(), "cineplaystudio-project-"),
    );

    try {
      const repository = new ProjectRepository(createFileStorage());
      const created = await repository.create(
        root,
        cloneValidProjectDocument(),
      );
      expect(created.ok).toBe(true);
      if (!created.ok) return;

      const updated = updatedProject(
        "2026-08-05T00:07:00Z",
        "Real Directory Save",
      );
      const saved = await repository.save(
        root,
        updated,
        created.value.revision,
      );
      expect(saved.ok).toBe(true);

      const reloaded = await repository.reload(root);
      expect(reloaded).toEqual(saved);
      expect(
        JSON.parse(await fs.readFile(path.join(root, "project.json"), "utf8")),
      ).toEqual(updated);
    } finally {
      await fs.rm(root, { recursive: true, force: true });
    }
  });
});
