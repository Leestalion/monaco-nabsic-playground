import KeyValuePair from "./KeyValuePair";
import NabArray from "./NabArray";
import { NabsicAny, NabsicBool, NabsicHashable, NabsicLambda } from "./basictypes";
import { typeParamsSym } from "./symbols";

export default class NabDictionary<K extends NabsicHashable, V extends NabsicAny> {
    #m: Map<NabsicHashable, V>; [typeParamsSym]: string[];
    constructor() {
        this.#m = new Map();
        this[typeParamsSym] = [];
        return this;
    }

    gettypename() { return `Dictionary<${this[typeParamsSym].join(", ")}>`; }

    get(k: K) {
        if (typeof k === "number" || typeof k === "string") {
            return this.#m.get(k);
        } else {
            return undefined;
        }
    }

    set(k: K, v: V) {
        if (typeof k === "number" || typeof k === "string") {
            this.#m.set(k, v);
        }
    }

    exists(k: K) {
        if (typeof k === "number" || typeof k === "string") {
            return this.#m.has(k);
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

    select<T extends NabsicAny>(lambda: NabsicLambda<KeyValuePair<K, V>, T>) {
        const res = new NabArray<T>();
        for (const [k, v] of this.#m.entries()) {
            res.append(lambda.invoke(new KeyValuePair(k, v) as Parameters<typeof lambda["invoke"]>));
        }
        return res;
    }

    todictionary<K2, V2>(kLambda: NabsicLambda<KeyValuePair<K, V>, K2>, vLambda: NabsicLambda<KeyValuePair<K, V>, V2>) {
        const res = new NabDictionary<any, any>();
        for (const [k, v] of this.#m.entries()) {
            const kvp = new KeyValuePair<any, V>(k, v);
            res.set(kLambda.invoke(kvp), vLambda.invoke(kvp));
        }
        return res;
    }

    where(lambda: NabsicLambda<KeyValuePair<K, V>, NabsicBool>) {
        const res = new NabArray<KeyValuePair<K, V>>();
        for (const [k, v] of this.#m.entries()) {
            const kvp = new KeyValuePair(k, v) as Parameters<typeof lambda["invoke"]>;
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
}