const { run, silent } = require('./index');

run('yarn workspace @gatsby-tv/types run build');
run('yarn run ttsc');
silent('yarn run tscpaths -p tsconfig.json -s src -o dist');
