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
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "~/components/ui/drawer";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { useIsMobile } from "~/hooks/use-mobile";
import type { GraphDatabase } from "../../types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { cn } from "~/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import ALL_IMPORTS, { type ImportOption } from "./implementations";
import { Separator } from "~/components/ui/separator";
import InputComponent, {
  createEmptyInputResults,
  type InputChangeResult,
} from "../../inputs";

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
        <DrawerHeader>
          <DrawerTitle>Select or Import a Database</DrawerTitle>
          <DrawerDescription>
            Choose an existing database or import a new one to begin working
            with your graph
          </DrawerDescription>
        </DrawerHeader>
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
      <DialogContent className="flex flex-col gap-2 max-h-[80vh] !max-w-[min(100%,calc(80vw))]">
        <DialogHeader>
          <DialogTitle>Import File</DialogTitle>
          <DialogDescription>
            Choose your import format or generate a graph
          </DialogDescription>
        </DialogHeader>
        <Tabs
          defaultValue={ALL_IMPORTS[0].value}
          className="flex-1 flex flex-col min-h-0"
        >
          <div className="mt-4 flex flex-col gap-4 md:flex-row flex-1 min-h-0">
            {/* Left Sidebar - Import Options with flex wrap on small, column on large */}
            <TabsList className="max-w-full h-fit">
              <div className="flex gap-2 w-full overflow-x-auto md:flex-col md:flex-nowrap md:overflow-y-auto">
                {ALL_IMPORTS.map((option) => (
                  <TabsTrigger
                    key={option.value}
                    value={option.value}
                    className="px-4 py-2 flex-shrink-0 w-fit h-fit data-[state=active]:bg-neutral"
                  >
                    <option.icon />
                    <p>{option.label}</p>
                  </TabsTrigger>
                ))}
              </div>
            </TabsList>

            {/* Right Content - Tabbed Interface with separate overflow */}
            <div className="flex-1 flex flex-col min-h-0">
              {ALL_IMPORTS.map((option) => (
                <OptionTabContent key={option.value} option={option} />
              ))}
            </div>
          </div>
        </Tabs>
      </DialogContent>
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

function OptionTabContent({ option }: { option: ImportOption }) {
  const [inputResults, setInputResults] = useState<
    Record<string, InputChangeResult>
  >(createEmptyInputResults(option.inputs));

  // Memoised values
  const isReadyToSubmit = useMemo(
    () => Object.values(inputResults).every((v) => v.success),
    [inputResults]
  );

  return (
    <TabsContent
      key={option.value}
      value={option.value}
      className="overflow-y-auto flex-1 min-h-0 data-[state=active]:flex data-[state=active]:flex-col"
    >
      <Tabs defaultValue="upload" className="space-y-2">
        <TabsList>
          <TabsTrigger value="upload">Upload</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>
        <Separator />
        <TabsContent value="upload" className="space-y-6 p-1">
          <div className="space-y-2">
            {/* Title + Description */}
            <div className="flex items-center gap-2">
              <option.icon />
              <h1 className="medium-title">{option.title}</h1>
            </div>
            {option.description && (
              <p className="small-body text-typography-secondary">
                {option.description}
              </p>
            )}
          </div>
          <div className="space-y-4">
            {/* Inputs */}
            {option.inputs.map((input, index) => (
              <InputComponent
                key={index}
                input={input}
                value={inputResults[input.label]?.value}
                onChange={(value) =>
                  setInputResults((prev) => ({
                    ...prev,
                    [input.label]: value,
                  }))
                }
              />
            ))}
          </div>
          {/* Additional Note */}
          {option.note && (
            <>
              <Separator />
              <p className="text-typography-secondary small-body">
                Note: {option.note}
              </p>
            </>
          )}
          <Button type="submit" disabled={!isReadyToSubmit}>
            Import
          </Button>
        </TabsContent>
        <TabsContent value="preview">
          <div className="space-y-2">
            {/* Title + Description */}
            {option.previewTitle && (
              <h1 className="medium-title">{option.previewTitle}</h1>
            )}
            {option.previewDescription && (
              <p className="small-body text-typography-secondary">
                {option.previewDescription}
              </p>
            )}
          </div>
          <option.preview />
        </TabsContent>
      </Tabs>
    </TabsContent>
  );
}
