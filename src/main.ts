import './style.css';
import { monaco } from './mona/customMonaco';

const configPath = monaco.Uri.parse("./language-configuration.json");


monaco.languages.register({ 
  id: 'nsharp',
  aliases: [
    "NSharp",
    "nsharp"
  ],
  extensions: [
    "nab"
  ],
  configuration: configPath
});

monaco.languages.setMonarchTokensProvider('nsharp', {
  ignoreCase: true,
  keywords: ["dim", "class", "public", "private", "if", "case", "for", "foreach", "while", "break", "continue"],
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

monaco.editor.create(document.querySelector<HTMLDivElement>('#app')!, {
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