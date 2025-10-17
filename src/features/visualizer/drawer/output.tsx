import ExportDropdownButton from "../export/export-dropdown-button";

import CodeOutputTabs from "./tabs";

import type {
  BaseGraphAlgorithm,
  BaseGraphAlgorithmResult,
} from "../algorithms/implementations";

export default function OutputTabContent({
  activeAlgorithm,
  activeResponse,
  tabControls,
}: {
  activeAlgorithm: BaseGraphAlgorithm | null;
  activeResponse: BaseGraphAlgorithmResult | null;
  tabControls: { problemsLen: number; enableOutput: boolean };
}) {
  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex-1 basis-0 min-h-0 overflow-y-auto">
        {!!activeAlgorithm &&
          !!activeResponse &&
          activeAlgorithm.output(activeResponse)}
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
