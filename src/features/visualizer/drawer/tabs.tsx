import { Code, FileText, OctagonX } from "lucide-react";

import type React from "react";

import { TabsList, TabsTrigger } from "~/components/ui/tabs";
import { cn } from "~/lib/utils";

export default function CodeOutputTabs({
  problemsLen,
  enableOutput = false,
  className,
}: {
  problemsLen: number;
  enableOutput: boolean;
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <TabsList className={cn("flex items-center gap-2", className)}>
      {/* Tabs */}
      <TabsTrigger value="code">
        <Code />
        Code
      </TabsTrigger>
      <TabsTrigger value="problems">
        <OctagonX />
        Problems{" "}
        {problemsLen > 0 && (
          <span className="bg-critical text-primary-fore flex items-center justify-center w-6 h-6 rounded-full font-bold text-xs">
            {problemsLen}
          </span>
        )}
      </TabsTrigger>
      <TabsTrigger value="output" disabled={!enableOutput}>
        <FileText />
        Output
      </TabsTrigger>
    </TabsList>
  );
}
