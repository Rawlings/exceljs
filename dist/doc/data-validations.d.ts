export declare class DataValidations {
    model: Record<string, any>;
    constructor(model?: Record<string, any>);
    add(address: string, validation: any): any;
    find(address: string): any;
    remove(address: string): void;
}
export default DataValidations;
