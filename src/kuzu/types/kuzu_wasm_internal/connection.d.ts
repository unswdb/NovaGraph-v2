export = Connection;
declare class Connection {
  /**
   * Initialize a new Connection object. Note that the initialization is done
   * lazily, so the connection is not initialized until the first query is
   * executed. To initialize the connection immediately, call the `init()`
   * function on the returned object.
   * @param {kuzu.Database} database the database object to connect to.
   * @param {Number} numThreads the maximum number of threads to use for query
   * execution.
   */
  constructor(database: kuzu.Database, numThreads?: number);
  _isInitialized: boolean;
  _initPromise: Promise<void>;
  _id: any;
  _isClosed: boolean;
  _database: kuzu.Database;
  numThreads: number;
  /**
   * Initialize the connection. Calling this function is optional, as the
   * connection is initialized automatically when the first query is executed.
   */
  init(): Promise<void>;
  /**
   * Internal function to get the connection object ID.
   * @private
   * @throws {Error} if the connection is closed.
   */
  private _getConnectionObjectId;
  /**
   * Set the maximum number of threads to use for query execution.
   * @param {Number} numThreads the maximum number of threads to use for query
   * execution.
   */
  setMaxNumThreadForExec(numThreads: number): Promise<void>;
  /**
   * Set the query timeout in milliseconds.
   * @param {Number} timeout the query timeout in milliseconds.
   */
  setQueryTimeout(timeout: number): Promise<void>;
  /**
   * Get the maximum number of threads to use for query execution.
   * @returns {Number} the maximum number of threads to use for query execution.
   */
  getMaxNumThreadForExec(): number;
  /**
   * Execute a query.
   * @param {String} statement the statement to execute.
   * @returns {kuzu.QueryResult} the query result.
   */
  query(statement: string): kuzu.QueryResult;
  /**
   * Prepare a statement for execution.
   * @param {String} statement the statement to prepare.
   * @returns {kuzu.PreparedStatement} the prepared statement.
   */
  prepare(statement: string): kuzu.PreparedStatement;
  /**
   * Execute a prepared statement.
   * @param {kuzu.sync.PreparedStatement} preparedStatement the prepared
   * statement to execute.
   * @param {Object} params a plain object mapping parameter names to values.
   * @returns {kuzu.QueryResult} the query result.
   */
  execute(
    preparedStatement: kuzu.sync.PreparedStatement,
    params?: any
  ): kuzu.QueryResult;
  /**
   * Close the connection.
   */
  close(): Promise<void>;
}
