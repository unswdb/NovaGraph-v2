export = Database;
declare class Database {
  /**
   * Initialize a new Database object.
   *
   * @param {String} databasePath path to the database file. If the path is not
   * specified, or empty, or equal to`:memory:`, the database will be created in
   * memory.
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
  _database: any;
  _isClosed: boolean;
  /**
   * Close the database.
   */
  close(): void;
}
