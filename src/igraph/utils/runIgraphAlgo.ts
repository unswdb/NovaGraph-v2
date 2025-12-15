import type { GraphModule } from "../types";

export async function _runIgraphAlgo<M extends GraphModule, R>(
  mod: M,
  exec: (m: M) => Promise<R> | R,
  algorithmName?: string
): Promise<R> {
  const startTime = performance.now();
  try {
    const result = await exec(mod);
    const endTime = performance.now();
    const elapsed = endTime - startTime;
    if (algorithmName) {
      console.log(`Time taken for ${algorithmName} (WASM): ${elapsed}ms`);
    } else {
      console.log(`Time taken for WASM algorithm: ${elapsed}ms`);
    }
    return result;
  } catch (e) {
    const endTime = performance.now();
    const elapsed = endTime - startTime;
    if (algorithmName) {
      console.log(`Time taken for ${algorithmName} (WASM, failed): ${elapsed}ms`);
    } else {
      console.log(`Time taken for WASM algorithm (failed): ${elapsed}ms`);
    }
    throw new Error(typeof e === "number" ? mod.what_to_stderr(e) : String(e));
  }
}
