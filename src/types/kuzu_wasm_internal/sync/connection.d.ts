export = Connection;
declare class Connection {
    /**
     * Initialize a new Connection object.
     *
     * @param {kuzu.sync.Database} database the database object to connect to.
     * @param {Number} numThreads the maximum number of threads to use for query
     * execution.
     */
    constructor(database: kuzu.sync.Database, numThreads?: number);
    _connection: any;
    _isClosed: boolean;
    /**
     * Internal function to check if the connection is closed.
     * @throws {Error} if the connection is closed.
     * @private
     */
    private _checkConnection;
    /**
     * Set the maximum number of threads to use for query execution.
     * @param {Number} numThreads the maximum number of threads to use for query
     * execution.
     * @throws {Error} if the connection is closed.
     * @throws {Error} if numThreads is not a positive integer.
     */
    setMaxNumThreadForExec(numThreads: number): void;
    _numThreads: number;
    /**
     * Set the query timeout in milliseconds.
     * @param {Number} timeout the query timeout in milliseconds.
     * @throws {Error} if the connection is closed.
     * @throws {Error} if timeout is not a positive integer.
     */
    setQueryTimeout(timeout: number): void;
    /**
     * Get the maximum number of threads to use for query execution.
     * @returns {Number} the maximum number of threads to use for query execution.
     * @throws {Error} if the connection is closed.
     */
    getMaxNumThreadForExec(): number;
    /**
     * Execute a query.
     * @param {String} statement the statement to execute.
     * @returns {kuzu.sync.QueryResult} the query result.
     * @throws {Error} if the connection is closed.
     * @throws {Error} if statement is not a string.
     */
    query(statement: string): kuzu.sync.QueryResult;
    /**
     * Prepare a statement for execution.
     * @param {String} statement the statement to prepare.
     * @returns {Promise<kuzu.sync.PreparedStatement>} the prepared statement.
     */
    prepare(statement: string): Promise<kuzu.sync.PreparedStatement>;
    /**
     * Execute a prepared statement.
     * @param {kuzu.sync.PreparedStatement} preparedStatement the prepared
     * statement to execute.
     * @param {Object} params a plain object mapping parameter names to values.
     * @returns {kuzu.sync.QueryResult} the query result.
     * @throws {Error} if the connection is closed.
     * @throws {Error} if preparedStatement is not a valid PreparedStatement
     * object.
     * @throws {Error} if preparedStatement is not successful.
     * @throws {Error} if params is not a plain object.
     */
    execute(preparedStatement: kuzu.sync.PreparedStatement, params?: any): kuzu.sync.QueryResult;
    /**
     * Close the connection.
     */
    close(): void;
}
