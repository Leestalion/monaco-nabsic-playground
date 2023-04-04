import NabDictionary from "./NabDictionary";
import { NabsicAny, NabsicBool, NabsicHashable, NabsicLambda } from "./basictypes";
import { typeParamsSym } from "./symbols";


export default class NabArray<T extends NabsicAny> {
    pElements: T[];
    [typeParamsSym]: string[];

    constructor(...args: T[]) {
        this.pElements = args ?? [];
        this[typeParamsSym] = ["Object"];
    }

    gettypename() { return `Array<${this[typeParamsSym]}>`; }

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
        const res = new NabArray<U>();
        for (const v of this.pElements) {
            res.append(lambda.invoke(v));
        }
        return res;
    }

    todictionary<K extends NabsicHashable, V extends NabsicAny>(kLambda: NabsicLambda<T, K>, vLambda: NabsicLambda<T, V>) {
        const res = new NabDictionary<K, V>();
        for (const v of this.pElements) {
            res.set(kLambda.invoke(v), vLambda.invoke(v));
        }
        return res;
    }

    where(lambda: NabsicLambda<T, NabsicBool>) {
        const res = new NabArray<T>();
        for (const e of this.pElements) {
            if (lambda.invoke(e)) {
                res.append(e);
            }
        }
        return res;
    }

    join(sep: string) {
        return this.pElements.join(sep);
    }

    tostring() {
        return this.join("|");
    }

    tojson() {
        return JSON.stringify(this.pElements);
    }
};