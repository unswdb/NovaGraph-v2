import { Separator } from "../separator";
import { useLineNumbers } from "./use-line-number";
import { controller } from '../../../MainController';
import { useEffect } from "react";

export default function CodeEditor({
  code,
  setCode,
}: {
  code: string;
  setCode: (s: string) => void;
}) {
  const { textAreaRef, lineNumbersRef, handleOnScroll, renderLineNumbers } =
    useLineNumbers();

  // // Test createSchema functionality
  // useEffect(() => {
  //   let hasRun = false; // Guard to prevent duplicate execution
    
  //   const testCreateSchema2 = async () => {
  //     if (hasRun) {
  //       console.warn('Schema creation already executed, skipping...');
  //       return;
  //     }
  //     hasRun = true;
    
  //     try {
  //       await controller.initKuzu();
  //       console.warn('Testing createSchema2...');
    
  //       // ----------------------------
  //       // 1. Create Person table (many primitives)
  //       // ----------------------------
  //       const personResult = await controller.db.createSchema('node', 'Person', [
  //         { name: 'name', type: 'STRING', primary: true },
  //         { name: 'age', type: 'INT' },
  //         { name: 'alive', type: 'BOOLEAN' },
  //         { name: 'height', type: 'DOUBLE' },
  //         { name: 'uuid', type: 'UUID' }
  //       ]);
  //       console.warn('Person schema result:', personResult);
    
  //       // ----------------------------
  //       // 2. Create Address table (STRUCT)
  //       // ----------------------------
  //       const addressResult = await controller.db.createSchema("node", "Address", [
  //         { name: "id", type: "STRING", primary: true },
  //         {
  //           name: "location",
  //           type: "STRUCT",
  //           structFields: [
  //             { name: "street", type: "STRING" },
  //             { name: "city", type: "STRING" },
  //             { name: "zipcode", type: "INT" },
  //           ],
  //         },
  //       ]);
  //       console.warn('Address schema result:', addressResult);
    
  //       // ----------------------------
  //       // 3. Use createNode to generate queries
  //       // ----------------------------
    
  //       // Person node (primitive types)
  //       const personQuery = await controller.db.createNode('Person', {
  //         name:  ['STRING',  'Tom Hanks'],
  //         age:   ['INT',     67],
  //         alive: ['BOOLEAN', true],
  //         height:['DOUBLE',  1.83],
  //         uuid:  ['UUID',    '123e4567-e89b-12d3-a456-426614174000']
  //       });
  //       console.warn('Person create query:', personQuery);
  //       // await controller.db.query(personQuery);
    
  //       // Address node (STRUCT)
  //       const addressQuery = await controller.db.createNode('Address', {
  //         id: ['STRING', 'ADDR-001'],   // primary key
  //         location: [
  //           { kind: 'STRUCT', fields: {
  //             street: 'STRING',
  //             city:   'STRING',
  //             zipcode:'INT'
  //           }},
  //           {
  //             street:  '123 Main St',
  //             city:    'Los Angeles',
  //             zipcode: 90001
  //           }
  //         ]
  //       });
        
  //       console.warn('Address create query:', addressQuery);
        

  //       const addressQuery2 = await controller.db.createNode('Address', {
  //         id: ['STRING', 'ADDR-0012'],   // primary key
  //         // id2: ['STRING', 'ADDR-00123'],   // primary key

  //         // location: [
  //         //   { kind: 'STRUCT', fields: {
  //         //     street: 'STRING',
  //         //     city:   'STRING',
  //         //     zipcode:'INT'
  //         //   }},
  //         //   {
  //         //     street:  '123 Main St',
  //         //     city:    'Los Angeles',
  //         //     zipcode: 90001
  //         //   }
  //         // ]
  //       });
        
  //       console.warn('Address create query:', addressQuery2);
        
  //       // await controller.db.query(addressQuery);
    
  //     } catch (error) {
  //       console.error('Error:', error);
  //       hasRun = false; // Reset on error so it can retry
  //     }
  //   };
    

  //   testCreateSchema2();
  // }, []);

  return (
    <div className="relative flex h-full border border-border rounded-md">
      {/* Line Numbers */}
      <div
        className="absolute top-0 left-0 w-14 flex flex-col h-full px-2 py-1 overflow-hidden font-mono text-typography-tertiary whitespace-pre pointer-events-none select-none"
        ref={lineNumbersRef}
      >
        {renderLineNumbers()}
      </div>
      <Separator
        orientation="vertical"
        className="absolute left-14 top-0 h-full opacity-50"
      />
      {/* Code Editor */}
      <textarea
        ref={textAreaRef}
        value={code}
        onChange={(e) => setCode(e.target.value)}
        onScroll={handleOnScroll}
        placeholder="Enter your code here..."
        spellCheck={false}
        className="resize-none w-full h-full py-1 ml-16 mr-1 outline-none font-mono whitespace-nowrap [&::-webkit-scrollbar]:hidden"
      />
    </div>
  );
}
