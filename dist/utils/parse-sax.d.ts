export default function parseSax(iterable: any): AsyncGenerator<({
    eventType: string;
    value: string;
} | {
    eventType: string;
    value: {
        name: string;
        attributes?: undefined;
        isSelfClosing?: undefined;
    };
} | {
    eventType: string;
    value: {
        name: string;
        attributes: {};
        isSelfClosing: boolean;
    };
})[], void, unknown>;
