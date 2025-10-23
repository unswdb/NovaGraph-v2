aight, seem like the clean api is not really possible yet. but sure, wrapper is still acceptable 


so frontend:

Option 1: controller.algorithm.bfs()

so MainController.ts:

private algorithm = IgraphController
async function bfs(params)
{
    let data = getData
    return this.algorithm.PathFinding.bfs(params, data)
}


IgraphController.ts

private mod: undefined
private PathFinding  
constructor() {
    mod = createModule()
    PathFinding = new PathFinding(); 
}

getPathFinding() {
    return this.PathFinding();
}

PathFinding

private BFS 

constructor () {
    BFS()
}

async function (BFS) {
    return this._bfs.getResult();
}


bfs.ts

_runIgraphBFS(params)

_parseIgraphBFS(result)

getAlgorithmResult()



Option 2: controller.algorithm.PathFinding.bfs()

 controller.algorithm.bfs()
