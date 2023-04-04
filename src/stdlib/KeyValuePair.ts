import { NabsicAny, NabsicObject } from "./basictypes";
import { typeParamsSym } from "./symbols";

export default class KeyValuePair<K extends NabsicAny, V extends NabsicAny> implements NabsicObject {
    #key: K;
    #value: V;
    [typeParamsSym]: string[] = [];

    constructor(key: K, value: V) {
        this.#key = key;
        this.#value = value;
    }
    equals(obj: NabsicAny): boolean {
        return obj instanceof KeyValuePair && obj.#key === this.#key && obj.#value === this.#value;
    }
    serializetojson(): string {
        return `{Key:${this.#key},Value:${this.#value}}`;
    }
    gettypename() { return `KeyValuePair<${this[typeParamsSym].join(", ")}>`; }
    key() { return this.#key }
    value() { return this.#value }
};