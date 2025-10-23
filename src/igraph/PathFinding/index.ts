import type { IgraphInput, KuzuToIgraphParseResult } from "../types/types";
import { igraphBFS } from "./IgraphBFS";


// Todo: eslint
export class PathFindingController {
    private _getKuzuToIgraphParseResult: () => Promise<KuzuToIgraphParseResult>;
    private _getIgraphModule: () => any
    constructor(
        getIgraphInput: () => Promise<KuzuToIgraphParseResult>,
        getIgraphModule: () => any
    ) {
        this._getKuzuToIgraphParseResult = getIgraphInput;
        this._getIgraphModule = getIgraphModule
    };


    async iBFS(
    ) {
        let KuzuToIgraphParsingResult = await this._getKuzuToIgraphParseResult();
        return await igraphBFS(this._getIgraphModule(), KuzuToIgraphParsingResult.IgraphInput, KuzuToIgraphParsingResult.IgraphToKuzuMap)
    }
}
 