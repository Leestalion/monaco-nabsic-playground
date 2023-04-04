import { monaco } from './customMonaco';
import { membersForVar } from '../compiler/src/mod';

export const langDef = {
    id: 'nsharp',
    aliases: [
        "NSharp",
        "nsharp"
    ],
    extensions: [
        "nab"
    ],
};

export const wordSeparators = `~!^&*()-=+[{]}\|;:'",.<>/?`;

export const langConfig: monaco.languages.LanguageConfiguration = {
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

export const tokensProvider: monaco.languages.IMonarchLanguage = {
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
            [/[a-z][\w]*/, {
                cases: {
                    '@keywords': 'keyword',
                    '@builtins': 'variable.other',
                    '@default': 'variable.other',
                }
            }],
            [/[0-9]+[.]?[0-9]*/, 'number.float'],
            [/".*?"/, 'string'],
            [/'.*?$/, 'comment']
        ]
    }
}

export const completionProvider: monaco.languages.CompletionItemProvider = {
    triggerCharacters: ['.'],
    provideCompletionItems(model, position, context, _token) {
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
};