import type { BaseGraphAlgorithm } from "../algorithms/implementations";
import { QueryOutput } from "../queries";
import ExportDropdownButton from "../export/export-dropdown-button";

import CodeOutputTabs from "./tabs";
import { useMemo, useState } from "react";
import {
  isAlgorithmVisualizationResult,
  isQueryVisualizationResult,
  type VisualizationResponse,
} from "../types";
import { Maximize2 } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Dialog, DialogContent, DialogHeader } from "~/components/ui/dialog";
import { DialogTitle } from "@radix-ui/react-dialog";

export default function OutputTabContent({
  activeAlgorithm,
  activeResponse,
  tabControls,
}: {
  activeAlgorithm: BaseGraphAlgorithm | null;
  activeResponse: VisualizationResponse | null;
  tabControls: { problemsLen: number; enableOutput: boolean };
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
      return "Query Result";
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
          <CodeOutputTabs {...tabControls} />
          {!!activeResponse && (
            <>
              <Button variant="ghost" onClick={() => setIsFullScreen(true)}>
                <Maximize2 /> Full Screen
              </Button>
              <ExportDropdownButton activeResponse={activeResponse} />
            </>
          )}
        </div>
      </div>

      <Dialog open={isFullScreen} onOpenChange={setIsFullScreen}>
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
        </DialogHeader>
        <DialogContent>{outputContent}</DialogContent>
      </Dialog>
    </>
  );
}
