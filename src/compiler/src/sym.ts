export type SymKind = "@" | "$" | "#" | "%" | "£" | "μ" | "";
export type Sym = { kind: SymKind, path?: string|undefined, name: string };

export function isGlobalBuiltIn(sym: Sym): boolean {
    return sym.kind === "" && typeof sym.path === "undefined";
}

export function symToString(sym: Sym): string {
    if (typeof sym.path === "undefined") {
        return `${sym.name}${sym.kind}`;
    } else {
        return `${sym.path}!${sym.name}${sym.kind}`;
    }
}