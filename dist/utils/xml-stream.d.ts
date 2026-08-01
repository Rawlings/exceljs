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
export default XmlStream;
