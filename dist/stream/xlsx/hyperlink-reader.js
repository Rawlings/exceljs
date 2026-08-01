"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
const parse_sax_1 = __importDefault(require("../../utils/parse-sax"));
const enums_1 = __importDefault(require("../../doc/enums"));
const rel_type_1 = __importDefault(require("../../xlsx/rel-type"));
class HyperlinkReader extends events_1.EventEmitter {
    workbook;
    id;
    iterator;
    options;
    hyperlinks;
    constructor({ workbook, id, iterator, options } = {}) {
        super();
        this.workbook = workbook;
        this.id = id;
        this.iterator = iterator;
        this.options = options;
    }
    get count() {
        return (this.hyperlinks && this.hyperlinks.length) || 0;
    }
    each(fn) {
        return this.hyperlinks.forEach(fn);
    }
    async read() {
        const { iterator, options } = this;
        let emitHyperlinks = false;
        let hyperlinks = null;
        switch (options.hyperlinks) {
            case 'emit':
                emitHyperlinks = true;
                break;
            case 'cache':
                this.hyperlinks = hyperlinks = {};
                break;
            default:
                break;
        }
        if (!emitHyperlinks && !hyperlinks) {
            this.emit('finished');
            return;
        }
        try {
            for await (const events of (0, parse_sax_1.default)(iterator)) {
                for (const { eventType, value } of events) {
                    if (eventType === 'opentag') {
                        const node = value;
                        if (node.name === 'Relationship') {
                            const rId = node.attributes.Id;
                            switch (node.attributes.Type) {
                                case rel_type_1.default.Hyperlink:
                                    {
                                        const relationship = {
                                            type: enums_1.default.RelationshipType.Styles,
                                            rId,
                                            target: node.attributes.Target,
                                            targetMode: node.attributes.TargetMode,
                                        };
                                        if (emitHyperlinks) {
                                            this.emit('hyperlink', relationship);
                                        }
                                        else {
                                            hyperlinks[relationship.rId] = relationship;
                                        }
                                    }
                                    break;
                                default:
                                    break;
                            }
                        }
                    }
                }
            }
            this.emit('finished');
        }
        catch (error) {
            this.emit('error', error);
        }
    }
}
exports.default = HyperlinkReader;
