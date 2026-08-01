"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Note = void 0;
const under_dash_1 = __importDefault(require("../utils/under-dash"));
class Note {
    static DEFAULT_CONFIGS = {
        note: {
            margins: {
                insetmode: 'auto',
                inset: [0.13, 0.13, 0.25, 0.25],
            },
            protection: {
                locked: 'True',
                lockText: 'True',
            },
            editAs: 'absolute',
        },
    };
    note;
    constructor(note) {
        this.note = note;
    }
    get model() {
        let value = null;
        switch (typeof this.note) {
            case 'string':
                value = {
                    type: 'note',
                    note: {
                        texts: [
                            {
                                text: this.note,
                            },
                        ],
                    },
                };
                break;
            default:
                value = {
                    type: 'note',
                    note: this.note,
                };
                break;
        }
        // Suitable for all cell comments
        return under_dash_1.default.deepMerge({}, Note.DEFAULT_CONFIGS, value);
    }
    set model(value) {
        const { note } = value;
        const { texts } = note;
        if (texts && texts.length === 1 && Object.keys(texts[0]).length === 1) {
            this.note = texts[0].text;
        }
        else {
            this.note = note;
        }
    }
    static fromModel(model) {
        const note = new Note();
        note.model = model;
        return note;
    }
}
exports.Note = Note;
exports.default = Note;
