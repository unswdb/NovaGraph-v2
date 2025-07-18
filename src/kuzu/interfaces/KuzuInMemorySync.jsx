import React, { useEffect, useState } from 'react';
import KuzuInMemoryService from '../../services/KuzuInMemoryService';
import { 
    DEMO_SCHEMA, 
    DEMO_PEOPLE, 
    DEMO_POSTS, 
    DEMO_FOLLOWS, 
    DEMO_POSTS_AUTHORSHIP, 
    DEMO_LIKES 
} from '../constants/demo-data';

const KuzuInMemorySync = React.memo(({ onGraphLoaded }) => {
    const [status, setStatus] = useState('Initializing Kuzu...');
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [queryText, setQueryText] = useState('');
    const [rawResults, setRawResults] = useState(null);
    const [activeSection, setActiveSection] = useState(null);
    const [service] = useState(() => new KuzuInMemoryService());

    useEffect(() => {
        async function init() {
            try {
                await service.initialize();
                setStatus('Kuzu ready. You can create the schema and run queries.');
                if (onGraphLoaded) {
                    onGraphLoaded(service.db, service.connection);
                }
            } catch (err) {
                setError(err.message);
            }
        }
        init();
        
        // Cleanup on unmount
        return () => service.cleanup();
    }, []);

});

export default KuzuInMemorySync; 

