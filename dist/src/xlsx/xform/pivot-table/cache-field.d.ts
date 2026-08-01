declare class CacheField {
    constructor({ name, sharedItems }: {
        name: any;
        sharedItems: any;
    });
    render(): string;
}
