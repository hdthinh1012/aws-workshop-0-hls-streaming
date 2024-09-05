const JSON5 = require('json5');
const tsConfigPaths = require("tsconfig-paths");
const fs = require("fs");

const tsConfigTxt = fs.readFileSync('./tsconfig.json');
const tsConfig = JSON5.parse(tsConfigTxt);
console.log(tsConfig.compilerOptions.paths);
const baseUrl = "./build"; // Either absolute or relative path. If relative it's resolved to current working directory.
const cleanup = tsConfigPaths.register({
    baseUrl,
    paths: {
        '*': ['./']
    },
});

// When path registration is no longer needed
cleanup();