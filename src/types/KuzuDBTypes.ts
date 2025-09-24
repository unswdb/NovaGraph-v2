// --- Atomic database scalars (including widths/kinds you listed) ---
export type ScalarType =
  | 'INT' | 'INT8' | 'INT16' | 'INT32' | 'INT64' | 'INT128'
  | 'UINT8' | 'UINT16' | 'UINT32' | 'UINT64'
  | 'FLOAT' | 'DOUBLE'
  | 'DECIMAL'          // parameterized (precision, scale) via a dedicated TypeSpec
  | 'BOOLEAN'
  | 'UUID'
  | 'STRING'
  | 'NULL'             // explicit NULL literal/type
  | 'DATE'
  | 'TIMESTAMP'
  | 'INTERVAL'
  | 'BLOB'             // e.g., Uint8Array / base64
  | 'JSON'             
  | 'SERIAL';          

// Keys allowed for MAP keys (assumingly limited to scalar/primitive types)
export type MapKeyScalar =
| 'STRING' | 'UUID' 
| 'INT' | 'INT8' | 'INT16' | 'INT32' | 'INT64' | 'INT128'
| 'UINT8' | 'UINT16' | 'UINT32' | 'UINT64';


// --- Composite/parameterized types ---
export type TypeSpec =
  | ScalarType
  | { kind: 'STRUCT'; fields: Record<string, TypeSpec> }
  | { kind: 'DECIMAL'; precision: number; scale: number }
  | { kind: 'LIST'; of: TypeSpec }
  | { kind: 'ARRAY'; of: TypeSpec }               
  | { kind: 'MAP'; key: MapKeyScalar; value: TypeSpec }
  | { kind: 'UNION'; variants: Record<string, TypeSpec> } 

  // Graph-specific handles (placeholders; often used in query results, not property values):
  | { kind: 'NODE'; label?: string }
  | { kind: 'REL'; label?: string }
  | { kind: 'RECURSIVE_REL'; label?: string };
  

// Values (runtime JS shapes)
export type PrimitiveValue = string | number | boolean | null;
export type NestedValue = PrimitiveValue | NestedValue[] | { [k: string]: NestedValue };
export type ValueWithType = [TypeSpec, NestedValue];