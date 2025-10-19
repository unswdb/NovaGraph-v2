import { ChevronDown, Loader, Plus } from "lucide-react";
import {
  Suspense,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
} from "react";

import type { GraphDatabase } from "../types";

import ImportDialog from "./import-dialog";

import { Button } from "~/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "~/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { Dialog, DialogTrigger } from "~/components/ui/dialog";
import { cn } from "~/lib/utils";

export default function ImportDropdown({
  database,
  databases,
  setDatabase,
  addDatabase,
  className,
}: ComponentProps<"button"> & {
  database: GraphDatabase | null;
  databases: GraphDatabase[];
  setDatabase: (g: GraphDatabase) => void;
  addDatabase: (g: GraphDatabase) => void;
}) {
  // Refs
  const buttonRef = useRef<HTMLButtonElement>(null);

  // States
  const [open, setOpen] = useState(false);

  const triggerWidth = useMemo(
    () => buttonRef.current?.offsetWidth,
    [buttonRef.current?.offsetWidth, open]
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          ref={buttonRef}
          variant="outline"
          className={cn(
            "flex justify-between items-center truncate",
            className
          )}
        >
          {database ? database.label : "Default"}
          <ChevronDown />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="p-0"
        align="start"
        style={{ width: triggerWidth }}
      >
        <Suspense fallback={<ImportListFallback />}>
          <ImportListSelector
            setOpen={setOpen}
            database={database}
            databases={databases}
            setDatabase={setDatabase}
            addDatabase={addDatabase}
          />
        </Suspense>
      </PopoverContent>
    </Popover>
  );
}

function ImportListSelector({
  setOpen,
  database,
  databases,
  setDatabase,
  addDatabase,
}: {
  setOpen: (b: boolean) => void;
  database: GraphDatabase | null;
  databases: GraphDatabase[];
  setDatabase: (g: GraphDatabase) => void;
  addDatabase: (g: GraphDatabase) => void;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <Command value={database?.label}>
        <CommandInput placeholder="Filter database..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Existing Databases">
            {/* List of databases */}
            {databases.map((database) => (
              <CommandItem
                key={database.label}
                value={database.label}
                onSelect={(value) => {
                  const selected = databases.find(
                    (database) => database.label === value
                  );
                  if (!selected) return;
                  setDatabase(database);
                  setOpen(false);
                }}
              >
                {database.label}
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Create Graph">
            {/* Create graph options */}
            <DialogTrigger asChild>
              <CommandItem onSelect={() => setDialogOpen(true)}>
                <Plus />
                Create Graph
              </CommandItem>
            </DialogTrigger>
          </CommandGroup>
        </CommandList>
      </Command>
      <ImportDialog onClose={() => setDialogOpen(false)} />
    </Dialog>
  );
}

function ImportListFallback() {
  return (
    <div className="bg-page flex items-center justify-center rounded-md gap-1 py-4">
      <Loader className="w-4 h-4 animate-spin" />
      <span className="small-body">Loading databases...</span>
    </div>
  );
}
