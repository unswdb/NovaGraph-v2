import { observer } from "mobx-react-lite";
import { useState } from "react";
import CounterStore from "./counter.store";

const Counter = observer(() => {
  const [store] = useState(new CounterStore());

  return (
    <div>
      <p>Count: {store.count}</p>
      <button onClick={() => store.increment()}>Increment</button>
    </div>
  );
});

export default Counter;
