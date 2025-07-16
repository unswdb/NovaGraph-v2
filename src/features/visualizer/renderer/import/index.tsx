import { ChevronDown, Loader, Plus } from "lucide-react";
import {
  Suspense,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
} from "react";
import { Button } from "~/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "~/components/ui/command";
import { Drawer, DrawerContent, DrawerTrigger } from "~/components/ui/drawer";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { useIsMobile } from "~/hooks/use-mobile";
import type { GraphDatabase } from "../../types";
import { Dialog, DialogTrigger } from "~/components/ui/dialog";
import ImportInputsModal from "./inputs-modal";
import { cn } from "~/lib/utils";

export default function DatabaseImport({
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

  // Hooks
  const isMobile = useIsMobile();

  const triggerWidth = useMemo(
    () => buttonRef.current?.offsetWidth,
    [buttonRef.current?.offsetWidth, open]
  );

  if (!isMobile) {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            ref={buttonRef}
            variant="outline"
            className={cn(
              "flex justify-between items-center text-ellipsis",
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
          <Suspense fallback={<DatabaseListFallback />}>
            <DatabaseSelector
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

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "flex justify-between items-center text-ellipsis",
            className
          )}
        >
          {database ? database.label : "Default"}
          <ChevronDown />
        </Button>
      </DrawerTrigger>
      <DrawerContent className="p-4">
        <Suspense fallback={<DatabaseListFallback />}>
          <DatabaseSelector
            setOpen={setOpen}
            database={database}
            databases={databases}
            setDatabase={setDatabase}
            addDatabase={addDatabase}
          />
        </Suspense>
      </DrawerContent>
    </Drawer>
  );
}

function DatabaseSelector({
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
      {/* Create Graph Dialog Content */}
      <ImportInputsModal />
    </Dialog>
  );
}

function DatabaseListFallback() {
  return (
    <div className="bg-page flex items-center justify-center rounded-md gap-1 py-4">
      <Loader className="w-4 h-4 animate-spin" />
      <span className="small-body">Loading databases...</span>
    </div>
  );
}
