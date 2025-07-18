const DEMO_SCHEMA = [
    `CREATE NODE TABLE Person (
        id INT64, 
        name STRING, 
        age INT64, 
        PRIMARY KEY (id)
    )`,
    `CREATE NODE TABLE Post (
        id INT64, 
        content STRING, 
        timestamp STRING, 
        PRIMARY KEY (id)
    )`,
    `CREATE REL TABLE Follows (
        FROM Person TO Person,
        since STRING
    )`,
    `CREATE REL TABLE Created (
        FROM Person TO Post
    )`,
    `CREATE REL TABLE Likes (
        FROM Person TO Post,
        timestamp STRING
    )`
];

const DEMO_PEOPLE = [
    { id: 1, name: "Alice", age: 28 },
    { id: 2, name: "Bob", age: 32 },
    { id: 3, name: "Charlie", age: 25 },
    { id: 4, name: "Diana", age: 30 },
    { id: 5, name: "Eva", age: 27 }
];

const DEMO_POSTS = [
    { id: 101, content: "Hello graph world!", timestamp: "2023-01-15T10:30:00" },
    { id: 102, content: "Graphs are awesome", timestamp: "2023-01-16T14:20:00" },
    { id: 103, content: "Learning Kuzu today", timestamp: "2023-01-17T09:45:00" }
];

const DEMO_FOLLOWS = [
    { from: 1, to: 2, since: "2022-05-10" },
    { from: 1, to: 3, since: "2022-06-15" },
    { from: 2, to: 4, since: "2022-04-20" },
    { from: 3, to: 1, since: "2022-07-05" }
];

const DEMO_POSTS_AUTHORSHIP = [
    { person: 1, post: 101 },
    { person: 2, post: 102 },
    { person: 3, post: 103 }
];

const DEMO_LIKES = [
    { person: 2, post: 101, timestamp: "2023-01-15T11:00:00" },
    { person: 3, post: 101, timestamp: "2023-01-15T12:30:00" },
    { person: 1, post: 102, timestamp: "2023-01-16T15:00:00" }
];
