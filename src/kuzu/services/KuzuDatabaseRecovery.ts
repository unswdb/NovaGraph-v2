/**
 * Shared database recovery utilities for all Kuzu service implementations
 */

export type DatabaseMetadata = {
  isDirected: boolean;
  createdAt?: string;
  lastModified?: string;
  lastUsedAt?: string;
};

/**
 * Callback type for database recovery notifications
 */
export type DatabaseRecoveryCallback = (info: {
  failedDatabase: string;
  switchedToDatabase: string;
  reason: string;
}) => void;

const PROBLEMATIC_DATABASES_KEY = "kuzu_problematic_databases";

/**
 * Get list of problematic databases from sessionStorage
 * These are databases that caused crashes or memory issues
 */
export function getProblematicDatabases(): Set<string> {
  try {
    if (typeof sessionStorage === 'undefined') {
      return new Set<string>();
    }
    const stored = sessionStorage.getItem(PROBLEMATIC_DATABASES_KEY);
    if (stored) {
      const list = JSON.parse(stored) as string[];
      return new Set(list);
    }
  } catch (error) {
    console.warn("[KuzuDatabaseRecovery] Failed to read problematic databases list:", error);
  }
  return new Set<string>();
}

/**
 * Mark a database as problematic (caused crash or memory issue)
 */
export function markDatabaseAsProblematic(dbName: string) {
  try {
    if (typeof sessionStorage === 'undefined') {
      return;
    }
    const problematic = getProblematicDatabases();
    problematic.add(dbName);
    sessionStorage.setItem(PROBLEMATIC_DATABASES_KEY, JSON.stringify(Array.from(problematic)));
    console.warn(`[KuzuDatabaseRecovery] Marked database '${dbName}' as problematic`);
  } catch (error) {
    console.warn("[KuzuDatabaseRecovery] Failed to mark database as problematic:", error);
  }
}

/**
 * Remove a database from problematic list
 */
export function unmarkDatabaseAsProblematic(dbName: string) {
  try {
    if (typeof sessionStorage === 'undefined') {
      return;
    }
    const problematic = getProblematicDatabases();
    problematic.delete(dbName);
    sessionStorage.setItem(PROBLEMATIC_DATABASES_KEY, JSON.stringify(Array.from(problematic)));
  } catch (error) {
    console.warn("[KuzuDatabaseRecovery] Failed to unmark database:", error);
  }
}

/**
 * Clear all problematic database markers
 */
export function clearProblematicDatabases() {
  try {
    if (typeof sessionStorage === 'undefined') {
      return;
    }
    sessionStorage.removeItem(PROBLEMATIC_DATABASES_KEY);
  } catch (error) {
    console.warn("[KuzuDatabaseRecovery] Failed to clear problematic databases:", error);
  }
}

/**
 * Check if an error indicates database connection failure
 */
export function isDatabaseConnectionError(error: Error | string): boolean {
  const errorMessage = typeof error === 'string' ? error : error.message;
  const connectionErrorPatterns = [
    /database not connected/i,
    /database.*does not exist/i,
    /failed to connect/i,
    /connection.*closed/i,
    /database.*corrupted/i,
    /database.*crash/i,
    /database.*error/i,
    /operation timeout/i,
  ];
  return connectionErrorPatterns.some(pattern => pattern.test(errorMessage));
}

/**
 * Check if an error is memory-related
 */
export function isMemoryError(error: Error | string): boolean {
  const errorMessage = typeof error === 'string' ? error : error.message;
  return (
    errorMessage.includes("Out of Memory") ||
    errorMessage.includes("memory") ||
    errorMessage.includes("crash")
  );
}

/**
 * Check if an error should trigger database recovery
 */
export function shouldTriggerRecovery(error: Error | string): boolean {
  const errorMessage = typeof error === 'string' ? error : error.message;
  return (
    isDatabaseConnectionError(errorMessage) ||
    isMemoryError(errorMessage) ||
    errorMessage.includes("timeout") ||
    errorMessage.includes("too large")
  );
}

