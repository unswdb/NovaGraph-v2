import { createContext, useContext, type ReactNode } from "react";
import type VisualizerStore from "../store";

const StoreContext = createContext<VisualizerStore | null>(null);

export const useStore = () => {
  const store = useContext(StoreContext);
  if (!store) {
    throw new Error("useStore must be used within a StoreProvider");
  }
  return store;
};

export const StoreProvider = ({
  children,
  store,
}: {
  children: ReactNode;
  store: VisualizerStore;
}) => {
  return (
    <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
  );
};
