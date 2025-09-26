// @ts-ignore
import kuzu from 'kuzu-wasm/sync';
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
            
            this.db = new kuzu.Database(':memory:');
            console.log('In-memory database created');
            
            // Create a connection to the database
            this.connection = new kuzu.Connection(this.db);
            console.log('Connection established');
            
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


// @ts-ignore 'kuzu-wasm/sync' is a JS api file from kuzu-wasm node module