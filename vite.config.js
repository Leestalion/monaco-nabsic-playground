import { defineConfig } from "vite";
import monacoEditorPlugin from "vite-plugin-monaco-editor";
import plainText from "vite-plugin-plain-text";


export default defineConfig({
    plugins: [
        monacoEditorPlugin.default({}),
        plainText([/\/LICENSE$/, '**/*.nab'], { namedExport: false }),
    ],
})