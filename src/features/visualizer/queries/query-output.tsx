import type { ExecuteQueryResult } from "../types";

export default function QueryOutput({ data }: { data: ExecuteQueryResult }) {
  const { successQueries, failedQueries, success, message } = data;

  return (
    <div className="space-y-4">
      {/* Query Status */}
      <div className="flex items-center gap-2">
        <span
          className={`text-sm font-medium ${
            success ? "text-positive" : "text-critical"
          }`}
        >
          {success ? "✓" : "✗"} {message}
        </span>
      </div>

      {/* Success Queries */}
      {successQueries && successQueries.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-typography-primary">
            Query Results ({successQueries.length}{" "}
            {successQueries.length === 1 ? "query" : "queries"})
          </h3>
          {successQueries.map((query, index) => (
            <div key={index} className="space-y-2">
              <div className="text-xs text-typography-secondary">
                Result {index + 1}: {query.objects.length}{" "}
                {query.objects.length === 1 ? "row" : "rows"}
              </div>
              {query.objects.length > 0 && (
                <div className="bg-neutral-low rounded-md p-3 overflow-x-auto">
                  <pre className="text-xs text-typography-primary whitespace-pre-wrap break-words">
                    {JSON.stringify(
                      query.objects,
                      (key, value) =>
                        typeof value === "bigint" ? value.toString() : value,
                      2
                    )}
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Failed Queries */}
      {failedQueries && failedQueries.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-critical">
            Failed Queries ({failedQueries.length})
          </h3>
          {failedQueries.map((query, index) => (
            <div
              key={index}
              className="bg-critical/10 border border-critical/20 rounded-md p-3"
            >
              <p className="text-xs text-critical">{query.message}</p>
            </div>
          ))}
        </div>
      )}

      {/* Statistics */}
      <div className="border-t border-border pt-3 space-y-2">
        <h3 className="text-sm font-semibold text-typography-primary">
          Statistics
        </h3>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex justify-between">
            <span className="text-typography-secondary">Nodes:</span>
            <span className="text-typography-primary font-medium">
              {data.nodes?.length || 0}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-typography-secondary">Edges:</span>
            <span className="text-typography-primary font-medium">
              {data.edges?.length || 0}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-typography-secondary">Node Tables:</span>
            <span className="text-typography-primary font-medium">
              {data.nodeTables?.length || 0}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-typography-secondary">Edge Tables:</span>
            <span className="text-typography-primary font-medium">
              {data.edgeTables?.length || 0}
            </span>
          </div>
          <div className="flex justify-between col-span-2">
            <span className="text-typography-secondary">
              Highlighted Elements:
            </span>
            <span className="text-typography-primary font-medium">
              {data.colorMap ? Object.keys(data.colorMap).length : 0}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
