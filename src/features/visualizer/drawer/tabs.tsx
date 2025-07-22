import { Code, FileText } from "lucide-react";
import { TabsList, TabsTrigger } from "~/components/ui/tabs";

export default function CodeOutputTabs({
  enableOutput = false,
}: {
  enableOutput: boolean;
}) {
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
