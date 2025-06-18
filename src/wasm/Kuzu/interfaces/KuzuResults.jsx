import React, { useState } from 'react';

// Simple component to display query results with expandable view
const KuzuResults = ({ results, query }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (!results || results.length === 0) {
    return null;
  }

  // Inline styles for the component
  const styles = {
    container: {
      backgroundColor: '#2d2d2d',
      borderRadius: '6px',
      margin: '16px 0',
      padding: '16px',
      border: '1px solid #444',
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '12px',
    },
    title: {
      margin: 0,
      fontSize: '16px',
      color: '#ddd',
    },
    button: {
      backgroundColor: '#444',
      color: '#fff',
      border: 'none',
      padding: '6px 12px',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '12px',
    },
    queryText: {
      backgroundColor: '#1e1e1e',
      padding: '12px',
      borderRadius: '4px',
      marginBottom: '12px',
      overflowX: 'auto',
    },
    code: {
      color: '#9cdcfe',
      fontFamily: 'monospace',
      whiteSpace: 'pre-wrap',
    },
    preview: {
      maxHeight: '200px',
      overflowY: 'auto',
      backgroundColor: '#1e1e1e',
      padding: '12px',
      borderRadius: '4px',
      color: '#ddd',
      margin: 0,
      fontFamily: 'monospace',
    },
    tableContainer: {
      overflowX: 'auto',
      maxHeight: '500px',
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
    },
    th: {
      backgroundColor: '#333',
      color: '#fff',
      textAlign: 'left',
      padding: '8px 12px',
      fontWeight: '600',
      position: 'sticky',
      top: 0,
    },
    td: {
      padding: '8px 12px',
      borderTop: '1px solid #444',
      color: '#ddd',
    },
    evenRow: {
      backgroundColor: '#2a2a2a',
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={styles.title}>Query Results: {results.length} row(s)</h3>
        <button 
          style={styles.button}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? 'Collapse' : 'Expand'}
        </button>
      </div>
      
      {query && (
        <div style={styles.queryText}>
          <div style={styles.code}>{query}</div>
        </div>
      )}
      
      {isExpanded ? (
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                {Object.keys(results[0]).map((key) => (
                  <th key={key} style={styles.th}>{key}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {results.map((row, rowIndex) => (
                <tr key={rowIndex} style={rowIndex % 2 === 1 ? styles.evenRow : {}}>
                  {Object.values(row).map((value, colIndex) => (
                    <td key={colIndex} style={styles.td}>
                      {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <pre style={styles.preview}>
          {JSON.stringify(results.slice(0, 3), null, 2)}
          {results.length > 3 && "\n...and " + (results.length - 3) + " more rows"}
        </pre>
      )}
    </div>
  );
};

export default KuzuResults;