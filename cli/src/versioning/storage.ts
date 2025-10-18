import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * Version history entry for a single version
 */
export type VersionHistoryEntry = {
  version: string;
  date: string;
  hash: string;
  added: number;
  removed: number;
  edited: number;
};

/**
 * Complete metadata for a single document
 */
export type DocMetadata = {
  version: string;
  updated: string;
  hash: string;
  sections: string[];
  history: VersionHistoryEntry[];
};

/**
 * Complete metadata storage for all documents by mapping relative file paths to their metadata
 */
export type VersionsMetadata = Record<string, DocMetadata>;

const METADATA_PATH = path.join(process.cwd(), "..", "docs", ".versions.json");

/**
 * Load the complete versions metadata from disk
 */
export async function loadMetadata(): Promise<VersionsMetadata> {
  try {
    const content = await readFile(METADATA_PATH, "utf8");
    return JSON.parse(content);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return {};
    }
    throw error;
  }
}

/**
 * Save the complete versions metadata to disk & creates the docs directory if it doesn't exist
 */
export async function saveMetadata(metadata: VersionsMetadata): Promise<void> {
  const docsDir = path.dirname(METADATA_PATH);
  await mkdir(docsDir, { recursive: true });
  await writeFile(METADATA_PATH, JSON.stringify(metadata, null, 2), "utf8");
}

/**
 * Get metadata for a specific document
 */
export async function getDocMetadata(relativePath: string): Promise<DocMetadata | undefined> {
  const metadata = await loadMetadata();
  return metadata[relativePath];
}

/**
 * Update metadata for a specific document or creates a new entry if document hasn't been versioned yet
 */
export async function updateDocMetadata(relativePath: string, docMeta: DocMetadata): Promise<void> {
  const metadata = await loadMetadata();
  metadata[relativePath] = docMeta;
  await saveMetadata(metadata);
}
