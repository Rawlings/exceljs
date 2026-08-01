"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const rich_text_xform_1 = __importDefault(require("../strings/rich-text-xform"));
const utils_1 = __importDefault(require("../../../utils/utils"));
const base_xform_1 = __importDefault(require("../base-xform"));
/**
  <comment ref="B1" authorId="0">
    <text>
      <r>
        <rPr>
          <b/>
          <sz val="9"/>
          <rFont val="宋体"/>
          <charset val="134"/>
        </rPr>
        <t>51422:</t>
      </r>
      <r>
        <rPr>
          <sz val="9"/>
          <rFont val="宋体"/>
          <charset val="134"/>
        </rPr>
        <t xml:space="preserve">&#10;test</t>
      </r>
    </text>
  </comment>
 */
const CommentXform = function (model) {
    this.model = model;
};
exports.default = CommentXform;
utils_1.default.inherits(CommentXform, base_xform_1.default, {
    get tag() {
        return 'r';
    },
    get richTextXform() {
        if (!this._richTextXform) {
            this._richTextXform = new rich_text_xform_1.default();
        }
        return this._richTextXform;
    },
    render(xmlStream, model) {
        model = model || this.model;
        xmlStream.openNode('comment', {
            ref: model.ref,
            authorId: 0,
        });
        xmlStream.openNode('text');
        if (model && model.note && model.note.texts) {
            model.note.texts.forEach((text) => {
                this.richTextXform.render(xmlStream, text);
            });
        }
        xmlStream.closeNode();
        xmlStream.closeNode();
    },
    parseOpen(node) {
        if (this.parser) {
            this.parser.parseOpen(node);
            return true;
        }
        switch (node.name) {
            case 'comment':
                this.model = {
                    type: 'note',
                    note: {
                        texts: [],
                    },
                    ...node.attributes,
                };
                return true;
            case 'r':
                this.parser = this.richTextXform;
                this.parser.parseOpen(node);
                return true;
            default:
                return false;
        }
    },
    parseText(text) {
        if (this.parser) {
            this.parser.parseText(text);
        }
    },
    parseClose(name) {
        switch (name) {
            case 'comment':
                return false;
            case 'r':
                this.model.note.texts.push(this.parser.model);
                this.parser = undefined;
                return true;
            default:
                if (this.parser) {
                    this.parser.parseClose(name);
                }
                return true;
        }
    },
});
