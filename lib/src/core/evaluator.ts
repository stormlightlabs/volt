/**
 * Safe expression evaluation with operators support
 *
 * Implements a recursive descent parser for expressions without using eval().
 * Includes sandboxing to prevent prototype pollution and sandbox escape attacks.
 */

import type { Dep, Scope } from "$types/volt";

/**
 * Blocked properties to prevent prototype pollution and sandbox escape
 */
const DANGEROUS_PROPERTIES = new Set(["__proto__", "prototype", "constructor"]);

const SAFE_GLOBALS = new Set([
  "Array",
  "Object",
  "String",
  "Number",
  "Boolean",
  "Date",
  "Math",
  "JSON",
  "RegExp",
  "Map",
  "Set",
  "Promise",
]);

const DANGEROUS_GLOBALS = new Set([
  "Function",
  "eval",
  "globalThis",
  "window",
  "global",
  "process",
  "require",
  "import",
  "module",
  "exports",
]);

/**
 * Validates that a property name is safe to access
 */
function isSafeProp(key: unknown): boolean {
  if (typeof key !== "string" && typeof key !== "number") {
    return true;
  }

  const keyStr = String(key);
  return !DANGEROUS_PROPERTIES.has(keyStr);
}

/**
 * Validates that accessing a property on an object is safe
 */
function isSafeAccess(object: unknown, key: unknown): boolean {
  if (!isSafeProp(key)) {
    return false;
  }

  if (typeof object === "function") {
    const keyStr = String(key);
    if (keyStr === "constructor" && object.name && !SAFE_GLOBALS.has(object.name)) {
      return false;
    }
  }

  return true;
}

type TokenType =
  | "NUMBER"
  | "STRING"
  | "TRUE"
  | "FALSE"
  | "NULL"
  | "UNDEFINED"
  | "IDENTIFIER"
  | "DOT"
  | "LBRACKET"
  | "RBRACKET"
  | "LPAREN"
  | "RPAREN"
  | "LBRACE"
  | "RBRACE"
  | "COMMA"
  | "QUESTION"
  | "COLON"
  | "ARROW"
  | "DOT_DOT_DOT"
  | "PLUS"
  | "MINUS"
  | "STAR"
  | "SLASH"
  | "PERCENT"
  | "BANG"
  | "EQ_EQ_EQ"
  | "BANG_EQ_EQ"
  | "LT"
  | "GT"
  | "LT_EQ"
  | "GT_EQ"
  | "AND_AND"
  | "OR_OR"
  | "EOF";

type Token = { type: TokenType; value: unknown; start: number; end: number };

function tokenize(expr: string): Token[] {
  const tokens: Token[] = [];
  let pos = 0;

  while (pos < expr.length) {
    const char = expr[pos];

    if (/\s/.test(char)) {
      pos++;
      continue;
    }

    if (/\d/.test(char) || (char === "-" && pos + 1 < expr.length && /\d/.test(expr[pos + 1]))) {
      const start = pos;
      if (char === "-") pos++;
      while (pos < expr.length && /[\d.]/.test(expr[pos])) {
        pos++;
      }
      tokens.push({ type: "NUMBER", value: Number(expr.slice(start, pos)), start, end: pos });
      continue;
    }

    if (char === "\"" || char === "'") {
      const start = pos;
      const quote = char;
      pos++;
      let value = "";
      while (pos < expr.length && expr[pos] !== quote) {
        if (expr[pos] === "\\") {
          pos++;
          if (pos < expr.length) {
            value += expr[pos];
          }
        } else {
          value += expr[pos];
        }
        pos++;
      }
      if (pos < expr.length) pos++;
      tokens.push({ type: "STRING", value, start, end: pos });
      continue;
    }

    if (/[a-zA-Z_$]/.test(char)) {
      const start = pos;
      while (pos < expr.length && /[a-zA-Z0-9_$]/.test(expr[pos])) {
        pos++;
      }
      const value = expr.slice(start, pos);

      switch (value) {
        case "true": {
          tokens.push({ type: "TRUE", value: true, start, end: pos });
          break;
        }
        case "false": {
          tokens.push({ type: "FALSE", value: false, start, end: pos });
          break;
        }
        case "null": {
          tokens.push({ type: "NULL", value: null, start, end: pos });
          break;
        }
        case "undefined": {
          tokens.push({ type: "UNDEFINED", value: undefined, start, end: pos });
          break;
        }
        default: {
          tokens.push({ type: "IDENTIFIER", value, start, end: pos });
        }
      }
      continue;
    }

    const start = pos;

    if (pos + 2 < expr.length) {
      const threeChar = expr.slice(pos, pos + 3);
      if (threeChar === "===") {
        tokens.push({ type: "EQ_EQ_EQ", value: "===", start, end: pos + 3 });
        pos += 3;
        continue;
      }
      if (threeChar === "!==") {
        tokens.push({ type: "BANG_EQ_EQ", value: "!==", start, end: pos + 3 });
        pos += 3;
        continue;
      }
      if (threeChar === "...") {
        tokens.push({ type: "DOT_DOT_DOT", value: "...", start, end: pos + 3 });
        pos += 3;
        continue;
      }
    }

    if (pos + 1 < expr.length) {
      const twoChar = expr.slice(pos, pos + 2);
      switch (twoChar) {
        case "<=": {
          tokens.push({ type: "LT_EQ", value: "<=", start, end: pos + 2 });
          pos += 2;
          continue;
        }
        case ">=": {
          tokens.push({ type: "GT_EQ", value: ">=", start, end: pos + 2 });
          pos += 2;
          continue;
        }
        case "&&": {
          tokens.push({ type: "AND_AND", value: "&&", start, end: pos + 2 });
          pos += 2;
          continue;
        }
        case "||": {
          tokens.push({ type: "OR_OR", value: "||", start, end: pos + 2 });
          pos += 2;
          continue;
        }
        case "=>": {
          tokens.push({ type: "ARROW", value: "=>", start, end: pos + 2 });
          pos += 2;
          continue;
        }
      }
    }

    switch (char) {
      case ".": {
        tokens.push({ type: "DOT", value: ".", start, end: pos + 1 });
        pos++;
        break;
      }
      case "[": {
        tokens.push({ type: "LBRACKET", value: "[", start, end: pos + 1 });
        pos++;
        break;
      }
      case "]": {
        tokens.push({ type: "RBRACKET", value: "]", start, end: pos + 1 });
        pos++;
        break;
      }
      case "(": {
        tokens.push({ type: "LPAREN", value: "(", start, end: pos + 1 });
        pos++;
        break;
      }
      case ")": {
        tokens.push({ type: "RPAREN", value: ")", start, end: pos + 1 });
        pos++;
        break;
      }
      case "+": {
        tokens.push({ type: "PLUS", value: "+", start, end: pos + 1 });
        pos++;
        break;
      }
      case "-": {
        tokens.push({ type: "MINUS", value: "-", start, end: pos + 1 });
        pos++;
        break;
      }
      case "*": {
        tokens.push({ type: "STAR", value: "*", start, end: pos + 1 });
        pos++;
        break;
      }
      case "/": {
        tokens.push({ type: "SLASH", value: "/", start, end: pos + 1 });
        pos++;
        break;
      }
      case "%": {
        tokens.push({ type: "PERCENT", value: "%", start, end: pos + 1 });
        pos++;
        break;
      }
      case "!": {
        tokens.push({ type: "BANG", value: "!", start, end: pos + 1 });
        pos++;
        break;
      }
      case "<": {
        tokens.push({ type: "LT", value: "<", start, end: pos + 1 });
        pos++;
        break;
      }
      case ">": {
        tokens.push({ type: "GT", value: ">", start, end: pos + 1 });
        pos++;
        break;
      }
      case "{": {
        tokens.push({ type: "LBRACE", value: "{", start, end: pos + 1 });
        pos++;
        break;
      }
      case "}": {
        tokens.push({ type: "RBRACE", value: "}", start, end: pos + 1 });
        pos++;
        break;
      }
      case ",": {
        tokens.push({ type: "COMMA", value: ",", start, end: pos + 1 });
        pos++;
        break;
      }
      case "?": {
        tokens.push({ type: "QUESTION", value: "?", start, end: pos + 1 });
        pos++;
        break;
      }
      case ":": {
        tokens.push({ type: "COLON", value: ":", start, end: pos + 1 });
        pos++;
        break;
      }
      default: {
        throw new Error(`Unexpected character '${char}' at position ${pos}`);
      }
    }
  }

  tokens.push({ type: "EOF", value: null, start: pos, end: pos });
  return tokens;
}

/**
 * Recursive descent parser for expression evaluation with operator precedence
 */
class Parser {
  private tokens: Token[];
  private current = 0;
  private scope: Scope;

  constructor(tokens: Token[], scope: Scope) {
    this.tokens = tokens;
    this.scope = scope;
  }

  parse(): unknown {
    return this.parseExpr();
  }

  private parseExpr(): unknown {
    return this.parseTernary();
  }

  private parseTernary(): unknown {
    const expr = this.parseLogicalOr();

    if (this.match("QUESTION")) {
      const trueBranch = this.parseExpr();
      this.consume("COLON", "Expected ':' in ternary expression");
      const falseBranch = this.parseExpr();
      return expr ? trueBranch : falseBranch;
    }

    return expr;
  }

  private parseLogicalOr(): unknown {
    let left = this.parseLogicalAnd();

    while (this.match("OR_OR")) {
      const right = this.parseLogicalAnd();
      left = Boolean(left) || Boolean(right);
    }

    return left;
  }

  private parseLogicalAnd(): unknown {
    let left = this.parseEquality();

    while (this.match("AND_AND")) {
      const right = this.parseEquality();
      left = Boolean(left) && Boolean(right);
    }

    return left;
  }

  private parseEquality(): unknown {
    let left = this.parseRelational();

    while (true) {
      if (this.match("EQ_EQ_EQ")) {
        const right = this.parseRelational();
        left = left === right;
      } else if (this.match("BANG_EQ_EQ")) {
        const right = this.parseRelational();
        left = left !== right;
      } else {
        break;
      }
    }

    return left;
  }

  private parseRelational(): unknown {
    let left = this.parseAdditive();

    while (true) {
      if (this.match("LT")) {
        const right = this.parseAdditive();
        left = (left as number) < (right as number);
      } else if (this.match("GT")) {
        const right = this.parseAdditive();
        left = (left as number) > (right as number);
      } else if (this.match("LT_EQ")) {
        const right = this.parseAdditive();
        left = (left as number) <= (right as number);
      } else if (this.match("GT_EQ")) {
        const right = this.parseAdditive();
        left = (left as number) >= (right as number);
      } else {
        break;
      }
    }

    return left;
  }

  private parseAdditive(): unknown {
    let left = this.parseMultiplicative();

    while (true) {
      if (this.match("PLUS")) {
        const right = this.parseMultiplicative();
        left = (left as number) + (right as number);
      } else if (this.match("MINUS")) {
        const right = this.parseMultiplicative();
        left = (left as number) - (right as number);
      } else {
        break;
      }
    }

    return left;
  }

  private parseMultiplicative(): unknown {
    let left = this.parseUnary();

    while (true) {
      if (this.match("STAR")) {
        const right = this.parseUnary();
        left = (left as number) * (right as number);
      } else if (this.match("SLASH")) {
        const right = this.parseUnary();
        left = (left as number) / (right as number);
      } else if (this.match("PERCENT")) {
        const right = this.parseUnary();
        left = (left as number) % (right as number);
      } else {
        break;
      }
    }

    return left;
  }

  private parseUnary(): unknown {
    if (this.match("BANG")) {
      const operand = this.parseUnary();
      return !operand;
    }

    if (this.match("MINUS")) {
      const operand = this.parseUnary();
      return -(operand as number);
    }

    if (this.match("PLUS")) {
      const operand = this.parseUnary();
      return +(operand as number);
    }

    return this.parseMemberAccess();
  }

  private parseMemberAccess(): unknown {
    let object = this.parsePrimary();

    while (true) {
      if (this.match("DOT")) {
        const prop = this.consume("IDENTIFIER", "Expected property name after '.'");
        const propValue = this.getMember(object, prop.value as string);

        if (this.check("LPAREN")) {
          this.advance();
          const args = this.parseArgumentList();
          this.consume("RPAREN", "Expected ')' after arguments");
          object = this.callMethod(object, prop.value as string, args);
        } else {
          object = propValue;
        }
      } else if (this.match("LBRACKET")) {
        const index = this.parseExpr();
        this.consume("RBRACKET", "Expected ']' after member access");
        object = this.getMember(object, index);
      } else if (this.match("LPAREN")) {
        const args = this.parseArgumentList();
        this.consume("RPAREN", "Expected ')' after arguments");

        if (typeof object === "function") {
          const func = object as { name?: string };
          if (func.name === "Function" || func.name === "eval") {
            throw new Error("Cannot call dangerous function");
          }
          object = (object as (...args: unknown[]) => unknown)(...args);
        } else {
          throw new TypeError("Attempting to call a non-function value");
        }
      } else {
        break;
      }
    }

    if (isSignal(object)) {
      return (object as { get: () => unknown }).get();
    }

    return object;
  }

  private parseArgumentList(): unknown[] {
    const args: unknown[] = [];

    if (this.check("RPAREN")) {
      return args;
    }

    do {
      args.push(this.parseExpr());
    } while (this.match("COMMA"));

    return args;
  }

  private callMethod(object: unknown, methodName: string, args: unknown[]): unknown {
    if (object === null || object === undefined) {
      throw new Error(`Cannot call method '${methodName}' on ${object}`);
    }

    if (!isSafeAccess(object, methodName)) {
      throw new Error(`Unsafe method call: ${methodName}`);
    }

    const method = (object as Record<string, unknown>)[methodName];

    if (typeof method !== "function") {
      throw new TypeError(`'${methodName}' is not a function`);
    }

    return (method as (...args: unknown[]) => unknown).call(object, ...args);
  }

  private parsePrimary(): unknown {
    if (this.match("NUMBER", "STRING", "TRUE", "FALSE", "NULL", "UNDEFINED")) {
      return this.previous().value;
    }

    if (this.match("IDENTIFIER")) {
      const identifier = this.previous().value as string;

      if (this.check("ARROW")) {
        this.current--;
        return this.parseArrowFunction();
      }

      return this.resolvePropPath(identifier);
    }

    if (this.match("LPAREN")) {
      const start = this.current;

      if (this.isArrowFunctionParams()) {
        this.current = start - 1;
        return this.parseArrowFunction();
      }

      const expr = this.parseExpr();
      this.consume("RPAREN", "Expected ')' after expression");
      return expr;
    }

    if (this.match("LBRACKET")) {
      return this.parseArrayLiteral();
    }

    if (this.match("LBRACE")) {
      return this.parseObjectLiteral();
    }

    throw new Error(`Unexpected token: ${this.peek().type}`);
  }

  private parseArrayLiteral(): unknown[] {
    const elements: unknown[] = [];

    if (this.match("RBRACKET")) {
      return elements;
    }

    do {
      if (this.match("DOT_DOT_DOT")) {
        const spreadValue = this.parseExpr();
        if (Array.isArray(spreadValue)) {
          elements.push(...spreadValue);
        } else {
          throw new TypeError("Spread operator can only be used with arrays");
        }
      } else {
        elements.push(this.parseExpr());
      }
    } while (this.match("COMMA"));

    this.consume("RBRACKET", "Expected ']' after array elements");
    return elements;
  }

  private parseObjectLiteral(): Record<string, unknown> {
    const object: Record<string, unknown> = {};

    if (this.match("RBRACE")) {
      return object;
    }

    do {
      if (this.match("DOT_DOT_DOT")) {
        const spreadValue = this.parseExpr();
        if (typeof spreadValue === "object" && spreadValue !== null && !Array.isArray(spreadValue)) {
          for (const key of Object.keys(spreadValue)) {
            if (!isSafeProp(key)) {
              throw new Error(`Unsafe property in spread: ${key}`);
            }
          }
          Object.assign(object, spreadValue);
        } else {
          throw new Error("Spread operator can only be used with objects in object literals");
        }
      } else {
        let key: string;

        if (this.match("IDENTIFIER")) {
          key = this.previous().value as string;
        } else if (this.match("STRING")) {
          key = this.previous().value as string;
        } else {
          throw new Error("Expected property key in object literal");
        }

        if (!isSafeProp(key)) {
          throw new Error(`Unsafe property key in object literal: ${key}`);
        }

        this.consume("COLON", "Expected ':' after property key");
        const value = this.parseExpr();
        object[key] = value;
      }
    } while (this.match("COMMA"));

    this.consume("RBRACE", "Expected '}' after object properties");
    return object;
  }

  private parseArrowFunction(): (...args: unknown[]) => unknown {
    const params: string[] = [];

    if (this.match("IDENTIFIER")) {
      params.push(this.previous().value as string);
    } else if (this.match("LPAREN")) {
      if (!this.check("RPAREN")) {
        do {
          const param = this.consume("IDENTIFIER", "Expected parameter name");
          params.push(param.value as string);
        } while (this.match("COMMA"));
      }
      this.consume("RPAREN", "Expected ')' after parameters");
    } else {
      throw new Error("Expected arrow function parameters");
    }

    this.consume("ARROW", "Expected '=>' in arrow function");

    if (this.match("LBRACE")) {
      let braceDepth = 1;
      while (braceDepth > 0 && !this.isAtEnd()) {
        if (this.check("LBRACE")) braceDepth++;
        if (this.check("RBRACE")) braceDepth--;
        this.advance();
      }
      throw new Error("Arrow function block bodies are not yet supported. Use single expressions only.");
    } else {
      const exprTokens: Token[] = [];
      let parenDepth = 0;
      let bracketDepth = 0;
      let braceDepth = 0;

      outer: while (!this.isAtEnd()) {
        const token = this.peek();

        switch (token.type) {
          case "LPAREN": {
            parenDepth++;
            break;
          }
          case "RPAREN": {
            if (parenDepth === 0) break outer;
            parenDepth--;
            break;
          }
          case "LBRACKET": {
            bracketDepth++;
            break;
          }
          case "RBRACKET": {
            if (bracketDepth === 0) break outer;
            bracketDepth--;
            break;
          }
          case "LBRACE": {
            braceDepth++;
            break;
          }
          case "RBRACE": {
            if (braceDepth === 0) break outer;
            braceDepth--;
            break;
          }
          case "COMMA": {
            if (parenDepth === 0 && bracketDepth === 0 && braceDepth === 0) {
              break outer;
            }
            break;
          }
          default: {
            break;
          }
        }

        exprTokens.push(this.advance());
      }

      const capturedScope = this.scope;

      return (...args: unknown[]) => {
        const arrowScope: Scope = { ...capturedScope };
        for (const [index, param] of params.entries()) {
          arrowScope[param] = args[index];
        }

        const parser = new Parser([...exprTokens, { type: "EOF", value: null, start: 0, end: 0 }], arrowScope);
        return parser.parse();
      };
    }
  }

  private isArrowFunctionParams(): boolean {
    const saved = this.current;
    let result = false;

    try {
      if (this.check("RPAREN")) {
        this.advance();
        if (this.check("ARROW")) {
          result = true;
        }
      } else {
        while (!this.isAtEnd() && !this.check("RPAREN")) {
          if (!this.match("IDENTIFIER", "COMMA")) {
            result = false;
            break;
          }
        }
        if (this.match("RPAREN") && this.check("ARROW")) {
          result = true;
        }
      }
    } finally {
      this.current = saved;
    }

    return result;
  }

  private getMember(object: unknown, key: unknown): unknown {
    if (object === null || object === undefined) {
      return undefined;
    }

    if (!isSafeAccess(object, key)) {
      throw new Error(`Unsafe property access: ${String(key)}`);
    }

    if (isSignal(object) && (key === "get" || key === "set" || key === "subscribe")) {
      return (object as Record<string, unknown>)[key as string];
    }

    if (isSignal(object)) {
      object = (object as { get: () => unknown }).get();
    }

    const value = (object as Record<string | number, unknown>)[key as string | number];

    if (isSignal(value)) {
      return value.get();
    }

    return value;
  }

  private resolvePropPath(path: string): unknown {
    if (!isSafeProp(path)) {
      throw new Error(`Unsafe property access: ${path}`);
    }

    if (DANGEROUS_GLOBALS.has(path)) {
      throw new Error(`Access to dangerous global: ${path}`);
    }

    if (!(path in this.scope)) {
      return undefined;
    }

    return this.scope[path];
  }

  private match(...types: TokenType[]): boolean {
    for (const type of types) {
      if (this.check(type)) {
        this.advance();
        return true;
      }
    }
    return false;
  }

  private check(type: TokenType): boolean {
    if (this.isAtEnd()) return false;
    return this.peek().type === type;
  }

  private advance(): Token {
    if (!this.isAtEnd()) this.current++;
    return this.previous();
  }

  private isAtEnd(): boolean {
    return this.peek().type === "EOF";
  }

  private peek(): Token {
    return this.tokens[this.current];
  }

  private previous(): Token {
    return this.tokens[this.current - 1];
  }

  private consume(type: TokenType, message: string): Token {
    if (this.check(type)) return this.advance();
    throw new Error(`${message} at position ${this.peek().start}`);
  }
}

export function isSignal(value: unknown): value is Dep {
  return (typeof value === "object"
    && value !== null
    && "get" in value
    && "subscribe" in value
    && typeof value.get === "function"
    && typeof (value as { subscribe: unknown }).subscribe === "function");
}

/**
 * Evaluate an expression against a scope object.
 *
 * Supports literals, property access, operators, and member access.
 *
 * @param expr - The expression string to evaluate
 * @param scope - The scope object containing values
 * @returns The evaluated result
 */
export function evaluate(expr: string, scope: Scope): unknown {
  try {
    const tokens = tokenize(expr);
    const parser = new Parser(tokens, scope);
    return parser.parse();
  } catch (error) {
    console.error(`Error evaluating expression "${expr}":`, error);
    return undefined;
  }
}

/**
 * Extract all signal dependencies from an expression by finding identifiers
 * that correspond to signals in the scope.
 *
 * @param expr - The expression to analyze
 * @param scope - The scope containing potential signal dependencies
 * @returns Array of signals found in the expression
 */
export function extractDependencies(expr: string, scope: Scope): Array<Dep> {
  const dependencies: Array<Dep> = [];
  const identifierRegex = /\b([a-zA-Z_$][\w$]*)\b/g;
  const matches = expr.matchAll(identifierRegex);
  const seen = new Set<string>();

  for (const match of matches) {
    const identifier = match[1];

    if (["true", "false", "null", "undefined"].includes(identifier)) {
      continue;
    }

    if (seen.has(identifier)) {
      continue;
    }

    seen.add(identifier);

    const value = scope[identifier];
    if (isSignal(value)) {
      dependencies.push(value);
    }
  }

  return dependencies;
}
