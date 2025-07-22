import CodeOutputTabs from "./tabs";
import type {
  BaseGraphAlgorithm,
  BaseGraphAlgorithmResult,
} from "../algorithms/implementations";

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
      <div className="flex-1">
        {!!activeAlgorithm &&
          !!activeResponse &&
          activeAlgorithm.output(activeResponse)}
      </div>
      <div className="flex justify-between">
        <CodeOutputTabs enableOutput={enableOutput} />
        {/* TODO: Export */}
      </div>
    </div>
  );
}
