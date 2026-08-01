"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
// =============================================================================
// AutoDrain - kind of /dev/null
class AutoDrain extends events_1.EventEmitter {
    write(chunk) {
        this.emit('data', chunk);
    }
    end() {
        this.emit('end');
    }
}
exports.default = AutoDrain;
