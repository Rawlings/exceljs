declare class StringBuf {
    constructor(options: any);
    get length(): any;
    get capacity(): any;
    get buffer(): any;
    toBuffer(): any;
    reset(position: any): void;
    _grow(min: any): void;
    addText(text: any): void;
    addStringBuf(inBuf: any): void;
}
