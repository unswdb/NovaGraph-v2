import { useMemo, useState } from "react";
import { Maximize2 } from "lucide-react";
import { DialogDescription, DialogTitle } from "@radix-ui/react-dialog";

import type { BaseGraphAlgorithm } from "../algorithms/implementations";
import { QueryOutput } from "../queries";
import ExportDropdownButton from "../export/export-dropdown-button";
import {
  isAlgorithmVisualizationResult,
  isQueryVisualizationResult,
  type VisualizationResponse,
} from "../types";

import CodeOutputTabs from "./tabs";

import { Button } from "~/components/ui/button";
import { Dialog, DialogContent, DialogHeader } from "~/components/ui/dialog";

export default function OutputTabContent({
  activeAlgorithm,
  activeResponse,
  enableOutput,
}: {
  activeAlgorithm: BaseGraphAlgorithm | null;
  activeResponse: VisualizationResponse | null;
  enableOutput: boolean;
}) {
  const [isFullScreen, setIsFullScreen] = useState(false);

  const outputContent = useMemo(() => {
    if (!activeResponse) {
      return (
        <div className="flex items-center justify-center h-full text-typography-tertiary small-body">
          No output to display. Run a query or algorithm to see results.
        </div>
      );
    }
    if (!!activeAlgorithm && isAlgorithmVisualizationResult(activeResponse)) {
      return activeAlgorithm.output(activeResponse);
    }
    if (isQueryVisualizationResult(activeResponse)) {
      return <QueryOutput data={activeResponse.queryData} />;
    }
    return null;
  }, [activeAlgorithm, activeResponse]);

  const dialogTitle = useMemo(() => {
    if (!activeResponse) {
      return "Output";
    }
    if (!!activeAlgorithm && isAlgorithmVisualizationResult(activeResponse)) {
      return activeAlgorithm.title + " Result";
    }
    if (isQueryVisualizationResult(activeResponse)) {
      const queryLength =
        activeResponse.queryData.successQueries.length +
        activeResponse.queryData.failedQueries.length;
      return `Query Results (${queryLength} ${
        queryLength === 1 ? "query" : "queries"
      } processed)`;
    }
    return "Output";
  }, [activeAlgorithm, activeResponse]);

  return (
    <>
      <div className="flex flex-col gap-4 h-full">
        <div className="flex-1 basis-0 min-h-0 overflow-y-auto">
          {outputContent}
        </div>
        <div className="flex flex-wrap-reverse justify-between gap-2">
          <CodeOutputTabs enableOutput={enableOutput} />
          {!!activeResponse && (
            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={() => setIsFullScreen(true)}>
                <Maximize2 /> Fullscreen
              </Button>
              <ExportDropdownButton activeResponse={activeResponse} />
            </div>
          )}
        </div>
      </div>

      <Dialog open={isFullScreen} onOpenChange={setIsFullScreen}>
        <DialogContent className="flex flex-col">
          <DialogHeader>
            <DialogTitle className="font-semibold">{dialogTitle}</DialogTitle>
            <DialogDescription className="hidden">
              Shows the full results from your latest run
            </DialogDescription>
          </DialogHeader>
          {outputContent}
        </DialogContent>
      </Dialog>
    </>
  );
}
