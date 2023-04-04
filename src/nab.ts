(function($nab) {
    $nab.BuiltIn = $nab.BuiltIn ?? {};
    $nab.Context = $nab.Context ?? {};

    type NabsicBool = boolean | undefined;
    type NabsicNumber = number | undefined;
    type NabsicString = string | NabString;
    type NabsicLambda<Args extends unknown, R> = {
        invoke(...args: readonly Args[]): R;
    };
    type NabsicObject = {
        equals(obj:NabsicAny):boolean;
        serializetojson():NabsicString;
        gettypename(): NabsicString;
        tostring(): NabString;
        tojson(): NabString;
    };
    type NabsicAny = number | boolean | undefined | NabsicString | NabsicObject;

    class NabString {
        #s
        constructor(s: string) {
            this.#s = s;
        }
        gettypename() { return "String"; }
        [Symbol.toPrimitive]() { return this.#s; }
        get length(): number { return this.#s.length; }
        toString() { return this.#s; }
        tostring() { return this; }
        equals(s: NabsicAny) { return (typeof s === "string" || s instanceof NabString) && this.toString() === s.toString(); }
        toupper() { return new $nab.BuiltIn.string(this.#s.toUpperCase()); }
        toupperinvariant() { return new $nab.BuiltIn.string(this.#s.toUpperCase()); }
        tolower() { return new $nab.BuiltIn.string(this.#s.toLowerCase()); }
        tolowerinvariant() { return new $nab.BuiltIn.string(this.#s.toLowerCase()); }
        contains(s: NabsicString) { return this.#s.includes(s.toString()); }
        startswith(s: NabsicString) { return this.#s.startsWith(s.toString()); }
        endswith(s: NabsicString) { return this.#s.endsWith(s.toString()); }
        remove(i: number, n: number) {
            const start = this.#s.substring(1, i-1);
            const end = this.#s.substring(i + n);
            return new $nab.BuiltIn.string(start + end);
        }
        insert(i: number, s: NabsicString) {
            const start = this.#s.substring(1, i);
            const end = this.#s.substring(i + 1);
            return new $nab.BuiltIn.string(start + s + end);
        }
        padleft(n: number) { return new $nab.BuiltIn.string(this.#s.padStart(n)); }
        padright(n: number) { return new $nab.BuiltIn.string(this.#s.padEnd(n)); }
        trimstart() { return new $nab.BuiltIn.string(this.#s.trimStart()); }
        trimend() { return new $nab.BuiltIn.string(this.#s.trimEnd()); }
        trim() { return new $nab.BuiltIn.string(this.#s.trim()); }
        substring(i: number, n: number) { return new $nab.BuiltIn.string(this.#s.substr(i-1, n)); }
        indexof(s: NabsicString, i: number) { return new $nab.BuiltIn.string(this.#s.indexOf(s.toString(), i - 1)); }
        split(s: NabsicString) { return new $nab.BuiltIn.string(this.#s.split(s.toString())); }
        replace(a: NabsicString, b: NabsicString) { return new $nab.BuiltIn.string(this.#s.replace(a.toString(), b.toString())); }
    }

    $nab.toString = (obj: NabsicAny): NabString => {
        switch (typeof obj) {
            case "boolean":
                return new NabString(obj ? "True" : "False");
            case "string":
                return new NabString(obj);
            case "number":
                return new NabString(obj.toString());
            case "object":
                if ("tostring" in obj) {
                    return obj.tostring();
                } else {
                    return new NabString(JSON.stringify(obj));
                }
            default:
                console.log("default", obj);
                return new NabString("Null");
        }
    };

    $nab.BuiltIn.string = NabString;

    $nab.break = Symbol("break");
    $nab.continue = Symbol("continue");
    $nab.return = Symbol("return");
    $nab.abort = Symbol("abort");
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
    $nab.cat = (s: NabsicString, o: NabsicAny) => s.toString() + $nab.toString(o);
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
    $nab.getTypeName = (obj: NabsicAny) => {
        switch (typeof obj) {
            case "number":
                return "Number";
            case "boolean":
                return "Boolean";
            case "undefined":
                return "Null";
            default:
                return "<Unknown>";
        }
    }
    $nab.call = (obj: NabsicAny, prop: string, ...args: NabsicAny[]) => {
        switch (prop) {
            case "serializetojson":
                if (typeof obj === "object" && "serializetojson" in obj) {
                    return obj.serializetojson();
                } else {
                    return JSON.stringify(obj);
                }
            case "gettypename":
                if (typeof obj === "object" && "gettypename" in obj) {
                    return obj.gettypename();
                } else {
                    return $nab.getTypeName(obj);
                }
            default:
                return (obj as any)[prop](...args);
        }
    };
    $nab.BuiltIn.ebyes = 1;
    $nab.BuiltIn.ebno = 2;
    $nab.BuiltIn.null = undefined;
    $nab.BuiltIn.debugprint = (obj: NabsicAny) => {
        let s = $nab.toString(obj);
        if ($nab.log) {
            $nab.log(s);
        } else {
            console.log(JSON.stringify(s));
        }
    };
    $nab.BuiltIn.error = (msg: NabString) => { throw msg };
    $nab.BuiltIn.abort = () => { throw $nab.abort };
    $nab.BuiltIn.serializetojson = (obj: NabsicAny) => {
        if (typeof obj === "object" && "tojson" in obj) {
            return obj.tojson();
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
    
    $nab.BuiltIn.len = (s: NabString) => s.length;
    $nab.BuiltIn.stringisnullorempty = (s: NabsicString|undefined) => s == null || $nab.BuiltIn.len(s) === 0;

    $nab.cast = (n: NabsicAny, type: any) => n;

    function jsObjectToNabsic(obj: any): NabsicAny {
        switch (typeof obj) {
            case "string":
                return new $nab.BuiltIn.string(obj);
            case "number":
                return obj;
            case "object": {
                if (Array.isArray(obj)) {
                    return $nab.BuiltIn.array(...obj.map(jsObjectToNabsic));
                }
                const dict = new $nab.BuiltIn.dictionary();
                for (const prop of Object.getOwnPropertyNames(obj)) {
                    dict.set(prop, jsObjectToNabsic(obj[prop]));
                }
                return dict;
            }
            default:
                return undefined;
        }
    }

    $nab.deserializefromjson = (s: NabString, type: any) => {
        const parsed = JSON.parse(s.toString());
        return jsObjectToNabsic(parsed);
    }

    $nab.BuiltIn.array = class NabArray<T extends NabsicAny> {
        pElements: T[];
        pTypes: string[];

        constructor(...args: T[]) {
            this.pElements = args ?? [];
            this.pTypes = ["Object"];
        }

        gettypename() { return `Array<${this.pTypes}>`; }

        get(i: number) {
            return this.pElements[i - 1];
        }

        set(i: number, e: T) {
            this.pElements[i - 1] = e;
        }

        append(e: T) {
            this.pElements.push(e);
        }

        size() {
            return this.pElements.length;
        }

        *entries() {
            for (const [i, e] of this.pElements.entries()) {
                yield [i+1, e];
            }
        }

        select<U extends NabsicAny>(lambda: NabsicLambda<T, U>): NabArray<U> {
            const res = new $nab.BuiltIn.array();
            for (const v of this.pElements) {
                res.append(lambda.invoke(v));
            }
            return res;
        }

        todictionary<K, V>(kLambda: NabsicLambda<T, K>, vLambda: NabsicLambda<T, V>) {
            const res = new $nab.BuiltIn.dictionary();
            for (const v of this.pElements) {
                res.set(kLambda.invoke(v), vLambda.invoke(v));
            }
            return res;
        }

        where(lambda: NabsicLambda<T, NabsicBool>) {
            const res = new $nab.BuiltIn.array();
            for (const e of this.pElements) {
                if (lambda.invoke(e)) {
                    res.append(e);
                }
            }
            return res;
        }

        join(sep: NabsicString) {
            return this.pElements.join(sep.toString());
        }

        tostring() {
            return this.join("|");
        }

        tojson() {
            return JSON.stringify(this.pElements);
        }
    };

    class KeyValuePair<K extends NabsicAny, V extends NabsicAny> {
        #key: K;
        #value: V;
        pTypes: string[] = [];

        constructor(key: K, value: V) {
            this.#key = key;
            this.#value = value;
        }
        gettypename() { return `KeyValuePair<${this.pTypes.join(", ")}>`; }
        key() { return this.#key }
        value() { return this.#value }
    };

    $nab.BuiltIn.keyvaluepair = KeyValuePair;

    $nab.BuiltIn.dictionary = class Dictionary<K extends NabsicAny, V extends NabsicAny> {
        #m: Map<string|number, V>; pTypes: string[];
        constructor() {
            this.#m = new Map();
            this.pTypes = [];
            return this;
        }

        gettypename() { return `Dictionary<${this.pTypes.join(", ")}>`; }

        get(k: K) {
            if (typeof k === "number" || typeof k === "string") {
                return this.#m.get(k);
            } else if (typeof k === "object" && "toString" in k) {
                return this.#m.get(k.toString());
            } else {
                return undefined;
            }
        }

        set(k: K, v: V) {
            if (typeof k === "number" || typeof k === "string") {
                this.#m.set(k, v);
            } else if (typeof k === "object" && "toString" in k) {
                this.#m.set(k.toString(), v);
            }
        }

        exists(k: K) {
            if (typeof k === "number" || typeof k === "string") {
                return this.#m.has(k);
            } else if (typeof k === "object" && "toString" in k) {
                return this.#m.has(k.toString());
            } else {
                return false;
            }
        }

        count(): number {
            return this.#m.size;
        }

        entries() {
            return this.#m.entries();
        }

        select<T>(lambda: NabsicLambda<KeyValuePair<K, V>, T>) {
            const res = new $nab.BuiltIn.array();
            for (const [k, v] of this.#m.entries()) {
                res.append(lambda.invoke(new $nab.BuiltIn.keyvaluepair(k, v)));
            }
            return res;
        }

        todictionary<K2, V2>(kLambda: NabsicLambda<KeyValuePair<K, V>, K2>, vLambda: NabsicLambda<KeyValuePair<K, V>, V2>) {
            const res = new $nab.BuiltIn.dictionary();
            for (const [k, v] of this.#m.entries()) {
                const kvp = new $nab.BuiltIn.keyvaluepair(k, v);
                res.set(kLambda.invoke(kvp), vLambda.invoke(kvp));
            }
            return res;
        }

        where(lambda: NabsicLambda<KeyValuePair<K, V>, NabsicBool>) {
            const res = new $nab.BuiltIn.array();
            for (const [k, v] of this.#m.entries()) {
                const kvp = new $nab.BuiltIn.keyvaluepair(k, v);
                if (lambda.invoke(kvp)) {
                    res.append(kvp);
                }
            }
            return res;
        }

        tostring() {
            return Array.from(this.#m.entries()).map(([k, v]) => `${k}:${v}`).join("|");
        }

        tojson() {
            return JSON.stringify(this.#m);
        }
    };
    $nab.BuiltIn.cache = class extends $nab.BuiltIn.dictionary {
        gettypename() { return `Cache<${this.pTypes.join(", ")}>`; }
    }

    $nab.BuiltIn.buffer = class Buffer {
        #value = ""

        gettypename() { return "Buffer"; }
        write(s: NabString) {
            this.#value += s;
        }

        getvalue() { return new $nab.BuiltIn.string(this.#value); }
    };

    $nab.BuiltIn.newbuffer = () => new $nab.BuiltIn.buffer();

    /* Fun with Web APIs */
    $nab.BuiltIn.ebkeycodearrowdown = "ArrowDown";
    $nab.BuiltIn.ebkeycodearrowup = "ArrowUp";
    $nab.BuiltIn.ebkeycodearrowleft = "ArrowLeft";
    $nab.BuiltIn.ebkeycodearrowright = "ArrowRight";
    $nab.BuiltIn.ebeventclick = "click";
    $nab.BuiltIn.ebeventkeydown = "keydown";

    class NabEvent {
        #event
        constructor(e: Event & { clientX: number, clientY: number, code: string, target: HTMLElement }) {
            this.#event = e;
        }

        gettypename() { return "Event"; }
        target() { return new NabElement(this.#event.target); }
        clientx() { return this.#event.clientX; }
        clienty() { return this.#event.clientY; }
        code() { return this.#event.code; }
        stoppropagation() { return this.#event.stopPropagation(); }
    }

    class Listenable {
        pElement: HTMLElement;
    
        constructor(e: HTMLElement) {
            this.pElement = e;
        }

        on(event: NabString, lambda: NabsicLambda<NabEvent, void>) {
            this.pElement.addEventListener(event.toString(), e => lambda.invoke(new NabEvent(e as any)));
            return this;
        }
    }

    class NabWindow extends Listenable {
        constructor(e: Window) {
            super(e as unknown as HTMLElement);
        }

        gettypename() { return "Window"; }

        eachframe(lambda: NabsicLambda<number, void>) {
            let lastUpdateTimestamp = -1;
            const step = (timestamp: number) => {
                if (lastUpdateTimestamp < 0) lastUpdateTimestamp = timestamp;
                const delta = timestamp - lastUpdateTimestamp;
                lastUpdateTimestamp = timestamp;
                lambda.invoke(delta);
                window.requestAnimationFrame(step);
            };
            window.requestAnimationFrame(step);
        }
    }

    $nab.Context.window = new NabWindow(window);
    $nab.BuiltIn.alert = (msg: NabsicString) => alert(msg);
    $nab.BuiltIn.refreshpage = () => window.location.reload();

    class NabElement extends Listenable {
        constructor(e: HTMLElement) {
            super(e);
        }

        gettypename() { return "Element"; }

        setstyle(property: NabString, value: NabString) {
            (this.pElement.style as any)[property.toString()] = value;
            return this;
        }

        settext(text: NabString) {
            this.pElement.textContent = text.toString();
            return this;
        }

        createchild(tag: NabString) {
            const element = document.createElement(tag.toString());
            this.pElement.appendChild(element);
            return new NabElement(element);
        }
    }

    $nab.BuiltIn.query = (selector: NabString) => {
        const res = new $nab.BuiltIn.array();
        document.querySelectorAll(selector.toString()).forEach((e) => {
            res.append(new NabElement(e as HTMLElement));
        });
        return res;
    };

    $nab.BuiltIn.queryunique = (selector: NabString) => new NabElement(document.querySelector(selector.toString())!);

    /* Fun API for programming visual things */

    class Color {
        #r; #g; #b;
        constructor(r: number, g: number, b: number) {
            this.#r = r;
            this.#g = g;
            this.#b = b;
        }

        gettypename() { return "Color"; }
        r() { return this.#r; }
        g() { return this.#g; }
        b() { return this.#b; }

        #componentToHex(c: number) {
            var hex = c.toString(16);
            return hex.length == 1 ? "0" + hex : hex;
        }
    
        #colorToHex(c: Color) {
            return "#" + this.#componentToHex(c.#r) + this.#componentToHex(c.#g) + this.#componentToHex(c.#b);
        }

        tohex() {
            return new $nab.BuiltIn.string(this.#colorToHex(this));
        }
    };

    $nab.BuiltIn.color = Color;

    $nab.BuiltIn.canvas = class Canvas extends NabElement {
        declare pElement: HTMLCanvasElement;
        ctx: CanvasRenderingContext2D;

        constructor(parent: NabElement) {
            super(document.createElement("canvas"));
            parent.pElement.appendChild(this.pElement);
            this.ctx = this.pElement.getContext("2d")!;
        }

        gettypename() { return "Canvas"; }

        resize(width: number, height: number) {
            this.pElement.width = width;
            this.pElement.height = height;
            return this;
        }

        setdrawcolor(color: Color) {
            this.ctx.fillStyle = color.tohex();
            return this;
        }

        drawrect(x: number, y: number, w: number, h: number) {
            this.ctx.fillRect(x, y, w, h);
            return this;
        }

        clear(color: Color) {
            return this.setdrawcolor(color).drawrect(0, 0, this.pElement.width, this.pElement.height);
        }

        repaint() {
            this.ctx.fill();
            return this;
        }
    };
}((window as any).$nab ? (window as any).$nab : (window as any).$nab = {}))