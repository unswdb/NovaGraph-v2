export = QueryResult;
declare class QueryResult {
  /**
   * Internal constructor. Use `Connection.query` or `Connection.execute`
   * to get a `QueryResult` object.
   * @param {kuzu.sync.QueryResult} _queryResult the native query result object.
   */
  constructor(_queryResult: kuzu.sync.QueryResult, _isClosable?: boolean);
  _result: kuzu.sync.QueryResult;
  _isClosed: boolean;
  _isClosable: boolean;
  /**
   * Internal function to check if the query result is closed.
   * @throws {Error} if the query result is closed.
   * @private
   */
  private _checkQueryResult;
  /**
   * Check if the query result is successfully executed.
   * @returns {Boolean} true if the query result is successfully executed.
   * @throws {Error} if the query result is closed.
   */
  isSuccess(): boolean;
  /**
   * Get the error message if the query result is not successfully executed.
   * @returns {String} the error message.
   * @throws {Error} if the query result is closed.
   */
  getErrorMessage(): string;
  /**
   * Reset the iterator of the query result to the beginning.
   * This function is useful if the query result is iterated multiple times.
   * @throws {Error} if the query result is closed.
   */
  resetIterator(): void;
  /**
   * Get the number of rows of the query result.
   * @returns {Number} the number of rows of the query result.
   * @throws {Error} if the query result is closed.
   */
  hasNext(): number;
  /**
   * Check if the query result has a following query result when multiple
   * statements are executed within a single query.
   * @returns {Boolean} true if the query result has a following query result.
   * @throws {Error} if the query result is closed.
   */
  hasNextQueryResult(): boolean;
  /**
   * Get the number of columns of the query result.
   * @returns {Number} the number of columns of the query result.
   * @throws {Error} if the query result is closed.
   */
  getNumColumns(): number;
  /**
   * Get the number of rows of the query result.
   * @returns {Number} the number of rows of the query result.
   * @throws {Error} if the query result is closed.
   */
  getNumTuples(): number;
  /**
   * Get the column names of the query result.
   * @returns {Array<String>} the column names of the query result.
   * @throws {Error} if the query result is closed.
   */
  getColumnNames(): Array<string>;
  /**
   * Get the column types of the query result.
   * @returns {Array<String>} the column types of the query result.
   * @throws {Error} if the query result is closed.
   */
  getColumnTypes(): Array<string>;
  /**
   * Get the string representation of the query result.
   * @returns {String} the string representation of the query result.
   * @throws {Error} if the query result is closed.
   */
  toString(): string;
  /**
   * Get the query summary (execution time and compiling time) of the query
   * result.
   * @returns {Object} the query summary of the query result.
   * @throws {Error} if the query result is closed.
   */
  getQuerySummary(): any;
  /**
   * Get the following query result when multiple statements are executed within
   * a single query.
   * @returns {QueryResult} the next query result.
   * @throws {Error} if the query result is closed.
   */
  getNextQueryResult(): QueryResult;
  /**
   * Get the next row of the query result.
   * @returns {Array} the next row of the query result.
   * @throws {Error} if the query result is closed.
   */
  getNext(): any[];
  /**
   * Get all rows of the query result.
   * @returns {Array<Array>} all rows of the query result.
   * @throws {Error} if the query result
   */
  getAllRows(): Array<any[]>;
  /**
   * Get all objects of the query result.
   * @returns {Array<Object>} all objects of the query result.
   * @throws {Error} if the query result is closed.
   */
  getAllObjects(): Array<any>;
  /**
   * Close the query result.
   */
  close(): void;
}
