import { AbstractType, AbstractTypeInfo, builtInType, Method, nullableType, ParamType, Type, typeEquals, typeIdEquals, TypeInfo } from "./typing.js";
import { DimExpr, Expr, FuncParameter, Parser, Span, Value } from "./parse.js";
import { isGlobalBuiltIn, Sym, symToString } from "./sym.js";
import { BinaryOperator } from "./operator.js";
import { createTypeRegistry } from "./typeregistry.js";
import { BooleanType, CallableType, defineStandardTypes, NullType, NumberNotNull, NumberType, ObjectType, StringType, UnknownType } from "./def-std-types.js";
import { defineStandardFunctions } from "./def-std-func.js";
import { ArrayType } from "./def-std-types.js";
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
    { kind: "access", object: TypedExpr, method: Sym, args: TypedExpr[] } |
    { kind: "lambda", params: FuncParameter[], body: TypedExpr });

export type TypingError = { expr: Expr } & (
    { kind: "not-subtype", type: Type, of: Type } |
    { kind: "not-callable", type: Type } |
    { kind: "not-iterable", type: Type } |
    { kind: "unknown-member", sym: Sym, of: Type } |
    { kind: "unknown-function", sym: Sym } |
    { kind: "unknown-var", sym: Sym } |
    { kind: "wrong-arity", name: string, expected: number[], got: number } |
    { kind: "already-declared", sym: Sym });

function concretizeType(concreteTypes: Type[], type: AbstractType): Type {
    return { sym: type.sym, nullable: type.nullable, params: resolveMethodParams(concreteTypes, type.params, 0) }
}

function resolveMethodParams(concreteTypes: Type[], methodParams: ParamType[], argsLength: number): Type[] {
    const result: Type[] = [];
    for (const methodParam of methodParams) {
        if (typeof methodParam === "number") {
            result.push(concreteTypes.at(methodParam) ?? UnknownType);
        } else if (Array.isArray(methodParam)) {
            let [start, end] = methodParam;
            const params = concreteTypes.slice(start, end);
            result.push(...params);
        } else if ("vararg" in methodParam) {
            const varArgLength = argsLength - (methodParams.length - 1);
            const [varargType] = resolveMethodParams(concreteTypes, [methodParam.vararg], 0);
            for (var i = 0; i < varArgLength; i++) {
                result.push(concretizeType(concreteTypes, varargType));
            }
        } else if ("sym" in methodParam) {
            result.push(concretizeType(concreteTypes, methodParam));
        }
    }
    return result;
}

function lookupType(type: Type, typeParam: Type|number|"this"): Type {
    if (typeof typeParam === "number") {
        return type.params.at(typeParam) ?? UnknownType;
    }
    if (typeParam === "this") {
        return type;
    }
    return typeParam;
}

function unreachable(_: never): never { throw "unreachable"; }

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

    function assertSubtype(expr: Expr, sub: Type, type: Type|undefined) {
        if (typeof type === "undefined") {
            return;
        }
        if (permissive && typeEquals(sub, UnknownType)) {
            return;
        }
        if (!reg.isSubtype(sub, type, permissive)) {
            signalError({ expr, kind: "not-subtype", type: sub, of: type });
        }
    }

    function inferSeqExpr(expr: Expr, seq: Expr[]): TypedExpr {
        const typedExprSeq = seq.map(expr => inferType(expr));
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
        const info = reg.typeInfo(cstr);
        const tArgs = args.map(arg => inferType(arg));
        if (!info && !permissive) {
            signalError({ expr: expr, kind: "unknown-function", sym: cstr.sym });
        } else if (info) {
            const methodNew = info.methods.get("new");
            if (!methodNew) {
                signalError({ expr: expr, kind: "unknown-function", sym: cstr.sym });
            } else {
                const cstrParams = resolveMethodParams(cstr.params, methodNew.params, args.length);
                if (args.length !== cstrParams.length) {
                    signalError({ expr, kind: "wrong-arity", name: cstr.sym.name, expected: [cstrParams.length], got: args.length });
                } else {
                    for (const [i, arg] of tArgs.entries()) {
                        assertSubtype(expr, arg.type, cstrParams[i]);
                    }
                }
            }
        }
        return { type: cstr, span: expr.span, kind: "new", cstr, args: tArgs };
    }

    function inferIfStatement(expr: TypedExpr, args: TypedExpr[]): TypedExpr {
        let returnType = UnknownType;
        if (args.length !== 2 && args.length !== 3) {
            signalError({ expr, kind: "wrong-arity", name: "If", expected: [2, 3], got: args.length });
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

    function inferCaseStatement(expr: TypedExpr, args: TypedExpr[]): TypedExpr {
        if (args.length < 2) {
            signalError({ expr, kind: "wrong-arity", name: "Case", expected: [2], got: args.length });
            return { type: NullType, span: expr.span, kind: "call", expr, args: args.map((arg, i) => inferType(arg, expr.type.params[i])) };
        }
        const inputType = args[0].type;
        const retType = args.at(-1)?.type ?? UnknownType;
        for (let i = 1; i < args.length; i ++) {
            if (i % 0 === 0) {
                assertSubtype(expr, args[i].type, retType);
            } else {
                assertSubtype(expr, args[i].type, inputType);
            }
        } 
        
        return { type: retType, span: expr.span, kind: "call", expr, args };
    }

    function inferForeachStatement(expr: TypedExpr, args: Expr[]): TypedExpr {
        if (args.length !== 2) {
            signalError({ expr, kind: "wrong-arity", name: "ForEach", expected: [2], got: args.length });
            return { type: NullType, span: expr.span, kind: "call", expr, args: args.map((arg, i) => inferType(arg, expr.type.params[i])) };
        }
        const iterable = inferType(args[0]);
        const keySym: Sym = { kind: "%", name: "key" };
        const valSym: Sym = { kind: "%", name: "val" };
        const oldKeyType = reg.symType(keySym) ?? UnknownType;
        const oldValType = reg.symType(valSym) ?? UnknownType;
        if (isGlobalBuiltIn(iterable.type.sym) && iterable.type.sym.name === "array") {
            reg.setSymType(keySym, NumberNotNull);
            reg.setSymType(valSym, iterable.type.params[0]);
        } else if (
            isGlobalBuiltIn(iterable.type.sym) && 
            (iterable.type.sym.name === "dictionary" || iterable.type.sym.name === "cache")
        ) {
            reg.setSymType(keySym, iterable.type.params[0]);
            reg.setSymType(valSym, iterable.type.params[1]);
        } else {
            signalError({ expr, kind: "not-iterable", type: iterable.type });
        }
        const typedArgs = args.map((arg, i) => inferType(arg, expr.type.params[i]))
        reg.setSymType(keySym, oldKeyType);
        reg.setSymType(valSym, oldValType);
        return { type: NullType, span: expr.span, kind: "call", expr, args: typedArgs };
    }

    function inferArrayStatement(expr: TypedExpr, args: TypedExpr[]): TypedExpr {
        let info: AbstractTypeInfo|undefined = undefined;
        let nullable = false;
        if (args.length === 0) {
            nullable = true;
            info = reg.typeInfo(ObjectType);
        } else {
            info = reg.typeInfo(args[0].type);
            nullable = args[0].type.nullable;
            for (let i = 1; i < args.length; i++) {
                nullable = nullable && args[i].type.nullable;
                const argType = reg.typeInfo(args[i].type);
                if (typeof argType === "undefined") { break; }
                info = info?.lastCommonAncestors(argType);
            }
        }
        let type: Type;
        if (info) {
            type = { sym: info.id.sym, nullable, params: [] };
        } else {
            type = { sym: UnknownType.sym, nullable, params: [] };
        }
        return { type: { sym: ArrayType.sym, nullable: true, params: [type] }, span: expr.span, kind: "call", expr, args };
    }

    function inferArgs(expr: Expr, name: string, typeParams: Type[], args: Expr[]): { args: TypedExpr[], returnType: Type } {
        const tArgs = args.map((arg, i) => inferType(arg, typeParams[i]));
        const returnType = typeParams.at(-1) ?? UnknownType;
        if (typeParams.length > 0 && args.length !== typeParams.length - 1) {
            signalError({ expr, kind: "wrong-arity", name, expected: [typeParams.length - 1], got: args.length });
        } else {
            for (const [i, arg] of tArgs.entries()) {
                assertSubtype(expr, arg.type, typeParams[i]);
            }
        }
        return { args: tArgs, returnType };
    }

    function inferCallExpr(expr: Expr, callee: Expr, args: Expr[]): TypedExpr {
        const tCallee = inferType(callee);
        if (!typeIdEquals(tCallee.type, CallableType)) {
            signalError({ expr: tCallee, kind: "not-callable", type: tCallee.type });
        }
        if (callee.kind === "var" && isGlobalBuiltIn(callee.sym)) {
            if (callee.sym.name === "foreach") {
                return inferForeachStatement(tCallee, args);
            }
            switch (callee.sym.name) {
                case "if": {
                    const tArgs = args.map((arg, i) => inferType(arg, tCallee.type.params[i]));
                    return inferIfStatement(tCallee, tArgs);
                }
                case "case": {
                    const tArgs = args.map((arg, i) => inferType(arg, tCallee.type.params[i]));
                    return inferCaseStatement(tCallee, tArgs);
                }
                case "array": {
                    const tArgs = args.map((arg, i) => inferType(arg, tCallee.type.params[i]));
                    return inferArrayStatement(tCallee, tArgs);
                }
                default:
                    break;
            }
        }
        let name = "";
        if (tCallee.kind === "var") {
            name = symToString(tCallee.sym);
        }
        const callable = inferArgs(tCallee, name, tCallee.type.params, args);
        return { type: callable.returnType, span: expr.span, kind: "call", expr: tCallee, args: callable.args };
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
        let type: Type;
        if (op === "&") {
            assertSubtype(expr, tLeft.type, StringType);
            type = builtInType("string", nullable);
        } else if (op === "+" || op === "-" || op === "*" || op === "/" || op === "^" || op === "bitand" || op === "bitor") {
            assertSubtype(expr, tLeft.type, NumberType);
            assertSubtype(expr, tRight.type, NumberType);
            type = builtInType("number", nullable);
        } else if (op === "<" || op === "<=" || op === ">" || op === ">=") {
            assertSubtype(expr, tLeft.type, NumberType);
            assertSubtype(expr, tRight.type, NumberType);
            type = builtInType("boolean", nullable);
        } else if (op === "and" || op === "andalso" || op === "or" || op === "orelse") {
            assertSubtype(expr, tLeft.type, BooleanType);
            assertSubtype(expr, tRight.type, BooleanType);
            type = builtInType("boolean", nullable);
        } else if (op === "in") {
            type = builtInType("boolean", nullable);
        } else if (op === "=" || op === "<>") {
            type = builtInType("boolean", nullable);
        } else {
            unreachable(op);
        }
        return { type, span: expr.span, kind: "op", op, left: tLeft, right: tRight };
    }

    function inferAccessExpr(expr: Expr, object: Expr, method: Sym, args: Expr[]): TypedExpr {
        console.log("infer access", method.name);
        const tObject = inferType(object);
        const objTypeInfo = reg.typeInfo(nullableType(tObject.type));
        let type = UnknownType;
        let tArgs: TypedExpr[];
        if (objTypeInfo && !method.path) {
            let currObjInfo: TypeInfo|undefined = objTypeInfo;
            let member: Method|undefined;
            while (!member && currObjInfo) {
                member = currObjInfo.methods.get(method.name);
                if (currObjInfo.parent) {
                    const args = resolveMethodParams(currObjInfo.args, currObjInfo.parent?.params, 0);
                    currObjInfo = { ...currObjInfo.parent, args };
                } else {
                    break;
                }
            }
            if (typeof member !== "undefined") {
                const typeParams = [
                    ...resolveMethodParams(tObject.type.params, member.params, args.length), 
                    lookupType(tObject.type, member.ret)];
                const callable = inferArgs(expr, `${method.name}`, typeParams, args);
                type = callable.returnType;
                tArgs = callable.args;
            } else {
                signalError({ expr, kind: "unknown-member", sym: method, of: tObject.type });
            }
        }
        tArgs ??= args.map(arg => ({ type: UnknownType, ...arg } as TypedExpr));
        return { type, span: expr.span, kind: "access", object: tObject, method, args: tArgs };
    }

    function inferLambdaExpr(expr: Expr, params: FuncParameter[], body: Expr, targetType: Type): TypedExpr {
        const tParams = [];
        for (const [i, param] of params.entries()) {
            const type = param.type ?? targetType.params[i] ?? UnknownType;
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

    function inferType(expr: Expr, targetType: Type = UnknownType): TypedExpr {
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
                return inferAccessExpr(expr, expr.object, expr.method, expr.args);
            case "lambda":
                return inferLambdaExpr(expr, expr.params, expr.body, targetType);
        }
        return { type: builtInType("unknown"), ...expr } as TypedExpr;
    }

    const checker = {
        errors,
        reg,
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