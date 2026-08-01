export declare class Anchor {
    worksheet: any;
    nativeCol: number;
    nativeColOff: number;
    nativeRow: number;
    nativeRowOff: number;
    constructor(worksheet?: any, address?: any, offset?: number);
    static asInstance(model: any): any;
    get col(): number;
    set col(v: number);
    get row(): number;
    set row(v: number);
    get colWidth(): number;
    get rowHeight(): number;
    get model(): any;
    set model(value: any);
}
export default Anchor;
