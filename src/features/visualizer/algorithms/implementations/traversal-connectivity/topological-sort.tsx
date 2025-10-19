import { List, type RowComponentProps } from "react-window";
import { createGraphAlgorithm, type GraphAlgorithmResult } from "../types";

// Infered from src/wasm/algorithms
type TopologicalSortOutputData = {
  order: {
    id: number; // numeric vertex id
    node: string; // vertex name
  }[]; // in topological order
};

export const topologicalSort = createGraphAlgorithm<TopologicalSortOutputData>({
  title: "Topological Sort",
  description:
    "Orders nodes in a directed acyclic graph (DAG) such that all edges go from earlier to later nodes",
  inputs: [],
  wasmFunction: (module, _) => {
    if (module) return module.topological_sort();
  },
  output: (props) => <TopologicalSort {...props} />,
});

function TopologicalSort(
  props: GraphAlgorithmResult<TopologicalSortOutputData>
) {
  const { order } = props.data;

  return (
    <div className="space-y-4">
      <p className="font-medium text-sm text-positive">
        ✓ Topological Sort completed successfully
      </p>

      {/* Statistics */}
      <p className="text-sm text-typography-secondary">
        Valid Execution Order Found:{" "}
        <b className="text-typography-primary">{order.length}</b> can be
        processed in dependency order
      </p>

      {/* Topological Order */}
      <div className="space-y-3 pt-3 border-t border-t-border">
        <h3 className="font-semibold">Topological Order</h3>
        <div className="border border-border border-collapse rounded-md overflow-hidden">
          {/* Header Row */}
          <div className="grid grid-cols-3 bg-tabdock">
            <span className="font-semibold text-sm px-3 py-1.5">Order</span>
            <span className="col-span-2 font-semibold text-sm px-3 py-1.5">
              Node
            </span>
          </div>
          <div className="max-h-80 overflow-y-auto">
            <List
              rowComponent={TopologicalOrderRowComponent}
              rowCount={order.length}
              rowHeight={36}
              rowProps={{ order }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function TopologicalOrderRowComponent({
  index,
  style,
  order: orders,
}: RowComponentProps<{ order: TopologicalSortOutputData["order"] }>) {
  const order = orders[index];
  return (
    <div
      key={index}
      className="grid grid-cols-3 not-odd:bg-neutral-low/50"
      style={style}
    >
      <span className="font-semibold px-3 py-1.5">{index + 1}</span>
      <span className="font-semibold px-3 py-1.5">{order.node}</span>
    </div>
  );
}
