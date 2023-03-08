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

monaco.editor.create(document.querySelector<HTMLDivElement>('#app')!, {
  value: 'console.log("Hello, world")',
  language: 'javascript',
});