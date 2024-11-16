/**
 * @param {HttpError} err
 * @param {import('node:http').ServerResponse} [res]
 * @returns {string}
 */
export function manyError(err: HttpError, res?: import("http").ServerResponse<import("http").IncomingMessage> | undefined): string;
/**
 * Transform to check if streamed objects are from an array;
 * after executing fn, returns success or failure into response
 */
export class ObjTransform extends Transform {
    constructor({ fn }: {
        fn: any;
    });
    _fn: any;
    _cnt: number;
    _transform(chunk: any, _encoding: any, callback: any): void;
    _flush(): void;
}
export class BodyLimit extends Transform {
    constructor({ limit, ...opts }: {
        [x: string]: any;
        limit: any;
    });
    _limit: any;
    _cnt: any;
    _transform(chunk: any, encoding: any, callback: any): void;
}
import { HttpError } from 'veloze';
import { Transform } from 'node:stream';
