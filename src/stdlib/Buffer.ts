export default class Buffer {
    #value = ""

    gettypename() { return "Buffer"; }
    write(s: string) {
        this.#value += s;
    }

    getvalue() { this.#value; }
};