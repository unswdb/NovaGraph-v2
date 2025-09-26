export = PreparedStatement;
declare class PreparedStatement {
    /**
     * Internal constructor. Use `Connection.prepare` to get a
     * `PreparedStatement` object.
     * @param {String} id the internal ID of the prepared statement object.
     * statement object.
     */
    constructor(id: string);
    _id: string;
    _isClosed: boolean;
    _isSuccess: any;
    /**
     * Internal function to update the local fields with the values from the
     * worker.
     * @private
     * @throws {Error} if the prepared statement is closed.
     */
    private _syncValues;
    /**
     * Check if the prepared statement is successfully prepared.
     * @returns {Boolean} true if the prepared statement is successfully
     * prepared.
     */
    isSuccess(): boolean;
    /**
     * Get the error message if the prepared statement is not successfully
     * prepared.
     * @returns {String} the error message.
     */
    getErrorMessage(): string;
    /**
     * Close the prepared statement.
     * @throws {Error} if the prepared statement is closed.
     */
    close(): Promise<void>;
}
