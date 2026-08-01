export declare class Note {
    static DEFAULT_CONFIGS: {
        note: {
            margins: {
                insetmode: string;
                inset: number[];
            };
            protection: {
                locked: string;
                lockText: string;
            };
            editAs: string;
        };
    };
    note: any;
    constructor(note?: any);
    get model(): any;
    set model(value: any);
    static fromModel(model: any): Note;
}
export default Note;
