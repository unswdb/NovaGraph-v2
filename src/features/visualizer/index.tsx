import { observer } from "mobx-react-lite";
import { useEffect, useMemo, useState } from "react";
import { Loader } from "lucide-react";

import { LS_KEY } from "../landing/use-navigate-app";

import VisualizerStore from "./store";
import Header from "./header";
import AlgorithmSidebar from "./algorithms/sidebar";
import SettingsSidebar from "./settings";
import GraphRenderer from "./renderer";
import { StoreProvider } from "./hooks/use-store";
import CodeOutputDrawer from "./drawer";

const Visualizer = observer(() => {
  const [store] = useState(() => new VisualizerStore());

  useEffect(() => {
    store.initialize();
    localStorage.setItem(LS_KEY, "app");
    return () => store.cleanup();
  }, []);

  const isInitialized = useMemo(
    () => !!store.database,
    [store, store.database]
  );

  if (!isInitialized) {
    return (
      <div className="flex justify-center items-center w-screen h-screen overflow-hidden">
        <Loader className="animate-spin" />
      </div>
    );
  }

  return (
    <StoreProvider store={store}>
      <div className="flex flex-col w-screen h-screen overflow-hidden">
        <Header />
        <div className="flex flex-row flex-1 [&>*]:h-[calc(100vh-64px)]">
          <AlgorithmSidebar />
          <main className="flex flex-col w-full">
            <GraphRenderer className="relative flex-1 overflow-hidden" />
            <CodeOutputDrawer />
          </main>
          <SettingsSidebar />
        </div>
      </div>
    </StoreProvider>
  );
});

export default Visualizer;
