import { isGlobalBuiltIn, Sym, symToString } from "./sym.js";

export type TypeId = {
    sym: Sym,
    nullable: boolean,
};

export function isBuiltinType(id: TypeId): boolean {
    switch (id.sym.kind) {
        case "":
            return true;
        case "#":
            return false;
        default:
            throw "unknown symbol kind";
    }
}

export function builtInType(name: string, nullable=false, params: Type[]=[]): Type {
    return { sym: { kind: "", name }, nullable, params };
}

export function builtInSym(name: string): Sym {
    return { kind: "", name };
}

export function callableType(params: Type[], ret: Type): Type {
    return { sym: builtInSym("callable"), nullable: false, params: [...params, ret] };
}

export function typeIdEquals(t1: TypeId, t2: TypeId): boolean {
    if (!t1 || !t2) {
        throw `${JSON.stringify(t1)}    ${JSON.stringify(t2)}`;
    }
    return t1.sym.path === t2.sym.path && 
        t1.sym.name === t2.sym.name && 
        t1.nullable === t2.nullable;
}

export type Type = TypeId & { params: Type[] };

export function typeParamsEqual(t1: Type, t2: Type): boolean {
    return t1.params.length === t2.params.length &&
        t1.params.every((p, i) => typeEquals(p, t2.params[i]));
}

export function typeEquals(t1: Type, t2: Type): boolean {
    return typeIdEquals(t1, t2) && typeParamsEqual(t1, t2);
}

export function typeIdToString(id: TypeId, nullInsensitive = false): string {
    const nullable = (id.nullable || nullInsensitive) ? "" : "+";
    return `${symToString(id.sym)}${nullable}`;
}

export function typeToString(id: Type, nullInsensitive = false): string {
    const nullable = (id.nullable || nullInsensitive) ? "" : "+";
    if (id.params.length === 0) {
        return `${symToString(id.sym)}${nullable}`;
    } else {
        return `${symToString(id.sym)}${nullable}<${id.params.map(p=>typeToString(p, nullInsensitive)).join(", ")}>`;
    }
}

export type ParamType = AbstractType|number|[number, number]|{vararg: ParamType};
export type AbstractType = TypeId & { params: ParamType[] };

export type Method = {
    name: string,
    params: ParamType[],
    ret: Type|number|"this",
};

export type AbstractTypeInfo = {
    readonly id: TypeId,
    readonly parent: AbstractTypeInfo|undefined,
    readonly params: ParamType[],
    readonly methods: Map<string, Method>,
    isSubtype(t: TypeId): boolean,
    lastCommonAncestors(t: AbstractTypeInfo): AbstractTypeInfo|undefined,
};

export type TypeInfo = AbstractTypeInfo & { args: Type[] };

export function nullableType(type: Type): Type {
    return { sym: type.sym, nullable: true, params: type.params };
}

export function isCallable(type: Type): boolean {
    return isGlobalBuiltIn(type.sym) && type.sym.name === "callable";
}

export function createTypeInfo(name: string, id: TypeId, parent: AbstractTypeInfo|undefined, params: ParamType[], methodDefs: Method[]): AbstractTypeInfo {
    const ancestorsById = new Map<string, AbstractTypeInfo>();
    let curParent: AbstractTypeInfo|undefined = parent;
    while (curParent) {
        ancestorsById.set(typeIdToString(curParent.id), curParent);
        curParent = curParent?.parent;
    }
    const methods = new Map<string, Method>();
    for (const method of methodDefs) {
        methods.set(method.name.toLowerCase(), method);
    }
    const info = {
        name, id, parent, params, methods,
        isSubtype(t: TypeId): boolean {
            return typeIdEquals(id, t) || ancestorsById.has(typeIdToString(t));
        },
        lastCommonAncestors(t: AbstractTypeInfo): AbstractTypeInfo|undefined {
            let ancestor: AbstractTypeInfo|undefined = undefined;
            if (t.isSubtype(info.id)) {
                return info;
            }
            for (const parent of ancestorsById.values()) {
                if (t.isSubtype(parent.id)) {
                    ancestor = { ...parent, id: { ...parent.id, nullable: parent.id.nullable && t.id.nullable } };
                    break;
                }
            }
            return ancestor;
        },
    };
    if (!id.nullable) {
        const nullableId = { ...id, nullable: true };
        ancestorsById.set(typeIdToString(nullableId), info);
    }
    return info;
}