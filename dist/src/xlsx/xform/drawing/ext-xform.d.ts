declare const BaseXform: any;
/** https://en.wikipedia.org/wiki/Office_Open_XML_file_formats#DrawingML */
declare const EMU_PER_PIXEL_AT_96_DPI = 9525;
declare class ExtXform extends BaseXform {
    constructor(options: any);
    render(xmlStream: any, model: any): void;
    parseOpen(node: any): boolean;
    parseText(): void;
    parseClose(): boolean;
}
