/**
 * @typedef {object} MongoInitOptions
 * @property {import('mongodb/mongodb').MongoClient} [client]
 * @property {object} [index]
 *
 * @typedef {import('./Adapter').AdapterOptions} AdapterOptions
 *
 * @typedef {object} MongoAdapterOptionsExt
 * @property {string} database database name
 *
 * @typedef {AdapterOptions & MongoAdapterOptionsExt & MongoInitOptions} MongoAdapterOptions
 *
 * @typedef {object} MongoClientUri
 * @property {string} uri
 * @property {string} database
 * @property {object[]} index MongoDb Database Index https://www.mongodb.com/basics/database-index
 * @property {function} randomUuid random id generation function
 */
/**
 * @see https://www.mongodb.com/docs/drivers/node/current/usage-examples/
 */
export class MongoAdapter extends Adapter {
    /**
     * @param {MongoAdapterOptions} options
     */
    constructor(options: MongoAdapterOptions);
    _adapterType: string;
    _database: string;
    /**
     * @param {MongoInitOptions} options
     */
    init(options: MongoInitOptions): Promise<void>;
    deleteDeleted(date: any): Promise<{
        deletedCount: any;
    }>;
}
export namespace MongoAdapter {
    export { convertFilterRule };
    export { convertFindOptions };
}
export type MongoInitOptions = {
    client?: import("mongodb").MongoClient | undefined;
    index?: object;
};
export type AdapterOptions = import('./Adapter').AdapterOptions;
export type MongoAdapterOptionsExt = {
    /**
     * database name
     */
    database: string;
};
export type MongoAdapterOptions = AdapterOptions & MongoAdapterOptionsExt & MongoInitOptions;
export type MongoClientUri = {
    uri: string;
    database: string;
    /**
     * MongoDb Database Index https://www.mongodb.com/basics/database-index
     */
    index: object[];
    /**
     * random id generation function
     */
    randomUuid: Function;
};
import { Adapter } from './Adapter.js';
declare function convertFilterRule(filterRule: any): {};
/**
 * @see https://www.mongodb.com/docs/v6.0/reference/command/find/#std-label-find-cmd-sort
 * @param {{
 *  offset?: number
 *  limit?: number
 *  fields?: string[]
 *  sort?: ??
 * }} findOptions
 * @returns {object}
 */
declare function convertFindOptions(findOptions: {
    offset?: number | undefined;
    limit?: number | undefined;
    fields?: string[] | undefined;
    sort?: unknown | null;
}): object;
export {};
