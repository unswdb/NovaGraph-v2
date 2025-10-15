export = PreparedStatement;
declare class PreparedStatement {
    /**
     * Internal constructor. Use `Connection.prepare` to get a
     * `PreparedStatement` object.
     * @param {kuzu.sync.PreparedStatement} _preparedStatement the native prepared
     * statement object.
     */
    constructor(_preparedStatement: kuzu.sync.PreparedStatement);
    _statement: kuzu.sync.PreparedStatement;
    _isClosed: boolean;
    /**
     * Internal function to check if the prepared statement is closed.
     * @throws {Error} if the prepared statement is closed.
     * @private
     */
    private _checkPreparedStatement;
    /**
     * Check if the prepared statement is successfully prepared.
     * @returns {Boolean} true if the prepared statement is successfully prepared.
     * @throws {Error} if the prepared statement is closed.
     */
    isSuccess(): boolean;
    /**
     * Get the error message if the prepared statement is not successfully
     * prepared.
     * @returns {String} the error message.
     * @throws {Error} if the prepared statement is closed.
     */
    getErrorMessage(): string;
    /**
     * Close the prepared statement.
     * @throws {Error} if the prepared statement is closed.
     */
    close(): void;
}
