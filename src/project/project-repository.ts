import { createHash, randomUUID } from "node:crypto";
import path from "node:path";
import {
  safeParseProjectDocument,
  type ProjectDocument,
} from "../../shared/contracts/project";

export type ProjectRepositoryErrorCode =
  | "PROJECT_NOT_FOUND"
  | "PROJECT_ALREADY_EXISTS"
  | "PROJECT_INVALID"
  | "REVISION_CONFLICT"
  | "WRITE_FAILED";

export type ProjectRepositoryResult<T> =
  | { ok: true; value: T }
  | { ok: false; code: ProjectRepositoryErrorCode; message: string };

export interface ProjectSnapshot {
  readonly document: ProjectDocument;
  readonly revision: string;
  readonly recoveryPath: string;
}

export interface ProjectStoragePort {
  ensureDirectory(directoryPath: string): Promise<void>;
  exists(filePath: string): Promise<boolean>;
  readFile(filePath: string): Promise<string>;
  writeFile(filePath: string, content: string): Promise<void>;
  copyFile(source: string, destination: string): Promise<void>;
  rename(source: string, destination: string): Promise<void>;
  removeFile(filePath: string): Promise<void>;
}

const PROJECT_FILE = "project.json";
const BACKUP_FILE = "project.previous.json";
const projectWriteLocks = new Map<string, Promise<void>>();

export class ProjectRepository {
  constructor(private readonly storage: ProjectStoragePort) {}

  async create(
    projectRoot: unknown,
    document: unknown,
  ): Promise<ProjectRepositoryResult<ProjectSnapshot>> {
    const root = normalizeProjectRoot(projectRoot);
    if (isFailure(root)) return failure(root.code, root.message);

    return withProjectWriteLock(root.value, async () => {
      const projectFile = this.projectFile(root.value);
      if (await this.storage.exists(projectFile)) {
        return failure(
          "PROJECT_ALREADY_EXISTS",
          "A project already exists in this directory.",
        );
      }

      await this.removeIfPresent(this.backupFile(root.value));
      return this.writeDocument(root.value, document, false);
    });
  }

  async open(
    projectRoot: unknown,
  ): Promise<ProjectRepositoryResult<ProjectSnapshot>> {
    const root = normalizeProjectRoot(projectRoot);
    if (isFailure(root)) return failure(root.code, root.message);
    return this.readSnapshot(root.value);
  }

  async reload(
    projectRoot: unknown,
  ): Promise<ProjectRepositoryResult<ProjectSnapshot>> {
    return this.open(projectRoot);
  }

  async save(
    projectRoot: unknown,
    document: unknown,
    expectedRevision: unknown,
  ): Promise<ProjectRepositoryResult<ProjectSnapshot>> {
    const root = normalizeProjectRoot(projectRoot);
    if (isFailure(root)) return failure(root.code, root.message);

    const revision = normalizeRevision(expectedRevision);
    if (isFailure(revision)) return failure(revision.code, revision.message);

    return withProjectWriteLock(root.value, async () => {
      const current = await this.readSnapshot(root.value);
      if (!current.ok) return current;

      if (current.value.revision !== revision.value) {
        return failure(
          "REVISION_CONFLICT",
          "The project changed before this save completed.",
        );
      }

      return this.writeDocument(root.value, document, true);
    });
  }

  private async readSnapshot(
    projectRoot: string,
  ): Promise<ProjectRepositoryResult<ProjectSnapshot>> {
    const projectFile = this.projectFile(projectRoot);
    if (!(await this.storage.exists(projectFile))) {
      return failure(
        "PROJECT_NOT_FOUND",
        "project.json was not found in this directory.",
      );
    }

    try {
      const content = await this.storage.readFile(projectFile);
      const parsed = parseProjectDocument(content);
      if (isFailure(parsed)) return failure(parsed.code, parsed.message);

      return success(
        this.snapshot(
          projectRoot,
          parsed.value.document,
          parsed.value.revision,
        ),
      );
    } catch {
      if (!(await this.storage.exists(projectFile))) {
        return failure(
          "PROJECT_NOT_FOUND",
          "project.json was not found in this directory.",
        );
      }

      return failure(
        "PROJECT_INVALID",
        "project.json could not be read as a valid project document.",
      );
    }
  }

  private async writeDocument(
    projectRoot: string,
    document: unknown,
    preserveCurrent: boolean,
  ): Promise<ProjectRepositoryResult<ProjectSnapshot>> {
    const parsed = validateDocument(document);
    if (isFailure(parsed)) return failure(parsed.code, parsed.message);

    const projectFile = this.projectFile(projectRoot);
    const backupFile = this.backupFile(projectRoot);
    const temporaryFile = this.temporaryProjectFile(projectRoot);
    const content = JSON.stringify(parsed.value, null, 2);

    try {
      await this.storage.ensureDirectory(projectRoot);

      if (preserveCurrent) {
        if (!(await this.storage.exists(projectFile))) {
          return failure(
            "PROJECT_NOT_FOUND",
            "project.json was not found in this directory.",
          );
        }
        await this.storage.copyFile(projectFile, backupFile);
      }

      await this.storage.writeFile(temporaryFile, content);
      await this.storage.rename(temporaryFile, projectFile);

      return success(
        this.snapshot(projectRoot, parsed.value, revisionForContent(content)),
      );
    } catch {
      try {
        await this.storage.removeFile(temporaryFile);
      } catch {
        // Temporary cleanup is best effort; the last successful file stays untouched.
      }

      if (preserveCurrent && !(await this.storage.exists(projectFile))) {
        return failure(
          "PROJECT_NOT_FOUND",
          "project.json was not found in this directory.",
        );
      }

      return failure(
        "WRITE_FAILED",
        "The project was not saved. The previous version remains recoverable.",
      );
    }
  }

  private async removeIfPresent(filePath: string): Promise<void> {
    if (!(await this.storage.exists(filePath))) return;
    try {
      await this.storage.removeFile(filePath);
    } catch {
      // A stale recovery file must not prevent a new project from being created.
    }
  }

  private snapshot(
    projectRoot: string,
    document: ProjectDocument,
    revision: string,
  ): ProjectSnapshot {
    return {
      document,
      revision,
      recoveryPath: this.backupFile(projectRoot),
    };
  }

  private projectFile(projectRoot: string): string {
    return resolveWithinProjectRoot(projectRoot, PROJECT_FILE);
  }

  private backupFile(projectRoot: string): string {
    return resolveWithinProjectRoot(projectRoot, BACKUP_FILE);
  }

  private temporaryProjectFile(projectRoot: string): string {
    return resolveWithinProjectRoot(
      projectRoot,
      "." + PROJECT_FILE + "." + randomUUID() + ".tmp",
    );
  }
}

function normalizeProjectRoot(value: unknown): ProjectRepositoryResult<string> {
  if (typeof value !== "string" || value.trim() === "") {
    return failure(
      "PROJECT_INVALID",
      "projectRoot must be a non-empty absolute directory path.",
    );
  }

  if (!isAbsoluteDirectoryPath(value)) {
    return failure(
      "PROJECT_INVALID",
      "projectRoot must be an absolute directory path.",
    );
  }

  return success(path.resolve(value));
}

function normalizeRevision(value: unknown): ProjectRepositoryResult<string> {
  if (typeof value !== "string" || value.trim() === "") {
    return failure(
      "PROJECT_INVALID",
      "expectedRevision must be a non-empty revision string.",
    );
  }

  return success(value);
}

function isAbsoluteDirectoryPath(value: string): boolean {
  if (!path.isAbsolute(value)) return false;
  if (path.sep !== "\\") return true;

  const root = path.parse(value).root;
  return /^[A-Za-z]:\\$/.test(root) || root.startsWith("\\\\");
}

function resolveWithinProjectRoot(
  projectRoot: string,
  childName: string,
): string {
  const candidate = path.resolve(projectRoot, childName);
  const relative = path.relative(projectRoot, candidate);
  if (
    relative.startsWith("..") ||
    path.isAbsolute(relative) ||
    relative === ""
  ) {
    throw new Error("Resolved project path escaped the project root.");
  }
  return candidate;
}

function parseProjectDocument(content: string): ProjectRepositoryResult<{
  document: ProjectDocument;
  revision: string;
}> {
  try {
    const parsedJson: unknown = JSON.parse(content);
    const parsed = safeParseProjectDocument(parsedJson);
    if ("error" in parsed) {
      const unsupportedVersion = parsed.error.issues.some(
        (issue) => issue.message === "SCHEMA_VERSION_UNSUPPORTED",
      );
      return failure(
        "PROJECT_INVALID",
        unsupportedVersion
          ? "project.json uses an unsupported schema version."
          : "project.json does not match the supported project schema.",
      );
    }

    return success({
      document: parsed.data,
      revision: revisionForContent(content),
    });
  } catch {
    return failure(
      "PROJECT_INVALID",
      "project.json could not be read as a valid project document.",
    );
  }
}

function validateDocument(
  document: unknown,
): ProjectRepositoryResult<ProjectDocument> {
  const parsed = safeParseProjectDocument(document);
  if ("error" in parsed) {
    const unsupportedVersion = parsed.error.issues.some(
      (issue) => issue.message === "SCHEMA_VERSION_UNSUPPORTED",
    );
    return failure(
      "PROJECT_INVALID",
      unsupportedVersion
        ? "The project document uses an unsupported schema version."
        : "The project document does not match the supported schema.",
    );
  }

  return success(parsed.data);
}

function revisionForContent(content: string): string {
  return "sha256:" + createHash("sha256").update(content, "utf8").digest("hex");
}

async function withProjectWriteLock<T>(
  projectRoot: string,
  action: () => Promise<T>,
): Promise<T> {
  const previous = projectWriteLocks.get(projectRoot) ?? Promise.resolve();
  let release = () => {};
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  const tail = previous.then(() => gate);
  projectWriteLocks.set(projectRoot, tail);
  void tail.finally(() => {
    if (projectWriteLocks.get(projectRoot) === tail) {
      projectWriteLocks.delete(projectRoot);
    }
  });

  await previous;
  try {
    return await action();
  } finally {
    release();
  }
}

function success<T>(value: T): ProjectRepositoryResult<T> {
  return { ok: true, value };
}

function isFailure<T>(
  result: ProjectRepositoryResult<T>,
): result is { ok: false; code: ProjectRepositoryErrorCode; message: string } {
  return result.ok === false;
}

function failure<T>(
  code: ProjectRepositoryErrorCode,
  message: string,
): ProjectRepositoryResult<T> {
  return { ok: false, code, message };
}
