import CodeOutputTabs from "./tabs";
import type {
  BaseGraphAlgorithm,
  BaseGraphAlgorithmResult,
} from "../algorithms/implementations";
import ExportDropdownButton from "../export/export-dropdown-button";

export default function OutputTabContent({
  activeAlgorithm,
  activeResponse,
  enableOutput = !!activeAlgorithm && !!activeResponse,
}: {
  activeAlgorithm: BaseGraphAlgorithm | null;
  activeResponse: BaseGraphAlgorithmResult | null;
  enableOutput?: boolean;
}) {
  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="h-38 overflow-auto">
        {!!activeAlgorithm &&
          !!activeResponse &&
          activeAlgorithm.output(activeResponse)}
      </div>
      <div className="flex justify-between gap-2 flex-wrap">
        <CodeOutputTabs enableOutput={enableOutput} />
        {!!activeResponse && (
          <ExportDropdownButton activeResponse={activeResponse} />
        )}
      </div>
    </div>
  );
}
