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
export const DictType = builtInType("dictionary", true);
export const CacheType = builtInType("cache", true);
export const FuncType = builtInType("func", true);

export function defineStandardTypes(reg: TypeRegistry) {
    const UnknownTypeInfo = reg.setTypeInfo(UnknownType, createTypeInfo("<unknown>", UnknownType, undefined, []));
    const ObjectTypeInfo = reg.setTypeInfo(ObjectType, createTypeInfo("Object", ObjectType, UnknownTypeInfo, [
        { name: "GetTypeName", params: [], ret: StringType },
        { name: "SerializeToJson", params: [], ret: StringType },
    ]));
    reg.setTypeInfo(NullType, createTypeInfo("Null", NullType, ObjectTypeInfo, []));
    reg.setTypeInfo(BooleanType, createTypeInfo("Boolean", BooleanType, ObjectTypeInfo, []));
    reg.setTypeInfo(NumberType, createTypeInfo("Number", NumberType, ObjectTypeInfo, []));
    reg.setTypeInfo(DateType, createTypeInfo("Number", NumberType, ObjectTypeInfo, []));
    reg.setTypeInfo(StringType, createTypeInfo("String", StringType, ObjectTypeInfo, [
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
    reg.setTypeInfo(BufferType, createTypeInfo("Buffer", BufferType, ObjectTypeInfo, [
        { name: "GetValue", params: [], ret: StringType },
    ]));
    reg.setTypeInfo(ArrayType, createTypeInfo("Array", ArrayType, ObjectTypeInfo, [
        { name: "Size", params: [], ret: NumberNotNull },
        { name: "Get", params: [NumberType], ret: 0 },
        { name: "Set", params: [NumberType, 0], ret: NullType },
        { name: "Append", params: [0], ret: NullType },
        { name: "Select", params: [{ sym: builtInSym("func"), nullable: true, params: [ObjectType, ObjectType] }], ret: ArrayType },
        { name: "Where", params: [{ sym: builtInSym("func"), nullable: true, params: [ObjectType, BooleanNotNull] }], ret: "this" },
    ]));
    const dictInfo = reg.setTypeInfo(DictType, createTypeInfo("Dictionary", DictType, ObjectTypeInfo, [
        { name: "Count", params: [], ret: NumberNotNull },
        { name: "Get", params: [0], ret: 1 },
        { name: "Set", params: [0, 1], ret: NullType },
    ]));
    reg.setTypeInfo(CacheType, createTypeInfo("Cache", CacheType, dictInfo, []));
    reg.setTypeInfo(FuncType, createTypeInfo("Func", FuncType, ObjectTypeInfo, [
        { name: "Invoke", params: [[0, -1]], ret: -1 },
    ]));
}