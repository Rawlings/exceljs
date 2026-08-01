declare class BaseXform {
    model: any;
    map: any;
    parser: any;
    get tag(): any;
    prepare(_model?: any, _options?: any): void;
    render(_xmlStream?: any, _model?: any): void;
    parseOpen(_node?: any): boolean | void;
    parseText(_text?: any): void;
    parseClose(_name?: any): boolean | void;
    reconcile(_model?: any, _options?: any): void;
    reset(): void;
    mergeModel(obj: any): void;
    parse(saxParser: any): Promise<any>;
    parseStream(stream: any): Promise<any>;
    get xml(): string;
    toXml(model: any): string;
    static toAttribute(value: any, dflt?: any, always?: boolean): string | undefined;
    static toStringAttribute(value: any, dflt?: any, always?: boolean): string | undefined;
    static toStringValue(attr: any, dflt?: any): any;
    static toBoolAttribute(value: any, dflt?: any, always?: boolean): string | undefined;
    static toBoolValue(attr: any, dflt?: any): boolean;
    static toIntAttribute(value: any, dflt?: any, always?: boolean): string | undefined;
    static toIntValue(attr: any, dflt?: any): number;
    static toFloatAttribute(value: any, dflt?: any, always?: boolean): string | undefined;
    static toFloatValue(attr: any, dflt?: any): number;
}
export default BaseXform;
