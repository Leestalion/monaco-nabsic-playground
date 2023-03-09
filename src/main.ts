import './style.css';
import { monaco } from './mona/customMonaco';
 
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


function membersForVar(nabsicString: string, variable: string) : string[] 
{
  return ["yoda", "chewbacca"];
}

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

    wordArraySuggestions.forEach(word => {
      suggestions.push({
        label: word,
        kind: monaco.languages.CompletionItemKind.Method,
        insertText: prevWord.word + "!"+word,
        range: range,
      });
    });

    return { suggestions };
  }
});

monaco.languages.setMonarchTokensProvider('nsharp', {
  ignoreCase: true,
  keywords: ["dim", "class", "public", "private", "if", "case", "for", "foreach", "while", "break", "continue"],
  typeKeywords: [
    'boolean', 'number', 'string', 'dictionary', 'cache', 'form', 'recordset', 'tuple', 'array'
  ],
  builtins: ["debugprint"],
  tokenizer: {
    root: [
      [/[a-z][\w]*#/, 'constant'],
      [/([+\-*\/\^&:]:=|=|<|<=|>|>=|=>)/, 'operators'],
      [ /[a-z][\w]*[@$%]?/, {
        cases: {
          '@keywords': 'keyword',
          '@default': 'variable',
          '@builtins': 'predefined',
        }
      } ],
      [/[0-9]+[.]?[0-9]*/, 'number.float'],
      [/".*?"/, 'string'],
      [/'.*?$/, 'comment']
    ]
  }
});

monaco.editor.create(document.querySelector<HTMLDivElement>('#editor')!, {
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