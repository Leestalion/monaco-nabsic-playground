(function($nab) {
    $nab.break = Symbol("break");
    $nab.continue = Symbol("continue");
    $nab.return = Symbol("return");
    $nab.abort = Symbol("abort");
    $nab.eq = (a, b) => {
        if (a == null || b == null) return undefined;
        if (typeof a.equals === "undefined") {
            if (typeof b.equals === "undefined") {
                return a === b
            } else {
                return b.equals(a);
            }
        } else {
            return a.equals(b);
        }
    }
    $nab.neq = (a, b) => !$nab.eq(a, b);
    $nab.lt = (a, b) => a == null ? undefined : b == null ? undefined : a < b;
    $nab.lte = (a, b) => a == null ? undefined : b == null ? undefined : a <= b;
    $nab.gt = (a, b) => a == null ? undefined : b == null ? undefined : a > b;
    $nab.gte = (a, b) => a == null ? undefined : b == null ? undefined : a >= b;
    $nab.and = (a, b) => a == null ? undefined : b == null ? undefined : a && b;
    $nab.or = (a, b) => a == null ? undefined : b == null ? undefined : a || b;
    $nab.andalso = (a, b) => {
        if (a == null) return undefined;
        if (!a) return false;
        const rb = b();
        if (rb == null) return undefined;
        return rb;
    };
    $nab.orelse = (a, b) => {
        if (a == null) return undefined;
        if (a) return true;
        const rb = b();
        if (rb == null) return undefined;
        return rb;
    };
    $nab.bitand = (a, b) => a == null ? undefined : b == null ? undefined : a & b;
    $nab.bitor = (a, b) => a == null ? undefined : b == null ? undefined : a | b;
    $nab.add = (a, b) => a == null ? undefined : b == null ? undefined : a + b;
    $nab.sub = (a, b) => a == null ? undefined : b == null ? undefined : a - b;
    $nab.mul = (a, b) => a == null ? undefined : b == null ? undefined : a * b;
    $nab.div = (a, b) => a == null ? undefined : b == null ? undefined : a / b;
    $nab.cat = (s, o) => s + (o.tostring ? o.tostring() : o);
    $nab.def = (a, b) => a == null ? b() : a;
    $nab.for = (n, cb) => {
        for (let i = 1; i <= n; i++) {
            try {
                cb(i);
            } catch (e) {
                if (e.flow === $nab.break) break;
                if (e.flow === $nab.continue) continue;
                throw e;
            }
        }
    };
    $nab.foreach = (iter, cb) => {
        for (const [k, v] of iter.entries()) {
            try {
                cb(k, v);
            } catch (e) {
                if (e.flow === $nab.break) break;
                if (e.flow === $nab.continue) continue;
                throw e;
            }
        }
    };
    $nab.while = (cond, body) => {
        while(cond()) {
            try {
                body();
            } catch (e) {
                if (e.flow === $nab.break) break;
                if (e.flow === $nab.continue) continue;
                throw e;
            }
        }
    };
    $nab.lambda = cb => ({
        invoke(...args) {
            try {
                return cb(...args); 
            } catch (e) {
                if (e.flow === $nab.return) {
                    return e.value;
                } else {
                    throw e;
                }
            }
        },
    });
    $nab.getTypeName = (obj) => {
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
    $nab.get = (obj, prop) => {
        switch (prop) {
            case "serializetojson":
                if (obj.serializetojson) {
                    return obj.serializetojson.bind(obj);
                } else {
                    return () => JSON.stringify(obj);
                }
            case "gettypename":
                if (obj.gettypename) {
                    return obj.gettypename.bind(obj);
                } else {
                    return () => $nab.getTypeName(obj);
                }
            default:
                return obj[prop].bind(obj);
        }
    };
    $nab.BuiltIn = $nab.BuiltIn ?? {};
    $nab.Context = $nab.Context ?? {};
    $nab.BuiltIn.ebyes = 1;
    $nab.BuiltIn.ebno = 2;
    $nab.BuiltIn.null = undefined;
    $nab.BuiltIn.debugprint = obj => {
        let s = obj;
        if (obj && obj.tostring) {
            s = obj.tostring();
        } else if (obj == null) {
            s = "Null";
        }
        if ($nab.log) {
            $nab.log(s);
        } else {
            console.log(JSON.stringify(s));
        }
    };
    $nab.BuiltIn.error = msg => { throw msg };
    $nab.BuiltIn.abort = () => { throw $nab.abort };
    $nab.BuiltIn.serializetojson = obj => {
        if (obj && obj.tojson) {
            return obj.tojson();
        }
        return JSON.stringify(obj);
    };
    $nab.BuiltIn.abs = n => Math.abs(n);
    $nab.BuiltIn.log = n => Math.log(n);
    $nab.BuiltIn.exp = n => Math.exp(n);
    $nab.BuiltIn.ceil = n => Math.ceil(n);
    $nab.BuiltIn.int = n => Math.floor(n);
    $nab.BuiltIn.round = n => Math.round(n);
    $nab.BuiltIn.rnd = () => Math.random();
    $nab.BuiltIn.mod = (n, m) => n % m;
    $nab.BuiltIn.sqr = n => Math.sqrt(n);
    $nab.BuiltIn.cos = n => Math.cos(n);
    $nab.BuiltIn.sin = n => Math.sin(n);
    $nab.BuiltIn.tan = n => Math.tan(n);
    $nab.BuiltIn.atan = n => Math.atan(n);
    $nab.BuiltIn.maxof = (...n) => Math.max(...n);
    $nab.BuiltIn.minof = (...n) => Math.min(...n);
    
    $nab.BuiltIn.len = s => s.length;
    $nab.BuiltIn.stringisnullorempty = s => s == null || $nab.BuiltIn.len(s) === 0;
    $nab.BuiltIn.array = function NabArray(...args) {
        const self = Object.create($nab.BuiltIn.array.prototype);
        self.pElements = args ?? [];
        return self;
    };
    $nab.BuiltIn.array.prototype = {
        constructor: $nab.BuiltIn.array,
        get(i) {
            return this.pElements[i - 1];
        },
        set(i, e) {
            this.pElements[i - 1] = e;
        },
        append(e) {
            this.pElements.push(e);
        },
        size() {
            return this.pElements.length;
        },
        *entries() {
            for (const [i, e] of this.pElements.entries()) {
                yield [i+1, e];
            }
        },
        select(lambda) {
            const res = new $nab.BuiltIn.array();
            for (const v of this.pElements) {
                res.append(lambda.invoke(v));
            }
            return res;
        },
        todictionary(kLambda, vLambda) {
            const res = new $nab.BuiltIn.dictionary();
            for (const v of this.pElements) {
                res.set(kLambda.invoke(v), vLambda.invoke(v));
            }
            return res;
        },
        where(lambda) {
            const res = new $nab.BuiltIn.array();
            for (const e of this.pElements) {
                if (lambda.invoke(e)) {
                    res.append(e);
                }
            }
            return res;
        },
        join(sep) {
            return this.pElements.join(sep);
        },
        tostring() {
            return this.join("|");
        },
        tojson() {
            return JSON.stringify(this.pElements);
        },
    };
    $nab.BuiltIn.keyvaluepair = class KeyValuePair {
        #key
        #value
        constructor(key, value) {
            this.#key = key;
            this.#value = value;
        }
        gettypename() { return "KeyValuePair"; }
        key() { return this.#key }
        value() { return this.#value }
    };
    $nab.BuiltIn.dictionary = class Dictionary {
        #m
        constructor() {
            this.#m = new Map();
            return this;
        }

        gettypename() { return "Dictionary"; }

        get(k) {
            return this.#m.get(k);
        }

        set(k, v) {
            this.#m.set(k, v);
        }

        exists(k) {
            return this.#m.has(k);
        }

        count() {
            return this.#m.size();
        }

        entries() {
            return this.#m.entries();
        }

        select(lambda) {
            const res = new $nab.BuiltIn.array();
            for (const [k, v] of this.#m.entries()) {
                res.append(lambda.invoke(new $nab.BuiltIn.keyvaluepair(k, v)));
            }
            return res;
        }

        todictionary(kLambda, vLambda) {
            const res = new $nab.BuiltIn.dictionary();
            for (const [k, v] of this.#m.entries()) {
                const kvp = new $nab.BuiltIn.keyvaluepair(k, v);
                res.set(kLambda.invoke(kvp), vLambda.invoke(kvp));
            }
            return res;
        }

        where(lambda) {
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
        gettypename() { return "Cache"; }
    }

    $nab.BuiltIn.string = class NabString {
        #s
        constructor(s) {
            this.#s = s;
        }
        gettypename() { return "String"; }
        [Symbol.toPrimitive]() { return this.#s; }
        toString() { return this.#s; }
        equals(s) { return (typeof s === "string" || s instanceof NabString) && this.toString() === s.toString(); }
        toupper() { return new $nab.BuiltIn.string(this.#s.toUpperCase()); }
        toupperinvariant() { return new $nab.BuiltIn.string(this.#s.toUpperCase()); }
        tolower() { return new $nab.BuiltIn.string(this.#s.toLowerCase()); }
        tolowerinvariant() { return new $nab.BuiltIn.string(this.#s.toLowerCase()); }
        contains(s) { return this.#s.includes(s); }
        startswith(s) { return this.#s.startsWith(s); }
        endswith(s) { return this.#s.endsWith(s); }
        remove(i, n) {
            const start = this.#s.substring(1, i-1);
            const end = this.#s.substring(i + n);
            return new $nab.BuiltIn.string(start + end);
        }
        insert(i, s) {
            const start = this.#s.substring(1, i);
            const end = this.#s.substring(i + 1);
            return new $nab.BuiltIn.string(start + s + end);
        }
        padleft(n) { return new $nab.BuiltIn.string(this.#s.padStart(n)); }
        padright(n) { return new $nab.BuiltIn.string(this.#s.padEnd(n)); }
        trimstart() { return new $nab.BuiltIn.string(this.#s.trimStart()); }
        trimend() { return new $nab.BuiltIn.string(this.#s.trimEnd()); }
        trim() { return new $nab.BuiltIn.string(this.#s.trim()); }
        substring(i, n) { return new $nab.BuiltIn.string(this.#s.substr(i-1, n)); }
        indexof(s, i) { return new $nab.BuiltIn.string(this.#s.indexOf(s, i - 1)); }
        split(s) { return new $nab.BuiltIn.string(this.#s.split(s)); }
        replace(a, b) { return new $nab.BuiltIn.string(this.#s.replace(a, b)); }
    };

    $nab.BuiltIn.buffer = class Buffer {
        #value = ""

        gettypename() { return "Buffer"; }
        write(s) {
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

    class Event {
        #event
        constructor(e) {
            this.#event = e;
        }

        gettypename() { return "Event"; }
        target() { return new Element(this.#event.target); }
        clientx() { return this.#event.clientX; }
        clienty() { return this.#event.clientY; }
        code() { return this.#event.code; }
        stoppropagation() { return this.#event.stopPropagation(); }
    }

    class Listenable {
        constructor(e) {
            this.pElement = e;
        }

        on(event, lambda) {
            this.pElement.addEventListener(event, e => lambda.invoke(new Event(e)));
            return this;
        }
    }

    class Window extends Listenable {
        constructor(e) {
            super(e);
        }

        gettypename() { return "Window"; }

        eachframe(lambda) {
            let lastUpdateTimestamp = -1;
            const step = timestamp => {
                if (lastUpdateTimestamp < 0) lastUpdateTimestamp = timestamp;
                const delta = timestamp - lastUpdateTimestamp;
                lastUpdateTimestamp = timestamp;
                lambda.invoke(delta);
                window.requestAnimationFrame(step);
            };
            window.requestAnimationFrame(step);
        }
    }

    $nab.Context.window = new Window(window);
    $nab.BuiltIn.alert = msg => alert(msg);
    $nab.BuiltIn.refreshpage = () => window.location.reload();

    class Element extends Listenable {
        constructor(e) {
            super(e);
        }

        gettypename() { return "Element"; }

        setstyle(property, value) {
            this.pElement.style[property] = value;
            return this;
        }

        settext(text) {
            this.pElement.textContent = text;
            return this;
        }

        createchild(tag) {
            const element = document.createElement(tag);
            this.pElement.appendChild(element);
            return new Element(element);
        }
    }

    $nab.BuiltIn.query = selector => {
        const res = new $nab.BuiltIn.array();
        document.querySelectorAll(selector).forEach((e) => {
            res.append(new Element(e));
        });
        return res;
    };

    $nab.BuiltIn.queryunique = selector => new Element(document.querySelector(selector));

    /* Fun API for programming visual things */

    $nab.BuiltIn.color = class Color {
        #r; #g; #b;
        constructor(r, g, b) {
            this.#r = r;
            this.#g = g;
            this.#b = b;
        }

        gettypename() { return "Color"; }
        r() { return this.#r; }
        g() { return this.#g; }
        b() { return this.#b; }

        #componentToHex(c) {
            var hex = c.toString(16);
            return hex.length == 1 ? "0" + hex : hex;
        }
    
        #colorToHex(c) {
            return "#" + this.#componentToHex(c.#r) + this.#componentToHex(c.#g) + this.#componentToHex(c.#b);
        }

        tohex() {
            return new $nab.BuiltIn.string(this.#colorToHex(this));
        }
    };

    $nab.BuiltIn.canvas = class Canvas extends Element {
        constructor(parent) {
            super(document.createElement("canvas"));
            parent.pElement.appendChild(this.pElement);
            this.ctx = this.pElement.getContext("2d");
        }

        gettypename() { return "Canvas"; }

        resize(width, height) {
            this.pElement.width = width;
            this.pElement.height = height;
            return this;
        }

        setdrawcolor(color) {
            this.ctx.fillStyle = color.tohex();
            return this;
        }

        drawrect(x, y, w, h) {
            this.ctx.fillRect(x, y, w, h);
            return this;
        }

        clear(color) {
            return this.setdrawcolor(color).drawrect(0, 0, this.pElement.width, this.pElement.height);
        }

        repaint() {
            this.ctx.fill();
            return this;
        }
    };
}(window.$nab ? window.$nab : window.$nab = {}))