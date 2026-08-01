"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const under_dash_1 = __importDefault(require("../../../utils/under-dash"));
const col_cache_1 = __importDefault(require("../../../utils/col-cache"));
const xml_stream_1 = __importDefault(require("../../../utils/xml-stream"));
const rel_type_1 = __importDefault(require("../../rel-type"));
const merges_1 = __importDefault(require("./merges"));
const base_xform_1 = __importDefault(require("../base-xform"));
const list_xform_1 = __importDefault(require("../list-xform"));
const row_xform_1 = __importDefault(require("./row-xform"));
const col_xform_1 = __importDefault(require("./col-xform"));
const dimension_xform_1 = __importDefault(require("./dimension-xform"));
const hyperlink_xform_1 = __importDefault(require("./hyperlink-xform"));
const merge_cell_xform_1 = __importDefault(require("./merge-cell-xform"));
const data_validations_xform_1 = __importDefault(require("./data-validations-xform"));
const sheet_properties_xform_1 = __importDefault(require("./sheet-properties-xform"));
const sheet_format_properties_xform_1 = __importDefault(require("./sheet-format-properties-xform"));
const sheet_view_xform_1 = __importDefault(require("./sheet-view-xform"));
const sheet_protection_xform_1 = __importDefault(require("./sheet-protection-xform"));
const page_margins_xform_1 = __importDefault(require("./page-margins-xform"));
const page_setup_xform_1 = __importDefault(require("./page-setup-xform"));
const print_options_xform_1 = __importDefault(require("./print-options-xform"));
const auto_filter_xform_1 = __importDefault(require("./auto-filter-xform"));
const picture_xform_1 = __importDefault(require("./picture-xform"));
const drawing_xform_1 = __importDefault(require("./drawing-xform"));
const table_part_xform_1 = __importDefault(require("./table-part-xform"));
const row_breaks_xform_1 = __importDefault(require("./row-breaks-xform"));
const header_footer_xform_1 = __importDefault(require("./header-footer-xform"));
const conditional_formattings_xform_1 = __importDefault(require("./cf/conditional-formattings-xform"));
const ext_lst_xform_1 = __importDefault(require("./ext-lst-xform"));
const mergeRule = (rule, extRule) => {
    Object.keys(extRule).forEach((key) => {
        const value = rule[key];
        const extValue = extRule[key];
        if (value === undefined && extValue !== undefined) {
            rule[key] = extValue;
        }
    });
};
const mergeConditionalFormattings = (model, extModel) => {
    // conditional formattings are rendered in worksheet.conditionalFormatting and also in
    // worksheet.extLst.ext.x14:conditionalFormattings
    // some (e.g. dataBar) are even spread across both!
    if (!extModel || !extModel.length) {
        return model;
    }
    if (!model || !model.length) {
        return extModel;
    }
    // index model rules by x14Id
    const cfMap = {};
    const ruleMap = {};
    model.forEach((cf) => {
        cfMap[cf.ref] = cf;
        cf.rules.forEach((rule) => {
            const { x14Id } = rule;
            if (x14Id) {
                ruleMap[x14Id] = rule;
            }
        });
    });
    extModel.forEach((extCf) => {
        extCf.rules.forEach((extRule) => {
            const rule = ruleMap[extRule.x14Id];
            if (rule) {
                // merge with matching rule
                mergeRule(rule, extRule);
            }
            else if (cfMap[extCf.ref]) {
                // reuse existing cf ref
                cfMap[extCf.ref].rules.push(extRule);
            }
            else {
                // create new cf
                model.push({
                    ref: extCf.ref,
                    rules: [extRule],
                });
            }
        });
    });
    // need to cope with rules in extModel that don't exist in model
    return model;
};
class WorkSheetXform extends base_xform_1.default {
    constructor(options) {
        super();
        const { maxRows, maxCols, ignoreNodes } = options || {};
        this.ignoreNodes = ignoreNodes || [];
        this.map = {
            sheetPr: new sheet_properties_xform_1.default(),
            dimension: new dimension_xform_1.default(),
            sheetViews: new list_xform_1.default({
                tag: 'sheetViews',
                count: false,
                childXform: new sheet_view_xform_1.default(),
            }),
            sheetFormatPr: new sheet_format_properties_xform_1.default(),
            cols: new list_xform_1.default({ tag: 'cols', count: false, childXform: new col_xform_1.default() }),
            sheetData: new list_xform_1.default({
                tag: 'sheetData',
                count: false,
                empty: true,
                childXform: new row_xform_1.default({ maxItems: maxCols }),
                maxItems: maxRows,
            }),
            autoFilter: new auto_filter_xform_1.default(),
            mergeCells: new list_xform_1.default({
                tag: 'mergeCells',
                count: true,
                childXform: new merge_cell_xform_1.default(),
            }),
            rowBreaks: new row_breaks_xform_1.default(),
            hyperlinks: new list_xform_1.default({
                tag: 'hyperlinks',
                count: false,
                childXform: new hyperlink_xform_1.default(),
            }),
            pageMargins: new page_margins_xform_1.default(),
            dataValidations: new data_validations_xform_1.default(),
            pageSetup: new page_setup_xform_1.default(),
            headerFooter: new header_footer_xform_1.default(),
            printOptions: new print_options_xform_1.default(),
            picture: new picture_xform_1.default(),
            drawing: new drawing_xform_1.default(),
            sheetProtection: new sheet_protection_xform_1.default(),
            tableParts: new list_xform_1.default({
                tag: 'tableParts',
                count: true,
                childXform: new table_part_xform_1.default(),
            }),
            conditionalFormatting: new conditional_formattings_xform_1.default(),
            extLst: new ext_lst_xform_1.default(),
        };
    }
    prepare(model, options) {
        options.merges = new merges_1.default();
        model.hyperlinks = options.hyperlinks = [];
        model.comments = options.comments = [];
        options.formulae = {};
        options.siFormulae = 0;
        this.map.cols.prepare(model.cols, options);
        this.map.sheetData.prepare(model.rows, options);
        this.map.conditionalFormatting.prepare(model.conditionalFormattings, options);
        model.mergeCells = options.merges.mergeCells;
        // prepare relationships
        const rels = (model.rels = []);
        function nextRid(r) {
            return `rId${r.length + 1}`;
        }
        model.hyperlinks.forEach((hyperlink) => {
            const rId = nextRid(rels);
            hyperlink.rId = rId;
            rels.push({
                Id: rId,
                Type: rel_type_1.default.Hyperlink,
                Target: hyperlink.target,
                TargetMode: 'External',
            });
        });
        // prepare comment relationships
        if (model.comments.length > 0) {
            const comment = {
                Id: nextRid(rels),
                Type: rel_type_1.default.Comments,
                Target: `../comments${model.id}.xml`,
            };
            rels.push(comment);
            const vmlDrawing = {
                Id: nextRid(rels),
                Type: rel_type_1.default.VmlDrawing,
                Target: `../drawings/vmlDrawing${model.id}.vml`,
            };
            rels.push(vmlDrawing);
            model.comments.forEach((item) => {
                item.refAddress = col_cache_1.default.decodeAddress(item.ref);
            });
            options.commentRefs.push({
                commentName: `comments${model.id}`,
                vmlDrawing: `vmlDrawing${model.id}`,
            });
        }
        const drawingRelsHash = [];
        let bookImage;
        model.media.forEach((medium) => {
            if (medium.type === 'background') {
                const rId = nextRid(rels);
                bookImage = options.media[medium.imageId];
                rels.push({
                    Id: rId,
                    Type: rel_type_1.default.Image,
                    Target: `../media/${bookImage.name}.${bookImage.extension}`,
                });
                model.background = {
                    rId,
                };
                model.image = options.media[medium.imageId];
            }
            else if (medium.type === 'image') {
                let { drawing } = model;
                bookImage = options.media[medium.imageId];
                if (!drawing) {
                    drawing = model.drawing = {
                        rId: nextRid(rels),
                        name: `drawing${++options.drawingsCount}`,
                        anchors: [],
                        rels: [],
                    };
                    options.drawings.push(drawing);
                    rels.push({
                        Id: drawing.rId,
                        Type: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/drawing',
                        Target: `../drawings/${drawing.name}.xml`,
                    });
                }
                let rIdImage = this.preImageId === medium.imageId
                    ? drawingRelsHash[medium.imageId]
                    : drawingRelsHash[drawing.rels.length];
                if (!rIdImage) {
                    rIdImage = nextRid(drawing.rels);
                    drawingRelsHash[drawing.rels.length] = rIdImage;
                    drawing.rels.push({
                        Id: rIdImage,
                        Type: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/image',
                        Target: `../media/${bookImage.name}.${bookImage.extension}`,
                    });
                }
                const anchor = {
                    picture: {
                        rId: rIdImage,
                    },
                    range: medium.range,
                };
                if (medium.hyperlinks && medium.hyperlinks.hyperlink) {
                    const rIdHyperLink = nextRid(drawing.rels);
                    drawingRelsHash[drawing.rels.length] = rIdHyperLink;
                    anchor.picture.hyperlinks = {
                        tooltip: medium.hyperlinks.tooltip,
                        rId: rIdHyperLink,
                    };
                    drawing.rels.push({
                        Id: rIdHyperLink,
                        Type: rel_type_1.default.Hyperlink,
                        Target: medium.hyperlinks.hyperlink,
                        TargetMode: 'External',
                    });
                }
                this.preImageId = medium.imageId;
                drawing.anchors.push(anchor);
            }
        });
        // prepare tables
        model.tables.forEach((table) => {
            // relationships
            const rId = nextRid(rels);
            table.rId = rId;
            rels.push({
                Id: rId,
                Type: rel_type_1.default.Table,
                Target: `../tables/${table.target}`,
            });
            // dynamic styles
            table.columns.forEach((column) => {
                const { style } = column;
                if (style) {
                    column.dxfId = options.styles.addDxfStyle(style);
                }
            });
        });
        // prepare pivot tables
        if ((model.pivotTables || []).length) {
            rels.push({
                Id: nextRid(rels),
                Type: rel_type_1.default.PivotTable,
                Target: '../pivotTables/pivotTable1.xml',
            });
        }
        // prepare ext items
        this.map.extLst.prepare(model, options);
    }
    render(xmlStream, model) {
        xmlStream.openXml(xml_stream_1.default.StdDocAttributes);
        xmlStream.openNode('worksheet', WorkSheetXform.WORKSHEET_ATTRIBUTES);
        const sheetFormatPropertiesModel = model.properties
            ? {
                defaultRowHeight: model.properties.defaultRowHeight,
                dyDescent: model.properties.dyDescent,
                outlineLevelCol: model.properties.outlineLevelCol,
                outlineLevelRow: model.properties.outlineLevelRow,
            }
            : undefined;
        if (model.properties && model.properties.defaultColWidth) {
            sheetFormatPropertiesModel.defaultColWidth = model.properties.defaultColWidth;
        }
        const sheetPropertiesModel = {
            outlineProperties: model.properties && model.properties.outlineProperties,
            tabColor: model.properties && model.properties.tabColor,
            pageSetup: model.pageSetup && model.pageSetup.fitToPage
                ? {
                    fitToPage: model.pageSetup.fitToPage,
                }
                : undefined,
        };
        const pageMarginsModel = model.pageSetup && model.pageSetup.margins;
        const printOptionsModel = {
            showRowColHeaders: model.pageSetup && model.pageSetup.showRowColHeaders,
            showGridLines: model.pageSetup && model.pageSetup.showGridLines,
            horizontalCentered: model.pageSetup && model.pageSetup.horizontalCentered,
            verticalCentered: model.pageSetup && model.pageSetup.verticalCentered,
        };
        const sheetProtectionModel = model.sheetProtection;
        this.map.sheetPr.render(xmlStream, sheetPropertiesModel);
        this.map.dimension.render(xmlStream, model.dimensions);
        this.map.sheetViews.render(xmlStream, model.views);
        this.map.sheetFormatPr.render(xmlStream, sheetFormatPropertiesModel);
        this.map.cols.render(xmlStream, model.cols);
        this.map.sheetData.render(xmlStream, model.rows);
        this.map.sheetProtection.render(xmlStream, sheetProtectionModel); // Note: must be after sheetData and before autoFilter
        this.map.autoFilter.render(xmlStream, model.autoFilter);
        this.map.mergeCells.render(xmlStream, model.mergeCells);
        this.map.conditionalFormatting.render(xmlStream, model.conditionalFormattings); // Note: must be before dataValidations
        this.map.dataValidations.render(xmlStream, model.dataValidations);
        // For some reason hyperlinks have to be after the data validations
        this.map.hyperlinks.render(xmlStream, model.hyperlinks);
        this.map.printOptions.render(xmlStream, printOptionsModel); // Note: must be before pageMargins
        this.map.pageMargins.render(xmlStream, pageMarginsModel);
        this.map.pageSetup.render(xmlStream, model.pageSetup);
        this.map.headerFooter.render(xmlStream, model.headerFooter);
        this.map.rowBreaks.render(xmlStream, model.rowBreaks);
        this.map.drawing.render(xmlStream, model.drawing); // Note: must be after rowBreaks
        this.map.picture.render(xmlStream, model.background); // Note: must be after drawing
        this.map.tableParts.render(xmlStream, model.tables);
        this.map.extLst.render(xmlStream, model);
        if (model.rels) {
            // add a <legacyDrawing /> node for each comment
            model.rels.forEach((rel) => {
                if (rel.Type === rel_type_1.default.VmlDrawing) {
                    xmlStream.leafNode('legacyDrawing', { 'r:id': rel.Id });
                }
            });
        }
        xmlStream.closeNode();
    }
    parseOpen(node) {
        if (this.parser) {
            this.parser.parseOpen(node);
            return true;
        }
        if (node.name === 'worksheet') {
            under_dash_1.default.each(this.map, (xform) => {
                xform.reset();
            });
            return true;
        }
        if (this.map[node.name] && !this.ignoreNodes.includes(node.name)) {
            this.parser = this.map[node.name];
            this.parser.parseOpen(node);
        }
        return true;
    }
    parseText(text) {
        if (this.parser) {
            this.parser.parseText(text);
        }
    }
    parseClose(name) {
        if (this.parser) {
            if (!this.parser.parseClose(name)) {
                this.parser = undefined;
            }
            return true;
        }
        switch (name) {
            case 'worksheet': {
                const properties = this.map.sheetFormatPr.model || {};
                if (this.map.sheetPr.model && this.map.sheetPr.model.tabColor) {
                    properties.tabColor = this.map.sheetPr.model.tabColor;
                }
                if (this.map.sheetPr.model && this.map.sheetPr.model.outlineProperties) {
                    properties.outlineProperties = this.map.sheetPr.model.outlineProperties;
                }
                const sheetProperties = {
                    fitToPage: (this.map.sheetPr.model &&
                        this.map.sheetPr.model.pageSetup &&
                        this.map.sheetPr.model.pageSetup.fitToPage) ||
                        false,
                    margins: this.map.pageMargins.model,
                };
                const pageSetup = Object.assign(sheetProperties, this.map.pageSetup.model, this.map.printOptions.model);
                const conditionalFormattings = mergeConditionalFormattings(this.map.conditionalFormatting.model, this.map.extLst.model && this.map.extLst.model['x14:conditionalFormattings']);
                this.model = {
                    dimensions: this.map.dimension.model,
                    cols: this.map.cols.model,
                    rows: this.map.sheetData.model,
                    mergeCells: this.map.mergeCells.model,
                    hyperlinks: this.map.hyperlinks.model,
                    dataValidations: this.map.dataValidations.model,
                    properties,
                    views: this.map.sheetViews.model,
                    pageSetup,
                    headerFooter: this.map.headerFooter.model,
                    background: this.map.picture.model,
                    drawing: this.map.drawing.model,
                    tables: this.map.tableParts.model,
                    conditionalFormattings,
                };
                if (this.map.autoFilter.model) {
                    this.model.autoFilter = this.map.autoFilter.model;
                }
                if (this.map.sheetProtection.model) {
                    this.model.sheetProtection = this.map.sheetProtection.model;
                }
                return false;
            }
            default:
                // not quite sure how we get here!
                return true;
        }
    }
    reconcile(model, options) {
        // options.merges = new Merges();
        // options.merges.reconcile(model.mergeCells, model.rows);
        const rels = (model.relationships || []).reduce((h, rel) => {
            h[rel.Id] = rel;
            if (rel.Type === rel_type_1.default.Comments) {
                model.comments = options.comments[rel.Target].comments;
            }
            if (rel.Type === rel_type_1.default.VmlDrawing && model.comments && model.comments.length) {
                const vmlComment = options.vmlDrawings[rel.Target].comments;
                model.comments.forEach((comment, index) => {
                    comment.note = Object.assign({}, comment.note, vmlComment[index]);
                });
            }
            return h;
        }, {});
        options.commentsMap = (model.comments || []).reduce((h, comment) => {
            if (comment.ref) {
                h[comment.ref] = comment;
            }
            return h;
        }, {});
        options.hyperlinkMap = (model.hyperlinks || []).reduce((h, hyperlink) => {
            if (hyperlink.rId) {
                h[hyperlink.address] = rels[hyperlink.rId].Target;
            }
            return h;
        }, {});
        options.formulae = {};
        // compact the rows and cells
        model.rows = (model.rows && model.rows.filter(Boolean)) || [];
        model.rows.forEach((row) => {
            row.cells = (row.cells && row.cells.filter(Boolean)) || [];
        });
        this.map.cols.reconcile(model.cols, options);
        this.map.sheetData.reconcile(model.rows, options);
        this.map.conditionalFormatting.reconcile(model.conditionalFormattings, options);
        model.media = [];
        if (model.drawing) {
            const drawingRel = rels[model.drawing.rId];
            const match = drawingRel.Target.match(/\/drawings\/([a-zA-Z0-9]+)[.][a-zA-Z]{3,4}$/);
            if (match) {
                const drawingName = match[1];
                const drawing = options.drawings[drawingName];
                drawing.anchors.forEach((anchor) => {
                    if (anchor.medium) {
                        const image = {
                            type: 'image',
                            imageId: anchor.medium.index,
                            range: anchor.range,
                            hyperlinks: anchor.picture.hyperlinks,
                        };
                        model.media.push(image);
                    }
                });
            }
        }
        const backgroundRel = model.background && rels[model.background.rId];
        if (backgroundRel) {
            const target = backgroundRel.Target.split('/media/')[1];
            const imageId = options.mediaIndex && options.mediaIndex[target];
            if (imageId !== undefined) {
                model.media.push({
                    type: 'background',
                    imageId,
                });
            }
        }
        model.tables = (model.tables || []).map((tablePart) => {
            const rel = rels[tablePart.rId];
            return options.tables[rel.Target];
        });
        delete model.relationships;
        delete model.hyperlinks;
        delete model.comments;
    }
}
WorkSheetXform.WORKSHEET_ATTRIBUTES = {
    xmlns: 'http://schemas.openxmlformats.org/spreadsheetml/2006/main',
    'xmlns:r': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships',
    'xmlns:mc': 'http://schemas.openxmlformats.org/markup-compatibility/2006',
    'mc:Ignorable': 'x14ac',
    'xmlns:x14ac': 'http://schemas.microsoft.com/office/spreadsheetml/2009/9/ac',
};
exports.default = WorkSheetXform;
