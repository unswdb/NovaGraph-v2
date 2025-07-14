import {
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "~/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import ALL_IMPORTS, { type ImportInput } from "./implementations";
import { Separator } from "~/components/ui/separator";
import { Label } from "~/components/form/label";
import { Input } from "~/components/form/input";
import { Switch } from "~/components/form/switch";

export default function ImportInputs() {
  return (
    <DialogContent className="flex flex-col gap-2 max-h-[80vh] !max-w-[min(100%,calc(80vw))]">
      <DialogTitle>Import File</DialogTitle>
      <DialogDescription>
        Choose your import format or generate a graph
      </DialogDescription>
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
                        <ImportInput key={index} input={input} />
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
            ))}
          </div>
        </div>
      </Tabs>
    </DialogContent>
  );
}

function ImportInput({ input }: { input: ImportInput }) {
  switch (input.type) {
    case "file":
      return (
        <div className="space-y-4">
          <Label htmlFor={input.id}>{input.label}</Label>
          <Input
            id={input.id}
            type="file"
            accept={input.accept}
            required={input.required}
            multiple={input.multiple}
          />
        </div>
      );
    case "switch":
      return (
        <div className="flex items-center gap-2">
          <Label htmlFor={input.id}>{input.label}</Label>
          <Switch id={input.id} defaultChecked={input.defaultValue} />
        </div>
      );
    case "text":
      return (
        <div className="space-y-4">
          <Label htmlFor={input.id}>{input.label}</Label>
          <Input
            id={input.id}
            type="text"
            required={input.required}
            placeholder={input.placeholder}
            defaultValue={input.defaultValue}
          />
        </div>
      );
    case "number":
      return (
        <div className="space-y-4">
          <Label htmlFor={input.id}>{input.label}</Label>
          <Input
            id={input.id}
            type="number"
            required={input.required}
            placeholder={input.placeholder}
            defaultValue={input.defaultValue}
            min={input.min}
            max={input.max}
          />
        </div>
      );
  }
}
