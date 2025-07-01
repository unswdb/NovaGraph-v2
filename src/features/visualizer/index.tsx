import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import VisualizerStore from "./visualizer.store";
import Header from "./header";
import AlgorithmSidebar from "./algorithms";
import SettingsSidebar from "./settings";
import GraphRenderer from "./renderer";

const Visualizer = observer(() => {
  const [store] = useState(() => new VisualizerStore());

  useEffect(() => {
    store.initialize();
    return () => store.cleanup();
  }, []);

  return (
    <div className="flex flex-col w-screen h-screen overflow-hidden">
      <Header />
      <div className="flex flex-row flex-1">
        <AlgorithmSidebar nodes={store.nodes} edges={store.edges} />
        <main className="h-[calc(100vh-64px)]">
          <GraphRenderer
            nodes={store.nodes}
            edges={store.edges}
            colors={{}} // TODO: From algorithm's response
            gravity={store.gravity}
            mode={0} // TODO: From algorithm's response
            nodeSizeScale={store.nodeSizeScale}
          />
        </main>
        <SettingsSidebar
          gravity={store.gravity}
          setGravity={store.setGravity}
          nodeSizeScale={store.nodeSizeScale}
          setNodeSizeScale={store.setNodeSizeScale}
        />
      </div>
    </div>
  );
});

export default Visualizer;
