import { TwoCharOperators, BinaryOperator, Operators, BinaryOperators } from "./operator.js";
import { SymKind, Sym } from "./sym.js";


type Time = { hours: number, minutes: number, seconds: number };
export type DateTime = { year: number, month: number, day: number, time?: Time };

type SimpleToken =
    { kind: ":" }   |
    { kind: "," }   |
    { kind: "." }   |
    { kind: "(" }   |
    { kind: ")" }   |
    { kind: "²[" }  |
    { kind: "[" }   |
    { kind: "]" }   |
    { kind: "{" }   |
    { kind: "}" }   |
    { kind: "dim" } |
    { kind: "as" }  |
    { kind: "new" } |
    { kind: "not" } |
    { kind: ":=" }  |
    { kind: "=>" };
export type Token = 
    { kind: "num", value: number } |
    { kind: "str", value: string } |
    { kind: "date", value: DateTime } |
    { kind: "op", value: BinaryOperator } |
    { kind: "sym", value: { kind: SymKind, name: string } } |
    SimpleToken;

export type TokenError =
    { kind: "invalid-date", msg: string } |
    { kind: "invalid-number", msg: string } |
    { kind: "expected-char", char: string } |
    { kind: "unterminated-string", str: string };

export type Place = {
    line: number,
    col: number,
    lastCol: number,
    start: number,
    end: number,
};

export const Place = {
    zero(): Place {
        return {
            line: 0,
            col: 0,
            lastCol: 0,
            start: 0,
            end: 0,
        };
    }
}

export type TokenResult = { place: Place } & 
    ({ status: "ok", token: Token } | 
     { status: "err", err: TokenError });

const separators = new Set([":", ",", "(", ")", "[", "]", "{", "}", " ", "\t", "\r", "\n", 
    "=", "<", ">", "&", "+", "-", "*", "/", ".", "²", "`"]);
const sigils = new Set(["@", "$", "#", "%", "£", "μ"])
const reDate = /(\d{2})\/(\d{2})\/(\d{4})(?:\s(\d{2}):(\d{2}):(\d{2}))?/

export function parseSym(sym: string): Sym {
    let kind: SymKind = "";
    const sigil = sym[sym.length-1];
    if (sigils.has(sigil)) {
        kind = sigil as SymKind;
        sym = sym.substring(0, sym.length-1)
    }
    const pathSym = sym.split("!");
    if (parseSym.length === 2) {
        const [path, name] = pathSym;
        return { kind, path, name };
    } else {
        return { kind, name: sym, path: undefined };
    }
}

export function createTokenStream(src: string) {
    let pos = 0;
    let line = 0;
    let willBreakLine = false;
    let lineFirstChar = 0;
    let peeked: IteratorResult<TokenResult>|undefined = undefined;

    function currentPlace(start: number, end: number): Place {
        let col = start - lineFirstChar;
        let lastCol = end - lineFirstChar;
        return { line, col, lastCol, start, end };
    }

    function resFromTok(token: Token|undefined, tokStart: number, tokEnd: number): IteratorResult<TokenResult> {
        if (typeof token === "undefined") {
            return { value: undefined, done: true };
        }
        return { value: { place: currentPlace(tokStart, tokEnd), status: "ok", token  }, done: false };
    }

    const hasNextChar = () => pos < src.length;

    function consumeChar() {
        pos++;
        if (willBreakLine) {
            line++;
            lineFirstChar = pos + 1;
            willBreakLine = false;
        }
        if (src[pos] === "\n") {
            willBreakLine = true;
        }
    }

    const currentChar = () => src[pos];
    const currentCharCode = () => src.charCodeAt(pos);
    const nextChar = () => src[pos+1];
    const nextCharCode = () => src.charCodeAt(pos+1);

    function consumeUntilChar(c: string) {
        consumeChar();
        while (currentChar() !== c && hasNextChar()) {
            consumeChar();
        }
    }

    function consumeString(): IteratorResult<TokenResult> {
        const tokStart = pos;
        consumeUntilChar("\"");
        while (currentChar() === "\"" && nextChar() === "\"") {
            consumeChar();
            consumeUntilChar("\"");
        }
        const tokEnd = pos;
        const res = resFromTok({ kind: "str", value: src.substring(tokStart+1, tokEnd).replaceAll("\"\"", "\"") }, tokStart, tokEnd);
        consumeChar();
        return res; 
    }

    function consumeSymbol(): IteratorResult<TokenResult> {
        const tokStart = pos;
        while (hasNextChar() && !separators.has(currentChar())) {
            consumeChar();
        }
        const tokEnd = pos;
        const sym = src.substring(tokStart, tokEnd).toLowerCase();
        let res;
        if (sym === "dim" || sym === "as" || sym === "new" || sym === "not") {
            res = resFromTok({ kind: sym }, tokStart, tokEnd);
        } else if (BinaryOperators.has(sym)) {
            res = resFromTok({ kind: "op", value: sym as BinaryOperator }, tokStart, tokEnd);
        } else {
            res = resFromTok({ kind: "sym", value: parseSym(sym) }, tokStart, tokEnd);
        }
        return res;
    }

    function isNumeric(code: number): boolean {
        if (!(code > 47 && code < 58)) {
            return false;
        }
        return true;
    }

    function consumeNumber(): IteratorResult<TokenResult> {
        const tokStart = pos;
        while (hasNextChar() && (nextChar() === "." || isNumeric(nextCharCode()))) {
            consumeChar();
        }
        const tokEnd = pos;
        const res = resFromTok({ kind: "num", value: parseFloat(src.substring(tokStart, tokEnd+1)) }, tokStart, tokEnd);
        consumeChar();
        return res;
    }

    function consumeDate(): IteratorResult<TokenResult> {
        const tokStart = pos;
        consumeUntilChar("#");
        const tokEnd = pos;
        const matches = reDate.exec(src.substring(tokStart+1, tokEnd));
        if (matches === null) {
            const res: IteratorResult<TokenResult> = {
                value: {
                    place: currentPlace(tokStart, tokEnd), 
                    status: "err", 
                    err: { kind: "invalid-date", msg: src.substring(tokStart+1, tokEnd) }
                },
                done: false
            };
            consumeChar();
            return res;
        }
        const value: DateTime = { year: parseInt(matches[3]), month: parseInt(matches[1]), day: parseInt(matches[2]) };
        if (typeof matches[4] !== "undefined") {
            value.time = { hours: parseInt(matches[4]), minutes: parseInt(matches[5]), seconds: parseInt(matches[6]) };
        }
        const res = resFromTok({ kind: "date", value }, tokStart, tokEnd);
        consumeChar();
        return res;
    }

    function consumeOperator(): IteratorResult<TokenResult> {
        const tokStart = pos;
        let tokEnd = pos + 1;
        if (TwoCharOperators.has(src.substring(tokStart, tokStart + 2))) {
            consumeChar();
            tokEnd++;
        }
        const op = src.substring(tokStart, tokEnd);
        let res;
        if (BinaryOperators.has(op)) {
            res = resFromTok({ kind: "op", value: op as BinaryOperator }, tokStart, tokEnd);
        } else {
            res = resFromTok({ kind: op as SimpleToken["kind"] }, tokStart, tokEnd);
        }
        consumeChar();
        return res;
    }

    const stream = {
        hasNext() {
            return !stream.peek().done;
        },
        next(): IteratorResult<TokenResult> {
            if (typeof peeked !== "undefined") {
                const res = peeked;
                peeked = undefined;
                return res;
            }
            while (hasNextChar()) {
                switch (currentChar()) {
                    case "\n": case "\r": case "\t": case " ":
                        consumeChar();
                        continue;
                    case "'":
                        consumeUntilChar("\n");
                        return stream.next();
                    case "\"":
                        return consumeString();
                    case "#":
                        return consumeDate();
                    default: {
                        if (isNumeric(currentCharCode())) {
                            return consumeNumber();
                        } else if (Operators.has(currentChar())) {
                            return consumeOperator();
                        } else {
                            return consumeSymbol();
                        }
                    }
                }
            }
            return { value: undefined, done: true };
        },
        peek(): IteratorResult<TokenResult> {
            if (typeof peeked === "undefined") {
                peeked = stream.next();
            }
            return peeked;
        },
        [Symbol.iterator](): Iterator<TokenResult> {
            return stream;
        }
    };
    return stream;
}

export type TokenStream = ReturnType<typeof createTokenStream>;