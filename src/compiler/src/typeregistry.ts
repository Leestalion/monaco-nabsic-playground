import { Sym, symToString } from "./sym.js";
import { Type, TypeInfo, typeIdToString, AbstractTypeInfo, typeIdEquals, typeParamsEqual } from "./typing.js";


export function createTypeRegistry() {
    const typeInfoById = new Map<string, AbstractTypeInfo>();
    const typesBySymbol = new Map<string, Type>();
    const typesByArgName = new Map<string, Type>();
    const reg = {
        typesBySymbol,
        typeInfo(id: Type): TypeInfo | undefined {
            const abstractInfo = typeInfoById.get(typeIdToString(id, true));
            if (abstractInfo) {
                return { ...abstractInfo, args: id.params };
            } else {
                return undefined;
            }
        },
        registerTypeInfo(info: AbstractTypeInfo) {
            typeInfoById.set(typeIdToString(info.id, true), info);
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
        },
        isSubtype(type: Type, t: Type, permissive=false): boolean {
            const info = reg.typeInfo(type);
            if (!permissive && !info) { return false; }
            if (typeIdEquals(type, t)) {
                return permissive || typeParamsEqual(type, t);
            }
            return info?.isSubtype(t) ?? false;
        },
    };
    return reg;
}

export type TypeRegistry = ReturnType<typeof createTypeRegistry>;