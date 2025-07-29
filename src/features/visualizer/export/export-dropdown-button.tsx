import { ChevronDown, Download } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Separator } from "~/components/ui/separator";
import ALL_EXPORTS, { type ExportOption } from "./implementations";
import type { BaseGraphAlgorithmResult } from "../algorithms/implementations";

export default function ExportDropdownButton({
  activeResponse,
}: {
  activeResponse: BaseGraphAlgorithmResult;
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
