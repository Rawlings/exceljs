declare const colCache: any;
declare const Anchor: any;
declare class Image {
    constructor(worksheet: any, model: any);
    get model(): {
        type: any;
        imageId: any;
        hyperlinks?: undefined;
        range?: undefined;
    } | {
        type: any;
        imageId: any;
        hyperlinks: any;
        range: {
            tl: any;
            br: any;
            ext: any;
            editAs: any;
        };
    };
    set model({ type, imageId, range, hyperlinks }: {
        type: any;
        imageId: any;
        hyperlinks?: undefined;
        range?: undefined;
    } | {
        type: any;
        imageId: any;
        hyperlinks: any;
        range: {
            tl: any;
            br: any;
            ext: any;
            editAs: any;
        };
    });
}
