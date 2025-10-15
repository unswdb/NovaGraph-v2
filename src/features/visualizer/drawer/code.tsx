import { useMemo, useState } from "react";
import { useStore } from "../hooks/use-store";
import { Button } from "~/components/ui/button";
import CodeOutputTabs from "./tabs";
import CodeEditor from "../../../components/ui/code-editor";
import CopyButton from "~/components/ui/code-editor/copy-button";

export default function CodeTabContent({
  enableOutput,
}: {
  enableOutput: boolean;
}) {
  // States
  const [code, setCode] = useState("");

  // Hooks
  const store = useStore();

  // Memoised value
  const isReadyToSubmit = useMemo(() => !!code, [code]);

  // Handle query result (error and success state and colorMap)
  const handleRunQuery = async () => {
    const result = await store.controller.db.executeQuery(code);
    if (
      !!result.nodes &&
      !!result.edges &&
      !!result.nodeTables &&
      !!result.edgeTables
    ) {
      store.setGraphState({
        nodes: result.nodes,
        edges: result.edges,
        nodeTables: result.nodeTables,
        edgeTables: result.edgeTables,
      });
    }
  };

  return (
    <div className="flex flex-col gap-4 h-full">
      <CodeEditor code={code} setCode={setCode} />
      <div className="flex flex-wrap justify-between gap-2">
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
