import { BinaryOperator } from "./operator.js";
import { DimExpr, Expr, FuncParameter, Value } from "./parse.js";
import { isGlobalBuiltIn, Sym, symToString } from "./sym.js";
import { Type, isBuiltinType } from "./typing.js";


function createJavaScriptGenerator(parser: Iterator<Expr>) {
    const vars = new Set<string>();
    let lastAutoId = 0;

    function genAutoVar(): string {
        const autoVarName = `$_${lastAutoId++}`;
        vars.add(autoVarName);
        return autoVarName;
    }

    function generateLit(expr: { kind: "lit", value: Value; }): string {
        const val = expr.value;
        switch (val.type) {
            case "num":
                return JSON.stringify(val.value);
            case "str":
                return `new $nab.BuiltIn.string(${JSON.stringify(val.value)})`;
            case "date":
                if (val.value.time) {
                    return `new Date(${val.value.year}, ${val.value.month-1}, ${val.value.day}, ${val.value.time.hours}, ${val.value.time.minutes}, ${val.value.time.seconds})`;
                } else {
                    return `new Date(${val.value.year}, ${val.value.month-1}, ${val.value.day})`;
                }
        }
    }
    
    function generateDim(expr: DimExpr): string {
        vars.add(expr.sym.name);
        if (expr.expr) {
            return `(${expr.sym.name} = ${exprToJavaScript(expr.expr)})`;
        } else {
            return "";
        }
    }
    
    function generateVarExpr(expr: { kind: "var", sym: Sym }): string {
        const { kind, path, name } = expr.sym;
        if (kind === "" && !path) {
            switch (name) {
                case "true":
                    return "true";
                case "false":
                    return "false";
                case "null":
                    return "undefined";
            }
        }
        const symStr = expr.sym.name;
        switch (kind) {
            case "@": case "$":
                return `${name}`;
            case "%":
                if (name == "inc" || name == "key" || name == "val") {
                    return `__${symStr}__`;
                }
                return `$nab.Context[${JSON.stringify(symStr)}]`;
            case "":
                if (!path) {
                    switch (name) {
                        case "true":
                            return "true";
                        case "false":
                            return "false";
                        case "null":
                            return "undefined";
                    }
                }
                return `$nab.BuiltIn[${JSON.stringify(symStr)}]`;
            case "#":
                return `$nab.Constant[${JSON.stringify(symStr)}]`;
            case "£":
                return `$nab.Family[${JSON.stringify(symStr)}]`;
            case "μ":
                return `$nab.Global[${JSON.stringify(symStr)}]`;
        }
    }
    
    function generateNewExpr(expr: { kind: "new", cstr: Type, args: Expr[] }): string {
        const args = `${expr.args.map(exprToJavaScript).join(",")}`;
        const typeStr = JSON.stringify(symToString(expr.cstr.sym));
        if (isBuiltinType(expr.cstr)) {
            return `new $nab.BuiltIn[${typeStr}](${args})`
        } else {
            return `new $nab.CustomTypes[${typeStr}](${args})`
        }
    }
    
    function generateCallExpr(expr: { kind: "call", expr: Expr, args: Expr[] }): string {
        if (expr.expr.kind === "var" && isGlobalBuiltIn(expr.expr.sym)) {
            switch (expr.expr.sym.name) {
                case "if": {
                    const [cond, ifTrue, ifFalse] = expr.args;
                    const ifFalseJs = ifFalse ? exprToJavaScript(ifFalse) : "undefined";
                    return `(${exprToJavaScript(cond)}) ? (${exprToJavaScript(ifTrue)}) : (${ifFalseJs})`;
                }
                case "case": {
                    const autoVarName = genAutoVar();
                    const cond = exprToJavaScript(expr.args[0]);
                    let code = `${autoVarName} = (${cond}),`;
                    for (let i = 1; i < expr.args.length - 1; i += 2) {
                        const left = exprToJavaScript(expr.args[i]);
                        const right = exprToJavaScript(expr.args[i + 1]);
                        code += `((${autoVarName}) === (${left})) ? (${right}) : `
                    }
                    const defaultCase = exprToJavaScript(expr.args[expr.args.length - 1]);
                    code += `(${defaultCase})`;
                    return code;
                }
                case "def": {
                    const nullableExpr = exprToJavaScript(expr.args[0]);
                    const defaultExpr = exprToJavaScript(expr.args[1]);
                    return `$nab.def(${nullableExpr}, () => (${defaultExpr}))`;
                }
                case "for": {
                    const iterations = exprToJavaScript(expr.args[0]);
                    const body = exprToJavaScript(expr.args[1]);
                    return `$nab.for((${iterations}), __inc__ => { return ${body}; })`;
                }
                case "while": {
                    const cond = exprToJavaScript(expr.args[0]);
                    const body = exprToJavaScript(expr.args[1]);
                    return `$nab.while(() => (${cond}), () => { return ${body}; })`;
                }
                case "foreach": {
                    const iterable = exprToJavaScript(expr.args[0]);
                    const body = exprToJavaScript(expr.args[1]);
                    return `$nab.foreach((${iterable}), (__key__, __val__) => { return ${body}; })`;
                }
                case "break": case "continue": case "return": {
                    const value = expr.args.length === 0 ?
                        "undefined" :
                        exprToJavaScript(expr.args[0]);
                    return `(() => { throw { flow: $nab.${expr.expr.sym.name}, value: ${value} }; })()`;
                }
                case "catch": {
                    const tryBody = exprToJavaScript(expr.args[0]);
                    const exceptBody = exprToJavaScript(expr.args[1]);
                    return `(() => { var $catch; try { $catch = ${tryBody}; } catch (__errmsg__) { if (__errmsg__ instanceof $nab.BuiltIn.string) { $catch = ${exceptBody}; } else { throw __errmsg__; } } return $catch; })()`;
                }
            }
            return `$nab.BuiltIn[${JSON.stringify(symToString(expr.expr.sym))}](${expr.args.map(exprToJavaScript).join(",")})`;
        }
        return `(${exprToJavaScript(expr.expr)})(${expr.args.map(exprToJavaScript).join(",")})`;
    }
    
    function generateAssignmentExpr(expr: { kind: ":=", left: Expr, right: Expr }): string {
        return `(${exprToJavaScript(expr.left)} = ${exprToJavaScript(expr.right)})`;
    }
    
    function generateOpExpr(expr: { kind: "op", op: BinaryOperator, left: Expr, right: Expr }): string {
        const left = exprToJavaScript(expr.left);
        const right = exprToJavaScript(expr.right);
        switch (expr.op) {
            case "^": return `Math.pow(${left}, ${right})`;
            case "in": return `(${left}).includes(${right})`;
            case "=": return `$nab.eq(${left}, ${right})`;
            case "<>": return `$nab.neq(${left}, ${right})`;
            case "<": return `$nab.lt(${left}, ${right})`;
            case ">": return `$nab.gt(${left}, ${right})`;
            case "<=": return `$nab.lte(${left}, ${right})`;
            case ">=": return `$nab.gte(${left}, ${right})`;
            case "&": return `$nab.cat(${left}, ${right})`;
            case "+": return `$nab.add(${left}, ${right})`;
            case "-": return `$nab.sub(${left}, ${right})`;
            case "*": return `$nab.mul(${left}, ${right})`;
            case "/": return `$nab.div(${left}, ${right})`;
            case "or": return `$nab.or(${left}, ${right})`;
            case "and": return `$nab.and(${left}, ${right})`;
            case "orelse": return `$nab.orelse(${left}, () => (${right}))`;
            case "andalso": return `$nab.andalso(${left}, () => (${right}))`;
            case "bitor": return `$nab.bitor(${left}, ${right})`;
            case "bitand": return `$nab.bitand(${left}, ${right})`;
        }
    }
    
    function generateAccessExpr(expr: { kind: "access", object: Expr, method: Sym }): string {
        return `$nab.get(${exprToJavaScript(expr.object)}, ${JSON.stringify(symToString(expr.method))})`;
    }
    
    function generateLambdaExpr(expr: { kind: "lambda", params: FuncParameter[], body: Expr }): string {
        return `$nab.lambda((${expr.params.map(p => p.name).join(",")}) => ${exprToJavaScript(expr.body)})`;
    }

    function exprToJavaScript(expr: Expr): string {
        switch (expr.kind) {
            case "lit":
                return generateLit(expr);
            case "not":
                return `(!${exprToJavaScript(expr.expr)})`
            case "minus":
             return `(-${exprToJavaScript(expr.expr)})`
            case "seq":
                return `(${expr.exprs.map(exprToJavaScript).join(",")})`;
            case "dim":
                return generateDim(expr);
            case "var":
                return generateVarExpr(expr);
            case "new":
                return generateNewExpr(expr);
            case "call":
                return generateCallExpr(expr);
            case "select":
                break;
            case "select2":
                break;
            case "aggregate":
                break;
            case ":=":
                return generateAssignmentExpr(expr);
            case "op":
                return generateOpExpr(expr);
            case "list":
                break;
            case "access":
                return generateAccessExpr(expr);
            case "lambda":
                return generateLambdaExpr(expr);
        }
        return "";
    }

    const gen = {
        vars,
        next(): IteratorResult<string> {
            const expr = parser.next();
            if (expr.done) {
                return { value: undefined, done: true };
            } else {
                return { value: exprToJavaScript(expr.value), done: false };
            }
        },
        [Symbol.iterator]() { return gen; },
    };
    return gen;
}

export function generateJavaScript(parser: Iterator<Expr>): string {
    const gen = createJavaScriptGenerator(parser);
    const statements = Array.from(gen);
    const varDecl = gen.vars.size === 0 ? "" : `var ${Array.from(gen.vars).join(",")};`;
    return `(function () { ${varDecl} $nab.__ans__ = (${statements.join(",")}); }());`;
}