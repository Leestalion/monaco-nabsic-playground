import { builtInSym, builtInType, createTypeInfo } from "./typing.js";
import { TypeRegistry } from "./typeregistry.js";


export const UnknownType = builtInType("<unknown>", true);
export const ObjectType = builtInType("object", true);
export const NullType = builtInType("null", true);
export const CallableType = builtInType("callable");
export const BooleanType = builtInType("boolean", true);
export const BooleanNotNull = builtInType("boolean");
export const NumberType = builtInType("number", true);
export const NumberNotNull = builtInType("number");
export const DateType = builtInType("date", true);
export const DateNotNull = builtInType("date");
export const StringType = builtInType("string", true);
export const StringNotNull = builtInType("string");
export const BufferType = builtInType("buffer", true);
export const ArrayType = builtInType("array", true);
export const KeyValuePair = builtInType("keyvaluepair", true);
export const DictType = builtInType("dictionary", true);
export const CacheType = builtInType("cache", true);
export const FuncType = builtInType("func", true);

export function defineStandardTypes(reg: TypeRegistry) {
    const UnknownTypeInfo = reg.registerTypeInfo(createTypeInfo("<unknown>", UnknownType, undefined, [], []));
    const ObjectTypeInfo = reg.registerTypeInfo(createTypeInfo("Object", ObjectType, UnknownTypeInfo, [], [
        { name: "GetTypeName", params: [], ret: StringType },
        { name: "SerializeToJson", params: [], ret: StringType },
    ]));
    reg.registerTypeInfo(createTypeInfo("KeyValuePair", KeyValuePair, ObjectTypeInfo, [ObjectType, ObjectType], [
        { name: "Key", params: [], ret: 0 },
        { name: "Value", params: [], ret: 1 },
    ]));
    const DictTypeInfo = reg.registerTypeInfo(createTypeInfo("Dictionary", DictType, ObjectTypeInfo, [ObjectType, ObjectType], [
        { name: "New", params: [], ret: NullType },
        { name: "ToString", params: [], ret: StringNotNull },
        { name: "Count", params: [], ret: NumberNotNull },
        { name: "Get", params: [0], ret: 1 },
        { name: "Set", params: [0, 1], ret: NullType },
        { name: "Select",
            params: [{ 
                sym: builtInSym("func"), nullable: true, 
                params: [{ sym: KeyValuePair.sym, nullable: true, params: [0, 1] }, ObjectType]
            }],
            ret: ArrayType
        },
        { name: "Where",
            params: [{ 
                sym: builtInSym("func"), nullable: true, 
                params: [{ sym: KeyValuePair.sym, nullable: true, params: [0, 1] }, BooleanNotNull]
            }],
            ret: "this"
        },
    ]));
    reg.registerTypeInfo(createTypeInfo("Null", NullType, ObjectTypeInfo, [], []));
    reg.registerTypeInfo(createTypeInfo("Boolean", BooleanType, ObjectTypeInfo, [],  []));
    reg.registerTypeInfo(createTypeInfo("Number", NumberType, ObjectTypeInfo, [], []));
    reg.registerTypeInfo(createTypeInfo("Number", NumberType, ObjectTypeInfo, [], []));
    reg.registerTypeInfo(createTypeInfo("String", StringType, ObjectTypeInfo, [], [
        { name: "ToUpper", params: [], ret: StringType },
        { name: "ToUpperInvariant", params: [], ret: StringType },
        { name: "ToLower", params: [], ret: StringType },
        { name: "ToLowerInvariant", params: [], ret: StringType },
        { name: "PadLeft", params: [], ret: StringType },
        { name: "PadRight", params: [], ret: StringType },
        { name: "TrimStart", params: [], ret: StringType },
        { name: "TrimEnd", params: [], ret: StringType },
        { name: "Trim", params: [], ret: StringType },
        { name: "Contains", params: [StringType], ret: BooleanNotNull },
        { name: "StartsWith", params: [StringType], ret: BooleanNotNull },
        { name: "EndsWith", params: [StringType], ret: BooleanNotNull },
        { name: "Remove", params: [NumberType, NumberType], ret: StringType },
        { name: "Insert", params: [NumberType, StringType], ret: StringType },
        { name: "SubString", params: [NumberType, NumberType], ret: StringType },
        { name: "IndexOf", params: [StringType, NumberType], ret: NumberType },
        { name: "Split", params: [StringType], ret: { ...ArrayType, params: [StringType] } },
        { name: "Replace", params: [StringType, StringType], ret: StringType },
    ]));
    reg.registerTypeInfo(createTypeInfo("Buffer", BufferType, ObjectTypeInfo, [], [
        { name: "GetValue", params: [], ret: StringType },
    ]));
    reg.registerTypeInfo(createTypeInfo("Array", ArrayType, ObjectTypeInfo, [ObjectType], [
        { name: "New", params: [{ vararg: 0 }], ret: NullType },
        { name: "Size", params: [], ret: NumberNotNull },
        { name: "Get", params: [NumberType], ret: 0 },
        { name: "Set", params: [NumberType, 0], ret: NullType },
        { name: "Append", params: [0], ret: NullType },
        { name: "Select", params: [{ sym: builtInSym("func"), nullable: true, params: [0, ObjectType] }], ret: ArrayType },
        { name: "Where", params: [{ sym: builtInSym("func"), nullable: true, params: [0, BooleanNotNull] }], ret: "this" },
    ]));
    reg.registerTypeInfo(createTypeInfo("Cache", CacheType, DictTypeInfo, [0, 1], []));
    reg.registerTypeInfo(createTypeInfo("Func", FuncType, ObjectTypeInfo, [{ vararg: ObjectType }], [
        { name: "Invoke", params: [[0, -1]], ret: -1 },
    ]));
}