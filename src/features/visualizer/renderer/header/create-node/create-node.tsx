import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";

export default function CreateNodeDialog({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: (b: boolean) => void;
}) {
  //   const inputs = [
  //     // TODO: Make inputs based on schema
  //   ].flat();

  //   const [values, setValues] = useState(createEmptyInputResults(inputs));

  //   const isReadyToSubmit = useMemo(
  //     () => Object.values(values).every((v) => v.success),
  //     [values]
  //   );

  //   // TODO: Implement handleSubmit
  //   const handleSubmit = () => {
  //     toast.success("Node created (not really, yet!)");
  //     setOpen(false);
  //   };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Node</DialogTitle>
          <DialogDescription>
            Create a new node based on the selected schema.
          </DialogDescription>
        </DialogHeader>
        {/* TODO: Inputs for create node */}
        {/* <div className="ml-auto">
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={!isReadyToSubmit}
            className="flex-1"
          >
            Create
          </Button>
        </div> */}
      </DialogContent>
    </Dialog>
  );
}
