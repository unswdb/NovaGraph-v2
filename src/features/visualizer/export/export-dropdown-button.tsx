import { ChevronDown, Download } from "lucide-react";

import type { VisualizationResponse } from "../store";

import ALL_EXPORTS from "./implementations";

import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Separator } from "~/components/ui/separator";

export default function ExportDropdownButton({
  activeResponse,
}: {
  activeResponse: VisualizationResponse;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="w-46">
          <Download />
          Export Results
          <Separator orientation="vertical" />
          <ChevronDown />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-46">
        {ALL_EXPORTS.map((option) => (
          <DropdownMenuItem onClick={() => option.export(activeResponse)}>
            <option.icon />
            <p>{option.label}</p>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
