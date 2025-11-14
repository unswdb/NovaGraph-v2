/**
 * Web Worker for Kuzu Persistent Async Mode
 * Runs Kuzu database operations with IndexedDB persistence in a separate thread
 */

// Use sync version for filesystem operations
// @ts-ignore
import kuzu from "kuzu-wasm/sync";

import { snapshotGraphState } from "../../helpers/KuzuQueryExecutor";
import { queryResultColorMapExtraction } from "../../helpers/KuzuQueryResultExtractor";

const DATABASES_DIR = "kuzu_databases";
const DB_FILE_NAME = "database.kuzu";
const METADATA_FILE_NAME = "metadata.json";

let db: any = null;
let connection: any = null;
let initialized = false;

interface DatabaseMetadata {
  isDirected: boolean;
  createdAt?: string;
  lastModified?: string;
}

const normalizePath = (filePath: string) =>
  filePath.startsWith("/") ? filePath : `/${filePath}`;

function ensureParentDirectory(filePath: string) {
  const fs = kuzu.getFS();
  const normalized = normalizePath(filePath);
  const lastSlash = normalized.lastIndexOf("/");
  const dirPath = lastSlash <= 0 ? "/" : normalized.slice(0, lastSlash);

  if (dirPath === "/") {
    return;
  }

  const segments = dirPath.split("/").filter(Boolean);
  let currentPath = "";

  for (const segment of segments) {
    currentPath += `/${segment}`;
    try {
      fs.mkdir(currentPath);
    } catch {
      // Ignore already existing directories
    }
  }
}

interface WorkerMessage {
  id: number;
  type: string;
  data: any;
}

interface WorkerResponse {
  id: number;
  type: string;
  data?: any;
  error?: string;
}

/**
 * Check if a directory exists
 */
function directoryExists(path: string): boolean {
  try {
    const stats = kuzu.getFS().stat(path);
    return kuzu.getFS().isDir(stats.mode);
  } catch (e) {
    return false;
  }
}

function fileExists(path: string): boolean {
  try {
    const stats = kuzu.getFS().stat(path);
    return kuzu.getFS().isFile(stats.mode);
  } catch (e) {
    return false;
  }
}

function getDatabaseDir(dbName: string): string {
  return `${DATABASES_DIR}/${dbName}`;
}

function getDatabaseFilePath(dbName: string): string {
  return `${getDatabaseDir(dbName)}/${DB_FILE_NAME}`;
}

function getMetadataFilePath(dbName: string): string {
  return `${getDatabaseDir(dbName)}/${METADATA_FILE_NAME}`;
}

/**
 * Save metadata for a database
 */
function saveMetadata(dbName: string, metadata: DatabaseMetadata) {
  const metadataPath = getMetadataFilePath(dbName);
  const metadataJson = JSON.stringify(metadata, null, 2);
  kuzu.getFS().writeFile(metadataPath, metadataJson);
}

/**
 * Load metadata for a database
 */
function loadMetadata(dbName: string): DatabaseMetadata {
  const metadataPath = getMetadataFilePath(dbName);

  try {
    if (fileExists(metadataPath)) {
      const metadataContent = kuzu
        .getFS()
        .readFile(metadataPath, { encoding: "utf8" });
      return JSON.parse(metadataContent) as DatabaseMetadata;
    }
  } catch (error) {
    console.warn(`[Worker] Failed to load metadata for ${dbName}:`, error);
  }

  // Return default metadata if file doesn't exist or fails to load
  return {
    isDirected: true,
  };
}

function removeDirectoryRecursive(path: string) {
  const fs = kuzu.getFS();
  const entries = fs.readdir(path);

  for (const entry of entries) {
    if (entry === "." || entry === "..") continue;
    const fullPath = `${path}/${entry}`;
    if (directoryExists(fullPath)) {
      removeDirectoryRecursive(fullPath);
    } else if (fileExists(fullPath)) {
      fs.unlink(fullPath);
    } else {
      console.warn(`[Worker] Unknown filesystem entry skipped: ${fullPath}`);
    }
  }

  fs.rmdir(path);
}

/**
 * Save filesystem to IndexedDB
 */
async function saveIDBFS(): Promise<void> {
  return new Promise((resolve, reject) => {
    kuzu.getFS().syncfs(false, (err: any) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

/**
 * Load filesystem from IndexedDB
 */
async function loadIDBFS(): Promise<void> {
  return new Promise((resolve, reject) => {
    kuzu.getFS().syncfs(true, (err: any) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

/**
 * Process a single query result coming from kuzu-wasm.
 * DDL statements may not provide row data, so failures in getAllObjects()
 * should not be treated as query failures.
 */
function processWorkerQueryResult(result: any) {
  if (!result) {
    return {
      success: true,
      objects: [],
      columnNames: [],
      columnTypes: [],
    };
  }

  let isSuccess = true;
  try {
    if (typeof result.isSuccess === "function") {
      isSuccess = result.isSuccess();
    }
  } catch (error) {
    console.warn(
      "[Worker] Failed to read isSuccess flag, assuming success:",
      error
    );
    isSuccess = true;
  }

  if (!isSuccess) {
    const errorMessage =
      typeof result.getErrorMessage === "function"
        ? result.getErrorMessage()
        : "Query failed";
    return {
      success: false,
      message: errorMessage,
    };
  }

  const safeReadArray = (reader?: () => any[]) => {
    if (typeof reader !== "function") {
      return [];
    }
    try {
      const value = reader.call(result);
      return Array.isArray(value) ? value : [];
    } catch (error) {
      console.warn("[Worker] Reader failed, returning empty array:", error);
      return [];
    }
  };

  const columnNames = safeReadArray(result.getColumnNames);
  const columnTypes = safeReadArray(result.getColumnTypes);

  let nodes: any[] = [];
  if (typeof result.getAllObjects === "function") {
    try {
      const objects = result.getAllObjects();
      if (Array.isArray(objects)) {
        nodes = objects;
      }
    } catch (error) {
      // DDL statements frequently throw here – just log and continue
      console.warn(
        "[Worker] getAllObjects failed; continuing with empty nodes:",
        error
      );
      nodes = [];
    }
  }

  return {
    success: true,
    objects: nodes,
    columnNames,
    columnTypes,
  };
}
/**
 * Handle messages from the main thread
 */
self.onmessage = async (e: MessageEvent<WorkerMessage>) => {
  const { id, type, data } = e.data;

  try {
    switch (type) {
      case "init":
        if (!initialized) {
          console.log("[Worker] Initializing Kuzu persistent async...");
          await kuzu.init();

          // Setup IDBFS
          if (!directoryExists(DATABASES_DIR)) {
            await kuzu.getFS().mkdir(DATABASES_DIR);
          }
          await kuzu
            .getFS()
            .mount(kuzu.getFS().filesystems.IDBFS, {}, DATABASES_DIR);
          await loadIDBFS();

          initialized = true;
          console.log("[Worker] Kuzu persistent async initialized");
        }

        // Get version synchronously (ensure it's a string, not Promise)
        let version = "0.11.3";
        if (typeof kuzu.getVersion === "function") {
          const versionValue = kuzu.getVersion();
          if (versionValue instanceof Promise) {
            version = await versionValue;
          } else {
            version = versionValue || "0.11.3";
          }
        }

        self.postMessage({
          id,
          type,
          data: {
            success: true,
            version: String(version),
          },
        } as WorkerResponse);
        break;

      case "createDatabase":
        const createDbDir = getDatabaseDir(data.dbName);
        const createDbFile = getDatabaseFilePath(data.dbName);

        // Check if already exists
        if (directoryExists(createDbDir)) {
          throw new Error(`Database '${data.dbName}' already exists`);
        }

        // Create directory
        await kuzu.getFS().mkdir(createDbDir);

        // Initialize the database by creating a Database instance
        // This creates the necessary database files
        const tempDb = new kuzu.Database(createDbFile);
        const tempConn = new kuzu.Connection(tempDb);
        tempConn.close();
        tempDb.close();

        // Save metadata (hardcoded to isDirected: true for now)
        const metadata: DatabaseMetadata = {
          isDirected: data.metadata?.isDirected ?? true,
          createdAt: new Date().toISOString(),
          lastModified: new Date().toISOString(),
        };
        saveMetadata(data.dbName, metadata);

        await saveIDBFS();

        self.postMessage({
          id,
          type,
          data: {
            success: true,
            message: `Database ${data.dbName} created`,
            metadata,
          },
        } as WorkerResponse);
        break;

      case "connectToDatabase":
        const dbDir = getDatabaseDir(data.dbName);
        const dbFile = getDatabaseFilePath(data.dbName);

        if (!directoryExists(dbDir) || !fileExists(dbFile)) {
          throw new Error(`Database '${data.dbName}' does not exist`);
        }

        if (db) {
          db.close();
          db = null;
        }
        db = new kuzu.Database(dbFile);
        connection = new kuzu.Connection(db);

        // Load metadata
        const loadedMetadata = loadMetadata(data.dbName);

        self.postMessage({
          id,
          type,
          data: {
            success: true,
            message: `Connected to ${data.dbName}`,
            metadata: loadedMetadata,
          },
        } as WorkerResponse);
        break;

      case "disconnectFromDatabase":
        if (db) {
          db.close();
          db = null;
        }
        connection = null;

        self.postMessage({
          id,
          type,
          data: { success: true },
        } as WorkerResponse);
        break;

      case "listDatabases":
        const entries = kuzu.getFS().readdir(DATABASES_DIR);
        const databases: string[] = [];

        for (const entry of entries) {
          if (entry === "." || entry === "..") continue;

          try {
            const fullPath = `${DATABASES_DIR}/${entry}`;
            const stats = kuzu.getFS().stat(fullPath);
            if (kuzu.getFS().isDir(stats.mode)) {
              databases.push(entry);
            }
          } catch (e) {
            console.warn(`[Worker] Error accessing entry "${entry}":`, e);
          }
        }

        self.postMessage({
          id,
          type,
          data: { success: true, databases },
        } as WorkerResponse);
        break;

      case "deleteDatabase":
        const deletePath = getDatabaseDir(data.dbName);

        if (!directoryExists(deletePath)) {
          throw new Error(`Database '${data.dbName}' does not exist`);
        }

        removeDirectoryRecursive(deletePath);
        await saveIDBFS();

        self.postMessage({
          id,
          type,
          data: { success: true, message: `Database ${data.dbName} deleted` },
        } as WorkerResponse);
        break;

      case "renameDatabase":
        const oldPath = `${DATABASES_DIR}/${data.oldName}`;
        const newPath = `${DATABASES_DIR}/${data.newName}`;

        if (!directoryExists(oldPath)) {
          throw new Error(`Database '${data.oldName}' does not exist`);
        }

        if (directoryExists(newPath)) {
          throw new Error(`Database '${data.newName}' already exists`);
        }

        kuzu.getFS().rename(oldPath, newPath);
        await saveIDBFS();

        self.postMessage({
          id,
          type,
          data: {
            success: true,
            message: `Database renamed from ${data.oldName} to ${data.newName}`,
          },
        } as WorkerResponse);
        break;

      case "saveDatabase":
        await saveIDBFS();

        self.postMessage({
          id,
          type,
          data: { success: true },
        } as WorkerResponse);
        break;

      case "loadDatabase":
        await loadIDBFS();

        self.postMessage({
          id,
          type,
          data: { success: true },
        } as WorkerResponse);
        break;

      case "query":
        if (!connection) {
          throw new Error("Database not connected");
        }

        console.log("[Worker] Executing query:", data.query);
        let currentResult = connection.query(data.query);
        const successQueries: any[] = [];
        const failedQueries: any[] = [];
        let allSuccess = true;
        let colorMap = {};
        let resultType = "graph";

        while (currentResult) {
          const queryResult = processWorkerQueryResult(currentResult);
          if (queryResult.success) {
            successQueries.push(queryResult);
          } else {
            allSuccess = false;
            failedQueries.push(queryResult);
          }

          if (
            currentResult.hasNextQueryResult &&
            currentResult.hasNextQueryResult()
          ) {
            currentResult = currentResult.getNextQueryResult();
            continue;
          } else {
            colorMap = queryResultColorMapExtraction(currentResult);
            break;
          }
        }

        if (currentResult && typeof currentResult.close === "function") {
          currentResult.close();
        }

        const graphState = snapshotGraphState(connection);
        const errorMessages = failedQueries
          .map((queryResult) => queryResult?.message)
          .filter((msg): msg is string => Boolean(msg && msg.trim()));
        const failureMessage = errorMessages.length
          ? errorMessages.join(" | ")
          : "Some queries failed. Check results for details.";

        // Auto-save after query execution
        if (data.autoSave !== false) {
          await saveIDBFS();
        }

        self.postMessage({
          id,
          type,
          data: {
            success: allSuccess,
            successQueries,
            failedQueries,
            nodes: graphState.nodes,
            edges: graphState.edges,
            nodeTables: graphState.nodeTables,
            edgeTables: graphState.edgeTables,
            colorMap,
            resultType,
          },
        } as WorkerResponse);
        break;

      case "getColumnTypes":
        if (!connection) {
          throw new Error("Database not connected");
        }

        const typeResult = connection.query(data.query);
        const columnTypes = typeResult.getColumnTypes();
        typeResult.close();

        self.postMessage({
          id,
          type,
          data: { columnTypes },
        } as WorkerResponse);
        break;

      case "writeFile":
        if (!data?.path) {
          throw new Error("File path is required");
        }
        const filePath = normalizePath(data.path);
        ensureParentDirectory(filePath);
        kuzu.getFS().writeFile(filePath, data.content ?? "");
        self.postMessage({
          id,
          type,
          data: { success: true, path: filePath },
        } as WorkerResponse);
        break;

      case "deleteFile":
        if (!data?.path) {
          throw new Error("File path is required");
        }
        try {
          const deleteFilePath = normalizePath(data.path);
          kuzu.getFS().unlink(deleteFilePath);
        } catch (error) {
          console.warn("[Worker] deleteFile warning:", error);
        }
        self.postMessage({
          id,
          type,
          data: { success: true },
        } as WorkerResponse);
        break;

      case "snapshotGraphState":
        if (!connection) {
          self.postMessage({
            id,
            type,
            data: {
              nodes: [],
              edges: [],
              nodeTables: [],
              edgeTables: [],
            },
          } as WorkerResponse);
        } else {
          self.postMessage({
            id,
            type,
            data: snapshotGraphState(connection),
          } as WorkerResponse);
        }
        break;

      case "getMetadata":
        const getMetaDbName = data.dbName;
        if (!getMetaDbName) {
          throw new Error("Database name is required for getMetadata");
        }

        const getMetaDbDir = getDatabaseDir(getMetaDbName);
        if (!directoryExists(getMetaDbDir)) {
          throw new Error(`Database '${getMetaDbName}' does not exist`);
        }

        const retrievedMetadata = loadMetadata(getMetaDbName);

        self.postMessage({
          id,
          type,
          data: {
            success: true,
            metadata: retrievedMetadata,
          },
        } as WorkerResponse);
        break;

      case "setMetadata":
        const setMetaDbName = data.dbName;
        if (!setMetaDbName) {
          throw new Error("Database name is required for setMetadata");
        }

        const setMetaDbDir = getDatabaseDir(setMetaDbName);
        if (!directoryExists(setMetaDbDir)) {
          throw new Error(`Database '${setMetaDbName}' does not exist`);
        }

        // Load existing metadata and merge with new values
        const existingMetadata = loadMetadata(setMetaDbName);
        const updatedMetadata: DatabaseMetadata = {
          ...existingMetadata,
          ...data.metadata,
          lastModified: new Date().toISOString(),
        };

        saveMetadata(setMetaDbName, updatedMetadata);
        await saveIDBFS();

        self.postMessage({
          id,
          type,
          data: {
            success: true,
            metadata: updatedMetadata,
          },
        } as WorkerResponse);
        break;

      case "cleanup":
        console.log("[Worker] Cleaning up...");

        // Save before cleanup
        if (initialized) {
          await saveIDBFS();
        }

        if (connection) {
          connection.close();
          connection = null;
        }
        if (db) {
          db.close();
          db = null;
        }
        initialized = false;

        self.postMessage({
          id,
          type,
          data: { success: true },
        } as WorkerResponse);
        break;

      default:
        throw new Error(`Unknown message type: ${type}`);
    }
  } catch (error) {
    console.error("[Worker]", error);
    self.postMessage({
      id,
      type,
      error: error instanceof Error ? error.message : String(error),
    } as WorkerResponse);
  }
};

// Handle worker errors
self.onerror = (error) => {
  console.error("[Worker] Unhandled error:", error);
};
