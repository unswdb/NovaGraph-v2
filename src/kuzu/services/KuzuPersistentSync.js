import kuzu from 'kuzu-wasm/sync';
import KuzuGraphHelper from '../helpers/KuzuGraphHelper';
import KuzuBaseService from './KuzuBaseService';

const DATABASES_DIR = 'kuzu_databases';

export default class KuzuPersistentSync extends KuzuBaseService {
  constructor() {
    super();
  }

  // Helper
  /**
	 * 
	 * @param {string} path 
	 * @returns true if directory exist, false otherwise
	 */
  directoryExists(path) {
    try {
      const stats = kuzu.getFS().stat(path);
      return kuzu.getFS().isDir(stats.mode);
    } catch (e) {
      return false;
    }
  }

  /**
	 * 
	 * @param {string} path 
	 * @returns true if file exist, false otherwise
	 */
  fileExists(path) {
    try {
      const stats = kuzu.getFS().stat(path);
      return kuzu.getFS().isFile(stats.mode);
    } catch (e) {
      return false;
    }
  }

  /**
	 * Removes a directory within the databases directory.
	 * 
	 * @param {string} path - The relative path to the directory to be removed
	 * @returns {Object} Result object with success status and message/error
	 * @example
	 * // Remove a directory named "my_database"
	 * const result = removeDirectory("my_database");
	 * if (result.success) {
	 *   console.log(result.message);
	 * } else {
	 *   console.error(result.error);
	 * }
	 */
  removeDirectory(path) {
    path = `${DATABASES_DIR}/${path}`;
    return this.removeDirectoryRecursive(path);
  }

  /**
	 * Recursively removes a directory and all its contents (files and subdirectories).
	 * 
	 * @param {string} path - The absolute path to the directory to be removed
	 * @returns {Object} Result object containing:
	 *   - success {boolean} - Whether the operation was successful
	 *   - message {string} - Success message (if operation succeeded)
	 *   - error {string} - Error message (if operation failed)
	 * @private
	 * @throws Will not throw exceptions directly, but returns error information in result object
	 */
  removeDirectoryRecursive(path) {
    try {
      const fs = kuzu.getFS();
      const entries = fs.readdir(path);
      for (const entry of entries) {
        if (entry === '.' || entry === '..') continue;
            
        const fullPath = path + '/' + entry;
        if (this.directoryExists(fullPath)) {
          const result = this.removeDirectoryRecursive(fullPath);
          if (!result.success) return result;
        } else if (this.fileExists(fullPath)) {
          fs.unlink(fullPath);
        } else {
          return {
            success: false,
            error: `Failed to delete directory: ${path}. ${error.message}`
          };
        }
      }
          
      // Now the directory should be empty, remove it
      fs.rmdir(path);
      return {
        success: true,
        message: `Successfully removed directory: ${path}`
      };
    } catch (error) {
      console.error(`Error removing directory ${path}:`, error);
      return {
        success: false,
        error: `Failed to delete directory: ${path}. ${error.message}`
      };
    }
  }

  /**
     * Deletes a Kuzu database
     * @param {string} dbName - Name of the database to delete
     */
  async deleteDatabase(dbName) {
    try {
      const path =`${DATABASES_DIR}/${dbName}`;

      // Check if database exists
      if (!this.directoryExists(path)) {
        return {
          success: false,
          error: `Failed to deleteDatabase: ${dbName}. Database does not exist`
        };
      }

      // Remove all files and directories

      // TODO: check
      // this.removeDirectoryRecursive(path);
      kuzu.getFS().rmdir(path);

      return {
        success: true,
        message:` Successfully removed directory: ${dbName}`
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to deleteDatabase: ${dbName}. ${error.message}`
      };
    }
  }

  /**
	 * create a Kuzu database
	 * @param {string} dbName - name of the database
	 */
  async createDatabase(dbName) {
    try {
      await kuzu.getFS().mkdir(`${DATABASES_DIR}/${dbName}`);
      return {
        success: true,
        message: 'Successfully created database: ' + dbName ,
      };
    } catch (e) {
      return {
        success: false,
        error: 'Failed creating database with error: ' + e,
      };
    }
  }

  /**
	 * Renames a Kuzu database
	 * @param {string} oldName - Current name of the database
	 * @param {string} newName - New name for the database
	 */
  async renameDatabase(oldName, newName) {
    try {
      if (oldName == newName) {
        return {
          success: true,
          message: `Successfully renamed database from '${oldName}' to '${newName}'`
        };
      }
      const oldPath = `${DATABASES_DIR}/${oldName}`;
      const newPath = `${DATABASES_DIR}/${newName}`;
		
      // Check if source database exists
      if (!this.directoryExists(oldPath)) {
        return {
          success: false,
          error: `Failed to renameDatabase: Database '${oldName}' does not exist`
        };
      }
			
      // Check if target name already exists
      if (this.directoryExists(newPath)) {
        return {
          success: false,
          error: `Failed to renameDatabase: Database '${newName}' already exists`
        };
      }
			
      // Rename the directory
      const fs = kuzu.getFS();
      fs.rename(oldPath, newPath);
			
      return {
        success: true,
        message: `Successfully renamed database from '${oldName}' to '${newName}'`
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to renameDatabase: ${error.message}`
      };
    }
  }

  /**
	 * Opens a connection to an existing database
	 * @param {string} dbName - Name of the database to connect to
	 * @param {Object} options - Database connection options
	 */
  async connectToDatabase(dbName, options = {}) {
    try {
      const path = `${DATABASES_DIR}/${dbName}`;
			
      // Check if database exists
      if (!this.directoryExists(path)) {
        return {
          success: false,
          error: `Failed to connectToDatabase: Database '${dbName}' does not exist`
        };
      }
			
      // Create database connection
      const db = new kuzu.Database(`${DATABASES_DIR}/${path}`);
      const conn = new kuzu.Connection(db);
      this.setConnection(conn);
      this.setHelper(new KuzuGraphHelper(conn));
      this.setDatabase(db);

      return {
        success: true,
        message: `Successfully connected to database '${dbName}'`,
        database: db
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to connectToDatabase: ${dbName}. ${error.message}`
      };
    }
  }

  /**
	 * Closes a database connection, 
	 * intention is 1 active db at a time
	 */
  async disconnectFromDatabase() {
    try {
      const db = this.getDatabase();
      if (!db || db == undefined || db == null || typeof db.close !== 'function') {
        return {
          success: false,
          error: 'Failed to disconnectFromDatabase: Invalid database connection'
        };
      }
		
      db.close();
      this.setDatabase(null);

      return {
        success: true,
        message: 'Successfully disconnected database connection'
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to disconnectFromDatabase: ${error.message}`
      };
    }
  }
	
  /**
	 * Saves the current filesystem state to IndexedDB storage.
	 * 
	 * This function persists any changes made to the filesystem during the current session
	 * by synchronizing from memory to IndexedDB.
	 * 
	 * @returns {Promise<void>} A promise that resolves when the save operation completes successfully
	 * @throws {Error} If the syncfs operation fails, the promise will reject with the error
	 * @example
	 * try {
	 *   await saveIDBFS();
	 *   console.log("Filesystem state saved successfully");
	 * } catch (error) {
	 *   console.error("Failed to save filesystem state:", error);
	 * }
	 */
  async saveIDBFS() {
    await new Promise((resolve, reject) => {
      kuzu.getFS().syncfs(false, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  /**
	 * Loads the filesystem state from IndexedDB storage.
	 * 
	 * This function retrieves the previously saved filesystem state from IndexedDB
	 * and populates the in-memory filesystem with it.
	 * 
	 * @returns {Promise<void>} A promise that resolves when the load operation completes successfully
	 * @throws {Error} If the syncfs operation fails, the promise will reject with the error
	 * @example
	 * try {
	 *   await loadIDBFS();
	 *   console.log("Filesystem state loaded successfully");
	 * } catch (error) {
	 *   console.error("Failed to load filesystem state:", error);
	 * }
	 */
  async loadIDBFS() {
    await new Promise((resolve, reject) => {
      kuzu.getFS().syncfs(true, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  /**
	 * Lists all databases present in the databases directory.
	 * 
	 * This function scans the databases directory and returns an array of all 
	 * subdirectories, which represent individual databases in the system.
	 * Entries that are not directories or cannot be accessed are skipped.
	 * 
	 * @returns {Object} Result object containing:
	 *   - success {boolean} - Whether the operation was successful
	 *   - directories {Array<string>} - Array of database names (directory names) if successful
	 *   - error {string} - Error message if operation failed
	 * @example
	 * const result = listDatabases();
	 * if (result.success) {
	 *   console.log("Available databases:", result.directories);
	 * } else {
	 *   console.error("Failed to list databases:", result.error);
	 * }
	 */
  listDatabases() {
    try {
      const entries = kuzu.getFS().readdir(DATABASES_DIR);
      const directories = [];
            
      for (const entry of entries) {
        if (entry === '.' || entry === '..') continue;
              
        try {
          const fullPath = `${DATABASES_DIR}/${entry}`;
          const stats = kuzu.getFS().stat(fullPath);
                
          // Check if it's a directory
          if (kuzu.getFS().isDir(stats.mode)) {
            directories.push(entry);
          }
        } catch (entryError) {
          console.warn(`Error accessing entry "${entry}": ${entryError.message}`);
        }
      }
      return {
        success: true,
        databases: directories
      };
    } catch (error) {
      console.error(`Failed to list databases in ${DATABASES_DIR}: ${error.message}`);
      return {
        success: false,
        error: error.message,
        databases: []
      };
    }
  }

  /**
	 * Clears all database directories from the designated storage location.
	 * 
	 * @async
	 * @function clearAllDatabases
	 * @description Removes all database directories found within the DATABASES_DIR path,
	 *              effectively resetting the database environment.
	 * 
	 * @returns {Promise<Object>} A promise that resolves to an object containing operation results
	 * @returns {boolean} returns.success - Indicates whether the operation was successful
	 * @returns {string} [returns.message] - Success message (when success is true)
	 * @returns {string} [returns.error] - Error message (when success is false)
	 * 
	 * @throws {Error} Internally catches all errors and returns failure object instead of throwing
	 * 
	 * @example
	 * // Clear all databases and handle the result
	 * const result = await clearAllDatabases();
	 * if (result.success) {
	 *   console.log(result.message);
	 * } else {
	 *   console.error(`Operation failed: ${result.error}`);
	 * }
	 */
  async clearAllDatabases() {
    try {
      const entries = kuzu.getFS().readdir(DATABASES_DIR);
            
      for (const entry of entries) {
        if (entry === '.' || entry === '..') continue;
              
        try {
          const fullPath = `${DATABASES_DIR}/${entry}`;
          const stats = kuzu.getFS().stat(fullPath);
                
          // Check if it's a directory
          if (kuzu.getFS().isDir(stats.mode)) {
            kuzu.getFS().rmdir(fullPath);
          }
        } catch (entryError) {
          console.warn(`Error accessing entry "${entry}": ${entryError.message}`);
        }
      }
      return {
        success: true,
        message: 'Successfully clear all databases',
      };
    } catch (error) {
      console.error(`Failed to clear databases in ${DATABASES_DIR}: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
	 * Initializes the Kuzu database system.
	 * 
	 * This function performs the following initialization steps:
	 * 1. Initializes the Kuzu engine if not already initialized
	 * 2. Creates the databases directory if it doesn't exist
	 * 3. Mounts the IndexedDB filesystem to provide persistence
	 * 4. Loads any previously saved filesystem state
	 * 
	 * The function is idempotent - calling it multiple times will only perform 
	 * initialization once.
	 * 
	 * @returns {Promise<boolean>} A promise that resolves to true if initialization was successful
	 * @throws {Error} If any initialization step fails
	 * @example
	 * try {
	 *   await initialize();
	 *   console.log("Kuzu database system initialized successfully");
	 * } catch (error) {
	 *   console.error("Failed to initialize Kuzu:", error);
	 * }
	 */
  async initialize() {
    if (this.initialized) {
      console.log('Kuzu already initialized, skipping');
      return true;
    }
        
    try {
      console.log('Starting Kuzu persistent initialization');
      await kuzu.init();
      console.log('Kuzu version:', kuzu.getVersion());
    
      // Logic: 
      // Initializes, initialize databse folder if it has not existed
      // console.log(kuzu.getFS());

      if (!this.directoryExists(DATABASES_DIR)) {
        await kuzu.getFS().mkdir(DATABASES_DIR);
      }
      await kuzu.getFS().mount(kuzu.getFS().filesystems.IDBFS, {}, DATABASES_DIR);
      await this.loadIDBFS();
      this.initialized = true;
            
    } catch (error) {
      console.error('Failed Kuzu initialization:', error); 
      throw error;
    }
  }
}