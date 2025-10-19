import type { BaseGraphAlgorithm } from "../algorithms/implementations";
import type { VisualizationResponse } from "../store";
import { QueryOutput } from "../queries";
import ExportDropdownButton from "../export/export-dropdown-button";

import CodeOutputTabs from "./tabs";

export default function OutputTabContent({
  activeAlgorithm,
  activeResponse,
  tabControls,
}: {
  activeAlgorithm: BaseGraphAlgorithm | null;
  activeResponse: VisualizationResponse | null;
  tabControls: { problemsLen: number; enableOutput: boolean };
}) {
  // Check if this is a query result by type discriminator
  const isQueryResult = activeResponse && 'type' in activeResponse && activeResponse.type === 'query';
  
  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex-1 basis-0 min-h-0 overflow-y-auto">
        {/* Display algorithm output */}
        {!!activeAlgorithm && !!activeResponse && !isQueryResult && (
          activeAlgorithm.output(activeResponse)
        )}
        
        {/* Display query result output */}
        {isQueryResult && (
          <QueryOutput data={activeResponse.queryData} />
        )}
        
        {/* No output available */}
        {!activeResponse && (
          <div className="flex items-center justify-center h-full text-typography-tertiary text-sm">
            No output to display. Run a query or algorithm to see results.
          </div>
        )}
      </div>
      <div className="flex flex-wrap-reverse justify-between gap-2">
        <CodeOutputTabs {...tabControls} />
        {!!activeResponse && (
          <ExportDropdownButton activeResponse={activeResponse} />
        )}
      </div>
    </div>
  );
}
