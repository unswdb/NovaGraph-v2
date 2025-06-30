import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import VisualizerStore from "./visualizer.store";
import Header from "./header";
import AlgorithmSidebar from "./algorithms";
import SettingsSidebar from "./settings";
import GraphRenderer from "./renderer";
import { SidebarInset } from "~/components/ui/sidebar";

const Visualizer = observer(() => {
  const [store] = useState(new VisualizerStore());

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
            colors={{}} // TODO
            gravity={0} // TODO
            mode={0} // TODO
            nodeSizeScale={0} // TODO
          />
        </main>
        <SettingsSidebar />
      </div>
    </div>
  );
});

export default Visualizer;
