import kuzu from 'kuzu-wasm/sync';
import KuzuGraphHelper from '../helpers/KuzuGraphHelper';
import KuzuBaseService from './KuzuBaseService';

export default class KuzuInMemorySync extends KuzuBaseService {
    constructor() {
        super();
    }

    async initialize() {
        if (this.initialized) {
            console.log("Kuzu already initialized, skipping");
            return true;
        }

        try {
            console.log("Starting Kuzu in-memory initialization");
            
            // Initialize the Kuzu module
            await kuzu.init();
            console.log('Kuzu version:', kuzu.getVersion());
            
            // Create an in-memory database
            this.db = new kuzu.Database(':memory:');
            console.log('In-memory database created');
            
            // Create a connection to the database
            this.connection = new kuzu.Connection(this.db);
            console.log('Connection established');
            
            // Create our helper and bind the query executor
            this.helper = new KuzuGraphHelper(this.connection);
            
            // Bind the executeQuery method from this service to the helper
            // This creates a clean dependency - the helper uses the service's execution logic
            this.helper.setQueryExecutor(this.executeQuery.bind(this));
            
            console.log('Graph helper created and linked');
            
            this.initialized = true;
            return true;
        } catch (err) {
            console.error("Failed Kuzu initialization:", err);
            throw err;
        }
    }

    cleanup() {
        if (this.connection) {
            this.connection.close();
        }
        if (this.db) {
            this.db.close();
        }
        this.initialized = false;
    }
}