实现 Kuzu/igraph 图有向性（isDirected）,实现无感的无向图支持完整方案
1. 元数据设计与持久化
扩展 DatabaseMetadata: 确认/扩展 DatabaseMetadata 结构（已包含 isDirected: boolean），后续如有需要可加入更多图级属性（例如 canonicalRuleVersion）。
初始化时设置 isDirected: 在内存版和持久化版 Kuzu service 的 initialize/createDatabase 逻辑中，根据 UI（"Directed Graph" 开关）传入的参数设置 currentDatabaseMetadata.isDirected，而不是硬编码 true。
持久化 DatabaseMetadata: 为每个数据库保存一份 metadata（例如同名 JSON 文件或专门的 Kuzu 配置表），在服务启动或 connectToDatabase 时加载，填充到 currentDatabaseMetadata。
统一获取接口: 在 KuzuController 中提供类似 getCurrentDatabaseMetadata() 的方法，MainController 和前端 UI 通过它来获取 isDirected 等属性。
2. MainController 与 UI 读写 isDirected
实现 getGraphDirection: 在 MainController 中实现 db.getGraphDirection()，通过调用 kuzuController.getCurrentDatabaseMetadata() 返回 metadata.isDirected，默认回退为 true（有向）。
新建图流程: 在 CSV/JSON/Auto import 以及“新建空图”界面，把 Directed Graph 开关的值一并传入创建数据库 / 初始化逻辑，确保 DatabaseMetadata.isDirected 与 UI 一致。
重连/切换数据库时: 在重新连接某个已有数据库时，从持久化的 metadata 读取 isDirected，更新到 MainController/全局状态，让 UI（例如图工具条、edge 创建对话框）能够知道当前是有向还是无向图。
3. Kuzu 侧 schema & 边插入的 canonical 规则
建 edge schema 时应用 canonical 规则:
对跨表关系：在创建 edge table 前，根据 (fromLabel, toLabel) 的字典序（或固定规则）决定 canonical 顺序，只在 CREATE REL TABLE 中声明这一对 (FROM canonicalFrom TO canonicalTo)。
对同一表关系：FROM NodeTable TO NodeTable，后续通过主键字符串排序来规范单边方向。
封装 canonicalizeNodesForEdge:
输入 (node1, node2, edgeTable, isDirected)，在 isDirected=false 时：
若 node1.tableName !== node2.tableName：按表名排序决定 src/dst；
若相同表：按 primary key 字符串排序决定 src/dst；
isDirected=true 时，直接按用户选择的方向。
集中使用 canonical: 所有写边的路径（createEdge、deleteEdge、updateEdge 以及导入时的 COPY/INSERT 生成）在传入 createEdgeQuery/deleteEdgeQuery 之前，都先经过 canonicalizeNodesForEdge，避免出现同一对节点的双向脏数据。
4. Import（CSV/JSON/Auto）中对 directed/undirected 的处理
去掉“反向 COPY 一遍”的逻辑: 在 importFromCSV / importFromJSON 中，取消当前 undirected 情况下生成反向边文件再 COPY 的做法，统一只 COPY 一次，并交给 canonical 规则处理。
导入管线使用 canonical: 若导入路径是通过 Kuzu 的 COPY 直接落表，需要改成：
先 COPY 到一个临时 edge 表 / staging 表，然后通过 INSERT ... SELECT ... 将 (source, target) 规范化成 canonical (src, dst) 写入正式 edge 表；
5. 手动添加 / 编辑 / 删除边时的 undirected 适配
前端 UI 适配: 在 edge 创建对话框中，根据 isDirected：
有向图：展示 from/to 选择，UI 上强调方向；
无向图：隐藏或弱化方向（仅选两个节点和 edge type）。
调用链统一走 canonical: 手动添加、编辑、删除边时，前端传上来的是两个节点 + edge table 名，KuzuController 层根据当前图的 isDirected 决定是否调用 canonical helper 再调用 createEdge / updateEdge / deleteEdge。
6. CLI 查询与操作的无向体验
查询层抽象: 在 CLI 中对 undirected 图提供一层“无向查询”封装：
自动兼容两端视角: 对于 undirected 图，CLI 在生成查询时始终使用“忽略方向”的 pattern（单边 canonical 存储 + 双向匹配或专门 DSL），保证无论用户从 Student 端还是 Tutor 端发起查询，都能命中同一条边。
CLI 写操作: 若 CLI 允许 CREATE EDGE 或等价操作，同样通过 canonical 规则归一化 (from, to)，保持和 UI/导入一致。
7. igraph 同步与 isDirected 的贯通
创建 igraph 实例时: 根据 DatabaseMetadata.isDirected 选择 igraph 的 graph 类型（directed vs undirected），并在同步边集时：
isDirected=true：按 Kuzu 实际方向创建有向边；
isDirected=false：将单条 canonical 边映射为 igraph 中的 undirected edge。
双向同步时的规范: 如有从 igraph 回写结构的逻辑，要求：
igraph 在 undirected 模式下只产生无向边 (u,v)；
回写前统一走 canonical 规则写回 Kuzu。