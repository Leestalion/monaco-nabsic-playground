import { Sym, symToString } from "./sym.js";
import { Type, TypeId, typeIdToString, TypeInfo } from "./typing.js";


export function createTypeRegistry() {
    const typeInfoById = new Map<string, TypeInfo>();
    const typesBySymbol = new Map<string, Type>();
    const typesByArgName = new Map<string, Type>();
    return {
        typeInfo(id: TypeId): TypeInfo | undefined {
            return typeInfoById.get(typeIdToString(id, true));
        },
        setTypeInfo(id: TypeId, info: TypeInfo) {
            typeInfoById.set(typeIdToString(id, true), info);
            return info;
        },
        symType(sym: Sym): Type | undefined {
            return typesBySymbol.get(symToString(sym));
        },
        setSymType(sym: Sym, type: Type) {
            typesBySymbol.set(symToString(sym), type);
        },
        argType(name: string): Type | undefined {
            return typesByArgName.get(name);
        },
        setArgType(name: string, type: Type) {
            typesByArgName.set(name, type);
        }
    };
}

export type TypeRegistry = ReturnType<typeof createTypeRegistry>;