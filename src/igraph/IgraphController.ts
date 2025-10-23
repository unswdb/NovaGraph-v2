import createModule from "../graph"
import { PathFindingController } from "./PathFinding";
import { KuzuToIgraphParsing } from "./utils/KuzuToIgraphConverter";
import type { KuzuToIgraphParseResult } from "./types/types";

// TODO: lint
export class IgraphController {
    private _wasmGraphModule: any = undefined;
    private _pathFindingController: undefined | PathFindingController = undefined;
    private _getKuzuData: () => Promise<any>; 
    private _getDirection: () => boolean; 
    

    constructor(
      getKuzuData: () => Promise<any>,
      getDirection: () => boolean
    ) {
      this._getDirection = getDirection;
      this._getKuzuData = getKuzuData;
      this._pathFindingController = new PathFindingController(this._parseKuzuData, this.getIgraphModule);
    }

    async _parseKuzuData() : Promise<KuzuToIgraphParseResult>
    {
        let kuzuData = await this._getKuzuData()
        let direction = this._getDirection();
        return KuzuToIgraphParsing(kuzuData.nodes.length, kuzuData.edges, direction);
      }


      getPathFinding() {
        return this._pathFindingController;
      }
  

    // Todo: lint
    async initIgraph() : Promise<any> {
        if (!this._wasmGraphModule) {
          try {
            this._wasmGraphModule = await createModule();
          } catch (err) {
            console.error("Failed to load WASM module", err);
            throw Error("Failed to load WASM module: " + err);;
          }
        }
        return this._wasmGraphModule
      }

      // Todo: lint
      getIgraphModule() : any {
        return this._wasmGraphModule;
      }

    // Parse data
    
    
}