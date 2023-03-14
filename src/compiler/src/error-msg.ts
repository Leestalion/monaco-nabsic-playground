import { ParseError } from "./parse";
import { symToString } from "./sym";
import { TypingError } from "./typechecker";
import { typeIdToString } from "./typing";


function reasonToString(err: ParseError): string {
    switch (err.reason) {
        case "assert-expr-failed":
            return `expected an expression but ${err.msg}`;
        case "bad-token":
            return `bad token ${err.err}`;
        case "binary-op-miss-operand":
            return `operator ${err.op} miss a right operand`;
        case "expected-but-found":
            return `expected ${err.expected.join(" or ")} but found some ${err.found.kind} token`;
        case "expected-but-found-expr":
            return `expected ${err.expected.join(" or ")} but found some ${err.found.kind} token`;
        case "expected-some":
            return `expected some ${err.msg}`;
        case "invalid-dim":
            return `invalid variable declaration ${err.token}`;
        case "invalid-param-name":
            return `invalid parameter name ${err.expr}`;
        case "invalid-type-kind":
            return `invalid type kind ${err.kind}`;
        case "invalid-var-name":
            return `invalid var name ${symToString(err.sym)}`;
        case "unclosed":
            return `unclosed ${err.parens}`;
        case "unexpected-expr":
            return `unexpected expression '${err.expr}'`;
        case "unexpected-token":
            return `unexpected token '${err.token}'`;
    }
}

export function parseErrorToString(err: ParseError): string {
    const reason = reasonToString(err);
    const { start, end } = err.span; 
    return `error parsing line ${start.line+1} col ${start.col+1} to ${end.col+1}: ${reason}`;
}

function typingErrorKindToString(err: TypingError): string {
    switch (err.kind) {
        case "already-declared":
            return `a variable named ${symToString(err.sym)} has already been declared`;
        case "not-subtype":
            return `expected type ${typeIdToString(err.of)} but got ${typeIdToString(err.type)}`;
        case "unknown-function":
            return `there is no function called ${symToString(err.sym)}`;
        case "unknown-member":
            return `type ${typeIdToString(err.of)} has no method named ${symToString(err.sym)}`;
        case "unknown-var":
            return `there is no variable called ${symToString(err.sym)}`;
        case "wrong-arity":
            return `function ${err.name} expects ${err.expected.join(" or ")} parameters but received ${err.got} arguments`;
    }
}

export function typingErrorToString(err: TypingError): string {
    return typingErrorKindToString(err);
}