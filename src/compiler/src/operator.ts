export type BinaryOperator = "=" | "<>" | "<" | ">" | "<=" | ">=" | "&" | 
    "+" | "-" | "*" | "/" | "^" | 
    "in" | "or" | "orelse" | "and" | "andalso" | "bitor" | "bitand";

export const BinaryOperators = new Set(["=", "<>", "<", ">", "<=", ">=", "&", 
    "+", "-", "*", "/", "^", 
    "in", "or", "orelse", "and", "andalso", "bitor", "bitand"]);
export const Operators = new Set([":", ",", "(", ")", "[", "]", "{", "}", "=", "<", ">", "&", "+", "-", "*", "/", "." , "²", "`"]);
export const TwoCharOperators = new Set([":=", "<=", ">=", "=>", "`[", "²[", "<>"]);

export function bindingPower(op: BinaryOperator): [number, number] {
    switch (op) {
        case "in": return [1, 2];
        case "or": case "orelse": return [3, 4];
        case "and": case "andalso": return [5, 6];
        case "bitor": return [7, 8];
        case "bitand": return [9, 10];
        case "<": case ">": case "<=": case ">=": return [11, 12];
        case "=": case "<>": return [14, 13];
        case "&": case "+": case "-": return [15, 16];
        case "*": case "/": return [17, 18];
        case "^": return [19, 20];
    }
}

export const unaryOpsBp = 21;