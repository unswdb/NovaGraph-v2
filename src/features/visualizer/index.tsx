import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import VisualizerStore from "./store";
import Header from "./header";
import AlgorithmSidebar from "./algorithms/sidebar";
import SettingsSidebar from "./settings";
import GraphRenderer from "./renderer";
import { MODE } from "./constant";
import { StoreProvider } from "./hooks/use-store";
import { CodeOutputDrawer } from "./drawer";

const Visualizer = observer(() => {
  const [store] = useState(() => new VisualizerStore());

  useEffect(() => {
    store.initialize();
    return () => store.cleanup();
  }, []);

  return (
    <StoreProvider store={store}>
      <div className="flex flex-col w-screen h-screen overflow-hidden">
        <Header />
        <div className="flex flex-row flex-1">
          <AlgorithmSidebar
            module={store.wasmModule}
            nodes={store.database?.graph.nodes ?? []}
            edges={store.database?.graph.edges ?? []}
            setActiveAlgorithm={store.setActiveAlgorithm}
            setActiveResponse={store.setActiveResponse}
          />
          <main className="flex flex-col h-[calc(100vh-64px)]">
            <GraphRenderer
              nodes={store.database?.graph.nodes ?? []}
              edges={store.database?.graph.edges ?? []}
              directed={store.database?.graph.directed ?? false}
              database={store.database}
              databases={store.databases}
              setDatabase={store.setDatabase}
              addDatabase={store.addDatabase}
              sizes={
                store.activeResponse && store.activeResponse.sizeMap
                  ? store.activeResponse.sizeMap
                  : {}
              }
              colors={store.activeResponse ? store.activeResponse.colorMap : {}}
              mode={
                store.activeResponse
                  ? store.activeResponse.mode
                  : MODE.COLOR_SHADE_DEFAULT
              }
              gravity={store.gravity}
              nodeSizeScale={store.nodeSizeScale ?? []}
              className="relative flex-1 overflow-hidden"
            />
            <CodeOutputDrawer
              activeAlgorithm={store.activeAlgorithm}
              activeResponse={store.activeResponse}
            />
          </main>
          <SettingsSidebar
            gravity={store.gravity}
            setGravity={store.setGravity}
            nodeSizeScale={store.nodeSizeScale ?? []}
            setNodeSizeScale={store.setNodeSizeScale}
          />
        </div>
      </div>
    </StoreProvider>
  );
});

export default Visualizer;
