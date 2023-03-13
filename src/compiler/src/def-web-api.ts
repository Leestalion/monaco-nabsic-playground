import { ArrayType, NullType, NumberNotNull, ObjectType, StringNotNull, StringType } from "./def-std-types.js";
import { TypeRegistry } from "./typeregistry.js";
import { builtInSym, builtInType, callableType, createTypeInfo } from "./typing.js";

export const EventType = builtInType("event", true);
export const ColorType = builtInType("color", true);
export const ListenableType = builtInType("listenable", true);
export const ElementType = builtInType("element", true);
export const CanvasType = builtInType("canvas", true);
export const WindowType = builtInType("window", true);

export function defineWebAPI(reg: TypeRegistry) {
    const ObjectTypeInfo = reg.typeInfo(ObjectType);
    reg.setSymType(builtInSym("ebkeycodearrowdown"), StringNotNull);
    reg.setSymType(builtInSym("ebkeycodearrowup"), StringNotNull);
    reg.setSymType(builtInSym("ebkeycodearrowleft"), StringNotNull);
    reg.setSymType(builtInSym("ebkeycodearrowright"), StringNotNull);
    
    reg.setSymType(builtInSym("ebeventclick"), StringNotNull);
    reg.setSymType(builtInSym("ebeventkeydown"), StringNotNull);
    
    reg.setSymType({ kind: "%", name: "window" }, WindowType);
    
    reg.setSymType(builtInSym("alert"), callableType([StringType, NullType]));
    reg.setSymType(builtInSym("refreshpage"), callableType([NullType]));
    
    reg.setSymType(builtInSym("queryunique"), callableType([StringNotNull, ElementType]));
    reg.setSymType(builtInSym("query"), callableType([StringNotNull, { 
        sym: ArrayType.sym, nullable: false, params: [ElementType]
    }]));
    reg.setTypeInfo(EventType, createTypeInfo("Event", EventType, ObjectTypeInfo, [
        { name: "StopPropagation", params: [], ret: NullType },
        { name: "Code", params: [], ret: StringNotNull },
    ]));
    reg.setTypeInfo(ColorType, createTypeInfo("Color", ColorType, ObjectTypeInfo, [
        { name: "R", params: [], ret: NumberNotNull },
        { name: "G", params: [], ret: NumberNotNull },
        { name: "B", params: [], ret: NumberNotNull },
    ]));
    const ListenableTypeInfo = reg.setTypeInfo(ListenableType, createTypeInfo("Listenable", ListenableType, ObjectTypeInfo, [
        {
            name: "On", 
            params: [StringNotNull, { sym: builtInSym("func"), nullable: true, params: [ListenableType, NullType] }], 
            ret: NullType
        },
    ]));
    const ElementTypeInfo = reg.setTypeInfo(ElementType, createTypeInfo("Element", ElementType, ListenableTypeInfo, [
        { name: "CreateChild", params: [StringType], ret: ElementType },
        { name: "SetStyle", params: [StringType, ObjectType], ret: ElementType },
        { name: "SetText", params: [StringType], ret: ElementType },
    ]));
    reg.setTypeInfo(CanvasType, createTypeInfo("Canvas", CanvasType, ElementTypeInfo, [
        { name: "Resize", params: [NumberNotNull, NumberNotNull], ret: CanvasType },
        { name: "Clear", params: [ColorType], ret: CanvasType },
        { name: "SetDrawColor", params: [ColorType], ret: CanvasType },
        { name: "DrawRect", params: [NumberNotNull, NumberNotNull, NumberNotNull, NumberNotNull], ret: CanvasType },
        { name: "Repaint", params: [], ret: CanvasType },
    ]));
    reg.setTypeInfo(WindowType, createTypeInfo("Window", WindowType, ListenableTypeInfo, [
        {
            name: "EachFrame", 
            params: [
                { 
                    sym: builtInSym("func"), nullable: true, params: [NumberNotNull, NullType]
                }
            ], ret: NullType
        },
    ]));
}