/** Syntax tree for the C++ subset. `start`/`end` are source offsets used for narration. */

export type BaseType =
  | 'int' | 'll' | 'uint' | 'ull' | 'short' | 'double' | 'float' | 'char' | 'bool'
  | 'string' | 'void' | 'auto' | 'vector';

export interface TypeSpec {
  base: BaseType;
  /** element type for vector<T> */
  elem?: TypeSpec;
  isConst?: boolean;
  isRef?: boolean;
}

interface NodeBase {
  line: number;
  start: number;
  end: number;
}

export type Expr =
  | (NodeBase & { type: 'Num'; value: number; isFloat: boolean; isLong: boolean })
  | (NodeBase & { type: 'Str'; value: string })
  | (NodeBase & { type: 'Char'; value: string })
  | (NodeBase & { type: 'Bool'; value: boolean })
  | (NodeBase & { type: 'Ident'; name: string })
  | (NodeBase & { type: 'Binary'; op: string; left: Expr; right: Expr })
  | (NodeBase & { type: 'Assign'; op: string; target: Expr; value: Expr })
  | (NodeBase & { type: 'Unary'; op: string; arg: Expr })
  | (NodeBase & { type: 'Update'; op: '++' | '--'; prefix: boolean; arg: Expr })
  | (NodeBase & { type: 'Ternary'; test: Expr; then: Expr; else: Expr })
  | (NodeBase & { type: 'Call'; callee: string; args: Expr[] })
  | (NodeBase & { type: 'Method'; obj: Expr; name: string; args: Expr[] })
  | (NodeBase & { type: 'Index'; obj: Expr; index: Expr })
  | (NodeBase & { type: 'Cast'; to: TypeSpec; arg: Expr })
  | (NodeBase & { type: 'Sizeof'; of: TypeSpec | null; arg: Expr | null })
  | (NodeBase & { type: 'InitList'; items: Expr[] })
  | (NodeBase & { type: 'Seq'; items: Expr[] });

export interface Declarator {
  name: string;
  dims: (Expr | null)[];
  init: Expr | null;
  /** constructor-style args: vector<int> v(5, 0) */
  ctorArgs: Expr[] | null;
  line: number;
  start: number;
  end: number;
}

export type Stmt =
  | (NodeBase & { type: 'Block'; body: Stmt[] })
  | (NodeBase & { type: 'Decl'; varType: TypeSpec; decls: Declarator[] })
  | (NodeBase & { type: 'ExprStmt'; expr: Expr })
  | (NodeBase & { type: 'If'; test: Expr; then: Stmt; else: Stmt | null; elseLine: number })
  | (NodeBase & { type: 'For'; init: Stmt | null; test: Expr | null; update: Expr | null; body: Stmt; id: number })
  | (NodeBase & { type: 'ForRange'; varType: TypeSpec; name: string; range: Expr; body: Stmt; id: number })
  | (NodeBase & { type: 'While'; test: Expr; body: Stmt; id: number })
  | (NodeBase & { type: 'DoWhile'; test: Expr; body: Stmt; id: number; testLine: number })
  | (NodeBase & { type: 'Switch'; disc: Expr; body: Stmt[]; labels: SwitchLabel[] })
  | (NodeBase & { type: 'Break' })
  | (NodeBase & { type: 'Continue' })
  | (NodeBase & { type: 'Return'; value: Expr | null })
  | (NodeBase & { type: 'Empty' });

export interface SwitchLabel {
  /** null = default */
  test: Expr | null;
  /** index into the switch body where this label points */
  index: number;
  line: number;
}

export interface Param {
  type: TypeSpec;
  name: string;
  isArray: boolean;
}

export interface FuncDecl {
  name: string;
  ret: TypeSpec;
  params: Param[];
  body: Stmt & { type: 'Block' };
  line: number;
}

export interface Program {
  functions: Map<string, FuncDecl>;
  globals: (Stmt & { type: 'Decl' })[];
  src: string;
}
