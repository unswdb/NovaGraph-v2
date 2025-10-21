import { useMemo } from "react";

import CodeEditor from "../../../components/ui/code-editor";
import type { ExecuteQueryResult } from "../types";

import CodeOutputTabs from "./tabs";

import { Button } from "~/components/ui/button";
import CopyButton from "~/components/ui/code-editor/copy-button";
import { KuzuToIgraphParsing } from "~/kuzu/IGraphAdapter/IGraphAdapter";
import { useStore } from "../hooks/use-store";
import { IgraphBFSTranslator } from "~/kuzu/IGraphAdapter/IGraphToKuzu/bfs";

export default function CodeTabContent({
  code,
  setCode,
  runQuery,
  onSuccessQuery,
  onErrorQuery,
  enableOutput,
}: {
  code: string;
  setCode: (s: string) => void;
  runQuery: (query: string) => Promise<ExecuteQueryResult>;
  onSuccessQuery: (r: ExecuteQueryResult) => void;
  onErrorQuery: (r: ExecuteQueryResult) => void;
  enableOutput: boolean;
}) {
  // Memoised value
  const isReadyToSubmit = useMemo(() => !!code, [code]);

  const store = useStore();
  // Handle query result (error and success state and colorMap)
  const handleRunQuery = async () => {
    const result = await runQuery(code);
    console.log(
      "result:",
      JSON.stringify(
        result,
        (key, value) =>
          typeof value === "bigint"
            ? value.toString()
            : value,
        2
      )
    );
    if (!result.success) {
      onErrorQuery(result);
      return;
    }
    onSuccessQuery(result);

    // const result = await runQuery(`
    //   CREATE NODE TABLE Person(name STRING, age INT, PRIMARY KEY (name));
    //   CREATE NODE TABLE Movie(title STRING, year INT, PRIMARY KEY (title));
    //   CREATE REL TABLE ActedIn(FROM Person TO Movie, role STRING, weight DOUBLE);
    //   CREATE REL TABLE Directed(FROM Person TO Movie, weight DOUBLE);
      
    //   CREATE (p:Person {name: "Tom Hanks", age: 67});
    //   CREATE (p:Person {name: "Steven Spielberg", age: 77});
    //   CREATE (p:Person {name: "Leonardo DiCaprio", age: 49});
    //   CREATE (p:Person {name: "Christopher Nolan", age: 54});
    //   CREATE (p:Person {name: "Kate Winslet", age: 48});
    //   CREATE (m:Movie {title: "Forrest Gump", year: 1994});
    //   CREATE (m:Movie {title: "Saving Private Ryan", year: 1998});
    //   CREATE (m:Movie {title: "Inception", year: 2010});
    //   CREATE (m:Movie {title: "Titanic", year: 1997});
    //   CREATE (m:Movie {title: "Catch Me If You Can", year: 2002});
      
    //   MATCH (p:Person {name: "Tom Hanks"}), (m:Movie {title: "Forrest Gump"})
    //   CREATE (p)-[:ActedIn {role: "Forrest Gump", weight: 9.8}]->(m);
      
    //   MATCH (p:Person {name: "Tom Hanks"}), (m:Movie {title: "Saving Private Ryan"})
    //   CREATE (p)-[:ActedIn {role: "Captain Miller", weight: 8.9}]->(m);
      
    //   MATCH (p:Person {name: "Leonardo DiCaprio"}), (m:Movie {title: "Inception"})
    //   CREATE (p)-[:ActedIn {role: "Cobb", weight: 9.2}]->(m);
      
    //   MATCH (p:Person {name: "Leonardo DiCaprio"}), (m:Movie {title: "Titanic"})
    //   CREATE (p)-[:ActedIn {role: "Jack Dawson", weight: 8.7}]->(m);
      
    //   MATCH (p:Person {name: "Kate Winslet"}), (m:Movie {title: "Titanic"})
    //   CREATE (p)-[:ActedIn {role: "Rose", weight: 8.5}]->(m);
      
    //   MATCH (p:Person {name: "Steven Spielberg"}), (m:Movie {title: "Saving Private Ryan"})
    //   CREATE (p)-[:Directed {weight: 9.5}]->(m);
      
    //   MATCH (p:Person {name: "Steven Spielberg"}), (m:Movie {title: "Catch Me If You Can"})
    //   CREATE (p)-[:Directed {weight: 8.9}]->(m);
      
    //   MATCH (p:Person {name: "Christopher Nolan"}), (m:Movie {title: "Inception"})
    //   CREATE (p)-[:Directed {weight: 9.6}]->(m);
    //   `);
      

  };

  return (
    <div className="flex flex-col gap-4 h-full">
      <CodeEditor
        code={code}
        setCode={setCode}
        className="flex-1 basis-0 min-h-0"
      />
      <div className="flex flex-wrap-reverse justify-between gap-2">
        <CodeOutputTabs enableOutput={enableOutput} />
        <div className="flex items-center gap-2">
          <CopyButton variant="ghost" value={code} />
          <Button
            type="submit"
            onClick={handleRunQuery}
            disabled={!isReadyToSubmit}
            className="flex-1"
          >
            Run Query
          </Button>
        </div>
      </div>
    </div>
  );
}
