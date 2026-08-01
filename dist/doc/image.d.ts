declare class Image {
    worksheet: any;
    type: any;
    imageId: any;
    range: any;
    constructor(worksheet?: any, model?: any);
    get model(): any;
    set model({ type, imageId, range, hyperlinks }: any);
}
export default Image;
