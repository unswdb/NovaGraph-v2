export = Database;
declare class Database {
  /**
   * Initialize a new Database object. Note that the initialization is done
   * lazily, so the database file is not opened until the first query is
   * executed. To initialize the database immediately, call the `init()`
   * function on the returned object.
   *
   * @param {String} databasePath path to the database file. If the path is not
   * specified, or empty, or equal to `:memory:`, the database will be created
   * in memory.
   * @param {Number} bufferManagerSize size of the buffer manager in bytes.
   * @param {Boolean} enableCompression whether to enable compression.
   * @param {Boolean} readOnly if true, database will be opened in read-only
   * mode.
   * @param {Boolean} autoCheckpoint if true, automatic checkpointing will be
   * enabled.
   * @param {Number} checkpointThreshold threshold for automatic checkpointing
   * in bytes. Default is 16MB.
   */
  constructor(
    databasePath: string,
    bufferPoolSize?: number,
    maxNumThreads?: number,
    enableCompression?: boolean,
    readOnly?: boolean,
    autoCheckpoint?: boolean,
    checkpointThreshold?: number
  );
  _isInitialized: boolean;
  _initPromise: Promise<void>;
  _id: any;
  _isClosed: boolean;
  databasePath: string;
  bufferPoolSize: number;
  maxNumThreads: number;
  enableCompression: boolean;
  readOnly: boolean;
  autoCheckpoint: boolean;
  checkpointThreshold: number;
  /**
   * Initialize the database. Calling this function is optional, as the
   * database is initialized automatically when the first query is executed.
   */
  init(): Promise<void>;
  /**
   * Internal function to get the database object ID.
   * @private
   * @throws {Error} if the database is closed.
   */
  private _getDatabaseObjectId;
  /**
   * Close the database.
   */
  close(): Promise<void>;
}
