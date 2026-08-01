declare class Merges {
    constructor();
    add(merge: any): void;
    get mergeCells(): any[];
    reconcile(mergeCells: any, rows: any): void;
    getMasterAddress(address: any): any;
}
export default Merges;
