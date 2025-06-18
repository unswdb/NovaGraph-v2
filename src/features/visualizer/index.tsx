import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import VisualizerStore from "./visualizer.store";

const Visualizer = observer(() => {
  const [store] = useState(new VisualizerStore());

  useEffect(() => {
    store.initialize();
    return () => store.cleanup();
  }, []);

  return (
    <div>
      <p>Visualizer Page</p>
    </div>
  );
});

export default Visualizer;
