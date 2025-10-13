import { Plus } from "lucide-react";
import { Button } from "~/components/ui/button";
import { useState } from "react";
import { useStore } from "~/features/visualizer/hooks/use-store";
import CreateNodeSchemaDialog from "./create-node-schema-dialog";
import CreateNodeDialog from "./create-node-dialog";
import { isNonEmpty } from "~/lib/utils";

export default function CreateNode() {
  const { database } = useStore();

  const [dialogStatus, setDialogStatus] = useState({
    createNode: false,
    createNodeSchema: false,
  });

  const onCloseCreateNode = () => {
    setDialogStatus({ createNode: false, createNodeSchema: false });
  };

  const onCreateSchemaClickCreateNode = () => {
    setDialogStatus((prev) => ({
      createNode: !prev.createNode,
      createNodeSchema: true,
    }));
  };

  const onSubmitCreateNodeSchema = () => {
    if (dialogStatus.createNodeSchema) {
      setDialogStatus({ createNode: true, createNodeSchema: false });
    }
  };

  const setCreateNodeSchemaOpen = (open: boolean) => {
    if (!isNonEmpty(database.graph.nodeTables)) {
      setDialogStatus({ createNode: false, createNodeSchema: open });
    } else {
      setDialogStatus({ createNode: !open, createNodeSchema: open });
    }
  };

  const openDialog = () => {
    if (!isNonEmpty(database.graph.nodeTables)) {
      setDialogStatus({ createNode: false, createNodeSchema: true });
    } else {
      setDialogStatus({ createNode: true, createNodeSchema: false });
    }
  };

  return (
    <>
      <Button title="Create Node" variant="outline" onClick={openDialog}>
        <Plus /> Node
      </Button>
      <CreateNodeSchemaDialog
        open={dialogStatus.createNodeSchema}
        setOpen={setCreateNodeSchemaOpen}
        onSubmit={onSubmitCreateNodeSchema}
      />
      {isNonEmpty(database.graph.nodeTables) && (
        <CreateNodeDialog
          open={dialogStatus.createNode}
          onClose={onCloseCreateNode}
          onCreateSchemaClick={onCreateSchemaClickCreateNode}
        />
      )}
    </>
  );
}
