/**
 * Web Worker for Kuzu In-Memory Async Mode
 * Runs Kuzu database operations in a separate thread to avoid blocking the main UI thread
 */

// @ts-ignore
import kuzu from "kuzu-wasm/sync";
import { snapshotGraphState } from "../../helpers/KuzuQueryExecutor";
import { queryResultColorMapExtraction } from "../../helpers/KuzuQueryResultExtractor";

let db: any = null;
let connection: any = null;
let initialized = false;

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
      message:
        error instanceof Error ? error.message : String(error),
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
      case 'init':
        if (!initialized) {
          console.log('[Worker] Initializing Kuzu async...');
          await kuzu.init();
          db = new kuzu.Database(":memory:");
          connection = new kuzu.Connection(db);
          initialized = true;
          console.log('[Worker] Kuzu async initialized');
        }
        
        // Get version synchronously (ensure it's a string, not Promise)
        let version = '0.11.3';
        if (typeof kuzu.getVersion === 'function') {
          const versionValue = kuzu.getVersion();
          if (versionValue instanceof Promise) {
            version = await versionValue;
          } else {
            version = versionValue || '0.11.3';
          }
        }
        
        self.postMessage({
          id,
          type,
          data: { 
            success: true, 
            version: String(version)
          },
        } as WorkerResponse);
        break;

      case 'query':
        if (!connection) {
          throw new Error('Database not initialized');
        }
        
        console.log('[Worker] Executing query:', data.query);
        let currentResult = connection.query(data.query);
        const successQueries: any[] = [];
        const failedQueries: any[] = [];
        let allSuccess = true;
        let colorMap = {};
        let resultType = 'graph';

        while (currentResult) {
          const queryResult = processQueryResult(currentResult);
          if (queryResult.success) {
            successQueries.push(queryResult);
          } else {
            allSuccess = false;
            failedQueries.push(queryResult);
          }

          if (currentResult.hasNextQueryResult && currentResult.hasNextQueryResult()) {
            currentResult = currentResult.getNextQueryResult();
            continue;
          } else {
            colorMap = queryResultColorMapExtraction(currentResult);
            break;
          }
        }

        if (currentResult && typeof currentResult.close === 'function') {
          currentResult.close();
        }

        const graphState = snapshotGraphState(connection);
        const errorMessages = failedQueries
          .map((queryResult) => queryResult?.message)
          .filter((msg): msg is string => Boolean(msg && msg.trim()));
        const failureMessage = errorMessages.length
          ? errorMessages.join(" | ")
          : "Some queries failed. Check results for details.";
        
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
            message: allSuccess ? 'All queries succeeded' : failureMessage,
            error: allSuccess ? undefined : failureMessage,
          },
        } as WorkerResponse);
        break;

      case 'snapshotGraphState':
        if (!connection) {
          throw new Error('Database not initialized');
        }

        self.postMessage({
          id,
          type,
          data: snapshotGraphState(connection),
        } as WorkerResponse);
        break;

      case 'getColumnTypes':
        if (!connection) {
          throw new Error('Database not initialized');
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

      case 'writeFile':
        if (!data?.path) {
          throw new Error('File path is required');
        }
        const targetPath = normalizePath(data.path);
        ensureParentDirectory(targetPath);
        kuzu.getFS().writeFile(targetPath, data.content ?? '');
        self.postMessage({
          id,
          type,
          data: { success: true, path: targetPath },
        } as WorkerResponse);
        break;

      case 'deleteFile':
        if (!data?.path) {
          throw new Error('File path is required');
        }
        try {
          const deletePath = normalizePath(data.path);
          kuzu.getFS().unlink(deletePath);
        } catch (error) {
          console.warn('[Worker] deleteFile warning:', error);
        }
        self.postMessage({
          id,
          type,
          data: { success: true },
        } as WorkerResponse);
        break;

      case 'cleanup':
        console.log('[Worker] Cleaning up...');
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
    console.error('[Worker] Error:', error);
    self.postMessage({
      id,
      type,
      error: error instanceof Error ? error.message : String(error),
    } as WorkerResponse);
  }
};

// Handle worker errors
self.onerror = (error) => {
  console.error('[Worker] Unhandled error:', error);
};
