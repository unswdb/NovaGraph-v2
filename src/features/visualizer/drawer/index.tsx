import { useEffect, useState } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { observer } from "mobx-react-lite";
import { toast } from "sonner";

import { useStore } from "../hooks/use-store";
import type { ExecuteQueryResult } from "../types";

import CodeTabContent from "./code";
import OutputTabContent from "./output";
import ProblemsTabContent from "./problems";

import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";
import { Tabs, TabsContent } from "~/components/ui/tabs";
import { controller } from "~/MainController";
import { convertQueryToVisualizationResult } from "../queries";

const DRAWER_HEIGHT = "18rem";

const CodeOutputDrawer = observer(({ className }: { className?: string }) => {
  const {
    code,
    setCode,
    problems,
    setProblems,
    setGraphState,
    activeAlgorithm,
    activeResponse,
    setActiveResponse,
    controller,
  } = useStore();

  // States
  const [tabValue, setTabValue] = useState("code");
  const [isExpanded, setIsExpanded] = useState(false);

  // Default to open when algorithm / response internal value
  // is changed
  useEffect(() => {
    if (!!activeAlgorithm && !!activeResponse) {
      setIsExpanded(true);
      setTabValue("output");
    }
  }, [activeAlgorithm, activeResponse]);

  const onSuccessQuery = (result: ExecuteQueryResult) => {
    setProblems([]);
    setGraphState({
      nodes: result.nodes,
      edges: result.edges,
      nodeTables: result.nodeTables,
      edgeTables: result.edgeTables,
    });
    
    // Convert query result to visualization result format
    // This will highlight the matched nodes and edges in the visualization
    // and provide data for display in the output tab
    if (result.colorMap && Object.keys(result.colorMap).length > 0) {
      const visualizationResult = convertQueryToVisualizationResult(result);
      setActiveResponse(visualizationResult);
      
      // Auto-open the drawer and switch to output tab to show query results
      setIsExpanded(true);
      setTabValue("output");
    }
    
    toast.success("Query executed successfully!");
  };

  const onErrorQuery = (result: ExecuteQueryResult) => {
    setProblems(result.failedQueries.map((q) => q.message));
    setGraphState({
      nodes: result.nodes,
      edges: result.edges,
      nodeTables: result.nodeTables,
      edgeTables: result.edgeTables,
    });
    toast.error("Some queries failed", {
      action: {
        label: "See problems",
        onClick: () => setTabValue("problems"),
      },
    });
    return;
  };

  return (
    <div
      style={
        {
          "--drawer-height": DRAWER_HEIGHT,
        } as React.CSSProperties
      }
      className={cn(
        "bg-gradient-to-br from-neutral-low/20 to-neutral/20",
        className
      )}
    >
      <div
        className={cn(
          "transition-all duration-250 ease-in-out",
          isExpanded ? "h-[var(--drawer-height)]" : "h-12"
        )}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-neutral-low border-t border-b border-border"
          onClick={() => setIsExpanded((prev) => !prev)}
        >
          <span className="text-sm text-typography-primary font-medium">
            Show Code/Output
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-typography-primary hover:text-typography-secondary"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronUp className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Content */}
        {isExpanded && (
          <Tabs
            value={tabValue}
            onValueChange={setTabValue}
            defaultValue="code"
            className="h-[calc(var(--drawer-height)-48px)] p-4"
          >
            {/* Content for Code */}
            <TabsContent value="code" className="flex flex-col">
              <CodeTabContent
                code={code}
                setCode={setCode}
                runQuery={controller.db.executeQuery.bind(controller.db)}
                onSuccessQuery={onSuccessQuery}
                onErrorQuery={onErrorQuery}
                tabControls={{
                  problemsLen: problems.length,
                  enableOutput: !!activeResponse,
                }}
              />
            </TabsContent>
            {/* TODO: Content for Problems */}
            <TabsContent value="problems" className="flex flex-col">
              <ProblemsTabContent
                problems={problems}
                tabControls={{
                  problemsLen: problems.length,
                  enableOutput: !!activeResponse,
                }}
              />
            </TabsContent>
            {/* Content for Output */}
            <TabsContent value="output" className="flex flex-col">
              <OutputTabContent
                activeAlgorithm={activeAlgorithm}
                activeResponse={activeResponse}
                tabControls={{
                  problemsLen: problems.length,
                  enableOutput: !!activeResponse,
                }}
              />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
});

export default CodeOutputDrawer;
