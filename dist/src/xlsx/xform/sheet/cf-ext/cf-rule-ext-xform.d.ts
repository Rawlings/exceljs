declare const crypto: any;
declare const uuidv4: () => `${string}-${string}-${string}-${string}-${string}`;
declare const BaseXform: any;
declare const CompositeXform: any;
declare const DatabarExtXform: any;
declare const IconSetExtXform: any;
declare const extIcons: {
    '3Triangles': boolean;
    '3Stars': boolean;
    '5Boxes': boolean;
};
declare class CfRuleExtXform extends CompositeXform {
    constructor();
    get tag(): string;
    static isExt(rule: any): any;
    prepare(model: any): void;
    render(xmlStream: any, model: any): void;
    renderDataBar(xmlStream: any, model: any): void;
    renderIconSet(xmlStream: any, model: any): void;
    createNewModel({ attributes }: {
        attributes: any;
    }): {
        type: any;
        x14Id: any;
        priority: any;
    };
    onParserClose(name: any, parser: any): void;
}
