const BellmanFordTestQuery = `CREATE NODE TABLE Node(id INT, PRIMARY KEY (id));
 CREATE REL TABLE Connected(FROM Node TO Node, w DOUBLE);
 CREATE (:Node {id:1}), (:Node {id:2}), (:Node {id:3}), (:Node {id:4}), (:Node {id:5}), (:Node {id:6}), (:Node {id:7}), (:Node {id:8}), (:Node {id:9}), (:Node {id:10});
 MATCH (a:Node {id:1}), (b:Node {id:2}) CREATE (a)-[:Connected {w:1}]->(b);
 MATCH (a:Node {id:1}), (b:Node {id:3}) CREATE (a)-[:Connected {w:1}]->(b);
 MATCH (a:Node {id:1}), (b:Node {id:4}) CREATE (a)-[:Connected {w:1}]->(b);
 MATCH (a:Node {id:2}), (b:Node {id:5}) CREATE (a)-[:Connected {w:1}]->(b);
 MATCH (a:Node {id:2}), (b:Node {id:6}) CREATE (a)-[:Connected {w:1}]->(b);
 MATCH (a:Node {id:3}), (b:Node {id:6}) CREATE (a)-[:Connected {w:1}]->(b);
 MATCH (a:Node {id:3}), (b:Node {id:7}) CREATE (a)-[:Connected {w:1}]->(b);
 MATCH (a:Node {id:4}), (b:Node {id:7}) CREATE (a)-[:Connected {w:1}]->(b);
 MATCH (a:Node {id:4}), (b:Node {id:8}) CREATE (a)-[:Connected {w:1}]->(b);
 MATCH (a:Node {id:5}), (b:Node {id:9}) CREATE (a)-[:Connected {w:1}]->(b);
 MATCH (a:Node {id:6}), (b:Node {id:9}) CREATE (a)-[:Connected {w:1}]->(b);
 MATCH (a:Node {id:6}), (b:Node {id:10}) CREATE (a)-[:Connected {w:1}]->(b);
 MATCH (a:Node {id:7}), (b:Node {id:10}) CREATE (a)-[:Connected {w:1}]->(b);
 MATCH (a:Node {id:8}), (b:Node {id:10}) CREATE (a)-[:Connected {w:1}]->(b);
`;

const BFSTestQuery = `
CREATE NODE TABLE Node(id INT, PRIMARY KEY (id));
CREATE REL TABLE Connected(FROM Node TO Node);

CREATE (n1:Node {id: 1});
CREATE (n2:Node {id: 2});
CREATE (n3:Node {id: 3});
CREATE (n4:Node {id: 4});
CREATE (n5:Node {id: 5});
CREATE (n6:Node {id: 6});
CREATE (n7:Node {id: 7});
CREATE (n8:Node {id: 8});

MATCH (n1:Node {id: 1}), (n3:Node {id: 3})
CREATE (n1)-[:Connected]->(n3);
MATCH (n1:Node {id: 1}), (n4:Node {id: 4})
CREATE (n1)-[:Connected]->(n4);
MATCH (n1:Node {id: 1}), (n5:Node {id: 5})
CREATE (n1)-[:Connected]->(n5);

MATCH (n2:Node {id: 2}), (n6:Node {id: 6})
CREATE (n2)-[:Connected]->(n6);
MATCH (n2:Node {id: 2}), (n7:Node {id: 7})
CREATE (n2)-[:Connected]->(n7);


CREATE NODE TABLE Person(name STRING, age INT, PRIMARY KEY (name));
CREATE NODE TABLE Movie(title STRING, year INT, PRIMARY KEY (title));
CREATE REL TABLE ActedIn(FROM Person TO Movie, role STRING);
CREATE REL TABLE Directed(FROM Person TO Movie);

CREATE (p1:Person {name: "Tom Hanks", age: 67});
CREATE (p2:Person {name: "Leonardo DiCaprio", age: 49});
CREATE (p3:Person {name: "Meryl Streep", age: 74});

CREATE (m1:Movie {title: "Forrest Gump", year: 1994});
CREATE (m2:Movie {title: "Inception", year: 2010});
CREATE (m3:Movie {title: "The Devil Wears Prada", year: 2006});

MATCH (p1:Person {name: "Tom Hanks"}), (m1:Movie {title: "Forrest Gump"})
CREATE (p1)-[:ActedIn {role: "Forrest Gump"}]->(m1);

MATCH (p2:Person {name: "Leonardo DiCaprio"}), (m2:Movie {title: "Inception"})
CREATE (p2)-[:ActedIn {role: "Cobb"}]->(m2);

MATCH (p3:Person {name: "Meryl Streep"}), (m3:Movie {title: "The Devil Wears Prada"})
CREATE (p3)-[:ActedIn {role: "Miranda Priestly"}]->(m3);

MATCH (p1:Person {name: "Tom Hanks"}), (m2:Movie {title: "Inception"})
CREATE (p1)-[:Directed]->(m2);

MATCH (p2:Person {name: "Leonardo DiCaprio"}), (m3:Movie {title: "The Devil Wears Prada"})
CREATE (p2)-[:Directed]->(m3);
`;
