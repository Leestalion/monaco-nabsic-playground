import { NabsicAny } from "./basictypes";


export const BuiltinMethods = {
    object: {
        gettypename(_self: string) { return "<Unknown>"; },
        tostring(self: NabsicAny) { return JSON.stringify(self) },
        serializetojson(self: NabsicAny) {
            if (typeof self === "object" && "tojson" in self) {
                return self.tojson();
            }
            return JSON.stringify(self);
        },
    },
    number: {
        gettypename(_self: string) { return "Number"; },
        tostring(self: string) { return self.toString(); },
        serializetojson(self: NabsicAny) { return JSON.stringify(self); },
    },
    boolean: {
        gettypename(_self: string) { return "Boolean"; },
        tostring(self: boolean) { return self ? "True" : "False"; },
        serializetojson(self: NabsicAny) { return JSON.stringify(self); },
    },
    undefined: {
        gettypename(_self: string) { return "Null"; },
        tostring(_self: boolean) { return "Null"; },
        serializetojson(self: NabsicAny) { return JSON.stringify(self); },
    },
    string: {
        gettypename(_self: string) { return "String"; },
        tostring(self: string) { return self; },
        equals(self: string, s: NabsicAny) { return (typeof s === "string") && self === s; },
        toupper(self: string) { return self.toUpperCase(); },
        toupperinvariant(self: string) { return self.toUpperCase(); },
        tolower(self: string) { return self.toLowerCase(); },
        tolowerinvariant(self: string) { return self.toLowerCase(); },
        contains(self: string, s: string) { return self.includes(s); },
        startswith(self: string, s: string) { return self.startsWith(s); },
        endswith(self: string, s: string) { return self.endsWith(s); },
        remove(self: string, i: number, n: number) {
            const start = self.substring(1, i-1);
            const end = self.substring(i + n);
            return start + end;
        },
        insert(self: string, i: number, s: string) {
            const start = self.substring(1, i);
            const end = self.substring(i + 1);
            return start + s + end;
        },
        padleft(self: string, n: number) { return self.padStart(n); },
        padright(self: string, n: number) { return self.padEnd(n); },
        trimstart(self: string) { return self.trimStart(); },
        trimend(self: string) { return self.trimEnd(); },
        trim(self: string) { return self.trim(); },
        substring(self: string, i: number, n: number) { return self.substr(i-1, n); },
        indexof(self: string, s: string, i: number) { return self.indexOf(s, i - 1); },
        split(self: string, s: string) { return self.split(s); },
        replace(self: string, a: string, b: string) { return self.replace(a, b); },
        serializetojson(self: NabsicAny) { return JSON.stringify(self); },
    }
};