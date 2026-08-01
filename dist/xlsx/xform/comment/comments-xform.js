"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const xml_stream_1 = __importDefault(require("../../../utils/xml-stream"));
const utils_1 = __importDefault(require("../../../utils/utils"));
const base_xform_1 = __importDefault(require("../base-xform"));
const comment_xform_1 = __importDefault(require("./comment-xform"));
const CommentsXform = function () {
    this.map = {
        comment: new comment_xform_1.default(),
    };
};
exports.default = CommentsXform;
utils_1.default.inherits(CommentsXform, base_xform_1.default, {
    COMMENTS_ATTRIBUTES: {
        xmlns: 'http://schemas.openxmlformats.org/spreadsheetml/2006/main',
    },
}, {
    render(xmlStream, model) {
        model = model || this.model;
        xmlStream.openXml(xml_stream_1.default.StdDocAttributes);
        xmlStream.openNode('comments', CommentsXform.COMMENTS_ATTRIBUTES);
        // authors
        // TODO: support authors properly
        xmlStream.openNode('authors');
        xmlStream.leafNode('author', null, 'Author');
        xmlStream.closeNode();
        // comments
        xmlStream.openNode('commentList');
        model.comments.forEach((comment) => {
            this.map.comment.render(xmlStream, comment);
        });
        xmlStream.closeNode();
        xmlStream.closeNode();
    },
    parseOpen(node) {
        if (this.parser) {
            this.parser.parseOpen(node);
            return true;
        }
        switch (node.name) {
            case 'commentList':
                this.model = {
                    comments: [],
                };
                return true;
            case 'comment':
                this.parser = this.map.comment;
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
            case 'commentList':
                return false;
            case 'comment':
                this.model.comments.push(this.parser.model);
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
