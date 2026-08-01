declare const _: any;
declare const utils: any;
declare const OPEN_ANGLE = "<";
declare const CLOSE_ANGLE = ">";
declare const OPEN_ANGLE_SLASH = "</";
declare const CLOSE_SLASH_ANGLE = "/>";
declare function pushAttribute(xml: any, name: any, value: any): void;
declare function pushAttributes(xml: any, attributes: any): void;
declare class XmlStream {
    constructor();
    get tos(): any;
    get cursor(): any;
    openXml(docAttributes: any): void;
    openNode(name: any, attributes: any): void;
    addAttribute(name: any, value: any): void;
    addAttributes(attrs: any): void;
    writeText(text: any): void;
    writeXml(xml: any): void;
    closeNode(): void;
    leafNode(name: any, attributes: any, text: any): void;
    closeAll(): void;
    addRollback(): any;
    commit(): void;
    rollback(): void;
    get xml(): any;
}
