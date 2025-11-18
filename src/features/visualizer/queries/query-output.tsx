import { useMemo } from "react";
import {
  List,
  useDynamicRowHeight,
  type RowComponentProps,
} from "react-window";

import type { ExecuteQueryResult } from "../types";

import { Button } from "~/components/ui/button";
import type {
  ErrorQueryResult,
  SuccessQueryResult,
} from "~/kuzu/helpers/KuzuQueryResultExtractor.types";

function stringifySafe(v: unknown) {
  return JSON.stringify(
    v,
    (_, val) => (typeof val === "bigint" ? String(val) : val),
    2
  );
}

export default function QueryOutput({ data }: { data: ExecuteQueryResult }) {
  const { successQueries, failedQueries, success, message } = data;

  const failedQueryRowHeight = useDynamicRowHeight({
    defaultRowHeight: 16,
  });

  const successQueryRowHeight = useDynamicRowHeight({
    defaultRowHeight: 16,
  });

  return (
    <div className="space-y-4">
      {/* Query Status */}
      <div className="flex items-center gap-2">
        <span
          className={`font-medium text-sm ${
            success ? "text-positive" : "text-critical"
          }`}
        >
          {success ? "✓" : "✗"} {message}
        </span>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 gap-2 text-sm">
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
          <span className="text-typography-secondary">Node Schemas:</span>
          <span className="text-typography-primary font-medium">
            {data.nodeTables?.length || 0}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-typography-secondary">Edge Schemas:</span>
          <span className="text-typography-primary font-medium">
            {data.edgeTables?.length || 0}
          </span>
        </div>
      </div>

      {/* Failed Queries */}
      {failedQueries && failedQueries.length > 0 && (
        <div className="space-y-3 pt-3">
          <h3 className="font-semibold text-critical">
            Failed Queries ({failedQueries.length})
          </h3>
          <List
            rowComponent={FailedQueryRowComponent}
            rowCount={failedQueries.length}
            rowHeight={failedQueryRowHeight}
            rowProps={{ failedQueries: failedQueries }}
          />
        </div>
      )}

      {/* Success Queries */}
      {successQueries && successQueries.length > 0 && (
        <div className="space-y-3 pt-3">
          <h3 className="font-semibold text-positive">
            Success Queries ({successQueries.length})
          </h3>
          <List
            rowComponent={SuccessQueryRowComponent}
            rowCount={successQueries.length}
            rowHeight={successQueryRowHeight}
            rowProps={{ successQueries: successQueries }}
          />
        </div>
      )}
    </div>
  );
}

function FailedQueryRowComponent({
  index,
  style,
  failedQueries,
}: RowComponentProps<{ failedQueries: ErrorQueryResult[] }>) {
  const query = failedQueries[index];
  return (
    <div
      key={index}
      style={style}
      className="bg-critical/10 border border-critical/20 rounded-md p-3 not-first:pt-4"
    >
      <p className="small-body text-critical">{query.message}</p>
    </div>
  );
}

function SuccessQueryRowComponent({
  index,
  style,
  successQueries,
}: RowComponentProps<{ successQueries: SuccessQueryResult[] }>) {
  const query = successQueries[index];
  return (
    <div key={index} style={style} className="space-y-2 not-first:pt-4">
      <div className="text-xs text-typography-secondary">
        Result {index + 1}: {query.objects.length}{" "}
        {query.objects.length === 1 ? "row" : "rows"}
      </div>
      {query.objects.length > 0 && (
        <div className="bg-neutral-low rounded-md p-3 overflow-x-auto">
          <JsonViewer objects={query.objects} />
        </div>
      )}
    </div>
  );
}

function JsonViewer({ objects }: { objects: unknown[] }) {
  const MAX_SIZE = 100 * 1024; // 100 KB

  const { json, size } = useMemo(() => {
    const json = stringifySafe(objects);
    return { json, size: new Blob([json]).size };
  }, [objects]);

  const openInNewTab = () => {
    const blob = new Blob([stringifySafe(objects)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  // Check file size, and show whether to show pre or open in new tab
  return size > MAX_SIZE ? (
    <Button variant="link" className="text-xs" size="sm" onClick={openInNewTab}>
      File is too big. Open JSON in new tab.
    </Button>
  ) : (
    <pre className="text-xs text-typography-primary whitespace-pre-wrap break-words">
      {json}
    </pre>
  );
}
