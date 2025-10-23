This is the architecture file for igraph folder

The folder here is mainly for handling logic with igraph, which is then will be connected or exposed into MainController

The orchestor or main api of this whole folder gonna be IGraphController.ts 


The whole folder will have responsibility as follow:

- retrieve data from kuzu - literally just call a function that the main controller has provided (for now it is snapshotgraphstate) and perhaps another function to retrieve the direction of the graph or it can be integrated into snapshotgraphstae as well - it is something to be discussed later when we add on "direction" for the app. Ah yea, this is a todo thingy: i have to make sure the call does not result in a circular recursive call, because maincontroller possibly will be has-a-relationship with the igraph controller class. A more subtle way to walk around this well to actuallly call the call data and parse data as params of function, we will have to investigate if this is actually performance wise thing to do. So perhaps KuzuToIgraph can be something stay inside kuzu side. We kinda want the maincontroller to hold as least resources and logic as possible. We might discuss this thing later


- okay extend a bit on this one, because we dont really want the to create wasm right inside main controller as it is, there is some several work around for this

kay let think of leaving igraph module inside maincontroller later 

but in case we dont want, one of the solution i have thought of:

inside IgraphController, we have something like setUpGraphState, which can help we temporarily add graphstate into the controller, but everything come with a price: extra cost to save both in memory and performance.

how about wedont save but we just pass it arround then? 

then the whole thing would be inside setupGraphState.

like

getAlgorithm() {
    setUpGraphState(snapShotGraphState())
}

inside igraphcontroller:
setupGraphstate(graphstate) {
    nah, it can not .bfs or shit like that, shait
}




how about, we plug this as kuzu extension? dont care about the main controller yet? , we leave this at kuzu base service?

so like , even at that point, hmm 


answer: pass down the kuzugetsnapshotstate function and it is all ressolved



- parse those data into something igraph would actually understand - IgraphAdapter.ts

- expose the call of relevant algorithm - so this is our proposed design so far: inside IgraphController.ts, we will init different class representing different kind of algorithm: centrality, pathfinding,... each of those will have their own file like Centrality.ts, PathFinding.ts and inside each of those class, they will have their own _runIgraphBFS() for example
. This i believe is more modular and easier to scale and maintain 

so it will look something like this 

inside any front end side will call:

controller.algorithm."some algo"

inside MainController.ts

public algorithm = undefined | IgraphController
constructor () {
    algorithm = new IgraphController();
}

inside IgraphController.ts will be:

private Centrality
private PathFinding
private igraphMod
// the list goes on

constructor() {
    igraphMod = createModule()
    Centrality = new Centrality()
    PathFinding = new PathFinding()
    // more to come 
}

export function BFS(params) {
    // let data = call function that retrieve data, parsing kuzu data
    return Centrality._runIgraphCentrality(data, params, this.igraphMod)
}


and inside Centrality.ts

constructor() {

}

export function _runIgraphBFS(params, mod) {
    return getResultBFS(igraphData, mod)
}

the "getResultBFS" shall come from files called _igraphBFS.ts (should it be underscored here?). Inside the thing will have 

async _runIgraphBFS(params,mod)

async _parseIgraphBFS(result)

and export async getResultBFS(params, mod) is just {
    
    return _parseIgraphBFS(_runIgraphBFS(params, mod))
}