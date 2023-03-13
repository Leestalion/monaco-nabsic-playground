import { BooleanNotNull, BooleanType, BufferType, DateNotNull, NullType, NumberNotNull, NumberType, ObjectType, StringType } from "./def-std-types.js";
import { TypeRegistry } from "./typeregistry.js";
import { builtInSym, callableType } from "./typing.js";


export function defineStandardFunctions(reg: TypeRegistry) {
    reg.setSymType(builtInSym("null"), NullType);
    reg.setSymType(builtInSym("true"), BooleanNotNull);
    reg.setSymType(builtInSym("false"), BooleanNotNull);
    reg.setSymType(builtInSym("ebyes"), NumberNotNull);
    reg.setSymType(builtInSym("ebno"), NumberNotNull);
    reg.setSymType({ kind: "%", name: "inc" }, NumberNotNull);
    reg.setSymType({ kind: "%", name: "inzoom" }, BooleanNotNull);
    reg.setSymType({ kind: "%", name: "interactive" }, BooleanNotNull);
    reg.setSymType(builtInSym("if"), callableType([BooleanType, ObjectType, ObjectType, ObjectType]));
    reg.setSymType(builtInSym("for"), callableType([NumberType, ObjectType, NullType]));
    reg.setSymType(builtInSym("foreach"), callableType([ObjectType, ObjectType, NullType]));
    reg.setSymType(builtInSym("while"), callableType([BooleanType, ObjectType, NullType]));
    reg.setSymType(builtInSym("case"), callableType([ObjectType]));
    reg.setSymType(builtInSym("array"), callableType([ObjectType]));
    reg.setSymType(builtInSym("return"), callableType([ObjectType, ObjectType]));
    reg.setSymType(builtInSym("break"), callableType([NullType]));
    reg.setSymType(builtInSym("continue"), callableType([NullType]));
    reg.setSymType(builtInSym("catch"), callableType([ObjectType, ObjectType, ObjectType]));
    reg.setSymType(builtInSym("error"), callableType([StringType, NullType]));
    reg.setSymType(builtInSym("continue"), callableType([NullType]));
    
    reg.setSymType(builtInSym("abs"), callableType([NumberNotNull, NumberNotNull]));
    reg.setSymType(builtInSym("log"), callableType([NumberNotNull, NumberNotNull]));
    reg.setSymType(builtInSym("exp"), callableType([NumberNotNull, NumberNotNull]));
    reg.setSymType(builtInSym("ceil"), callableType([NumberNotNull, NumberNotNull]));
    reg.setSymType(builtInSym("int"), callableType([NumberNotNull, NumberNotNull]));
    reg.setSymType(builtInSym("rnd"), callableType([NumberNotNull, NumberNotNull]));
    reg.setSymType(builtInSym("mod"), callableType([NumberNotNull, NumberNotNull, NumberNotNull]));
    reg.setSymType(builtInSym("sqr"), callableType([NumberNotNull, NumberNotNull]));
    reg.setSymType(builtInSym("cos"), callableType([NumberNotNull, NumberNotNull]));
    reg.setSymType(builtInSym("sin"), callableType([NumberNotNull, NumberNotNull]));
    reg.setSymType(builtInSym("tan"), callableType([NumberNotNull, NumberNotNull]));
    reg.setSymType(builtInSym("atan"), callableType([NumberNotNull, NumberNotNull]));
    
    reg.setSymType(builtInSym("maxof"), callableType([NumberNotNull, NumberNotNull]));
    reg.setSymType(builtInSym("minof"), callableType([NumberNotNull, NumberNotNull]));

    reg.setSymType(builtInSym("stringisnullorempty"), callableType([StringType, BooleanNotNull]));
    reg.setSymType(builtInSym("debugprint"), callableType([StringType, NullType]));
    reg.setSymType(builtInSym("now"), callableType([DateNotNull]));
    reg.setSymType(builtInSym("nowutc"), callableType([DateNotNull]));

    reg.setSymType(builtInSym("newbuffer"), callableType([BufferType]));
}