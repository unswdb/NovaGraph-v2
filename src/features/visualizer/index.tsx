import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import VisualizerStore from "./visualizer.store";
import Header from "./header";
import AlgorithmSidebar from "./algorithms";
import SettingsSidebar from "./settings";

const Visualizer = observer(() => {
  const [store] = useState(new VisualizerStore());

  useEffect(() => {
    store.initialize();
    return () => store.cleanup();
  }, []);

  return (
    <div className="flex flex-col w-screen h-screen overflow-hidden">
      <Header />
      <div className="flex flex-1">
        <AlgorithmSidebar nodes={store.nodes} edges={store.edges} />
        <main className="flex-1"></main>
        <SettingsSidebar />
      </div>
    </div>
  );
});

export default Visualizer;
