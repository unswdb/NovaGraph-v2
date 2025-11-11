import { useMemo } from "react";

import CodeEditor from "../../../components/ui/code-editor";
import type { ExecuteQueryResult } from "../types";

import CodeOutputTabs from "./tabs";

import { Button } from "~/components/ui/button";
import CopyButton from "~/components/ui/code-editor/copy-button";

export default function CodeTabContent({
  code,
  setCode,
  runQuery,
  onSuccessQuery,
  onErrorQuery,
  enableOutput,
}: {
  code: string;
  setCode: (s: string) => void;
  runQuery: (query: string) => Promise<ExecuteQueryResult>;
  onSuccessQuery: (r: ExecuteQueryResult) => void;
  onErrorQuery: (r: ExecuteQueryResult) => void;
  enableOutput: boolean;
}) {
  // Memoised value
  const isReadyToSubmit = useMemo(() => !!code, [code]);

  // Handle query result (error and success state and colorMap)
  const handleRunQuery = async () => {
    const result = await runQuery(code);
    if (!result.success) {
      onErrorQuery(result);
      return;
    }
    onSuccessQuery(result);
  };

  return (
    <div className="flex flex-col gap-4 h-full">
      <CodeEditor
        code={code}
        setCode={setCode}
        className="flex-1 basis-0 min-h-0"
      />
      <div className="flex flex-wrap-reverse justify-between gap-2">
        <CodeOutputTabs enableOutput={enableOutput} />
        <div className="flex items-center gap-2">
          <CopyButton variant="ghost" value={code} />
          <Button
            type="submit"
            onClick={handleRunQuery}
            disabled={!isReadyToSubmit}
            className="flex-1"
          >
            Run Query
          </Button>
        </div>
      </div>
    </div>
  );
}
