import { NabsicLambda } from "./basictypes";

export class Listenable {
    pElement: HTMLElement;

    constructor(e: HTMLElement) {
        this.pElement = e;
    }

    on(event: string, lambda: NabsicLambda<NabEvent, void>) {
        this.pElement.addEventListener(event, e => lambda.invoke(new NabEvent(e as any)));
        return this;
    }
}

export class NabElement extends Listenable {
    constructor(e: HTMLElement) {
        super(e);
    }

    gettypename() { return "Element"; }

    setstyle(property: string, value: string) {
        (this.pElement.style as any)[property] = value;
        return this;
    }

    settext(text: string) {
        this.pElement.textContent = text;
        return this;
    }

    createchild(tag: string) {
        const element = document.createElement(tag);
        this.pElement.appendChild(element);
        return new NabElement(element);
    }
}

export class NabEvent {
    #event
    constructor(e: Event & { clientX: number, clientY: number, code: string, target: HTMLElement }) {
        this.#event = e;
    }

    gettypename() { return "Event"; }
    target() { return new NabElement(this.#event.target); }
    clientx() { return this.#event.clientX; }
    clienty() { return this.#event.clientY; }
    code() { return this.#event.code; }
    stoppropagation() { return this.#event.stopPropagation(); }
}

export class NabWindow extends Listenable {
    constructor(e: Window) {
        super(e as unknown as HTMLElement);
    }

    gettypename() { return "Window"; }

    eachframe(lambda: NabsicLambda<number, void>) {
        let lastUpdateTimestamp = -1;
        const step = (timestamp: number) => {
            if (lastUpdateTimestamp < 0) lastUpdateTimestamp = timestamp;
            const delta = timestamp - lastUpdateTimestamp;
            lastUpdateTimestamp = timestamp;
            lambda.invoke(delta);
            window.requestAnimationFrame(step);
        };
        window.requestAnimationFrame(step);
    }
}

export class Color {
    #r; #g; #b;
    constructor(r: number, g: number, b: number) {
        this.#r = r;
        this.#g = g;
        this.#b = b;
    }

    gettypename() { return "Color"; }
    r() { return this.#r; }
    g() { return this.#g; }
    b() { return this.#b; }

    #componentToHex(c: number) {
        var hex = c.toString(16);
        return hex.length == 1 ? "0" + hex : hex;
    }

    #colorToHex(c: Color) {
        return "#" + this.#componentToHex(c.#r) + this.#componentToHex(c.#g) + this.#componentToHex(c.#b);
    }

    tohex() {
        return this.#colorToHex(this);
    }
}

export class NabCanvas extends NabElement {
    declare pElement: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;

    constructor(parent: NabElement) {
        super(document.createElement("canvas"));
        parent.pElement.appendChild(this.pElement);
        this.ctx = this.pElement.getContext("2d")!;
    }

    gettypename() { return "Canvas"; }

    resize(width: number, height: number) {
        this.pElement.width = width;
        this.pElement.height = height;
        return this;
    }

    setdrawcolor(color: Color) {
        this.ctx.fillStyle = color.tohex();
        return this;
    }

    drawrect(x: number, y: number, w: number, h: number) {
        this.ctx.fillRect(x, y, w, h);
        return this;
    }

    clear(color: Color) {
        return this.setdrawcolor(color).drawrect(0, 0, this.pElement.width, this.pElement.height);
    }

    repaint() {
        this.ctx.fill();
        return this;
    }
}