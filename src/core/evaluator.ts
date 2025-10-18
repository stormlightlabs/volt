/**
 * Safe expression evaluation with operators support
 * Implements a recursive descent parser for expressions without using eval()
 */

import type { Dep, Scope } from "$types/volt";

/**
 * Token types for lexical analysis
 */
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

/**
 * Token representing a lexical unit
 */
type Token = { type: TokenType; value: unknown; start: number; end: number };

/**
 * Tokenize an expression string into a stream of tokens
 *
 * @param expr - The expression string
 * @returns Array of tokens
 */
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

  /**
   * Parse the expression and return the result
   */
  parse(): unknown {
    return this.parseExpression();
  }

  private parseExpression(): unknown {
    return this.parseLogicalOr();
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
        const property = this.consume("IDENTIFIER", "Expected property name after '.'");
        object = this.getMember(object, property.value as string);
      } else if (this.match("LBRACKET")) {
        const index = this.parseExpression();
        this.consume("RBRACKET", "Expected ']' after member access");
        object = this.getMember(object, index);
      } else {
        break;
      }
    }

    return object;
  }

  private parsePrimary(): unknown {
    if (this.match("NUMBER", "STRING", "TRUE", "FALSE", "NULL", "UNDEFINED")) {
      return this.previous().value;
    }

    if (this.match("IDENTIFIER")) {
      const identifier = this.previous().value as string;
      return this.resolvePropPath(identifier);
    }

    if (this.match("LPAREN")) {
      const expr = this.parseExpression();
      this.consume("RPAREN", "Expected ')' after expression");
      return expr;
    }

    throw new Error(`Unexpected token: ${this.peek().type}`);
  }

  private getMember(object: unknown, key: unknown): unknown {
    if (object === null || object === undefined) {
      return undefined;
    }

    // Access property - works on objects, strings, arrays, etc.
    const value = (object as Record<string | number, unknown>)[key as string | number];

    if (isSignal(value)) {
      return value.get();
    }

    return value;
  }

  private resolvePropPath(path: string): unknown {
    if (!(path in this.scope)) {
      return undefined;
    }

    const value = this.scope[path];

    if (isSignal(value)) {
      return value.get();
    }

    return value;
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
 * @param expression - The expression string to evaluate
 * @param scope - The scope object containing values
 * @returns The evaluated result
 */
export function evaluate(expression: string, scope: Scope): unknown {
  try {
    const tokens = tokenize(expression);
    const parser = new Parser(tokens, scope);
    return parser.parse();
  } catch (error) {
    console.error(`Error evaluating expression "${expression}":`, error);
    return undefined;
  }
}

/**
 * Extract all signal dependencies from an expression by finding identifiers
 * that correspond to signals in the scope.
 *
 * @param expression - The expression to analyze
 * @param scope - The scope containing potential signal dependencies
 * @returns Array of signals found in the expression
 */
export function extractDependencies(expression: string, scope: Scope): Array<Dep> {
  const dependencies: Array<Dep> = [];
  const identifierRegex = /\b([a-zA-Z_$][\w$]*)\b/g;
  const matches = expression.matchAll(identifierRegex);
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
