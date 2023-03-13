import { generateJavaScript } from "./generatejs.js";
import { createParser } from "./parse.js";
import { createTokenStream } from "./tokenize.js";
import { createTypeChecker } from "./typechecker.js";


const input = await Deno.readTextFile(Deno.args[0]);
const tokens = createTokenStream(input);
const parser = createParser(tokens, false, false);
const checker = createTypeChecker(parser, true);
console.log(generateJavaScript(checker));
for (const err of parser.errors) {
    console.error(err);
}
for (const err of checker.errors) {
    console.dir(err, { depth: 6 });
}