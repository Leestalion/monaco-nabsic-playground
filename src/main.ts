import './style.css';
import { monaco } from './mona/customMonaco';
import init, { javascriptFromBasic, membersForVar } from "../pkg/basic_lang.js";

const langConfig: monaco.languages.LanguageConfiguration = {
  wordPattern: /(-?\d*\.\d\w*@?#?%?)|([^\`\~\!\^\&\*\(\)\-\=\+\[\{\]\}\\\|\;\:\'\"\,\.\<\>\/\?\s]+)/g,
  "comments": {
      // symbol used for single line comment. Remove this entry if your language does not support line comments
      "lineComment": "'"
  },
  // symbols used as brackets
  "brackets": [
      ["{", "}"],
      ["[", "]"],
      ["(", ")"]
  ],
  // symbols that are auto closed when typing
  "autoClosingPairs": [
		{ open: '{', close: '}' },
		{ open: '[', close: ']' },
		{ open: '(', close: ')' },
		{ open: '"', close: '"', notIn: ['string'] },
  ],
  // symbols that can be used to surround a selection
  "surroundingPairs": [
		{ open: '{', close: '}' },
		{ open: '[', close: ']' },
		{ open: '(', close: ')' },
		{ open: '"', close: '"' },
  ]
};

monaco.languages.register({ 
  id: 'nsharp',
  aliases: [
    "NSharp",
    "nsharp"
  ],
  extensions: [
    "nab"
  ],
});

monaco.languages.setLanguageConfiguration('nsharp', langConfig);

monaco.languages.registerCompletionItemProvider('nsharp', {
  triggerCharacters: ['.'],
  provideCompletionItems(model, position, context, token) {
    if (context.triggerCharacter !== '.') {
      return { suggestions: [] };
    }
    const word = model.getWordUntilPosition(position);
    const prevWord = model.getWordUntilPosition({ lineNumber: position.lineNumber, column: position.column - 1 });
    const wordArraySuggestions = membersForVar(model.getValue(), prevWord.word);

    const range = {
      startLineNumber: position.lineNumber,
      endLineNumber: position.lineNumber,
      startColumn: word.startColumn,
      endColumn: word.endColumn
    }
    const suggestions: monaco.languages.CompletionItem[] = [];

    wordArraySuggestions.forEach((word: string) => {
      suggestions.push({
        label: word,
        kind: monaco.languages.CompletionItemKind.Method,
        insertText: word,
        range: range,
      });
    });

    return { suggestions };
  }
});

monaco.languages.setMonarchTokensProvider('nsharp', {
  ignoreCase: true,
  keywords: ["dim", "new", "as", "class", "public", "private", "if", "case", "for", "foreach", "while", "break", "continue"],
  typeKeywords: [
    'boolean', 'number', 'string', 'dictionary', 'cache', 'form', 'recordset', 'tuple', 'array'
  ],
  builtins: ["debugprint"],
  tokenizer: {
    root: [
      [/[a-z][\w]*[#%]/, 'constant'],
      [/([+\-*\/\^&:]:=|=|<|<=|>|>=|=>)/, 'operators'],
      [/[a-z][\w]*[@$%]/, 'identifier'],
      [ /[a-z][\w]*/, {
        cases: {
          '@keywords': 'keyword',
          '@builtins': 'variable.other',
          '@default': 'variable.other',
        }
      } ],
      [/[0-9]+[.]?[0-9]*/, 'number.float'],
      [/".*?"/, 'string'],
      [/'.*?$/, 'comment']
    ]
  }
});

const editor = monaco.editor.create(document.querySelector<HTMLDivElement>('#editor')!, {
  wordSeparators: `~!^&*()-=+[{]}\|;:'",.<>/?`,
  theme: "vs-dark",
  value: `Dim factorial@ := (n@ Number+) => (
    Dim fac@ := 1:
    For(n@,
        fac@ := fac@ * Inc%
    ):
    fac@
):

Dim range@ := New Array<Number+>():
For(5,
    range@.Append(Inc%)
):

Dim results@ := range@.Select((n@) => (factorial@.Invoke(n@))):

ForEach(results@,
    DebugPrint("factorial(" & Key% & ") -> " & Val%)
)`,
  language: 'nsharp',
});

const out = document.getElementById("out") as HTMLTextAreaElement;
const err = document.getElementById("errors") as HTMLTextAreaElement;
const errConsole = document.getElementById("err-console") as HTMLTextAreaElement;
const execBtn = document.getElementById("exec-btn") as HTMLButtonElement;
const clearBtn = document.getElementById("clear") as HTMLButtonElement;
const closeErrBtn = document.getElementById("close-errors") as HTMLButtonElement;


(window as any).$nab = (window as any).$nab ?? {};
(window as any).$nab.log = (s: string) => {
  if (out)
  out.value += s + "\n";
}

function exec() {
    const input = editor.getModel()?.getValue() ?? "";
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
        }
    }
}

async function run() {
    await init();
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
    });
}
run();