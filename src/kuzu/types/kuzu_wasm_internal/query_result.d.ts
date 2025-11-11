export = QueryResult;
declare class QueryResult {
  /**
   * Internal constructor. Use `Connection.query` or `Connection.execute`
   * to get a `QueryResult` object.
   * @param {String} id the internal ID of the query result object.
   */
  constructor(id: string);
  _id: string;
  _isClosed: boolean;
  _hasNext: any;
  _hasNextQueryResult: any;
  _isSuccess: any;
  /**
   * Internal function to update the local fields with the values from the
   * worker.
   * @private
   * @throws {Error} if the query result is closed.
   */
  private _syncValues;
  /**
   * Check if the query result is successfully executed.
   * @returns {Boolean} true if the query result is successfully executed.
   */
  isSuccess(): boolean;
  /**
   * Get the error message if the query result is not successfully executed.
   * @returns {String} the error message.
   */
  getErrorMessage(): string;
  /**
   * Reset the iterator of the query result to the beginning.
   * This function is useful if the query result is iterated multiple times.
   */
  resetIterator(): Promise<void>;
  /**
   * Get the number of rows of the query result.
   * @returns {Number} the number of rows of the query result.
   */
  hasNext(): number;
  /**
   * Check if the query result has a following query result when multiple
   * statements are executed within a single query.
   * @returns {Boolean} true if the query result has a following query result.
   */
  hasNextQueryResult(): boolean;
  /**
   * Get the number of columns of the query result.
   * @returns {Number} the number of columns of the query result.
   */
  getNumColumns(): number;
  /**
   * Get the number of rows of the query result.
   * @returns {Number} the number of rows of the query result.
   */
  getNumTuples(): number;
  /**
   * Get the column names of the query result.
   * @returns {Array<String>} the column names of the query result.
   */
  getColumnNames(): Array<string>;
  /**
   * Get the column types of the query result.
   * @returns {Array<String>} the column types of the query result.
   */
  getColumnTypes(): Array<string>;
  /**
   * Get the string representation of the query result.
   * @returns {String} the string representation of the query result.
   */
  toString(): string;
  /**
   * Get the query summary (execution time and compiling time) of the query
   * result.
   * @returns {Object} the query summary of the query result.
   */
  getQuerySummary(): any;
  /**
   * Get the following query result when multiple statements are executed within
   * a single query.
   * @returns {QueryResult} the next query result.
   */
  getNextQueryResult(): QueryResult;
  /**
   * Get the next row of the query result.
   * @returns {Array} the next row of the query result.
   */
  getNext(): any[];
  /**
   * Get all rows of the query result.
   * @returns {Array<Array>} all rows of the query result.
   */
  getAllRows(): Array<any[]>;
  /**
   * Get all objects of the query result.
   * @returns {Array<Object>} all objects of the query result.
   */
  getAllObjects(): Array<any>;
  /**
   * Close the query result.
   */
  close(): Promise<void>;
}
