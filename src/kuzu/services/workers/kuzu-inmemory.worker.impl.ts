/**
 * Web Worker for Kuzu In-Memory Async Mode
 * Runs Kuzu database operations in a separate thread to avoid blocking the main UI thread
 */

// @ts-ignore
import kuzu from "kuzu-wasm/sync";

import { snapshotGraphState } from "../../helpers/KuzuQueryExecutor";
import { queryResultColorMapExtraction } from "../../helpers/KuzuQueryResultExtractor";

const PERSIST_DIR = "kuzu_inmemory";
const DEFAULT_DB_FILE = "database.kuzu";

// Database management for in-memory mode
interface DatabaseInfo {
  db: any;
  connection: any;
  metadata: {
    isDirected: boolean;
    createdAt?: string;
    lastModified?: string;
    lastUsedAt?: string;
  };
}

let databases: Map<string, DatabaseInfo> = new Map();
let currentDatabaseName: string | null = null;
let db: any = null;
let connection: any = null;
let initialized = false;
let persistentEnabled = false;
let autoSaveEnabled = false;
let databaseFilePath = ":memory:";

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
    } catch (error) {
      // Ignore already-existing directories
    }
  }
}

/**
 * Check if a directory exists
 */
function directoryExists(path: string): boolean {
  const fs = kuzu.getFS();
  try {
    const stats = fs.stat(normalizePath(path));
    return fs.isDir(stats.mode);
  } catch {
    return false;
  }
}

function fileExists(path: string): boolean {
  const fs = kuzu.getFS();
  try {
    const stats = fs.stat(normalizePath(path));
    return fs.isFile(stats.mode);
  } catch {
    return false;
  }
}

/**
 * Persist virtual FS to IndexedDB
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
 * Load virtual FS from IndexedDB
 */
async function loadIDBFS(): Promise<void> {
  return new Promise((resolve, reject) => {
    kuzu.getFS().syncfs(true, (err: any) => {
      if (err) reject(err);
      else resolve();
    });
  });
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
 * Process query results to make them serializable for postMessage
 */
function processQueryResult(result: any) {
  try {
    const isSuccess =
      typeof result.isSuccess === "function" ? result.isSuccess() : true;
    if (!isSuccess) {
      const message =
        typeof result.getErrorMessage === "function"
          ? result.getErrorMessage()
          : "Query failed";
      return { success: false, message };
    }

    let objects: any[] = [];
    if (typeof result.getAllObjects === "function") {
      try {
        const fetched = result.getAllObjects();
        if (Array.isArray(fetched)) {
          objects = fetched;
        }
      } catch (err) {
        console.warn("[Worker] getAllObjects failed; treating as empty:", err);
      }
    }

    return {
      success: true,
      objects,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : String(error),
    };
  }
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
          const defaultPath = `${PERSIST_DIR}/${DEFAULT_DB_FILE}`;
          persistentEnabled = data?.persistent === true;
          autoSaveEnabled = data?.autoSave === true;
          databaseFilePath = persistentEnabled
            ? normalizePath(
                typeof data?.dbPath === "string" && data.dbPath.trim()
                  ? data.dbPath.trim()
                  : defaultPath
              )
            : ":memory:";

          console.log(
            "[Worker] Initializing Kuzu async...",
            persistentEnabled ? "with persistence" : "in-memory only"
          );
          await kuzu.init();

          if (persistentEnabled) {
            const fs = kuzu.getFS();
            const persistRoot = normalizePath(PERSIST_DIR);
            if (!directoryExists(persistRoot)) {
              await fs.mkdir(persistRoot);
            }
            await fs.mount(fs.filesystems.IDBFS, {}, persistRoot);
            await loadIDBFS();

            if (data?.reset && fileExists(databaseFilePath)) {
              fs.unlink(databaseFilePath);
            }

            ensureParentDirectory(databaseFilePath);
            db = new kuzu.Database(databaseFilePath);
            connection = new kuzu.Connection(db);
          } else {
            // In-memory mode: initialize with default database
            const defaultDbName = "default";
            const defaultDb = new kuzu.Database(":memory:");
            const defaultConn = new kuzu.Connection(defaultDb);
            databases.set(defaultDbName, {
              db: defaultDb,
              connection: defaultConn,
              metadata: {
                isDirected: true,
                createdAt: new Date().toISOString(),
                lastModified: new Date().toISOString(),
                lastUsedAt: new Date().toISOString(),
              },
            });
            currentDatabaseName = defaultDbName;
            db = defaultDb;
            connection = defaultConn;
          }

          initialized = true;

          if (persistentEnabled && autoSaveEnabled) {
            await saveIDBFS();
          }
          console.log("[Worker] Kuzu async initialized");
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
        });
        break;

      case "query":
        if (!connection) {
          throw new Error("Database not initialized");
        }

        console.log("[Worker] Executing query:", data.query);
        let currentResult = connection.query(data.query);
        const successQueries: any[] = [];
        const failedQueries: any[] = [];
        let allSuccess = true;
        let colorMap = {};
        let resultType = "graph";

        while (currentResult) {
          const queryResult = processQueryResult(currentResult);
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

        if (persistentEnabled && autoSaveEnabled) {
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
        });
        break;

      case "snapshotGraphState":
        if (!connection) {
          throw new Error("Database not initialized");
        }

        self.postMessage({
          id,
          type,
          data: snapshotGraphState(connection),
        });
        break;

      case "getColumnTypes":
        if (!connection) {
          throw new Error("Database not initialized");
        }

        const typeResult = connection.query(data.query);
        const columnTypes = typeResult.getColumnTypes();
        typeResult.close();

        self.postMessage({
          id,
          type,
          data: { columnTypes },
        });
        break;

      case "writeFile":
        if (!data?.path) {
          throw new Error("File path is required");
        }
        const targetPath = normalizePath(data.path);
        ensureParentDirectory(targetPath);
        kuzu.getFS().writeFile(targetPath, data.content ?? "");

        if (persistentEnabled && autoSaveEnabled) {
          await saveIDBFS();
        }
        self.postMessage({
          id,
          type,
          data: { success: true, path: targetPath },
        });
        break;

      case "deleteFile":
        if (!data?.path) {
          throw new Error("File path is required");
        }
        try {
          const deletePath = normalizePath(data.path);
          kuzu.getFS().unlink(deletePath);
        } catch (error) {
          console.warn("[Worker] deleteFile warning:", error);
        }

        if (persistentEnabled && autoSaveEnabled) {
          await saveIDBFS();
        }
        self.postMessage({
          id,
          type,
          data: { success: true },
        });
        break;

      case "saveDatabase":
        if (persistentEnabled) {
          await saveIDBFS();
        }
        self.postMessage({
          id,
          type,
          data: { success: true },
        });
        break;

      case "loadDatabase":
        if (persistentEnabled) {
          await loadIDBFS();
        }
        self.postMessage({
          id,
          type,
          data: { success: true },
        });
        break;

      case "createDatabase":
        if (persistentEnabled) {
          // For persistent mode, use file system
          const createDbDir = `${PERSIST_DIR}/${data.dbName}`;
          const createDbFile = `${createDbDir}/${DEFAULT_DB_FILE}`;

          if (directoryExists(createDbDir)) {
            throw new Error(`Database '${data.dbName}' already exists`);
          }

          const fs = kuzu.getFS();
          await fs.mkdir(normalizePath(createDbDir));
          ensureParentDirectory(normalizePath(createDbFile));

          const tempDb = new kuzu.Database(normalizePath(createDbFile));
          const tempConn = new kuzu.Connection(tempDb);
          tempConn.close();
          tempDb.close();

          if (autoSaveEnabled) {
            await saveIDBFS();
          }
        } else {
          // For in-memory mode, create a new database instance
          if (databases.has(data.dbName)) {
            throw new Error(`Database '${data.dbName}' already exists`);
          }

          const newDb = new kuzu.Database(":memory:");
          const newConn = new kuzu.Connection(newDb);
          databases.set(data.dbName, {
            db: newDb,
            connection: newConn,
            metadata: {
              isDirected: data.metadata?.isDirected ?? true,
              createdAt: new Date().toISOString(),
              lastModified: new Date().toISOString(),
              lastUsedAt: new Date().toISOString(),
            },
          });
        }

        self.postMessage({
          id,
          type,
          data: {
            success: true,
            message: `Database ${data.dbName} created`,
            metadata: persistentEnabled
              ? {
                  isDirected: data.metadata?.isDirected ?? true,
                  createdAt: new Date().toISOString(),
                }
              : databases.get(data.dbName)?.metadata,
          },
        });
        break;

      case "connectToDatabase":
        if (persistentEnabled) {
          // For persistent mode, use file system
          const dbDir = `${PERSIST_DIR}/${data.dbName}`;
          const dbFile = `${dbDir}/${DEFAULT_DB_FILE}`;

          if (!directoryExists(dbDir) || !fileExists(normalizePath(dbFile))) {
            throw new Error(`Database '${data.dbName}' does not exist`);
          }

          if (db) {
            db.close();
            db = null;
          }
          db = new kuzu.Database(normalizePath(dbFile));
          connection = new kuzu.Connection(db);

          if (autoSaveEnabled) {
            await saveIDBFS();
          }
        } else {
          // For in-memory mode, switch to existing database
          const dbInfo = databases.get(data.dbName);
          if (!dbInfo) {
            throw new Error(`Database '${data.dbName}' does not exist`);
          }

          // Update last used time
          dbInfo.metadata.lastUsedAt = new Date().toISOString();
          dbInfo.metadata.lastModified = new Date().toISOString();

          // Switch to the database
          currentDatabaseName = data.dbName;
          db = dbInfo.db;
          connection = dbInfo.connection;
        }

        self.postMessage({
          id,
          type,
          data: {
            success: true,
            message: `Connected to ${data.dbName}`,
            metadata: persistentEnabled
              ? undefined
              : databases.get(data.dbName)?.metadata,
          },
        });
        break;

      case "disconnectFromDatabase":
        if (persistentEnabled) {
          if (db) {
            db.close();
            db = null;
          }
          connection = null;
        } else {
          // In in-memory mode, we keep the database but just clear current reference
          currentDatabaseName = null;
          db = null;
          connection = null;
        }

        self.postMessage({
          id,
          type,
          data: { success: true },
        });
        break;

      case "listDatabases":
        if (persistentEnabled) {
          const fs = kuzu.getFS();
          const entries = fs.readdir(normalizePath(PERSIST_DIR));
          const dbList: string[] = [];

          for (const entry of entries) {
            if (entry === "." || entry === "..") continue;
            try {
              const fullPath = `${PERSIST_DIR}/${entry}`;
              const stats = fs.stat(normalizePath(fullPath));
              if (fs.isDir(stats.mode)) {
                dbList.push(entry);
              }
            } catch (e) {
              console.warn(`[Worker] Error accessing entry "${entry}":`, e);
            }
          }

          self.postMessage({
            id,
            type,
            data: { success: true, databases: dbList },
          });
        } else {
          // For in-memory mode, return list of database names
          const dbList = Array.from(databases.keys());
          self.postMessage({
            id,
            type,
            data: { success: true, databases: dbList },
          });
        }
        break;

      case "deleteDatabase":
        if (persistentEnabled) {
          const deletePath = `${PERSIST_DIR}/${data.dbName}`;
          if (!directoryExists(deletePath)) {
            throw new Error(`Database '${data.dbName}' does not exist`);
          }

          const fs = kuzu.getFS();
          // Remove directory recursively
          const removeDir = (path: string) => {
            const normalized = normalizePath(path);
            try {
              const entries = fs.readdir(normalized);
              for (const entry of entries) {
                if (entry === "." || entry === "..") continue;
                const entryPath = `${normalized}/${entry}`;
                const stats = fs.stat(entryPath);
                if (fs.isDir(stats.mode)) {
                  removeDir(entryPath);
                } else {
                  fs.unlink(entryPath);
                }
              }
              fs.rmdir(normalized);
            } catch (e) {
              console.warn(`[Worker] Error removing directory:`, e);
            }
          };
          removeDir(deletePath);

          if (autoSaveEnabled) {
            await saveIDBFS();
          }
        } else {
          // For in-memory mode, remove from map
          const dbInfo = databases.get(data.dbName);
          if (!dbInfo) {
            throw new Error(`Database '${data.dbName}' does not exist`);
          }

          // Close the database if it's currently active
          if (currentDatabaseName === data.dbName) {
            if (connection) {
              connection.close();
              connection = null;
            }
            if (db) {
              db.close();
              db = null;
            }
            currentDatabaseName = null;
          } else {
            // Close the database connection
            if (dbInfo.connection) {
              dbInfo.connection.close();
            }
            if (dbInfo.db) {
              dbInfo.db.close();
            }
          }

          databases.delete(data.dbName);

          // If no databases left, create default
          if (databases.size === 0) {
            const defaultDb = new kuzu.Database(":memory:");
            const defaultConn = new kuzu.Connection(defaultDb);
            databases.set("default", {
              db: defaultDb,
              connection: defaultConn,
              metadata: {
                isDirected: true,
                createdAt: new Date().toISOString(),
                lastModified: new Date().toISOString(),
                lastUsedAt: new Date().toISOString(),
              },
            });
            currentDatabaseName = "default";
            db = defaultDb;
            connection = defaultConn;
          }
        }

        self.postMessage({
          id,
          type,
          data: { success: true, message: `Database ${data.dbName} deleted` },
        });
        break;

      case "renameDatabase":
        if (persistentEnabled) {
          const oldPath = `${PERSIST_DIR}/${data.oldName}`;
          const newPath = `${PERSIST_DIR}/${data.newName}`;

          if (!directoryExists(oldPath)) {
            throw new Error(`Database '${data.oldName}' does not exist`);
          }

          if (directoryExists(newPath)) {
            throw new Error(`Database '${data.newName}' already exists`);
          }

          kuzu.getFS().rename(normalizePath(oldPath), normalizePath(newPath));

          if (autoSaveEnabled) {
            await saveIDBFS();
          }
        } else {
          // For in-memory mode, rename in map
          const dbInfo = databases.get(data.oldName);
          if (!dbInfo) {
            throw new Error(`Database '${data.oldName}' does not exist`);
          }

          if (databases.has(data.newName)) {
            throw new Error(`Database '${data.newName}' already exists`);
          }

          databases.set(data.newName, {
            ...dbInfo,
            metadata: {
              ...dbInfo.metadata,
              lastModified: new Date().toISOString(),
            },
          });
          databases.delete(data.oldName);

          if (currentDatabaseName === data.oldName) {
            currentDatabaseName = data.newName;
          }
        }

        self.postMessage({
          id,
          type,
          data: {
            success: true,
            message: `Database renamed from ${data.oldName} to ${data.newName}`,
          },
        });
        break;

      case "cleanup":
        console.log("[Worker] Cleaning up...");
        if (persistentEnabled && initialized) {
          await saveIDBFS();
        }

        // Close current connection
        if (connection) {
          connection.close();
          connection = null;
        }
        if (db) {
          db.close();
          db = null;
        }

        // Close all in-memory databases
        for (const [name, dbInfo] of databases.entries()) {
          if (dbInfo.connection) {
            dbInfo.connection.close();
          }
          if (dbInfo.db) {
            dbInfo.db.close();
          }
        }
        databases.clear();
        currentDatabaseName = null;
        initialized = false;

        self.postMessage({
          id,
          type,
          data: { success: true },
        });
        break;

      default:
        throw new Error(`Unknown message type: ${type}`);
    }
  } catch (error) {
    console.error("[Worker] Error:", error);
    self.postMessage({
      id,
      type,
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

// Handle worker errors
self.onerror = (error) => {
  console.error("[Worker] Unhandled error:", error);
};
