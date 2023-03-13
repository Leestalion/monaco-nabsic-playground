import { builtInType, Method, nullableType, Type, typeEquals, TypeInfo } from "./typing.js";
import { DimExpr, Expr, FuncParameter, Parser, Span, Value } from "./parse.js";
import { isGlobalBuiltIn, Sym } from "./sym.js";
import { BinaryOperator } from "./operator.js";
import { createTypeRegistry } from "./typeregistry.js";
import { BooleanType, CallableType, defineStandardTypes, NullType, NumberType, StringType, UnknownType } from "./def-std-types.js";
import { defineStandardFunctions } from "./def-std-func.js";
import { defineWebAPI } from "./def-web-api.js";


type TypedExpr =
    { type: Type, span: Span } & (
    { kind: "lit", value: Value } |
    { kind: "seq", exprs: TypedExpr[] } |
    { kind: "dim", sym:  Sym, dimType?: Type, expr?: TypedExpr } |
    { kind: "new", cstr: Type, args: TypedExpr[] } |
    { kind: "call", expr: TypedExpr, args: TypedExpr[] } |
    { kind: "select", expr: TypedExpr, args: TypedExpr[] } |
    { kind: "select2", expr: TypedExpr, args: TypedExpr[] } |
    { kind: "aggregate", expr: TypedExpr, args: TypedExpr[] } |
    { kind: "minus", expr: TypedExpr } |
    { kind: "not", expr: TypedExpr } |
    { kind: "var", sym: Sym } |
    { kind: ":=", left: TypedExpr, right: TypedExpr } |
    { kind: "op", op: BinaryOperator, left: TypedExpr, right: TypedExpr } |
    { kind: "list", expressions: TypedExpr[] } |
    { kind: "access", object: TypedExpr, method: Sym } |
    { kind: "lambda", params: FuncParameter[], body: TypedExpr });

type TypingError = { expr: Expr } & (
    { kind: "not-subtype", type: Type, of: Type } |
    { kind: "unknown-member", sym: Sym, of: Type } |
    { kind: "unknown-function", sym: Sym } |
    { kind: "unknown-var", sym: Sym } |
    { kind: "wrong-arity", expected: number[], got: number } |
    { kind: "already-declared", sym: Sym });

function lookupType(type: Type, typeParam: Type|number): Type {
    if (typeof typeParam === "number") {
        return type.params.at(typeParam) ?? UnknownType;
    }
    return typeParam;
}

function inferLitType(expr: Expr, value: Value): TypedExpr {
    let type = builtInType("unknown", false);
    if (value.type === "num") {
        type = builtInType("number", false);
    } else if (value.type === "str") {
        type = builtInType("string", false);
    } else if (value.type === "date") {
        type = builtInType("date", false);
    }
    return { type, span: expr.span, kind: "lit", value: value };
}

export function createTypeChecker(parser: Parser, permissive: boolean) {
    const errors: TypingError[] = [];
    const reg = createTypeRegistry();
    defineStandardTypes(reg);
    defineStandardFunctions(reg);
    defineWebAPI(reg);

    function signalError(err: TypingError) {
        errors.push(err);
    }

    function assertSubtype(expr: Expr, sub: Type, type: Type) {
        if (permissive && typeEquals(sub, UnknownType)) {
            return true;
        }
        const t1 = reg.typeInfo(sub);
        if (t1 && !t1.isSubtype(type)) {
            signalError({ expr, kind: "not-subtype", type: sub, of: type });
        }
    }

    function inferSeqExpr(expr: Expr, seq: Expr[]): TypedExpr {
        const typedExprSeq = seq.map(inferType);
        return { 
            type: typedExprSeq.at(-1)?.type ?? builtInType("unknown"), span: expr.span, kind: "seq", 
            exprs: typedExprSeq
        };
    }

    function inferDim(expr: DimExpr & { span: Span }): TypedExpr {
        const rightExpr = expr.expr ? inferType(expr.expr) : undefined;
        if (expr.dimType && rightExpr) {
            assertSubtype(expr, rightExpr.type, expr.dimType);
        }
        let type = expr.dimType;
        if (typeof type === "undefined" && typeof rightExpr !== "undefined") {
            type = rightExpr.type;
        }
        type ??= UnknownType;
        reg.setSymType(expr.sym, type);
        return {
            type, span: expr.span, 
            kind: "dim", sym: expr.sym, dimType: expr.dimType, 
            expr: rightExpr,
        };
    }

    function inferVarExpr(expr: Expr, sym: Sym): TypedExpr {
        return { type: reg.symType(sym) ?? UnknownType, span: expr.span, kind: "var", sym };
    }

    function inferNewExpr(expr: Expr, cstr: Type, args: Expr[]): TypedExpr {
        return { type: cstr, span: expr.span, kind: "new", cstr, args: args.map(inferType) };
    }

    function inferIfStatement(expr: TypedExpr, args: TypedExpr[]): TypedExpr {
        let returnType = UnknownType;
        if (args.length !== 2 && args.length !== 3) {
            signalError({ expr, kind: "wrong-arity", expected: [2, 3], got: args.length });
        }
        assertSubtype(expr, args[0].type, BooleanType);
        if (args.length === 3) {
            const leftType = args[1].type;
            const rightType = args[2].type;
            if (typeEquals(leftType, rightType)) {
                returnType = leftType;
            } else {
                returnType = UnknownType;
            }
        } else {
            returnType = NullType;
        }
        return { type: returnType, span: expr.span, kind: "call", expr, args };
    }

    function inferCallExpr(expr: Expr, callee: Expr, args: Expr[]): TypedExpr {
        const tArgs = args.map(inferType);
        const tCallee = inferType(callee);
        if (callee.kind === "var" && isGlobalBuiltIn(callee.sym)) {
            switch (callee.sym.name) {
                case "if":
                    return inferIfStatement(tCallee, tArgs);
                default:
                    break;
            }
        }
        if (!permissive) {
            if (args.length !== tCallee.type.params.length - 1) {
                signalError({ expr, kind: "wrong-arity", expected: [tCallee.type.params.length - 1], got: args.length });
            } else {
                for (const [i, arg] of tArgs.entries()) {
                    assertSubtype(expr, arg.type, tCallee.type.params[i]);
                }
            }
        }
        const returnType = tCallee.type.params.at(-1) ?? UnknownType;
        const tExpr: TypedExpr = { type: returnType, span: expr.span, kind: "call", expr: tCallee, args: tArgs };
        assertSubtype(tExpr, tCallee.type, CallableType);
        return tExpr;
    }

    function inferAssignmentExpr(expr: Expr, left: Expr, right: Expr): TypedExpr {
        const tLeft = inferType(left);
        const tRight = inferType(right);
        assertSubtype(expr, tRight.type, tLeft.type);
        return { type: tRight.type, span: expr.span, kind: ":=", left: tLeft, right: tRight };
    }

    function inferOpExpr(expr: Expr, op: BinaryOperator, left: Expr, right: Expr): TypedExpr {
        const tLeft = inferType(left);
        const tRight = inferType(right);
        const nullable = tLeft.type.nullable || tRight.type.nullable;
        let type = builtInType("boolean", nullable);
        if (op === "&") {
            assertSubtype(expr, tLeft.type, StringType);
            assertSubtype(expr, tRight.type, StringType);
            type = builtInType("string", nullable);
        } else if (op === "+" || op === "-" || op === "*" || op === "/" || op === "^") {
            assertSubtype(expr, tLeft.type, NumberType);
            assertSubtype(expr, tRight.type, NumberType);
            type = builtInType("number", nullable);
        } else if (op === "<" || op === "<=" || op === ">" || op === ">=") {
            assertSubtype(expr, tLeft.type, NumberType);
            assertSubtype(expr, tRight.type, NumberType);
        }
        return { type, span: expr.span, kind: "op", op, left: tLeft, right: tRight };
    }

    function inferAccessExpr(expr: Expr, object: Expr, method: Sym): TypedExpr {
        const tObject = inferType(object);
        const objTypeInfo = reg.typeInfo(nullableType(tObject.type));
        let type = UnknownType;
        if (objTypeInfo && !method.path) {
            let currObjInfo: TypeInfo|undefined = objTypeInfo;
            let member: Method|undefined;
            while (!member && currObjInfo) {
                member = currObjInfo.methods.get(method.name);
                currObjInfo = currObjInfo.parent;
            }
            if (typeof member !== "undefined") {
                type = builtInType("callable", false, [
                    ...member.params.map(p => lookupType(tObject.type, p)), 
                    lookupType(tObject.type, member.ret)]);
            } else {
                signalError({ expr, kind: "unknown-member", sym: method, of: tObject.type });
            }
        }
        return { type, span: expr.span, kind: "access", object: tObject, method };
    }

    function inferLambdaExpr(expr: Expr, params: FuncParameter[], body: Expr): TypedExpr {
        const tParams = [];
        for (const param of params) {
            const type = param.type ?? UnknownType;
            reg.setSymType({ kind: "@", name: param.name }, type);
            tParams.push(type);
        }
        const tBody = inferType(body);
        tParams.push(tBody.type);
        return {
            type: builtInType("func", false, tParams), 
            span: expr.span, kind: "lambda", params, body: tBody
        };
    }

    function inferType(expr: Expr): TypedExpr {
        switch (expr.kind) {
            case "lit":
                return inferLitType(expr, expr.value);
            case "not":
                return { type: builtInType("boolean"), span: expr.span, kind: "not", expr: inferType(expr.expr) }
            case "minus":
                return { type: builtInType("number"), span: expr.span, kind: "minus", expr: inferType(expr.expr) };
            case "seq":
                return inferSeqExpr(expr, expr.exprs);
            case "dim":
                return inferDim(expr);
            case "var":
                return inferVarExpr(expr, expr.sym);
            case "new":
                return inferNewExpr(expr, expr.cstr, expr.args);
            case "call":
                return inferCallExpr(expr, expr.expr, expr.args);
            case "select":
                break;
            case "select2":
                break;
            case "aggregate":
                break;
            case ":=":
                return inferAssignmentExpr(expr, expr.left, expr.right);
            case "op":
                return inferOpExpr(expr, expr.op, expr.left, expr.right);
            case "list":
                break;
            case "access":
                return inferAccessExpr(expr, expr.object, expr.method);
            case "lambda":
                return inferLambdaExpr(expr, expr.params, expr.body);
        }
        return { type: builtInType("unknown"), ...expr } as TypedExpr;
    }

    const checker = {
        errors,
        next(): IteratorResult<TypedExpr> {
            const expr = parser.next();
            if (expr.done) {
                return { value: undefined, done: true };
            } else {
                return { value: inferType(expr.value), done: false };
            }
        },
        [Symbol.iterator]() { return checker; },
    };
    return checker;
}