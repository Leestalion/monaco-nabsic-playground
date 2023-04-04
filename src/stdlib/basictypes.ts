export type NabsicBool = boolean | undefined;
export type NabsicNumber = number | undefined;
export type NabsicHashable = number | string;
export type NabsicLambda<Args extends unknown, R> = {
    invoke(...args: readonly Args[]): R;
};
export type NabsicObject = {
    equals(obj:NabsicAny):boolean;
    serializetojson():string;
    gettypename(): string;
};
export type NabsicAny = number | boolean | undefined | string | NabsicObject;