const { run, silent } = require("./index");
run('rm -rf dist');
run("yarn format");
run("yarn run tsc -p tsconfig.json --emitDeclarationOnly");
silent("yarn run tscpaths -p tsconfig.json -s lib -o dist");
run(
  'yarn run babel lib --out-dir dist --extensions ".ts" --source-maps inline'
);
