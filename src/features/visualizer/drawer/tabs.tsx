import { Code, FileText } from "lucide-react";
import type React from "react";
import { TabsList, TabsTrigger } from "~/components/ui/tabs";
import { cn } from "~/lib/utils";

export default function CodeOutputTabs({
  enableOutput = false,
  className,
}: {
  enableOutput: boolean;
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <TabsList className={cn("flex items-center gap-2", className)}>
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
