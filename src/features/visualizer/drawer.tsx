import { useEffect, useState } from "react";
import { ChevronUp, ChevronDown, Code, FileText } from "lucide-react";
import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import type {
  BaseGraphAlgorithm,
  BaseGraphAlgorithmResult,
} from "./algorithms/implementations/types";
import { useStore } from "./hooks/use-store";
import { controller } from "~/MainController";
const DRAWER_HEIGHT = "18rem";

export function CodeOutputDrawer({
  activeAlgorithm = null,
  activeResponse = null,
  className,
}: {
  activeAlgorithm: BaseGraphAlgorithm | null;
  activeResponse: BaseGraphAlgorithmResult | null;
  className?: string;
}) {
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
              <CodeTabContent />
              <CodeOutputTabs
                enableOutput={!!activeAlgorithm && !!activeResponse}
              />
            </TabsContent>
            {/* Content for Output */}
            <TabsContent value="output" className="flex flex-col">
              <div className="flex-1">
                {!!activeAlgorithm &&
                  !!activeResponse &&
                  activeAlgorithm.output(activeResponse)}
              </div>
              <CodeOutputTabs
                enableOutput={!!activeAlgorithm && !!activeResponse}
              />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}

// TODO: Prettify it please with line numbers
function CodeTabContent() {
  const store = useStore();
  const [query, setQuery] = useState("");

  useEffect(() => {
    controller.initKuzu("inmemory", "sync");
  }, []);
  
  const handleRunQuery = async () => {
    const queryResult = await controller.executeQuery(query);
    console.log('executeQuery result:', queryResult);


    // const snapShot = await controller.executeHelper("snapshotGraphState");
    // console.log('snapshotHelper result:', snapShot);
    // const helperResult = await controller.executeHelper("getStructuredGraphSnapshot");
    // console.log('executeHelper result:', helperResult);
    // // TODO: Execute query from controller
    // const result = await controller.executeQuery(query);
    // // TODO: Handle query result (error and success state)
    store.setNodes(queryResult.nodes);
    store.setEdges(queryResult.edges);
  };

  return (
    <div className="flex flex-col gap-2 h-full">
      <textarea
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full h-full border border-border resize-none"
      />
      <Button type="submit" onClick={handleRunQuery}>
        Run Query
      </Button>
    </div>
  );
}

function CodeOutputTabs({ enableOutput = false }: { enableOutput: boolean }) {
  return (
    <TabsList className="block space-x-2">
      {/* Tabs */}
      <TabsTrigger value="code">
        <Code />
        Code
      </TabsTrigger>
      <TabsTrigger value="output" disabled={!enableOutput}>
        <FileText />
        Output
      </TabsTrigger>
    </TabsList>
  );
}
