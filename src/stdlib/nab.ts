import { ArrayType, DictType, NumberType, StringType } from "../compiler/src/def-std-types";
import { Type, typeIdEquals, typeToString } from "../compiler/src/typing";
import Buffer from "./Buffer";
import KeyValuePair from "./KeyValuePair";
import NabArray from "./NabArray";
import NabDictionary from "./NabDictionary";
import type { NabsicBool, NabsicNumber, NabsicAny } from "./basictypes";
import { BuiltinMethods } from "./builtinmethods";
import { abortSym, breakSym, continueSym, returnSym, typeParamsSym } from "./symbols";
import { Color, NabCanvas, NabElement, NabWindow } from "./web";


export const $nab: any = {};
(window as any).$nab = $nab;

$nab.BuiltIn = $nab.BuiltIn ?? {};
$nab.Context = $nab.Context ?? {};

$nab.typeParamsSym = typeParamsSym;
$nab.break = breakSym;
$nab.continue = continueSym;
$nab.return = returnSym;
$nab.abort = abortSym;
$nab.eq = (a: NabsicAny, b: NabsicAny) => {
    if (a == null || b == null) return undefined;
    if (typeof a !== "object" || typeof b !== "object") { return a === b; }
    if (!("equals" in a)) {
        if (!("equals" in b)) {
            return a === b
        } else {
            return b.equals(a);
        }
    } else {
        return a.equals(b);
    }
}
$nab.neq = (a: NabsicAny, b: NabsicAny) => !$nab.eq(a, b);
$nab.lt = (a: NabsicAny, b: NabsicAny) => a == null ? undefined : b == null ? undefined : a < b;
$nab.lte = (a: NabsicAny, b: NabsicAny) => a == null ? undefined : b == null ? undefined : a <= b;
$nab.gt = (a: NabsicAny, b: NabsicAny) => a == null ? undefined : b == null ? undefined : a > b;
$nab.gte = (a: NabsicAny, b: NabsicAny) => a == null ? undefined : b == null ? undefined : a >= b;
$nab.and = (a: NabsicBool, b: NabsicBool) => a == null ? undefined : b == null ? undefined : a && b;
$nab.or = (a: NabsicBool, b: NabsicBool) => a == null ? undefined : b == null ? undefined : a || b;
$nab.andalso = (a: NabsicBool, b: () => NabsicBool) => {
    if (a == null) return undefined;
    if (!a) return false;
    const rb = b();
    if (rb == null) return undefined;
    return rb;
};
$nab.orelse = (a: NabsicBool, b: () => NabsicBool) => {
    if (a == null) return undefined;
    if (a) return true;
    const rb = b();
    if (rb == null) return undefined;
    return rb;
};
$nab.bitand = (a: NabsicNumber, b: NabsicNumber) => a == null ? undefined : b == null ? undefined : a & b;
$nab.bitor = (a: NabsicNumber, b: NabsicNumber) => a == null ? undefined : b == null ? undefined : a | b;
$nab.add = (a: NabsicNumber, b: NabsicNumber) => a == null ? undefined : b == null ? undefined : a + b;
$nab.sub = (a: NabsicNumber, b: NabsicNumber) => a == null ? undefined : b == null ? undefined : a - b;
$nab.mul = (a: NabsicNumber, b: NabsicNumber) => a == null ? undefined : b == null ? undefined : a * b;
$nab.div = (a: NabsicNumber, b: NabsicNumber) => a == null ? undefined : b == null ? undefined : a / b;
$nab.cat = (s: string, o: NabsicAny) => s.toString() + $nab.call(o, "tostring");
$nab.def = (a: NabsicAny, b: () => NabsicAny) => a == null ? b() : a;
$nab.for = (n: number, cb: (inc: number)=>void) => {
    for (let i = 1; i <= n; i++) {
        try {
            cb(i);
        } catch (e: any) {
            if (e.flow === $nab.break) break;
            if (e.flow === $nab.continue) continue;
            throw e;
        }
    }
};
$nab.foreach = <K extends NabsicAny, V extends NabsicAny>(iter: { entries(): Iterable<[K,V]> }, cb: (key: K, val: V) => NabsicAny) => {
    for (const [k, v] of iter.entries()) {
        try {
            cb(k, v);
        } catch (e: any) {
            if (e.flow === $nab.break) break;
            if (e.flow === $nab.continue) continue;
            throw e;
        }
    }
};
$nab.while = (cond: () => boolean, body: () => NabsicAny) => {
    while(cond()) {
        try {
            body();
        } catch (e: any) {
            if (e.flow === $nab.break) break;
            if (e.flow === $nab.continue) continue;
            throw e;
        }
    }
};
$nab.lambda = (cb: (...args: NabsicAny[]) => NabsicAny) => ({
    invoke(...args: NabsicAny[]) {
        try {
            return cb(...args); 
        } catch (e: any) {
            if (e.flow === $nab.return) {
                return e.value;
            } else {
                throw e;
            }
        }
    },
});
$nab.call = (obj: NabsicAny, prop: string, ...args: NabsicAny[]) => {
    switch (typeof obj) {
        case "number":
        case "string":
        case "boolean":
        case "undefined":
            return (BuiltinMethods as any)[typeof obj][prop](obj, ...args);
        case "object":
            const m = (obj as any)[prop];
            if (m) {
                return m.apply(obj, args);
            } else {
                return (BuiltinMethods.object as any)[prop](obj, ...args);
            }
    }
};
$nab.BuiltIn.ebyes = 1;
$nab.BuiltIn.ebno = 2;
$nab.BuiltIn.null = undefined;
$nab.BuiltIn.debugprint = (obj: NabsicAny) => {
    let s = $nab.call(obj, "tostring");
    if ($nab.log) {
        $nab.log(s);
    } else {
        console.log(JSON.stringify(s));
    }
};
$nab.BuiltIn.error = (msg: string) => { throw msg };
$nab.BuiltIn.abort = () => { throw $nab.abort };
$nab.BuiltIn.serializetojson = (obj: NabsicAny) => {
    if (typeof obj === "object" && "serializetojson" in obj) {
        return obj.serializetojson();
    }
    return JSON.stringify(obj);
};
$nab.BuiltIn.abs = (n: number) => Math.abs(n);
$nab.BuiltIn.log = (n: number) => Math.log(n);
$nab.BuiltIn.exp = (n: number) => Math.exp(n);
$nab.BuiltIn.ceil = (n: number) => Math.ceil(n);
$nab.BuiltIn.int = (n: number) => Math.floor(n);
$nab.BuiltIn.round = (n: number) => Math.round(n);
$nab.BuiltIn.rnd = () => Math.random();
$nab.BuiltIn.mod = (n: number, m: number) => n % m;
$nab.BuiltIn.sqr = (n: number) => Math.sqrt(n);
$nab.BuiltIn.cos = (n: number) => Math.cos(n);
$nab.BuiltIn.sin = (n: number) => Math.sin(n);
$nab.BuiltIn.tan = (n: number) => Math.tan(n);
$nab.BuiltIn.atan = (n: number) => Math.atan(n);
$nab.BuiltIn.maxof = (...n: number[]) => Math.max(...n);
$nab.BuiltIn.minof = (...n: number[]) => Math.min(...n);

$nab.BuiltIn.len = (s: string) => s.length;
$nab.BuiltIn.stringisnullorempty = (s: string|undefined) => s == null || $nab.BuiltIn.len(s) === 0;

$nab.cast = (obj: NabsicAny, type: Type) => {
    switch (typeof obj) {
        case "string":
            if (typeIdEquals(type, StringType)) {
                return obj;
            } else {
                $nab.BuiltIn.error(`cannot cast a String value to ${typeToString(type)}`);
            }
        case "number":
            if (typeIdEquals(type, NumberType)) {
                return obj;
            } else {
                $nab.BuiltIn.error(`cannot cast a Number value to ${typeToString(type)}`);
            }
            return obj;
        case "object": {
            const objType = obj.gettypename().toLocaleLowerCase();
            const castType = typeToString(type);
            if (objType === castType) {
                return obj;
            } else {
                $nab.BuiltIn.error(`cannot cast a ${objType} value to a ${castType}`);
            }
        }
        default:
            return undefined;
    }
}

function jsObjectToNabsic(obj: any, type: Type): NabsicAny {
    switch (typeof obj) {
        case "string":
            if (typeIdEquals(type, StringType)) {
                return obj;
            } else {
                console.log("hi")
                $nab.BuiltIn.error(`cannot deserialize a String value to ${typeToString(type)}`);
            }
        case "number":
            if (typeIdEquals(type, NumberType)) {
                return obj;
            } else {
                $nab.BuiltIn.error(`cannot deserialize a Number value to ${typeToString(type)}`);
            }
            return obj;
        case "object": {
            if (Array.isArray(obj)) {
                if (typeIdEquals(type, ArrayType)) {
                    return new $nab.BuiltIn.array(...obj.map(p => jsObjectToNabsic(p, type.params[0])));
                } else {
                    $nab.BuiltIn.error(`cannot deserialize an Array value to ${typeToString(type)}`);
                }
            }
            if (typeIdEquals(type, DictType)) {
                const dict = new $nab.BuiltIn.dictionary();
                for (const prop of Object.getOwnPropertyNames(obj)) {
                    dict.set(prop, jsObjectToNabsic(obj[prop], type));
                }
                return dict;
            } else {
                $nab.BuiltIn.error(`cannot deserialize an object value to ${typeToString(type)}`);
            }
        }
        default:
            return undefined;
    }
}

$nab.deserializefromjson = (s: string, type: Type) => {
    const parsed = JSON.parse(s);
    return jsObjectToNabsic(parsed, type);
}

$nab.BuiltIn.array = NabArray;
$nab.BuiltIn.keyvaluepair = KeyValuePair;
$nab.BuiltIn.dictionary = NabDictionary;
$nab.BuiltIn.cache = class extends $nab.BuiltIn.dictionary {
    gettypename() { return `Cache<${super[typeParamsSym].join(", ")}>`; }
}
$nab.BuiltIn.buffer = Buffer;
$nab.BuiltIn.newbuffer = () => new $nab.BuiltIn.buffer();

/* Fun with Web APIs */
$nab.BuiltIn.ebkeycodearrowdown = "ArrowDown";
$nab.BuiltIn.ebkeycodearrowup = "ArrowUp";
$nab.BuiltIn.ebkeycodearrowleft = "ArrowLeft";
$nab.BuiltIn.ebkeycodearrowright = "ArrowRight";
$nab.BuiltIn.ebeventclick = "click";
$nab.BuiltIn.ebeventkeydown = "keydown";
$nab.Context.window = new NabWindow(window);
$nab.BuiltIn.alert = (msg: string) => alert(msg);
$nab.BuiltIn.refreshpage = () => window.location.reload();
$nab.BuiltIn.query = (selector: string) => {
    const res = new $nab.BuiltIn.array();
    document.querySelectorAll(selector).forEach((e) => {
        res.append(new NabElement(e as HTMLElement));
    });
    return res;
};
$nab.BuiltIn.queryunique = (selector: string) => new NabElement(document.querySelector(selector)!);
$nab.BuiltIn.color = Color;
$nab.BuiltIn.canvas = NabCanvas;