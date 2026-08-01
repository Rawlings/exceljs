import { createRequire } from "module";

const require = createRequire(import.meta.url);

global.verquire = require("../utils/verquire.js");
