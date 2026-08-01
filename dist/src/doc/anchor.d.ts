declare const colCache: any;
declare class Anchor {
    constructor(worksheet: any, address: any, offset?: number);
    static asInstance(model: any): any;
    get col(): any;
    set col(v: any);
    get row(): any;
    set row(v: any);
    get colWidth(): number;
    get rowHeight(): number;
    get model(): {
        nativeCol: any;
        nativeColOff: any;
        nativeRow: any;
        nativeRowOff: any;
    };
    set model(value: {
        nativeCol: any;
        nativeColOff: any;
        nativeRow: any;
        nativeRowOff: any;
    });
}
