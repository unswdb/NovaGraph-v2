import type { GraphModule } from "../types";

export async function _runIgraphAlgo<M extends GraphModule, R>(
  mod: M,
  exec: (m: M) => Promise<R> | R
): Promise<R> {
  try {
    return await exec(mod);
  } catch (e) {
    throw new Error(typeof e === "number" ? mod.what_to_stderr(e) : String(e));
  }
}
