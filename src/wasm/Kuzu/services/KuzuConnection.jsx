import React, { useEffect, useState, useRef } from 'react';
import kuzu from 'kuzu-wasm/sync';

// Custom JSON replacer function to handle BigInt serialization
const customJSONReplacer = (key, value) => {
  // Convert BigInt to String during serialization
  if (typeof value === 'bigint') {
    return value.toString();
  }
  return value;
};

const KuzuConnection = React.memo(({ onGraphLoaded }) => {
    const [status, setStatus] = useState('Initializing Kuzu...');
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [queryText, setQueryText] = useState('');
    const [rawResults, setRawResults] = useState(null);
    const [activeSection, setActiveSection] = useState(null);
    
    // Use refs to track initialization state and store DB references
    const initRef = useRef(false);
    const dbRef = useRef(null);
    const connRef = useRef(null);
    const helperRef = useRef(null);

    // Initialize KuzuDB only once
    useEffect(() => {
        if (initRef.current) {
            console.log("Kuzu already initialized, skipping");
            return;
        }

        async function initKuzu() {
            try {
                console.log("Starting Kuzu initialization");
                
                // Initialize the Kuzu module
                await kuzu.init();
                console.log('Kuzu version:', kuzu.getVersion());
                
                // Create an in-memory database
                const db = new kuzu.Database(':memory:');
                dbRef.current = db;
                console.log('In-memory database created');
                
                // Create a connection to the database
                const connection = new kuzu.Connection(db);
                connRef.current = connection;
                console.log('Connection established');
                
                // Create our helper
                helperRef.current = new KuzuGraphHelper(connection);
                console.log('Graph helper created');
                
                setStatus('Kuzu ready. You can create the schema and run queries.');
                
                // Mark as initialized
                initRef.current = true;
                
                // Pass objects to parent component
                if (onGraphLoaded) {
                    onGraphLoaded(db, connection);
                }
                
            } catch (err) {
                console.error("Failed Kuzu initialization:", err);
                setError(err.message);
            }
        }

        initKuzu();
    }, []); 

    // Execute query function
    const executeQuery = (query) => {
        if (!connRef.current || !query.trim()) {
            return;
        }

        // Clear previous messages
        setError(null);
        setSuccess(null);
        setRawResults(null);

        try {
            console.log("Executing query:", query);

            const result = connRef.current.query(query);
            
            if (!result.isSuccess()) {
                const errorMsg = result.getErrorMessage();
                console.error("Query failed:", errorMsg);
                setError(`Query failed: ${errorMsg}`);
                return false;
            }
            
            console.log("Query results:", result);

            // Try to get objects from result
            try {
                const rows = result.getAllObjects();
                console.log("Query results data:", rows);
                setRawResults(rows);
                
                // Determine query type for success message
                let queryType = "Query";
                if (query.toUpperCase().includes('CREATE')) queryType = "Create";
                if (query.toUpperCase().includes('MATCH')) queryType = "Match";
                if (query.toUpperCase().includes('UPDATE')) queryType = "Update";
                if (query.toUpperCase().includes('DELETE')) queryType = "Delete";
                
                setSuccess(`${queryType} operation successful! Found ${rows.length} results.`);
                return true;
            } catch (e) {
                // Handle queries that don't return data (like CREATE)
                console.log("Query executed successfully (no data returned)");
                
                // Determine query type for success message
                let queryType = "Operation";
                if (query.toUpperCase().includes('CREATE')) queryType = "Create";
                if (query.toUpperCase().includes('UPDATE')) queryType = "Update";
                if (query.toUpperCase().includes('DELETE')) queryType = "Delete";
                
                setSuccess(`${queryType} completed successfully.`);
                return true;
            }
        } catch (err) {
            console.error("Error executing query:", err);
            setError(`Error: ${err.message}`);
            return false;
        }
    };

    // Execute helper function (returns result object)
    const executeHelper = (operation, ...args) => {
        if (!helperRef.current) {
            setError("Helper not initialized");
            return;
        }

        try {
            // Clear previous messages
            setError(null);
            setSuccess(null);
            setRawResults(null);

            console.log(`Executing ${operation} with args:`, args);
            
            const result = helperRef.current[operation](...args);
            
            if (!result.success) {
                console.error(`${operation} failed:`, result.error);
                setError(`${operation} failed: ${result.error}`);
                return false;
            }
            
            console.log(`${operation} results:`, result);
            setRawResults(result.data);
            setSuccess(`${operation} completed successfully! ${result.data ? `Found ${result.data.length} results.` : ''}`);
            return true;
        } catch (err) {
            console.error(`Error in ${operation}:`, err);
            setError(`Error in ${operation}: ${err.message}`);
            return false;
        }
    };

    // Schema setup function
    const setupSchema = () => {
        setActiveSection('schema');
        setSuccess(null);
        setError(null);
        setRawResults(null);

        try {
            // Execute each schema statement
            for (const statement of DEMO_SCHEMA) {
                const result = executeQuery(statement);
                if (!result) {
                    return; // Stop if any query fails
                }
            }
            setSuccess("Schema created successfully!");
        } catch (err) {
            setError(`Error creating schema: ${err.message}`);
        }
    };

    // Data setup function
    const setupData = () => {
        setActiveSection('data');
        setSuccess(null);
        setError(null);
        setRawResults(null);

        try {
            // Create people
            let result;
            for (const person of DEMO_PEOPLE) {
                result = helperRef.current.createNode('Person', person);
                if (!result.success) {
                    setError(`Failed to create person: ${result.error}`);
                    return;
                }
            }

            // Create posts
            for (const post of DEMO_POSTS) {
                result = helperRef.current.createNode('Post', post);
                if (!result.success) {
                    setError(`Failed to create post: ${result.error}`);
                    return;
                }
            }

            // Create follows relationships
            for (const rel of DEMO_FOLLOWS) {
                const query = `
                    MATCH (a:Person), (b:Person)
                    WHERE a.id = ${rel.from} AND b.id = ${rel.to}
                    CREATE (a)-[r:Follows {since: '${rel.since}'}]->(b)
                    RETURN r
                `;
                if (!executeQuery(query)) {
                    return;
                }
            }

            // Create post authorship
            for (const rel of DEMO_POSTS_AUTHORSHIP) {
                const query = `
                    MATCH (a:Person), (p:Post)
                    WHERE a.id = ${rel.person} AND p.id = ${rel.post}
                    CREATE (a)-[r:Created]->(p)
                    RETURN r
                `;
                if (!executeQuery(query)) {
                    return;
                }
            }

            // Create likes
            for (const rel of DEMO_LIKES) {
                const query = `
                    MATCH (a:Person), (p:Post)
                    WHERE a.id = ${rel.person} AND p.id = ${rel.post}
                    CREATE (a)-[r:Likes {timestamp: '${rel.timestamp}'}]->(p)
                    RETURN r
                `;
                if (!executeQuery(query)) {
                    return;
                }
            }

            setSuccess("Sample data created successfully!");
        } catch (err) {
            setError(`Error creating data: ${err.message}`);
        }
    };

    // Find all people
    const findAllPeople = () => {
        setActiveSection('queries');
        executeHelper('findNodes', 'Person');
    };

    // Find person by ID
    const findPersonById = (id = 1) => {
        setActiveSection('queries');
        executeHelper('findNodes', 'Person', { id });
    };

    // Find all posts
    const findAllPosts = () => {
        setActiveSection('queries');
        executeHelper('findNodes', 'Post');
    };

    // Find posts by author
    const findPostsByAuthor = (personId = 1) => {
        setActiveSection('queries');
        executeHelper('executeQuery', `
            MATCH (p:Person)-[:Created]->(post:Post)
            WHERE p.id = ${personId}
            RETURN post.id, post.content, post.timestamp
        `);
    };

    // Find followers
    const findFollowers = (personId = 1) => {
        setActiveSection('queries');
        executeHelper('executeQuery', `
            MATCH (follower:Person)-[:Follows]->(p:Person)
            WHERE p.id = ${personId}
            RETURN follower.id, follower.name, follower.age
        `);
    };

    // Find popular posts
    const findPopularPosts = () => {
        setActiveSection('queries');
        executeHelper('executeQuery', `
            MATCH (p:Post)<-[l:Likes]-()
            RETURN p.id, p.content, COUNT(l) AS likeCount
            ORDER BY likeCount DESC
        `);
    };

    // Find people who like posts by people they follow
    const findEngagements = () => {
        setActiveSection('queries');
        executeHelper('executeQuery', `
            MATCH (p1:Person)-[:Follows]->(p2:Person)-[:Created]->(post:Post)<-[:Likes]-(p1)
            RETURN p1.name AS fan, p2.name AS creator, post.content AS post
        `);
    };

    // Delete all data - careful with this!
    const deleteAllData = () => {
        setActiveSection('danger');
        const confirmed = window.confirm("This will delete ALL data. Are you sure?");
        if (confirmed) {
            // First delete relationships, then nodes
            executeQuery("MATCH ()-[r]-() DELETE r");
            executeQuery("MATCH (n) DELETE n");
            setSuccess("All data deleted successfully");
            setRawResults(null);
        }
    };

    // Get neighbors example
    const getPersonNeighbors = (personId = 1) => {
        setActiveSection('queries');
        executeHelper('getNeighbors', 'Person', { id: personId }, 'both');
    };

    // Recommend similar users
    const recommendSimilarUsers = (personId = 1) => {
        setActiveSection('queries');
        executeHelper('recommendSimilarNodes', 'Person', { id: personId }, 3);
    };

    // Handle form submission
    const handleQuerySubmit = (e) => {
        e.preventDefault();
        executeQuery(queryText);
    };
    
    return (
        <div style={styles.container}>
            <div style={styles.status}>{status}</div>
            
            {error && <div style={styles.error}>{error}</div>}
            {success && <div style={styles.success}>{success}</div>}
            
            <div style={styles.buttonContainer}>
                <button 
                    style={styles.sectionButton} 
                    onClick={setupSchema}
                >
                    1. Create Schema
                </button>
                <button 
                    style={styles.sectionButton} 
                    onClick={setupData}
                >
                    2. Load Sample Data
                </button>
            </div>

            <div style={styles.section}>
                <h3 style={styles.sectionTitle}>Graph Queries</h3>
                <div style={styles.buttonContainer}>
                    <button style={styles.queryButton} onClick={findAllPeople}>
                        Find All People
                    </button>
                    <button style={styles.queryButton} onClick={() => findPersonById(1)}>
                        Find Person (ID: 1)
                    </button>
                    <button style={styles.queryButton} onClick={findAllPosts}>
                        Find All Posts
                    </button>
                    <button style={styles.queryButton} onClick={() => findPostsByAuthor(1)}>
                        Find Posts by Alice
                    </button>
                    <button style={styles.queryButton} onClick={() => findFollowers(1)}>
                        Find Alice's Followers
                    </button>
                    <button style={styles.queryButton} onClick={findPopularPosts}>
                        Find Popular Posts
                    </button>
                    <button style={styles.queryButton} onClick={findEngagements}>
                        Find Engagement Patterns
                    </button>
                </div>
            </div>

            <div style={styles.section}>
                <h3 style={styles.sectionTitle}>Graph Helper Functions</h3>
                <div style={styles.buttonContainer}>
                    <button style={styles.queryButton} onClick={() => getPersonNeighbors(1)}>
                        Get Alice's Neighbors
                    </button>
                    <button style={styles.queryButton} onClick={() => recommendSimilarUsers(1)}>
                        Recommend Similar Users
                    </button>
                </div>
            </div>

            <div style={styles.section}>
                <h3 style={styles.sectionTitle}>Custom Query</h3>
                <form onSubmit={handleQuerySubmit} style={styles.form}>
                    <textarea 
                        value={queryText}
                        onChange={(e) => setQueryText(e.target.value)}
                        placeholder="Enter Kuzu query here..."
                        rows={4}
                        style={styles.textarea}
                    />
                    <button type="submit" style={styles.button}>
                        Run Query
                    </button>
                </form>
            </div>

            <div style={styles.section}>
                <h3 style={styles.sectionTitle}>Danger Zone</h3>
                <div style={styles.buttonContainer}>
                    <button style={styles.deleteButton} onClick={deleteAllData}>
                        Delete All Data
                    </button>
                </div>
            </div>
            
            {rawResults && (
                <div style={styles.resultsContainer}>
                    <pre style={styles.pre}>{JSON.stringify(rawResults, customJSONReplacer, 2)}</pre>
                </div>
            )}
        </div>
    );
});

export default KuzuConnection;