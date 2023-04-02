import { BinaryOperator, bindingPower, unaryOpsBp } from "./operator.js";
import { Sym, SymKind } from "./sym.js";
import { Type } from "./typing.js";
import { DateTime, Place, Token, TokenError, TokenResult, TokenStream } from "./tokenize.js";


export type Span = { start: Place, end: Place };

export type Value = 
    { type: "str", value: string} |
    { type: "num", value: number} |
    { type: "date", value: DateTime };

export type FuncParameter = {name: string, type: Type|undefined};

export type DimExpr = { kind: "dim", sym: Sym, dimType?: Type, expr?: Expr }

type ExprMinusSpan =
    { kind: "lit", value: Value } |
    { kind: "seq", exprs: Expr[] } |
    DimExpr |
    { kind: "new", cstr: Type, args: Expr[] } |
    { kind: "call", expr: Expr, args: Expr[] } |
    { kind: "select", expr: Expr, args: Expr[] } |
    { kind: "select2", expr: Expr, args: Expr[] } |
    { kind: "aggregate", expr: Expr, args: Expr[] } |
    { kind: "minus", expr: Expr } |
    { kind: "not", expr: Expr } |
    { kind: "var", sym: Sym } |
    { kind: ":=", left: Expr, right: Expr } |
    { kind: "op", op: BinaryOperator, left: Expr, right: Expr } |
    { kind: "list", expressions: Expr[] } |
    { kind: "access", object: Expr, method: Sym, args: Expr[] } |
    { kind: "lambda", params: FuncParameter[], body: Expr }

export type Expr = { span: Span } & ExprMinusSpan;

type ParseErrorMinusSpan =
    { reason: "unexpected-token", token: Token } |
    { reason: "expected-but-found", expected: Token["kind"][], found: Token } |
    { reason: "expected-but-found-expr", expected: Expr["kind"][], found: Expr } |
    { reason: "binary-op-miss-operand", op: BinaryOperator } |
    { reason: "expected-some", msg: string } |
    { reason: "assert-expr-failed", msg: string } |
    { reason: "unexpected-expr", expr: Expr } |
    { reason: "unclosed", parens: "(" | "[" | "²[" } |
    { reason: "invalid-type-kind", kind: SymKind } |
    { reason: "invalid-dim", token: Token } |
    { reason: "invalid-var-name", sym: Sym } |
    { reason: "invalid-param-name", expr: Expr } |
    { reason: "bad-token", err: TokenError};

export type ParseError = { span: Span } & ParseErrorMinusSpan;

export function createParser(tokens: TokenStream, stopOnFirstError: boolean, declarationFile: boolean) {
    const errors: ParseError[] = [];
    let lastPlace: Place = Place.zero();
    let currentPlace: Place = Place.zero();

    function tryToken(tok: IteratorResult<TokenResult>): Token|undefined {
        if (tok.done) {
            return undefined;
        }
        if (tok.value.status === "err") {
            errors.push({ reason: "bad-token", span: { start: lastPlace, end: tok.value.place }, err: tok.value.err });
            if (stopOnFirstError) {
                throw "end";
            }
            return tryNextToken();
        }
        return tok.value.token;
    }

    function expectNonNull<T>(thing: T|undefined, msg: string): T {
        if (typeof thing === "undefined") {
            signalError({ reason: "expected-some", msg });
        }
        return thing;
    }

    function assertExpr(expr: IteratorResult<Expr>, msg: string): Expr {
        if (expr.done) {
            signalError({ reason: "assert-expr-failed", msg });
        }
        return expr.value;
    }

    function tryNextToken(): Token|undefined {
        const tok = tokens.next();
        const res = tryToken(tok);
        if (res) {
            currentPlace = tok.value.place;
        }
        return res;
    }

    function tryPeekToken(): Token|undefined {
        const tok = tokens.peek();
        return tryToken(tok);
    }

    function signalError(err: ParseErrorMinusSpan): never {
        errors.push({ span: currentSpan(), ...err });
        throw "error";
    }

    function currentSpan() {
        return { start: lastPlace, end: currentPlace };
    }

    function exprWithSpan(expr: ExprMinusSpan): Expr {
        return { span: currentSpan(), ...expr };
    }

    function isSeparator(tok: Token): boolean {
        return typeof tok === "undefined" || tok.kind === "," || tok.kind === ":" || 
            tok.kind === ")" || tok.kind === "]" || tok.kind === "}";
    }

    function parseBinaryOp(lhs: Expr, minBp: number): ExprMinusSpan {
        while (true) {
            const tok = tryPeekToken();
            if (!tok || isSeparator(tok)) {
                break;
            }
            if (tok.kind !== "op") {
                signalError({ reason: "expected-but-found", expected: ["op"], found: tok });
            }
            const op = tok.value;
            const [lbp, rbp] = bindingPower(op);
            if (lbp < minBp) {
                break;
            }
            tryNextToken();
            const rhs = assertExpr(parseNextExpr(rbp), "binary op rhs");
            lhs = exprWithSpan({ kind: "op", op, left: lhs, right: rhs });
        }
        return lhs;
    }

    function expressionsToExpr(exprs: Expr[]): Expr {
        if (exprs.length === 1) {
            return exprs[0];
        } else {
            return exprWithSpan({ kind: "seq", exprs });
        }
    }

    function parseSequence(): Expr {
        const exprs: Expr[] = [];
        let tok: Token|undefined = undefined;
        while (true) {
            exprs.push(assertExpr(parseNextExpr(0), "expr in seq"));
            tok = tryPeekToken();
            if (!tok || tok.kind !== ":") {
                break;
            }
            tryNextToken();
            tok = expectNonNull(tryPeekToken(), "next seq expr");
            if (isSeparator(tok)) {
                break;
            }
        }
        return expressionsToExpr(exprs);
    }

    function parseSequenceList(endTokenKind: ")" | "}"  | "]"): Expr[] {
        const sequences: Expr[] = [];
        let tok = tryNextToken();
        tok = tryPeekToken();
        if (tok && tok.kind !== endTokenKind) {
            sequences.push(parseSequence());
        }
        while (typeof (tok = tryPeekToken()) !== "undefined") {
            if (tok.kind === endTokenKind) {
                tryNextToken();
                break;
            } else if (tok.kind === ",") {
                tryNextToken();
                sequences.push(parseSequence());
            } else {
                signalError({ reason: "expected-but-found", expected: [endTokenKind, ",", ":"], found: tok });
            }
        }
        return sequences;
    }

    function checkTypeKind(kind: SymKind) {
        switch (kind) {
            case "":
                return;
            case "#":
                return;
            case "$":
                if (!declarationFile) {
                    signalError({ reason: "invalid-type-kind", kind });
                }
                return;
            default:
                signalError({ reason: "invalid-type-kind", kind });
        }
    }

    function tryParseType(): Type|undefined {
        const typeSym = expectNonNull(tryPeekToken(), "type sym");
        if (typeSym.kind !== "sym") { return undefined; }
        tryNextToken();
        const sym = typeSym.value;
        checkTypeKind(sym.kind);
        const params: Type[] = [];
        let nullable = true;
        let nextTok = tryPeekToken();
        if (typeof nextTok !== "undefined") {
            if (nextTok.kind === "op" && nextTok.value === "+") {
                nullable = false;
                tryNextToken();
                nextTok = tryPeekToken();
            }
            if (typeof nextTok !== "undefined" && nextTok.kind === "op" && nextTok.value === "<") {
                let tok = tryNextToken();
                while (typeof (tok = tryPeekToken()) !== "undefined") {
                    const param = tryParseType();
                    if (typeof param !== "undefined") {
                        params.push(param);
                    } else if (tok.kind === "op" && tok.value === ">") {
                        tryNextToken();
                        break;
                    } else if (tok.kind === ",") {
                        tryNextToken();
                        continue;
                    } else {
                        signalError({ reason: "expected-but-found", expected: ["op", ","], found: tok });
                    }
                }
            }
        }
        return { sym, nullable, params }
    }

    function parseNew(): Expr {
        const cstr = expectNonNull(tryParseType(), "constructor type");
        const nextTok = tryPeekToken();
        let args: Expr[] = [];
        if (nextTok && nextTok.kind === "(") {
            args = parseSequenceList(")");
        }
        return exprWithSpan({ kind: "new", cstr, args });
    }

    function parseDim(): Expr {
        const varSym = expectNonNull(tryNextToken(), "declaration sym");
        if (varSym.kind !== "sym") {
            signalError({ reason: "expected-but-found", expected: ["sym"], found: varSym });
        }
        if (!declarationFile && varSym.value.kind !== "@" && varSym.value.kind !== "$") {
            signalError({ reason: "invalid-dim", token: varSym });
        }
        let nextTok = tryPeekToken();
        if (nextTok && nextTok.kind === "as") { tryNextToken() }
        nextTok = tryPeekToken();
        let expr: Expr|undefined = undefined;
        let cstr: Type|undefined;
        if (nextTok && nextTok.kind === "new") {
            tryNextToken();
            cstr = expectNonNull(tryParseType(), "initialization type");
            expr = exprWithSpan({ kind: "new", cstr, args: [] });
        } else {
            cstr = tryParseType();
            nextTok = tryPeekToken();
            if (nextTok && nextTok.kind === ":=") {
                tryNextToken();
                expr = assertExpr(parseNextExpr(0), "expression to assign");
            }
        }
        return exprWithSpan({ kind: "dim", sym: varSym.value, dimType: cstr, expr });
    }

    function expressionToParamName(expr: Expr): string {
        if (expr.kind === "var" && expr.sym.kind === "@" && !expr.sym.path) {
            return expr.sym.name;
        } else {
            signalError({ reason: "invalid-param-name", expr })
        }
    }

    function listToParamsList(list: Expr[]): FuncParameter[] {
        const params: FuncParameter[] = [];
        for (const expr of list) {
            params.push({ name: expressionToParamName(expr), type: undefined });
        }
        return params;
    }

    function parseLambda(params: FuncParameter[]): Expr {
        tryNextToken();
        let nextTok: Token|undefined = expectNonNull(tryNextToken(), "lambda body");
        if (nextTok.kind !== "(") {
            signalError({ reason: "expected-but-found", expected: ["("], found: nextTok });
        }
        const body = parseSequence();
        nextTok = tryNextToken();
        if (typeof nextTok === "undefined") {
            signalError({ reason: "unclosed", parens: "(" });
        }
        if (nextTok.kind !== ")") {
            signalError({ reason: "expected-but-found", expected: [")"], found: nextTok });
        }
        return exprWithSpan({ kind: "lambda", params, body });
    }

    function parseParamsList(firstExpr: Expr, firstType: Type|undefined): Expr {
        const params: FuncParameter[] = [{ name: expressionToParamName(firstExpr), type: firstType }];
        let tok: Token|undefined = undefined;
        while (typeof (tok = tryNextToken()) !== "undefined") {
            if (tok.kind === ")") {
                break;
            } else if (tok.kind === ",") {
                const name = expressionToParamName(assertExpr(parseNextExpr(0), "param name"));
                const type = tryParseType();
                params.push({ name, type });
            } else {
                signalError({ reason: "expected-but-found", expected: [")", ","], found: tok });
            }
        }
        return parseLambda(params);
    }

    function parseList(firstExpr: Expr): Expr {
        const expressions = [firstExpr];
        let tok: Token|undefined = undefined;
        while (typeof (tok = tryNextToken()) !== "undefined") {
            if (tok.kind === ")") {
                break;
            } else if (tok.kind === ",") {
                expressions.push(assertExpr(parseNextExpr(0), "list element"));
            } else {
                signalError({ reason: "expected-but-found", expected: [")", ","], found: tok });
            }
        }
        return exprWithSpan({ kind: "list", expressions });
    }

    function parseParens(): Expr {
        let nextTok = tryPeekToken();
        if (typeof nextTok === "undefined") {
            signalError({ reason: "unclosed", parens: "(" });
        } else if (nextTok.kind === ")") {
            tryNextToken();
            nextTok = expectNonNull(tryPeekToken(), "=> after empty parens");
            if (nextTok.kind === "=>") {
                return parseLambda([]);
            } else {
                signalError({ reason: "expected-but-found", expected: ["=>"], found: nextTok });
            }
        }
        const firstExpr = assertExpr(parseNextExpr(0), "in parens");
        nextTok = tryPeekToken();
        if (typeof nextTok === "undefined") {
            throw "";
        } else if (firstExpr.kind === "var") {
            const firstType = tryParseType();
            return parseParamsList(firstExpr, firstType);
        } else if (nextTok.kind === ",") {
            return parseList(firstExpr);
        } else if (nextTok.kind === ")") {
            tryNextToken();
            nextTok = tryPeekToken();
            if (nextTok && nextTok.kind === "=>") {
                return parseLambda(listToParamsList([firstExpr]));
            } else {
                return firstExpr;
            }
        } else {
            signalError({ reason: "expected-but-found", expected: ["sym", ",", ")"], found: nextTok });
        }
    }

    function parseNextToken(previous: Expr|undefined, minBp: number): Expr|undefined {
        const tokres = tokens.peek();
        if (!tokres.done) {
            lastPlace = tokres.value.place;
        }
        const tok = tryToken(tokres);
        if (tok?.kind !== "op") {
            tryNextToken();
        }
        switch (tok?.kind) {
            case "str":
                return exprWithSpan({ kind: "lit", value: { type: "str", value: tok.value } });
            case "num":
                return exprWithSpan({ kind: "lit", value: { type: "num", value: tok.value } });
            case "date":
                return exprWithSpan({ kind: "lit", value: { type: "date", value: tok.value } });
            case "sym":
                return exprWithSpan({ kind: "var", sym: tok.value });
            case "not":
                return exprWithSpan({ kind: "not", expr: assertExpr(parseNextExpr(unaryOpsBp), "to negate") });
            case "new":
                return parseNew();
            case "dim":
                return parseDim();
            case "op":
                if (typeof previous === "undefined") {
                    if (tok.value === "-") {
                        tryNextToken();
                        return exprWithSpan({ kind: "minus", expr: assertExpr(parseNextExpr(unaryOpsBp), "to minus") });
                    } else {
                        signalError({ reason: "unexpected-token", token: tok });
                    }
                }
                return exprWithSpan(parseBinaryOp(previous, minBp));
            case "(":
                return parseParens();
            default:
                return undefined;
        }
    }

    function parseNextExpr(minBp: number): IteratorResult<Expr> {
        let expr: Expr|undefined;
        do {
            expr = parseNextToken(undefined, minBp);
        } while (tokens.hasNext() &&  typeof expr === "undefined");
        let nextTok;
        while (typeof (nextTok = tryPeekToken()) !== "undefined") {
            expr = expectNonNull(expr, "unreachable");
            if (nextTok.kind === ":") {
                break;
            } else if (nextTok.kind === "op") {
                expr = parseNextToken(expr, minBp);
                break;
            } else if (nextTok.kind === "(") {
                expr = exprWithSpan({ kind: "call", expr, args: parseSequenceList(")") });
            } else if (nextTok.kind === "[") {
                expr = exprWithSpan({ kind: "select", expr, args: parseSequenceList("]") });
            } else if (nextTok.kind === "²[") {
                expr = exprWithSpan({ kind: "select2", expr, args: parseSequenceList("]") });
            } else if (nextTok.kind === "{") {
                expr = exprWithSpan({ kind: "aggregate", expr, args: parseSequenceList("}") });
            } else if (nextTok.kind === ".") {
                tryNextToken();
                const member = expectNonNull(tryNextToken(), "member");
                if (member.kind !== "sym") {
                    signalError({ reason: "expected-but-found", expected: ["."], found: member })
                }
                const nextTok = expectNonNull(tryPeekToken(), "method call");
                if (nextTok.kind !== "(") {
                    signalError({ reason: "expected-but-found", expected: ["("], found: nextTok });
                }
                const args = parseSequenceList(")");
                expr = exprWithSpan({ kind: "access", object: expr, method: member.value, args });
            } else if (nextTok.kind === ":=") {
                tryNextToken();
                expr = exprWithSpan({ kind: ":=", left: expr, right: assertExpr(parseNextExpr(0), "right part of :=") });
                break;
            } else {
                break;
            }
        }
        if (typeof expr === "undefined") {
            return { value: undefined, done: true };
        }
        return { value: expr, done: false };
    }

    const parser = {
        errors,
        next(): IteratorResult<Expr> {
            if (stopOnFirstError && errors.length > 0) {
                return { value: undefined, done: true };
            }
            try {
                const expr = parseNextExpr(0);
                const tok = tryNextToken();
                if (tok && tok.kind !== ":") {
                    errors.push({ reason: "expected-but-found", span: currentSpan(), expected: [":"], found: tok });
                }
                return expr;
            } catch (e) {
                if (e === "end") {
                    return { value: undefined, done: true };
                }
                if (e === "error") {
                    return parser.next();
                }
                throw e;
            }
        },
        [Symbol.iterator]() { return parser; },
    };
    return parser;
}

export type Parser = ReturnType<typeof createParser>;