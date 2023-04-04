import "./style.css";
import { monaco } from "./editor/customMonaco";
// @ts-ignore
import sampleCode from "./editor/samplecode.nab";
import { completionProvider, langConfig, langDef, tokensProvider, wordSeparators } from "./editor/nabsic";
import { javascriptFromBasic } from "./compiler/src/mod";


monaco.languages.register(langDef);
monaco.languages.setLanguageConfiguration('nsharp', langConfig);
monaco.languages.setMonarchTokensProvider('nsharp', tokensProvider);
monaco.languages.registerCompletionItemProvider('nsharp', completionProvider);

const urlParams = new URLSearchParams(window.location.search);

const value = urlParams.get("code") ?? window.localStorage.getItem("saved-code") ?? sampleCode;

const editor = monaco.editor.create(document.querySelector<HTMLDivElement>('#editor')!, {
    wordSeparators,
    theme: window.localStorage.getItem("theme") ?? "vs",
    value,
    language: 'nsharp',
});

const out = document.getElementById("out") as HTMLTextAreaElement;
const doc = document.getElementById("doc") as HTMLDivElement;
const err = document.getElementById("errors") as HTMLTextAreaElement;
const errConsole = document.getElementById("err-console") as HTMLTextAreaElement;
const execBtn = document.getElementById("exec-btn") as HTMLButtonElement;
const clearBtn = document.getElementById("clear") as HTMLButtonElement;
const closeErrBtn = document.getElementById("close-errors") as HTMLButtonElement;
const themeSwitchBtn = document.getElementById("theme-switch") as HTMLInputElement;
const graphicsSwitchBtn = document.getElementById("graphic-switch") as HTMLInputElement;
const shareBtn = document.getElementById("share") as HTMLButtonElement;
const saveBtn = document.getElementById("save") as HTMLButtonElement;

const darkModeText = document.querySelector<HTMLLabelElement>('.dark-mode-text');
const themeSwitch = document.querySelector<HTMLLabelElement>('.switch');
if (themeSwitch != null && darkModeText != null) {
    themeSwitch.addEventListener('click', (e: Event) => switchCurrentTheme(e));
}

const graphicsSwitch = document.querySelector<HTMLLabelElement>('#graphics-switcher');
if (graphicsSwitch != null) {
    graphicsSwitch.addEventListener('click', (e: Event) => switchGraphicsMode(e));
}

if (shareBtn != null) {
    shareBtn.addEventListener('click', (e: Event) => copyToClipBoard(e));
}

if (shareBtn != null) {
    shareBtn.addEventListener('mouseout', (e: Event) => outFunction(e));
}

if (saveBtn != null) {
    saveBtn.addEventListener('click', (e: Event) => saveCode(e));
}

if (window.localStorage.getItem('graphics-mode') === 'canvas') {
    setGraphicsMode(true);
    graphicsSwitchBtn.checked = true;
}

if (window.localStorage.getItem('theme') === 'vs-dark') {
    setSwitchCurrentTheme(true);
    themeSwitchBtn.checked = true;
}

function setSwitchCurrentTheme(dark: boolean) {
    if (dark) {
        monaco.editor.setTheme('vs-dark');
        window.localStorage.setItem('theme', 'vs-dark');
        if (darkModeText) darkModeText.innerHTML = "Dark Mode&nbsp;";
    } else {
        monaco.editor.setTheme('vs');
        window.localStorage.setItem('theme', 'vs');
        if (darkModeText) darkModeText.innerHTML = "Light Mode&nbsp;";
    }
}

function switchCurrentTheme(e: any) {
    if (e.target.checked != null) {
        setSwitchCurrentTheme(e.target.checked);
    }
}

function setGraphicsMode(enable: boolean) {
    if (enable) {
        window.localStorage.setItem('graphics-mode', 'canvas');
        out.classList.add("hidden");
        doc.classList.remove("hidden");
    } else {
        window.localStorage.setItem('graphics-mode', 'console');
        doc.classList.add("hidden");
        out.classList.remove("hidden");
    }
}

function switchGraphicsMode(e: any) {
    if (e.target.checked != null) {
        setGraphicsMode(e.target.checked);
    }
}

function copyToClipBoard(_e: any) {
    const tooltip = document.getElementById("tooltip");
    const sharedLink = new URL(window.location.href);
    sharedLink.searchParams.set('code', editor.getModel()?.getValue() ?? "");

    navigator.clipboard.writeText(sharedLink.href);
    if (tooltip != null) {
        tooltip.innerHTML = "Copied !";
    }
}

function outFunction(_e: any) {
    const tooltip = document.getElementById("tooltip");
    if (tooltip != null) {
        tooltip.innerHTML = "Copy to clipboard";
    }
}

function saveCode(_e: any) {
    window.localStorage.setItem("saved-code", editor.getModel()?.getValue() ?? "");
}

(window as any).$nab = (window as any).$nab ?? {};
(window as any).$nab.log = (s: string) => {
    if (out)
        out.value += s + "\n";
}

function exec() {
    const input = editor.getModel()?.getValue() ?? "";
    err.value = "";
    try {
        const built = javascriptFromBasic(input);
        eval(built);
        if (typeof (window as any).$nab.__ans__ !== "undefined") {
            (window as any).$nab.BuiltIn.debugprint((window as any).$nab.__ans__);
        }
        errConsole.classList.add("hidden");
    } catch (e) {
        errConsole.classList.remove("hidden");
        if (typeof e === "string") {
            err.value = e;
        } else {
            throw e;
        }
    }
}

async function run() {
    document.addEventListener("keyup", function (e) {
        if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.code === "KeyX") {
            e.stopPropagation();
            exec();
        }
    });
    closeErrBtn.addEventListener("click", function () {
        errConsole.classList.add("hidden");
    });
    execBtn.addEventListener("click", function () {
        exec();
    });
    clearBtn.addEventListener("click", function () {
        out.value = "";
        doc.innerHTML = "&nbsp;";
    });
}
run();