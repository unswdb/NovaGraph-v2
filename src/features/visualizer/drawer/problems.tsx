import { OctagonX } from "lucide-react";
import CodeOutputTabs from "./tabs";
import { List, type RowComponentProps } from "react-window";

export default function ProblemsTabContent({
  problems,
  tabControls,
}: {
  problems: string[];
  tabControls: { problemsLen: number; enableOutput: boolean };
}) {
  return (
    <div className="flex flex-col gap-4 flex-1">
      <div className="flex-1 basis-0 min-h-0 overflow-y-auto">
        {problems.length > 0 ? (
          <List
            rowComponent={ProblemRowComponent}
            rowCount={problems.length}
            rowHeight={30}
            rowProps={{ problems }}
          />
        ) : (
          <p className="text-typography-secondary">
            No problems with the query have been detected yet
          </p>
        )}
      </div>
      <CodeOutputTabs {...tabControls} />
    </div>
  );
}

function ProblemRowComponent({
  index,
  problems,
}: RowComponentProps<{ problems: string[] }>) {
  return (
    <span className="w-full flex items-start gap-2 pb-3 border-b border-b-neutral">
      <OctagonX className="shrink-0 text-critical h-4 w-4" />
      <p className="flex-1 leading-4 break-words">{problems[index]}</p>
    </span>
  );
}
