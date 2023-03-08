import { defineConfig } from 'vite'
import monacoEditorPlugin from 'vite-plugin-monaco-editor'
import path from 'node:path';

export default defineConfig({
    plugins: [
        monacoEditorPlugin.default({}),
    ],
})