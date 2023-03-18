import { parseErrorToString, typingErrorToString } from "./error-msg.js";
import { generateJavaScript } from "./generatejs.js";
import { createParser } from "./parse.js";
import { createTokenStream, parseSym } from "./tokenize.js";
import { createTypeChecker } from "./typechecker.js";


export function javascriptFromBasic(input: string): string {
    const tokens = createTokenStream(input);
    const parser = createParser(tokens, false, false);
    const checker = createTypeChecker(parser, true);
    const output = generateJavaScript(checker);
    if (parser.errors.length > 0 || checker.errors.length > 0) {
        let errmsg = "";
        for (const err of parser.errors) {
            errmsg += parseErrorToString(err) + "\n";
        }
        for (const err of checker.errors) {
            errmsg += typingErrorToString(err) + "\n";
        }
        throw errmsg;
    }
    return output;
}

export function membersForVar(input: string, variable: string): string[] {
    const varSym = parseSym(variable.toLowerCase());
    const tokens = createTokenStream(input);
    const parser = createParser(tokens, false, false);
    const checker = createTypeChecker(parser, true);
    for (const _ of checker) {}
    const varType = checker.reg.symType(varSym);
    if (typeof varType === "undefined") return [];
    let typeInfo = checker.reg.typeInfo(varType);
    const methods = [];
    while (typeof typeInfo !== "undefined") {
        for (const m of typeInfo.methods.values()) {
            methods.push(m.name);
        }
        typeInfo = typeInfo.parent;
    }
    return methods;
}