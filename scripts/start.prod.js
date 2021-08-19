const { run } = require("./index");

run("yarn run format");
run("yarn run build");
run("yarn cross-env NODE_ENV=production node -r dotenv-flow/config .");
